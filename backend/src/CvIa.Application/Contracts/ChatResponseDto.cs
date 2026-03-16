namespace CvIa.Application.Contracts;

public sealed record ChatResponseDto(
    string Id,
    DateTimeOffset CreatedAt,
    ChatMessageDto Message,
    IReadOnlyList<ChatCitationDto>? Citations
);

