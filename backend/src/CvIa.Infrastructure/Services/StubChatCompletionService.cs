using System.Text.RegularExpressions;
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

        var stubText = LooksLikeSpanish(lastUserMessage)
            ? "Scaffold activo. El endpoint de chat ya esta conectado al contrato."
            : "Scaffold is active. Chat endpoint is wired to the contract.";

        var response = new ChatResponseDto(
            Id: $"chatcmpl_{Guid.NewGuid():N}",
            CreatedAt: DateTimeOffset.UtcNow,
            Message: new ChatMessageDto(
                Role: "assistant",
                Content: stubText
            ),
            Citations:
            [
                new ChatCitationDto("content/en/sections/about.md", "About", null)
            ]
        );

        return Task.FromResult(response);
    }

    /// <summary>Lightweight hint for stub responses so dev matches user language without using CV page locale.</summary>
    private static bool LooksLikeSpanish(string text)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            return false;
        }

        foreach (var c in text)
        {
            if (c is 'ñ' or 'Ñ' or '¿' or '¡' or 'á' or 'é' or 'í' or 'ó' or 'ú'
                or 'Á' or 'É' or 'Í' or 'Ó' or 'Ú')
            {
                return true;
            }
        }

        var lower = text.ToLowerInvariant();
        return lower.Contains("estás", StringComparison.Ordinal)
            || lower.Contains(" cómo ", StringComparison.Ordinal)
            || lower.Contains(" qué ", StringComparison.Ordinal)
            || lower.Contains("cuál", StringComparison.Ordinal)
            || lower.Contains("dónde", StringComparison.Ordinal)
            || lower.Contains("hola", StringComparison.Ordinal)
            || lower.Contains("gracias", StringComparison.Ordinal)
            || lower.Contains("buenos días", StringComparison.Ordinal)
            || Regex.IsMatch(lower, @"\bestas\b");
    }
}

