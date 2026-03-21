namespace CvIa.Application.Contracts;

/// <param name="Lang">CV page locale (<c>en</c> or <c>es</c>) for API compatibility; assistant reply language follows the user's messages, not this field.</param>
/// <remarks>Temperature and max output tokens are server-only (<c>OpenAiChat</c> in appsettings), not client-controlled.</remarks>
public sealed record ChatRequestDto(
    string Lang,
    IReadOnlyList<ChatMessageDto> Messages
);

