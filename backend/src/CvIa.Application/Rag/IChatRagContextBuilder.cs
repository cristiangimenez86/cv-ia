using CvIa.Application.Contracts;

namespace CvIa.Application.Rag;

/// <summary>
/// Builds the RAG context block (markdown excerpts + citations) that supplements the system prompt.
/// Implementations may return empty values when RAG is disabled or no chunks are retrieved.
/// </summary>
public interface IChatRagContextBuilder
{
    Task<ChatRagContext> BuildAsync(ChatRequestDto request, string normalizedLang, CancellationToken cancellationToken);
}

/// <summary>
/// Result of <see cref="IChatRagContextBuilder.BuildAsync"/>. <see cref="Markdown"/> is appended to the system prompt;
/// <see cref="Citations"/> is attached to the API response so the UI can render sources.
/// </summary>
public readonly record struct ChatRagContext(string? Markdown, IReadOnlyList<ChatCitationDto>? Citations)
{
    public static ChatRagContext Empty { get; } = new(null, null);
}
