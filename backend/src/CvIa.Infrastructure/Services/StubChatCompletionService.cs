using System.Text.RegularExpressions;
using CvIa.Application;
using CvIa.Application.Contracts;

namespace CvIa.Infrastructure.Services;

public sealed partial class StubChatCompletionService : IChatCompletionService
{
    [GeneratedRegex(@"\bestas\b", RegexOptions.CultureInvariant)]
    private static partial Regex SpanishEstasRegex();

    private static readonly char[] SpanishOnlyChars =
        ['ñ', 'Ñ', '¿', '¡', 'á', 'é', 'í', 'ó', 'ú', 'Á', 'É', 'Í', 'Ó', 'Ú'];

    private static readonly string[] SpanishMarkerSubstrings =
    [
        "estás", " cómo ", " qué ", "cuál", "dónde", "hola", "gracias", "buenos días"
    ];

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

        if (text.IndexOfAny(SpanishOnlyChars) >= 0)
        {
            return true;
        }

        var lower = text.ToLowerInvariant();
        foreach (var marker in SpanishMarkerSubstrings)
        {
            if (lower.Contains(marker, StringComparison.Ordinal))
            {
                return true;
            }
        }

        return SpanishEstasRegex().IsMatch(lower);
    }
}

