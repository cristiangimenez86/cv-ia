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
using Microsoft.Extensions.DependencyInjection;
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
    private readonly RagOptions _ragOptions;
    private readonly IOpenAiChatPromptBuilder _promptBuilder;
    private readonly IOpenAiHttpRequestHeadersApplier _headersApplier;
    private readonly IOpenAiChatHttpResponseProcessor _responseProcessor;
    private readonly IRagRetrievalService _retrieval;
    private readonly IOpenAiEmbeddingsClient? _embeddings;
    private readonly ILogger<OpenAiChatCompletionService> _logger;
    private readonly ResiliencePipeline<HttpResponseMessage> _openAi429RetryPipeline;

    public OpenAiChatCompletionService(
        HttpClient httpClient,
        IOptions<OpenAiChatOptions> options,
        IOptions<RagOptions> ragOptions,
        IOpenAiChatPromptBuilder promptBuilder,
        IOpenAiHttpRequestHeadersApplier headersApplier,
        IOpenAiChatHttpResponseProcessor responseProcessor,
        IRagRetrievalService retrieval,
        IServiceProvider serviceProvider,
        ILogger<OpenAiChatCompletionService> logger)
    {
        _httpClient = httpClient;
        _options = options.Value;
        _ragOptions = ragOptions.Value;
        _promptBuilder = promptBuilder;
        _headersApplier = headersApplier;
        _responseProcessor = responseProcessor;
        _retrieval = retrieval;
        _embeddings = serviceProvider.GetService<IOpenAiEmbeddingsClient>();
        _logger = logger;
        _openAi429RetryPipeline = OpenAiChatHttpRetryPipeline.Create429RetryPipeline(logger);
    }

    public async Task<ChatResponseDto> CompleteAsync(ChatRequestDto request, CancellationToken cancellationToken)
    {
        var sw = Stopwatch.StartNew();
        var correlation = Guid.NewGuid().ToString("N");

        var langNorm = string.Equals(request.Lang, "es", StringComparison.OrdinalIgnoreCase) ? "es" : "en";
        var (retrievedContext, citations) = await TryBuildRagContextAsync(request, langNorm, cancellationToken);
        var payloads = _promptBuilder.BuildMessages(request.Messages, request.Lang, retrievedContext);

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
            var baseResponse = _responseProcessor.MapResponseOrThrow(raw, httpResponse, correlation, sw);

            // Server-side output policy enforcement: allowlisted link targets only.
            // If output violates policy, return a deterministic safe fallback instead of leaking disallowed links.
            var targets = ChatMarkdownLinkTargetExtractor.ExtractTargets(baseResponse.Message.Content);
            var hasDisallowed = targets.Any(t => !ChatLinkAllowlistPolicy.IsAllowedTarget(t));
            if (hasDisallowed)
            {
                _logger.LogWarning(
                    "Chat output violated link allowlist policy; returning safe fallback. CorrelationId={CorrelationId} Targets={Targets}",
                    correlation,
                    string.Join(", ", targets));
                var safe = ChatSafeFallbackResponseGenerator.CreateSafeAssistantMessage(langNorm, request);
                baseResponse = baseResponse with { Message = safe };
            }

            if (citations is null || citations.Count == 0)
            {
                return baseResponse;
            }

            return new ChatResponseDto(
                Id: baseResponse.Id,
                CreatedAt: baseResponse.CreatedAt,
                Message: baseResponse.Message,
                Citations: citations
            );
        }
    }

    private async Task<(string? Context, IReadOnlyList<ChatCitationDto>? Citations)> TryBuildRagContextAsync(
        ChatRequestDto request,
        string lang,
        CancellationToken cancellationToken)
    {
        if (!_ragOptions.Enabled)
        {
            return (null, null);
        }

        if (_embeddings is null)
        {
            return (null, null);
        }

        var lastUser = request.Messages.LastOrDefault(m => string.Equals(m.Role, "user", StringComparison.OrdinalIgnoreCase))?.Content;
        if (string.IsNullOrWhiteSpace(lastUser))
        {
            return (null, null);
        }

        var maxMessageChars = Math.Max(200, _options.MaxMessageChars);
        var normalizedLastUser = ChatInputNormalizer.NormalizeAndTruncate(lastUser, maxMessageChars);
        var queryEmbedding = await _embeddings.CreateEmbeddingAsync(normalizedLastUser, _ragOptions.EmbeddingModel, cancellationToken);
        var chunks = await _retrieval.RetrieveAsync(lang, queryEmbedding, _ragOptions.TopK, cancellationToken);
        if (chunks.Count == 0)
        {
            return (null, null);
        }

        var maxChars = Math.Max(200, _ragOptions.MaxRetrievedContextTokens * 4);
        var contextParts = new List<string>();
        var citations = new List<ChatCitationDto>();
        var currentChars = 0;

        foreach (var c in chunks)
        {
            var header = $"[source={c.SourceId} document={c.DocumentKey} section={c.SectionId ?? ""} score={c.Score:F3}]";
            var block = $"{header}\n{c.Text}".Trim();
            if (currentChars + block.Length + 2 > maxChars)
            {
                break;
            }

            contextParts.Add(block);
            currentChars += block.Length + 2;

            var sourceId = c.SourceId.Equals("cv", StringComparison.OrdinalIgnoreCase) && !string.IsNullOrWhiteSpace(c.SectionId)
                ? $"content/{lang}/sections/{c.SectionId}.md"
                : $"rag/{c.SourceId}/{c.DocumentKey}";

            var title = c.SectionId ?? c.DocumentKey;
            var snippet = c.Text.Length <= 240 ? c.Text : c.Text[..240];
            citations.Add(new ChatCitationDto(sourceId, title, snippet));
        }

        return (string.Join("\n\n", contextParts), citations);
    }
}
