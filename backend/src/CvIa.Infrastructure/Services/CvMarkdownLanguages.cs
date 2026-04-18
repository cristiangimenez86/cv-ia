using CvIa.Application;

namespace CvIa.Infrastructure.Services;

/// <summary>Locales for which CV markdown trees exist under <c>content/{lang}/sections</c>.</summary>
public static class CvMarkdownLanguages
{
    public static IReadOnlyList<string> Supported => SupportedLanguages.All;
}

