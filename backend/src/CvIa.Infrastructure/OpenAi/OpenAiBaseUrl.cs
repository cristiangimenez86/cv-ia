namespace CvIa.Infrastructure.OpenAi;

/// <summary>Helper to normalize the OpenAI base URL so HttpClient.BaseAddress always ends with <c>/v1/</c>.</summary>
internal static class OpenAiBaseUrl
{
    private const string V1Suffix = "/v1";

    /// <summary>Trims trailing slash, ensures <c>/v1</c> suffix, and returns the URI ready for <c>HttpClient.BaseAddress</c>.</summary>
    public static Uri ResolveBaseAddress(string rawBaseUrl)
    {
        var trimmed = rawBaseUrl.TrimEnd('/');
        if (!trimmed.EndsWith(V1Suffix, StringComparison.OrdinalIgnoreCase))
        {
            trimmed = $"{trimmed}{V1Suffix}";
        }

        return new Uri($"{trimmed}/");
    }
}
