using System.Diagnostics;
using System.Net;
using System.Text.Json;
using CvIa.Application.Configuration;
using CvIa.Application.Contracts;
using CvIa.Infrastructure.OpenAi.Models;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace CvIa.Infrastructure.OpenAi;

/// <summary>
/// Translates the raw OpenAI <c>chat/completions</c> HTTP response into a <see cref="ChatResponseDto"/>,
/// or throws a typed <see cref="Application.Exceptions.OpenAiChatException"/> with the appropriate
/// HTTP status and error envelope. All error construction is delegated to <see cref="OpenAiChatErrorFactory"/>.
/// </summary>
public sealed class OpenAiChatHttpResponseProcessor : IOpenAiChatHttpResponseProcessor
{
    private readonly OpenAiChatOptions _options;
    private readonly ILogger<OpenAiChatHttpResponseProcessor> _logger;

    public OpenAiChatHttpResponseProcessor(
        IOptions<OpenAiChatOptions> options,
        ILogger<OpenAiChatHttpResponseProcessor> logger)
    {
        _options = options.Value;
        _logger = logger;
    }

    public ChatResponseDto MapResponseOrThrow(string raw, HttpResponseMessage response, string correlationId, Stopwatch elapsed)
    {
        if (!response.IsSuccessStatusCode)
        {
            throw BuildErrorForFailedResponse(raw, response, correlationId, elapsed);
        }

        return ParseSuccessResponse(raw, correlationId, elapsed);
    }

    private Exception BuildErrorForFailedResponse(string raw, HttpResponseMessage response, string correlationId, Stopwatch elapsed)
    {
        var status = response.StatusCode;

        if (status == HttpStatusCode.Unauthorized)
        {
            var (openAiMsg, openAiCode) = OpenAiErrorParser.TryParseError(raw);
            LogProviderFailure(401, raw, correlationId, elapsed);

            return OpenAiErrorParser.LooksLikeScopeOrPermissionError(openAiMsg, openAiCode)
                ? OpenAiChatErrorFactory.ProviderForbiddenScope(correlationId, openAiMsg)
                : OpenAiChatErrorFactory.ProviderAuth(correlationId, openAiMsg);
        }

        if ((int)status == 429)
        {
            _logger.LogWarning(
                "OpenAI rate limited. CorrelationId={CorrelationId} ElapsedMs={ElapsedMs}",
                correlationId, elapsed.ElapsedMilliseconds);
            return OpenAiChatErrorFactory.RateLimited(correlationId);
        }

        if (status == HttpStatusCode.Forbidden)
        {
            var openAiMsg = OpenAiErrorParser.TryParseError(raw).Message;
            LogProviderFailure(403, raw, correlationId, elapsed);
            return OpenAiChatErrorFactory.ProviderForbidden(correlationId, openAiMsg);
        }

        var providerMessage = OpenAiErrorParser.TryParseError(raw).Message;
        LogProviderFailure((int)status, raw, correlationId, elapsed);
        return OpenAiChatErrorFactory.ProviderError(correlationId, (int)status, providerMessage);
    }

    private ChatResponseDto ParseSuccessResponse(string raw, string correlationId, Stopwatch elapsed)
    {
        OpenAiChatCompletionResponse? parsed;
        try
        {
            parsed = JsonSerializer.Deserialize<OpenAiChatCompletionResponse>(raw, OpenAiChatJsonOptions.Response);
        }
        catch (JsonException ex)
        {
            _logger.LogError(ex, "Failed to deserialize OpenAI response. CorrelationId={CorrelationId}", correlationId);
            throw OpenAiChatErrorFactory.ProviderResponseUnreadable(correlationId, ex);
        }

        var text = parsed?.Choices?.FirstOrDefault()?.Message?.Content?.Trim();
        if (string.IsNullOrEmpty(text))
        {
            throw OpenAiChatErrorFactory.ProviderEmptyMessage(correlationId);
        }

        var id = string.IsNullOrEmpty(parsed?.Id) ? $"chatcmpl_{Guid.NewGuid():N}" : parsed.Id;
        var createdAt = parsed?.Created is long unix && unix > 0
            ? DateTimeOffset.FromUnixTimeSeconds(unix)
            : DateTimeOffset.UtcNow;

        _logger.LogInformation(
            "OpenAI chat completed. CorrelationId={CorrelationId} Model={Model} ElapsedMs={ElapsedMs}",
            correlationId, _options.Model, elapsed.ElapsedMilliseconds);

        return new ChatResponseDto(
            Id: id,
            CreatedAt: createdAt,
            Message: new ChatMessageDto("assistant", text),
            Citations: null);
    }

    private void LogProviderFailure(int status, string raw, string correlationId, Stopwatch elapsed) =>
        _logger.LogWarning(
            "OpenAI returned {Status}. CorrelationId={CorrelationId} Body={BodySnippet} ElapsedMs={ElapsedMs}",
            status, correlationId, OpenAiErrorParser.TruncateForLog(raw), elapsed.ElapsedMilliseconds);
}
