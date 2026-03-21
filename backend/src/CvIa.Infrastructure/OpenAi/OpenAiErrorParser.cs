using System.Text.Json;

namespace CvIa.Infrastructure.OpenAi;

/// <summary>Parses OpenAI <c>error</c> JSON bodies and classifies permission-style failures.</summary>
internal static class OpenAiErrorParser
{
    /// <summary>Extracts <c>error.message</c> and <c>error.code</c> from OpenAI JSON error bodies.</summary>
    public static (string? Message, string? Code) TryParseError(string raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
        {
            return (null, null);
        }

        try
        {
            using var doc = JsonDocument.Parse(raw);
            if (!doc.RootElement.TryGetProperty("error", out var err))
            {
                return (null, null);
            }

            string? message = err.TryGetProperty("message", out var msgEl) ? msgEl.GetString() : null;
            string? code = err.TryGetProperty("code", out var codeEl) ? codeEl.GetString() : null;
            return (message, code);
        }
        catch (JsonException)
        {
            return (null, null);
        }
    }

    /// <summary>OpenAI may return 401 for missing API key scopes (e.g. model.request), not only invalid keys.</summary>
    public static bool LooksLikeScopeOrPermissionError(string? message, string? code)
    {
        if (!string.IsNullOrEmpty(code))
        {
            var c = code.ToLowerInvariant();
            if (c.Contains("insufficient") || c.Contains("permission"))
            {
                return true;
            }
        }

        if (string.IsNullOrEmpty(message))
        {
            return false;
        }

        var m = message.ToLowerInvariant();
        return m.Contains("missing scopes")
            || m.Contains("insufficient permissions")
            || m.Contains("model.request")
            || m.Contains("does not have access to model")
            || m.Contains("restricted api key");
    }

    public static string TruncateForLog(string raw, int max = 256)
    {
        if (string.IsNullOrEmpty(raw))
        {
            return "";
        }

        return raw.Length <= max ? raw : raw[..max] + "…";
    }
}
