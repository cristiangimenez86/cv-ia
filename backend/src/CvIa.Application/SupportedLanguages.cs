namespace CvIa.Application;

/// <summary>Single source of truth for the languages the API understands (CV markdown, PDF assets, RAG).</summary>
public static class SupportedLanguages
{
    public const string English = "en";
    public const string Spanish = "es";

    public static readonly IReadOnlyList<string> All = [English, Spanish];

    /// <summary>Returns <c>en</c>/<c>es</c> if the input matches (case-insensitive); otherwise <c>null</c>.</summary>
    public static string? TryNormalize(string? lang)
    {
        if (string.IsNullOrWhiteSpace(lang))
        {
            return null;
        }

        if (string.Equals(lang, English, StringComparison.OrdinalIgnoreCase))
        {
            return English;
        }

        if (string.Equals(lang, Spanish, StringComparison.OrdinalIgnoreCase))
        {
            return Spanish;
        }

        return null;
    }

    /// <summary>Same as <see cref="TryNormalize"/> but falls back to <see cref="English"/> for unknown/empty input.</summary>
    public static string NormalizeOrDefault(string? lang) => TryNormalize(lang) ?? English;
}
