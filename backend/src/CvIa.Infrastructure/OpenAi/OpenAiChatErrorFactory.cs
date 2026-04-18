using CvIa.Application.Contracts;
using CvIa.Application.Exceptions;
using Microsoft.AspNetCore.Http;

namespace CvIa.Infrastructure.OpenAi;

/// <summary>
/// Builds <see cref="OpenAiChatException"/> instances with consistent error envelopes
/// (code, message, <c>correlationId</c>, optional <c>setupHint</c> / <c>providerStatus</c>).
/// Centralizes the boilerplate previously duplicated across the response processor.
/// </summary>
internal static class OpenAiChatErrorFactory
{
    private const string AuthSetupHint =
        "Wrong or revoked API key, or project/org headers missing: Project keys (sk-proj-): set OpenAiChat:OpenAiProjectId (proj_…) and OpenAiChat:OpenAiOrganizationId (org_…). Env: OpenAiChat__OpenAiProjectId / OpenAiChat__OpenAiOrganizationId.";

    private const string ScopeSetupHint =
        "Restricted key or role: enable Chat completions + model access for OpenAiChat:Model (e.g. gpt-4o-mini), or create a key with All permissions. Confirm org/project roles (Reader/Writer/Owner; Member/Owner on project). Project keys: OpenAiChat:OpenAiProjectId / OpenAiChat:OpenAiOrganizationId must match the key.";

    private const string ForbiddenSetupHint =
        "Restricted key: enable model access for the model in OpenAiChat:Model (e.g. gpt-4o-mini), or create a key with All permissions. Confirm your org/project role on the key’s project.";

    public static OpenAiChatException ProviderAuth(string correlationId, string? providerMessage) =>
        Provider(
            httpStatus: StatusCodes.Status502BadGateway,
            code: "provider_auth",
            message: Coalesce(providerMessage, "AI provider authentication failed."),
            correlationId: correlationId,
            extra: new Dictionary<string, object?> { ["setupHint"] = AuthSetupHint });

    public static OpenAiChatException ProviderForbiddenScope(string correlationId, string? providerMessage) =>
        Provider(
            httpStatus: StatusCodes.Status502BadGateway,
            code: "provider_forbidden",
            message: Coalesce(providerMessage, "AI provider authentication failed."),
            correlationId: correlationId,
            extra: new Dictionary<string, object?> { ["setupHint"] = ScopeSetupHint });

    public static OpenAiChatException ProviderForbidden(string correlationId, string? providerMessage) =>
        Provider(
            httpStatus: StatusCodes.Status403Forbidden,
            code: "provider_forbidden",
            message: Coalesce(providerMessage, "The AI provider denied this request (forbidden)."),
            correlationId: correlationId,
            extra: new Dictionary<string, object?> { ["setupHint"] = ForbiddenSetupHint });

    public static OpenAiChatException RateLimited(string correlationId) =>
        Provider(
            httpStatus: StatusCodes.Status429TooManyRequests,
            code: "rate_limited",
            message: "The AI provider rate limit was exceeded. Try again shortly.",
            correlationId: correlationId);

    public static OpenAiChatException ProviderError(string correlationId, int providerStatus, string? providerMessage) =>
        Provider(
            httpStatus: StatusCodes.Status502BadGateway,
            code: "provider_error",
            message: Coalesce(providerMessage, "The AI provider returned an error."),
            correlationId: correlationId,
            extra: new Dictionary<string, object?> { ["providerStatus"] = providerStatus });

    public static OpenAiChatException ProviderResponseUnreadable(string correlationId, Exception? inner = null) =>
        Provider(
            httpStatus: StatusCodes.Status502BadGateway,
            code: "provider_error",
            message: "Unexpected response from the AI provider.",
            correlationId: correlationId,
            inner: inner);

    public static OpenAiChatException ProviderEmptyMessage(string correlationId) =>
        Provider(
            httpStatus: StatusCodes.Status502BadGateway,
            code: "provider_error",
            message: "Empty assistant message from the AI provider.",
            correlationId: correlationId);

    private static OpenAiChatException Provider(
        int httpStatus,
        string code,
        string message,
        string correlationId,
        IDictionary<string, object?>? extra = null,
        Exception? inner = null)
    {
        var details = new Dictionary<string, object?> { ["correlationId"] = correlationId };
        if (extra is not null)
        {
            foreach (var kvp in extra)
            {
                details[kvp.Key] = kvp.Value;
            }
        }

        var error = new ErrorResponse(code, message, details);
        return inner is null
            ? new OpenAiChatException(httpStatus, error)
            : new OpenAiChatException(httpStatus, error, inner);
    }

    private static string Coalesce(string? providerMessage, string fallback) =>
        string.IsNullOrWhiteSpace(providerMessage) ? fallback : providerMessage.Trim();
}
