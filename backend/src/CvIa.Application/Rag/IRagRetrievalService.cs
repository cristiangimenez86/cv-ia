using CvIa.Domain.Rag;

namespace CvIa.Application.Rag;

public interface IRagRetrievalService
{
    Task<IReadOnlyList<RagRetrievedChunk>> RetrieveAsync(string lang, float[] queryEmbedding, int topK, CancellationToken cancellationToken);
}
