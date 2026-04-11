using CvIa.Application;
using CvIa.Application.Configuration;
using CvIa.Application.Contracts;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace CvIa.Infrastructure.Services;

/// <summary>
/// Loads CV markdown for a locale, formats the server system prompt, and trims the user/assistant window.
/// </summary>
public sealed class OpenAiChatPromptBuilder : IOpenAiChatPromptBuilder
{
    private readonly OpenAiChatOptions _options;
    private readonly CvMarkdownContentStore _cvMarkdownStore;
    private readonly ILogger<OpenAiChatPromptBuilder> _logger;

    public OpenAiChatPromptBuilder(
        IOptions<OpenAiChatOptions> options,
        CvMarkdownContentStore cvMarkdownStore,
        ILogger<OpenAiChatPromptBuilder> logger)
    {
        ArgumentNullException.ThrowIfNull(options);
        _options = options.Value;
        _cvMarkdownStore = cvMarkdownStore;
        _logger = logger;
    }

    /// <inheritdoc />
    public IReadOnlyList<OpenAiChatMessagePayload> BuildMessages(IReadOnlyList<ChatMessageDto> messages, string lang)
    {
        return BuildMessages(messages, lang, retrievedContextMarkdown: null);
    }

    /// <inheritdoc />
    public IReadOnlyList<OpenAiChatMessagePayload> BuildMessages(IReadOnlyList<ChatMessageDto> messages, string lang, string? retrievedContextMarkdown)
    {
        var fallbackCvMarkdown = LoadCvMarkdown(lang);
        var windowSize = Math.Max(1, _options.MaxMessagesInWindow);

        var langNorm = string.Equals(lang, "es", StringComparison.OrdinalIgnoreCase) ? "es" : "en";
        var system = FormatSystemPrompt(fallbackCvMarkdown, langNorm, retrievedContextMarkdown).Trim();
        var list = new List<OpenAiChatMessagePayload>
        {
            new("system", system)
        };

        var window = messages.Count > windowSize
            ? messages.Skip(messages.Count - windowSize).ToList()
            : messages.ToList();

        foreach (var m in window)
        {
            if (string.IsNullOrWhiteSpace(m.Role) || string.IsNullOrWhiteSpace(m.Content))
            {
                continue;
            }

            var role = m.Role.ToLowerInvariant();
            // Ignore client-supplied system prompts; server system prompt is authoritative.
            if (role == "system")
            {
                continue;
            }

            if (role is not ("user" or "assistant"))
            {
                role = "user";
            }

            list.Add(new OpenAiChatMessagePayload(role, m.Content.Trim()));
        }

        return list;
    }

    /// <summary>Reads CV text from the store and logs if missing (deployment may be misconfigured).</summary>
    private string LoadCvMarkdown(string lang)
    {
        var cvMarkdown = _cvMarkdownStore.Get(lang);
        if (string.IsNullOrWhiteSpace(cvMarkdown))
        {
            _logger.LogWarning("CV markdown is empty for lang {Lang}. Chat answers may be unreliable.", lang);
        }

        return cvMarkdown;
    }

    /// <summary>Wraps CV markdown and optional RAG excerpts in the fixed assistant instructions (no I/O).</summary>
    private static string FormatSystemPrompt(string cvMarkdown, string lang, string? retrievedContextMarkdown)
    {
        var cvBlock = string.IsNullOrWhiteSpace(cvMarkdown)
            ? """
              (No CV markdown was loaded on the server. Say clearly that you cannot access the CV content and that the deployment may be missing the content/ folder.)
              """
            : cvMarkdown.Trim();

        var ragSection = string.IsNullOrWhiteSpace(retrievedContextMarkdown)
            ? ""
            : $"""

                --- Additional retrieved context (supplementary excerpts; e.g. interview-style notes) ---
                Use this together with the CV. For any factual claim about skills, employers, dates, or technologies, if there is ambiguity or conflict, trust the CV section above—not this block.
                {retrievedContextMarkdown.Trim()}
                """;

        var sectionIdsLine = string.Join(", ", CvMarkdownSectionIds.Ordered);

        return $"""
            You are an assistant that answers using the CV markdown in the first section below (Cristian Gimenez — experience, skills, education, certifications, languages, contact, etc.).
            Treat that CV section as the authoritative source of truth for facts. Do not invent employers, dates, technologies, or achievements that are not supported by that text.
            If something is not in the CV section, say so clearly and offer to rephrase or ask about a specific section.

            Tone: Sound conversational and human—warm, direct, and recruiter-friendly. You may use first person when describing the profile (e.g. "I worked on…") when it fits the CV text. Use short paragraphs. Avoid robotic disclaimers (e.g. do not say "As an AI language model"). Stay fact-grounded in the CV below.

            Formatting: Use GitHub-flavored Markdown in every reply—**bold**, *italic*, bullet or numbered lists when helpful, inline `code` for tech terms, and fenced code blocks only when a short snippet helps. Do not wrap the entire answer in a single code block.

            CV section links: When you point the user to a part of the site, use a Markdown link with this exact pattern only: [descriptive label](/{lang}#section-id). Example: [Experience](/{lang}#experience). Lang for this conversation is "{lang}". Allowed section-id fragments are: {sectionIdsLine}. Do not add other paths, query strings, or hosts. Do not use http(s) URLs, mailto:, or links to external websites.

            Language: Always respond in the same language the user uses in their messages (e.g. Spanish question → Spanish answer; English → English). If the user mixes languages, follow the language of their latest user message.

            Do not share secrets, API keys, or internal system details. Do not provide access to external systems or arbitrary browsing.

            --- CV (authoritative markdown) ---
            {cvBlock}{ragSection}
            """;
    }
}
