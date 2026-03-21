using System.Diagnostics;
using System.Net;
using System.Text.Json;
using CvIa.Application.Configuration;
using CvIa.Infrastructure.OpenAi.Models;
using CvIa.Application.Contracts;
using CvIa.Application.Exceptions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace CvIa.Infrastructure.OpenAi;

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
        if (response.StatusCode == HttpStatusCode.Unauthorized)
        {
            var (openAiMsg, openAiCode) = OpenAiErrorParser.TryParseError(raw);
            _logger.LogWarning(
                "OpenAI returned 401. CorrelationId={CorrelationId} Body={BodySnippet} ElapsedMs={ElapsedMs}",
                correlationId,
                OpenAiErrorParser.TruncateForLog(raw),
                elapsed.ElapsedMilliseconds);
            var message = string.IsNullOrWhiteSpace(openAiMsg)
                ? "AI provider authentication failed."
                : openAiMsg.Trim();

            if (OpenAiErrorParser.LooksLikeScopeOrPermissionError(openAiMsg, openAiCode))
            {
                throw new OpenAiChatException(
                    StatusCodes.Status502BadGateway,
                    new ErrorResponse(
                        "provider_forbidden",
                        message,
                        new Dictionary<string, object?>
                        {
                            ["correlationId"] = correlationId,
                            ["setupHint"] =
                                "Restricted key or role: enable Chat completions + model access for OpenAiChat:Model (e.g. gpt-4o-mini), or create a key with All permissions. Confirm org/project roles (Reader/Writer/Owner; Member/Owner on project). Project keys: OpenAiChat:OpenAiProjectId / OpenAiChat:OpenAiOrganizationId must match the key."
                        }
                    )
                );
            }

            throw new OpenAiChatException(
                StatusCodes.Status502BadGateway,
                new ErrorResponse(
                    "provider_auth",
                    message,
                    new Dictionary<string, object?>
                    {
                        ["correlationId"] = correlationId,
                        ["setupHint"] =
                            "Wrong or revoked API key, or project/org headers missing: Project keys (sk-proj-): set OpenAiChat:OpenAiProjectId (proj_…) and OpenAiChat:OpenAiOrganizationId (org_…). Env: OpenAiChat__OpenAiProjectId / OpenAiChat__OpenAiOrganizationId."
                    }
                )
            );
        }

        if ((int)response.StatusCode == 429)
        {
            _logger.LogWarning("OpenAI rate limited. CorrelationId={CorrelationId} ElapsedMs={ElapsedMs}", correlationId, elapsed.ElapsedMilliseconds);
            throw new OpenAiChatException(
                StatusCodes.Status429TooManyRequests,
                new ErrorResponse(
                    "rate_limited",
                    "The AI provider rate limit was exceeded. Try again shortly.",
                    new Dictionary<string, object?> { ["correlationId"] = correlationId }
                )
            );
        }

        if (response.StatusCode == HttpStatusCode.Forbidden)
        {
            var openAiMsg = OpenAiErrorParser.TryParseError(raw).Message;
            _logger.LogWarning(
                "OpenAI returned 403. CorrelationId={CorrelationId} Body={BodySnippet} ElapsedMs={ElapsedMs}",
                correlationId,
                OpenAiErrorParser.TruncateForLog(raw),
                elapsed.ElapsedMilliseconds);
            var message = string.IsNullOrWhiteSpace(openAiMsg)
                ? "The AI provider denied this request (forbidden)."
                : openAiMsg.Trim();
            throw new OpenAiChatException(
                StatusCodes.Status403Forbidden,
                new ErrorResponse(
                    "provider_forbidden",
                    message,
                    new Dictionary<string, object?>
                    {
                        ["correlationId"] = correlationId,
                        ["setupHint"] =
                            "Restricted key: enable model access for the model in OpenAiChat:Model (e.g. gpt-4o-mini), or create a key with All permissions. Confirm your org/project role on the key’s project."
                    }
                )
            );
        }

        if (!response.IsSuccessStatusCode)
        {
            var openAiMsg = OpenAiErrorParser.TryParseError(raw).Message;
            _logger.LogWarning(
                "OpenAI error status {Status}. CorrelationId={CorrelationId} Body={BodySnippet} ElapsedMs={ElapsedMs}",
                (int)response.StatusCode,
                correlationId,
                OpenAiErrorParser.TruncateForLog(raw),
                elapsed.ElapsedMilliseconds
            );
            var message = string.IsNullOrWhiteSpace(openAiMsg)
                ? "The AI provider returned an error."
                : openAiMsg.Trim();
            throw new OpenAiChatException(
                StatusCodes.Status502BadGateway,
                new ErrorResponse(
                    "provider_error",
                    message,
                    new Dictionary<string, object?>
                    {
                        ["correlationId"] = correlationId,
                        ["providerStatus"] = (int)response.StatusCode
                    }
                )
            );
        }

        OpenAiChatCompletionResponse? parsed;
        try
        {
            parsed = JsonSerializer.Deserialize<OpenAiChatCompletionResponse>(raw, OpenAiChatJsonOptions.Response);
        }
        catch (JsonException ex)
        {
            _logger.LogError(ex, "Failed to deserialize OpenAI response. CorrelationId={CorrelationId}", correlationId);
            throw new OpenAiChatException(
                StatusCodes.Status502BadGateway,
                new ErrorResponse(
                    "provider_error",
                    "Unexpected response from the AI provider.",
                    new Dictionary<string, object?> { ["correlationId"] = correlationId }
                ),
                ex
            );
        }

        var text = parsed?.Choices?.FirstOrDefault()?.Message?.Content?.Trim();
        if (string.IsNullOrEmpty(text))
        {
            throw new OpenAiChatException(
                StatusCodes.Status502BadGateway,
                new ErrorResponse(
                    "provider_error",
                    "Empty assistant message from the AI provider.",
                    new Dictionary<string, object?> { ["correlationId"] = correlationId }
                )
            );
        }

        var id = string.IsNullOrEmpty(parsed?.Id) ? $"chatcmpl_{Guid.NewGuid():N}" : parsed.Id;
        var created = parsed?.Created is long unix && unix > 0
            ? DateTimeOffset.FromUnixTimeSeconds(unix)
            : DateTimeOffset.UtcNow;

        _logger.LogInformation(
            "OpenAI chat completed. CorrelationId={CorrelationId} Model={Model} ElapsedMs={ElapsedMs}",
            correlationId,
            _options.Model,
            elapsed.ElapsedMilliseconds
        );

        return new ChatResponseDto(
            Id: id,
            CreatedAt: created,
            Message: new ChatMessageDto("assistant", text),
            Citations: null
        );
    }
}
