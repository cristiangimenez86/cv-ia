using CvIa.Application.Rag;
using CvIa.Domain.Rag;

namespace CvIa.Infrastructure.Rag.Services;

internal sealed class DisabledRagRetrievalService : IRagRetrievalService
{
    public Task<IReadOnlyList<RagRetrievedChunk>> RetrieveAsync(string lang, float[] queryEmbedding, int topK, CancellationToken cancellationToken) =>
        Task.FromResult<IReadOnlyList<RagRetrievedChunk>>([]);
}
