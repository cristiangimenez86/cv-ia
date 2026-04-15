using System.Text.RegularExpressions;

namespace CvIa.Infrastructure.Services;

public static class ChatMarkdownLinkTargetExtractor
{
    // Best-effort markdown link: [label](target). We accept minimal whitespace inside ().
    private static readonly Regex LinkRegex = new(
        @"\[(?<label>[^\]]+)\]\((?<target>[^)\s]+)\)",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    public static IReadOnlyList<string> ExtractTargets(string markdown)
    {
        if (string.IsNullOrWhiteSpace(markdown))
        {
            return Array.Empty<string>();
        }

        // Ignore fenced code blocks to reduce false positives / bypass via code.
        var withoutFences = ChatInputNormalizer.StripFencedCodeBlocks(markdown);

        var matches = LinkRegex.Matches(withoutFences);
        if (matches.Count == 0)
        {
            return Array.Empty<string>();
        }

        var targets = new List<string>(matches.Count);
        foreach (Match m in matches)
        {
            var t = m.Groups["target"].Value?.Trim();
            if (!string.IsNullOrWhiteSpace(t))
            {
                targets.Add(t);
            }
        }

        return targets;
    }
}

