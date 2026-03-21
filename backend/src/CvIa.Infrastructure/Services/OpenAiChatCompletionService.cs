using System.Diagnostics;
using System.Net.Http.Json;
using CvIa.Application;
using CvIa.Application.Configuration;
using CvIa.Application.Contracts;
using CvIa.Application.Exceptions;
using CvIa.Infrastructure.OpenAi;
using CvIa.Infrastructure.OpenAi.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Polly;

namespace CvIa.Infrastructure.Services;

/// <summary>
/// Orchestrates chat prompt building, HTTP call to OpenAI chat completions, and response handling.
/// </summary>
public sealed class OpenAiChatCompletionService : IChatCompletionService
{
    private readonly HttpClient _httpClient;
    private readonly OpenAiChatOptions _options;
    private readonly IOpenAiChatPromptBuilder _promptBuilder;
    private readonly IOpenAiHttpRequestHeadersApplier _headersApplier;
    private readonly IOpenAiChatHttpResponseProcessor _responseProcessor;
    private readonly ILogger<OpenAiChatCompletionService> _logger;
    private readonly ResiliencePipeline<HttpResponseMessage> _openAi429RetryPipeline;

    public OpenAiChatCompletionService(
        HttpClient httpClient,
        IOptions<OpenAiChatOptions> options,
        IOpenAiChatPromptBuilder promptBuilder,
        IOpenAiHttpRequestHeadersApplier headersApplier,
        IOpenAiChatHttpResponseProcessor responseProcessor,
        ILogger<OpenAiChatCompletionService> logger)
    {
        _httpClient = httpClient;
        _options = options.Value;
        _promptBuilder = promptBuilder;
        _headersApplier = headersApplier;
        _responseProcessor = responseProcessor;
        _logger = logger;
        _openAi429RetryPipeline = OpenAiChatHttpRetryPipeline.Create429RetryPipeline(logger);
    }

    public async Task<ChatResponseDto> CompleteAsync(ChatRequestDto request, CancellationToken cancellationToken)
    {
        var sw = Stopwatch.StartNew();
        var correlation = Guid.NewGuid().ToString("N");

        var payloads = _promptBuilder.BuildMessages(request.Messages, request.Lang);

        if (payloads.Count < 2)
        {
            throw new OpenAiChatException(
                StatusCodes.Status400BadRequest,
                new ErrorResponse("invalid_request", "At least one user or assistant message is required after validation.")
            );
        }

        var body = new OpenAiChatCompletionRequest
        {
            Model = _options.Model,
            Messages = payloads.Select(p => new OpenAiChatApiMessage { Role = p.Role, Content = p.Content }).ToList(),
            Temperature = _options.Temperature,
            MaxTokens = _options.MaxTokens
        };

        var context = ResilienceContextPool.Shared.Get(cancellationToken);
        context.Properties.Set(OpenAiChatHttpRetryPipeline.CorrelationIdProperty, correlation);

        HttpResponseMessage httpResponse;
        try
        {
            httpResponse = await _openAi429RetryPipeline.ExecuteAsync(
                async ctx =>
                {
                    using var httpRequest = new HttpRequestMessage(HttpMethod.Post, "chat/completions")
                    {
                        Content = JsonContent.Create(body, options: OpenAiChatJsonOptions.Request)
                    };

                    _headersApplier.Apply(httpRequest, _options);

                    try
                    {
                        return await _httpClient.SendAsync(httpRequest, HttpCompletionOption.ResponseHeadersRead, ctx.CancellationToken);
                    }
                    catch (TaskCanceledException ex) when (!ctx.CancellationToken.IsCancellationRequested)
                    {
                        _logger.LogWarning(ex, "OpenAI request timed out. CorrelationId={CorrelationId} Model={Model} ElapsedMs={ElapsedMs}", correlation, _options.Model, sw.ElapsedMilliseconds);
                        throw new OpenAiChatException(
                            StatusCodes.Status504GatewayTimeout,
                            new ErrorResponse(
                                "provider_timeout",
                                "The AI provider did not respond in time.",
                                new Dictionary<string, object?> { ["correlationId"] = correlation }
                            ),
                            ex
                        );
                    }
                    catch (HttpRequestException ex)
                    {
                        _logger.LogWarning(ex, "OpenAI HTTP failure. CorrelationId={CorrelationId} Model={Model}", correlation, _options.Model);
                        throw new OpenAiChatException(
                            StatusCodes.Status502BadGateway,
                            new ErrorResponse(
                                "provider_unreachable",
                                "Could not reach the AI provider.",
                                new Dictionary<string, object?> { ["correlationId"] = correlation }
                            ),
                            ex
                        );
                    }
                },
                context);
        }
        finally
        {
            ResilienceContextPool.Shared.Return(context);
        }

        using (httpResponse)
        {
            var raw = await httpResponse.Content.ReadAsStringAsync(cancellationToken);
            sw.Stop();
            return _responseProcessor.MapResponseOrThrow(raw, httpResponse, correlation, sw);
        }
    }
}
