using CvIa.Application.Contracts;

namespace CvIa.Application;

public interface IChatCompletionService
{
    Task<ChatResponseDto> CompleteAsync(ChatRequestDto request, CancellationToken cancellationToken);
}

