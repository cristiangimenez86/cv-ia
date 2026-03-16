using CvIa.Application;
using CvIa.Application.Contracts;

namespace CvIa.Infrastructure.Services;

public sealed class StubChatCompletionService : IChatCompletionService
{
    public Task<ChatResponseDto> CompleteAsync(ChatRequestDto request, CancellationToken cancellationToken)
    {
        var lastUserMessage = request.Messages.LastOrDefault(m => m.Role == "user")?.Content ?? string.Empty;

        // Test hook: allows middleware test to trigger an unhandled exception.
        if (string.Equals(lastUserMessage, "throw", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Forced exception for global middleware test.");
        }

        var response = new ChatResponseDto(
            Id: $"chatcmpl_{Guid.NewGuid():N}",
            CreatedAt: DateTimeOffset.UtcNow,
            Message: new ChatMessageDto(
                Role: "assistant",
                Content: request.Lang == "es"
                    ? "Scaffold activo. El endpoint de chat ya esta conectado al contrato."
                    : "Scaffold is active. Chat endpoint is wired to the contract."
            ),
            Citations:
            [
                new ChatCitationDto("content/en/sections/about.md", "About", null)
            ]
        );

        return Task.FromResult(response);
    }
}

