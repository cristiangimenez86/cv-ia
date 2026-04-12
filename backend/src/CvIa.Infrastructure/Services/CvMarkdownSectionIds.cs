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

    /// <summary>
    /// Markdown files under <c>content/{{lang}}/sections/{{id}}.md</c> ingested for RAG only (not concatenated into the public CV store, not in <c>site.json</c> sectionsOrder).
    /// e.g. <c>hr-interview-simulation.md</c> — HR screening answers for the chat assistant.
    /// </summary>
    public static readonly string[] RagIngestionOnly =
    [
        "hr-interview-simulation",
        "work-authorization"
    ];

    /// <summary>
    /// Appended to the in-memory CV markdown used for chat (system prompt) after <see cref="Ordered"/>, but not rendered on the public CV page and not in <c>shared/section-ids.json</c>.
    /// Keep small—large files belong in <see cref="RagIngestionOnly"/> only.
    /// </summary>
    public static readonly string[] ChatPromptSupplementOnly =
    [
        "work-authorization"
    ];
}
