using CvIa.Application.Rag;
using CvIa.Domain.Rag;

namespace CvIa.Tests.Infrastructure.OpenAiChat;

internal sealed class NoopRagRetrievalService : IRagRetrievalService
{
    public Task<IReadOnlyList<RagRetrievedChunk>> RetrieveAsync(string lang, float[] queryEmbedding, int topK, CancellationToken cancellationToken) =>
        Task.FromResult<IReadOnlyList<RagRetrievedChunk>>([]);
}
