namespace CvIa.Infrastructure.Services;

public static class ChatLinkAllowlistPolicy
{
    private static readonly HashSet<string> AllowedPdfTargets = new(StringComparer.Ordinal)
    {
        "/api/v1/cv?lang=es",
        "/api/v1/cv?lang=en"
    };

    public static bool IsAllowedTarget(string target)
    {
        if (string.IsNullOrWhiteSpace(target))
        {
            return true;
        }

        // Disallow absolute URLs and common exfil vectors.
        if (target.StartsWith("http://", StringComparison.OrdinalIgnoreCase) ||
            target.StartsWith("https://", StringComparison.OrdinalIgnoreCase) ||
            target.StartsWith("mailto:", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        if (AllowedPdfTargets.Contains(target))
        {
            return true;
        }

        // Allow only /{lang}#{section-id}
        if (!target.StartsWith("/", StringComparison.Ordinal))
        {
            return false;
        }

        var hash = target.IndexOf('#', StringComparison.Ordinal);
        if (hash <= 1 || hash == target.Length - 1)
        {
            return false;
        }

        var path = target[..hash];
        var fragment = target[(hash + 1)..];

        if (path is not ("/en" or "/es"))
        {
            return false;
        }

        return CvMarkdownSectionIds.Ordered.Contains(fragment, StringComparer.Ordinal);
    }
}

