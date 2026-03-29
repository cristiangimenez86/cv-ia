using CvIa.Application.Contracts;

namespace CvIa.Application;

/// <summary>Builds trimmed chat message payloads (system + user/assistant window) for OpenAI (or compatible) APIs.</summary>
public interface IOpenAiChatPromptBuilder
{
    IReadOnlyList<OpenAiChatMessagePayload> BuildMessages(IReadOnlyList<ChatMessageDto> messages, string lang);

    /// <summary>
    /// Builds payloads using retrieved RAG context when provided; otherwise uses the full CV markdown loaded at startup.
    /// </summary>
    IReadOnlyList<OpenAiChatMessagePayload> BuildMessages(IReadOnlyList<ChatMessageDto> messages, string lang, string? retrievedContextMarkdown);
}
