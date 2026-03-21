using CvIa.Application.Contracts;

namespace CvIa.Application;

/// <summary>Builds trimmed chat message payloads (system + user/assistant window) for OpenAI (or compatible) APIs.</summary>
public interface IOpenAiChatPromptBuilder
{
    IReadOnlyList<OpenAiChatMessagePayload> BuildMessages(IReadOnlyList<ChatMessageDto> messages, string lang);
}
