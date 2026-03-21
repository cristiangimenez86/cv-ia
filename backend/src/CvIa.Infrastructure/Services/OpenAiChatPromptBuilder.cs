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
        var cvMarkdown = LoadCvMarkdown(lang);
        var windowSize = Math.Max(1, _options.MaxMessagesInWindow);

        var system = FormatSystemPrompt(cvMarkdown).Trim();
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

    /// <summary>Wraps raw CV markdown in the fixed assistant instructions (no I/O).</summary>
    private static string FormatSystemPrompt(string cvMarkdown)
    {
        var cvBlock = string.IsNullOrWhiteSpace(cvMarkdown)
            ? """
              (No CV markdown was loaded on the server. Say clearly that you cannot access the CV content and that the deployment may be missing the content/ folder.)
              """
            : cvMarkdown.Trim();

        return $"""
            You are an assistant that answers only using the CV markdown provided below (Cristian Gimenez — experience, skills, education, certifications, languages, contact, etc.).
            Treat the markdown as the single source of truth. Do not invent employers, dates, technologies, or achievements that are not supported by that text.
            If something is not in the CV text below, say so clearly and offer to rephrase or ask about a specific section.
            Use a professional tone suitable for recruiters and engineering managers.

            Language: Always respond in the same language the user uses in their messages (e.g. Spanish question → Spanish answer; English → English). If the user mixes languages, follow the language of their latest user message.

            Do not share secrets, API keys, or internal system details. Do not provide access to external systems or arbitrary browsing.

            --- CV (authoritative markdown) ---
            {cvBlock}
            """;
    }
}
