using System.Diagnostics;
using System.Net.Http.Json;
using CvIa.Application;
using CvIa.Application.Configuration;
using CvIa.Application.Contracts;
using CvIa.Application.Exceptions;
using CvIa.Application.Rag;
using CvIa.Infrastructure.OpenAi;
using CvIa.Infrastructure.OpenAi.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Polly;

namespace CvIa.Infrastructure.Services;

/// <summary>
/// Orchestrates a chat completion request:
/// 1) Builds the (optional) RAG context via <see cref="IChatRagContextBuilder"/>.
/// 2) Builds the chat payload via <see cref="IOpenAiChatPromptBuilder"/>.
/// 3) Calls OpenAI's <c>chat/completions</c> with retry/backoff for 429s.
/// 4) Reviews the assistant reply through <see cref="IChatOutputPolicy"/> before returning to the caller.
/// </summary>
public sealed class OpenAiChatCompletionService : IChatCompletionService
{
    private readonly HttpClient _httpClient;
    private readonly OpenAiChatOptions _options;
    private readonly IOpenAiChatPromptBuilder _promptBuilder;
    private readonly IOpenAiHttpRequestHeadersApplier _headersApplier;
    private readonly IOpenAiChatHttpResponseProcessor _responseProcessor;
    private readonly IChatRagContextBuilder _ragContextBuilder;
    private readonly IChatOutputPolicy _outputPolicy;
    private readonly ILogger<OpenAiChatCompletionService> _logger;
    private readonly ResiliencePipeline<HttpResponseMessage> _openAi429RetryPipeline;

    public OpenAiChatCompletionService(
        HttpClient httpClient,
        IOptions<OpenAiChatOptions> options,
        IOpenAiChatPromptBuilder promptBuilder,
        IOpenAiHttpRequestHeadersApplier headersApplier,
        IOpenAiChatHttpResponseProcessor responseProcessor,
        IChatRagContextBuilder ragContextBuilder,
        IChatOutputPolicy outputPolicy,
        ILogger<OpenAiChatCompletionService> logger)
    {
        _httpClient = httpClient;
        _options = options.Value;
        _promptBuilder = promptBuilder;
        _headersApplier = headersApplier;
        _responseProcessor = responseProcessor;
        _ragContextBuilder = ragContextBuilder;
        _outputPolicy = outputPolicy;
        _logger = logger;
        _openAi429RetryPipeline = OpenAiChatHttpRetryPipeline.Create429RetryPipeline(logger);
    }

    public async Task<ChatResponseDto> CompleteAsync(ChatRequestDto request, CancellationToken cancellationToken)
    {
        var stopwatch = Stopwatch.StartNew();
        var correlationId = Guid.NewGuid().ToString("N");

        var normalizedLang = SupportedLanguages.NormalizeOrDefault(request.Lang);
        var ragContext = await _ragContextBuilder.BuildAsync(request, normalizedLang, cancellationToken);

        var payloads = _promptBuilder.BuildMessages(request.Messages, request.Lang, ragContext.Markdown);
        if (payloads.Count < 2)
        {
            throw new OpenAiChatException(
                StatusCodes.Status400BadRequest,
                new ErrorResponse("invalid_request", "At least one user or assistant message is required after validation."));
        }

        var requestBody = BuildOpenAiRequest(payloads);

        using var httpResponse = await SendWithRetryAsync(requestBody, correlationId, stopwatch, cancellationToken);
        var rawBody = await httpResponse.Content.ReadAsStringAsync(cancellationToken);
        stopwatch.Stop();

        var baseResponse = _responseProcessor.MapResponseOrThrow(rawBody, httpResponse, correlationId, stopwatch);
        var finalResponse = ApplyOutputPolicy(baseResponse, request, normalizedLang, correlationId);

        return AttachCitations(finalResponse, ragContext.Citations);
    }

    private OpenAiChatCompletionRequest BuildOpenAiRequest(IReadOnlyList<OpenAiChatMessagePayload> payloads) => new()
    {
        Model = _options.Model,
        Messages = payloads.Select(p => new OpenAiChatApiMessage { Role = p.Role, Content = p.Content }).ToList(),
        Temperature = _options.Temperature,
        MaxTokens = _options.MaxTokens
    };

    private async Task<HttpResponseMessage> SendWithRetryAsync(
        OpenAiChatCompletionRequest body,
        string correlationId,
        Stopwatch stopwatch,
        CancellationToken cancellationToken)
    {
        var resilienceContext = ResilienceContextPool.Shared.Get(cancellationToken);
        resilienceContext.Properties.Set(OpenAiChatHttpRetryPipeline.CorrelationIdProperty, correlationId);
        try
        {
            return await _openAi429RetryPipeline.ExecuteAsync(
                ctx => SendOnceAsync(body, correlationId, stopwatch, ctx.CancellationToken),
                resilienceContext);
        }
        finally
        {
            ResilienceContextPool.Shared.Return(resilienceContext);
        }
    }

    private async ValueTask<HttpResponseMessage> SendOnceAsync(
        OpenAiChatCompletionRequest body,
        string correlationId,
        Stopwatch stopwatch,
        CancellationToken cancellationToken)
    {
        using var httpRequest = new HttpRequestMessage(HttpMethod.Post, "chat/completions")
        {
            Content = JsonContent.Create(body, options: OpenAiChatJsonOptions.Request)
        };
        _headersApplier.Apply(httpRequest, _options);

        try
        {
            return await _httpClient.SendAsync(httpRequest, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
        }
        catch (TaskCanceledException ex) when (!cancellationToken.IsCancellationRequested)
        {
            _logger.LogWarning(ex,
                "OpenAI request timed out. CorrelationId={CorrelationId} Model={Model} ElapsedMs={ElapsedMs}",
                correlationId, _options.Model, stopwatch.ElapsedMilliseconds);
            throw new OpenAiChatException(
                StatusCodes.Status504GatewayTimeout,
                new ErrorResponse(
                    "provider_timeout",
                    "The AI provider did not respond in time.",
                    new Dictionary<string, object?> { ["correlationId"] = correlationId }),
                ex);
        }
        catch (HttpRequestException ex)
        {
            _logger.LogWarning(ex,
                "OpenAI HTTP failure. CorrelationId={CorrelationId} Model={Model}",
                correlationId, _options.Model);
            throw new OpenAiChatException(
                StatusCodes.Status502BadGateway,
                new ErrorResponse(
                    "provider_unreachable",
                    "Could not reach the AI provider.",
                    new Dictionary<string, object?> { ["correlationId"] = correlationId }),
                ex);
        }
    }

    private ChatResponseDto ApplyOutputPolicy(
        ChatResponseDto baseResponse,
        ChatRequestDto request,
        string normalizedLang,
        string correlationId)
    {
        var review = _outputPolicy.Review(baseResponse.Message, request, normalizedLang);
        if (!review.WasReplaced)
        {
            return baseResponse;
        }

        _logger.LogWarning(
            "Chat output violated policy; returning safe fallback. CorrelationId={CorrelationId} Reason={Reason}",
            correlationId,
            review.ViolationReason);

        return baseResponse with { Message = review.Message };
    }

    private static ChatResponseDto AttachCitations(ChatResponseDto response, IReadOnlyList<ChatCitationDto>? citations)
    {
        if (citations is null || citations.Count == 0)
        {
            return response;
        }

        return new ChatResponseDto(
            Id: response.Id,
            CreatedAt: response.CreatedAt,
            Message: response.Message,
            Citations: citations);
    }
}
