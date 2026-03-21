namespace CvIa.Infrastructure.Services;

/// <summary>
/// Section ids in display order. Must stay in sync with <c>shared/section-ids.json</c> (see <c>npm run verify:section-ids</c>).
/// Files: <c>content/{lang}/sections/{id}.md</c>.
/// </summary>
public static class CvMarkdownSectionIds
{
    public static readonly string[] Ordered =
    [
        "about",
        "core-skills",
        "key-achievements",
        "experience",
        "education",
        "certifications",
        "languages",
        "contact"
    ];
}
