using CvIa.Application.Rag;
using CvIa.Domain.Rag;

namespace CvIa.Infrastructure.Rag.Services;

internal sealed class DisabledRagIngestionService : IRagIngestionService
{
    public Task<RagReindexResult> ReindexAsync(RagReindexRequest request, CancellationToken cancellationToken) =>
        throw new InvalidOperationException("RAG database is not configured (missing ConnectionStrings:Rag).");
}
