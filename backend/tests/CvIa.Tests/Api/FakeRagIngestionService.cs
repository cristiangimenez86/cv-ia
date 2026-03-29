using CvIa.Application.Rag;
using CvIa.Domain.Rag;

namespace CvIa.Tests.Api;

internal sealed class FakeRagIngestionService : IRagIngestionService
{
    public RagReindexRequest? LastRequest { get; private set; }

    public Task<RagReindexResult> ReindexAsync(RagReindexRequest request, CancellationToken cancellationToken)
    {
        LastRequest = request;
        return Task.FromResult(new RagReindexResult(request.Mode, new Dictionary<string, int> { ["cv"] = 1 }, TimeSpan.FromMilliseconds(1)));
    }
}
