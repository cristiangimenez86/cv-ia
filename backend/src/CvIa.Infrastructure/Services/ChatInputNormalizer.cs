using System.Text;

namespace CvIa.Infrastructure.Services;

public static class ChatInputNormalizer
{
    public static string NormalizeAndTruncate(string content, int maxChars)
    {
        if (string.IsNullOrWhiteSpace(content))
        {
            return "";
        }

        var trimmed = content.Trim();
        if (maxChars <= 0 || trimmed.Length <= maxChars)
        {
            return trimmed;
        }

        // Keep deterministic truncation; avoid adding links or any extra content here.
        return trimmed[..maxChars];
    }

    public static string StripFencedCodeBlocks(string markdown)
    {
        if (string.IsNullOrEmpty(markdown))
        {
            return "";
        }

        // Simple deterministic pass: remove ``` fenced blocks (best-effort).
        var sb = new StringBuilder(markdown.Length);
        var i = 0;
        var inFence = false;
        while (i < markdown.Length)
        {
            if (i + 2 < markdown.Length && markdown[i] == '`' && markdown[i + 1] == '`' && markdown[i + 2] == '`')
            {
                inFence = !inFence;
                i += 3;
                continue;
            }

            if (!inFence)
            {
                sb.Append(markdown[i]);
            }

            i++;
        }

        return sb.ToString();
    }
}

