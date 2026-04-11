using CvIa.Application.Contracts;

namespace CvIa.Application;

/// <summary>Builds trimmed chat message payloads (system + user/assistant window) for OpenAI (or compatible) APIs.</summary>
public interface IOpenAiChatPromptBuilder
{
    IReadOnlyList<OpenAiChatMessagePayload> BuildMessages(IReadOnlyList<ChatMessageDto> messages, string lang);

    /// <summary>
    /// Builds payloads with the full CV markdown always included. When <paramref name="retrievedContextMarkdown"/> is non-empty,
    /// it is appended after the CV as supplementary context (RAG); the CV remains authoritative for factual claims.
    /// </summary>
    IReadOnlyList<OpenAiChatMessagePayload> BuildMessages(IReadOnlyList<ChatMessageDto> messages, string lang, string? retrievedContextMarkdown);
}
