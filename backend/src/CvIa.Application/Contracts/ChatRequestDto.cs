namespace CvIa.Application.Contracts;

public sealed record ChatRequestDto(
    string Lang,
    IReadOnlyList<ChatMessageDto> Messages,
    double? Temperature,
    int? MaxTokens
);

