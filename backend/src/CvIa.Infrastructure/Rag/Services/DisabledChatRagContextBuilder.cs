using CvIa.Application.Contracts;
using CvIa.Application.Rag;

namespace CvIa.Infrastructure.Rag.Services;

/// <summary>No-op builder used when RAG is not configured. Returns an empty context (no extra markdown, no citations).</summary>
public sealed class DisabledChatRagContextBuilder : IChatRagContextBuilder
{
    public Task<ChatRagContext> BuildAsync(ChatRequestDto request, string normalizedLang, CancellationToken cancellationToken) =>
        Task.FromResult(ChatRagContext.Empty);
}
