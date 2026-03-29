using CvIa.Application.Rag;
using CvIa.Domain.Rag;
using CvIa.Infrastructure.Rag.Persistence;
using CvIa.Infrastructure.Rag.Persistence.Repositories;

namespace CvIa.Infrastructure.Rag.Services;

public sealed class RagRetrievalService(RagChunkSimilarityRepository repository) : IRagRetrievalService
{
    public Task<IReadOnlyList<RagRetrievedChunk>> RetrieveAsync(
        string lang,
        float[] queryEmbedding,
        int topK,
        CancellationToken cancellationToken) =>
        repository.SearchAsync(lang, queryEmbedding, topK, cancellationToken);
}
