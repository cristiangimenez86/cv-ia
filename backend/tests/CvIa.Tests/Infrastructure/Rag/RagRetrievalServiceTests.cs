using CvIa.Infrastructure.Rag.Persistence;
using CvIa.Infrastructure.Rag.Persistence.Repositories;
using CvIa.Infrastructure.Rag.Services;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace CvIa.Tests.Infrastructure.Rag;

public sealed class RagRetrievalServiceTests
{
    [Fact]
    public async Task RetrieveAsync_ReturnsEmpty_WhenTopKIsZero()
    {
        var options = new DbContextOptionsBuilder<RagDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString("N"))
            .Options;

        await using var db = new RagDbContext(options);
        var repo = new RagChunkSimilarityRepository(db);
        var service = new RagRetrievalService(repo);

        var result = await service.RetrieveAsync("en", new float[1536], topK: 0, CancellationToken.None);

        Assert.Empty(result);
    }
}
