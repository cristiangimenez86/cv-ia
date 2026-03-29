using CvIa.Domain.Rag;

namespace CvIa.Application.Rag;

public interface IRagIngestionService
{
    Task<RagReindexResult> ReindexAsync(RagReindexRequest request, CancellationToken cancellationToken);
}
