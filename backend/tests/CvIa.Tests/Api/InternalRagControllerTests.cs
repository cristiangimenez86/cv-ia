using System.Net;
using System.Net.Http.Json;
using CvIa.Application.Configuration;
using CvIa.Application.Rag;
using CvIa.Domain.Rag;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace CvIa.Tests.Api;

public sealed class InternalRagControllerTests
{
    [Fact]
    public async Task Reindex_Returns503_WhenKeyNotConfigured()
    {
        await using var factory = new RagWebApplicationFactory(configureKey: "");
        var client = factory.CreateClient();

        var res = await client.PostAsJsonAsync("/internal/v1/rag/reindex", new { mode = "incremental", sourceIds = new[] { "cv" } });

        Assert.Equal(HttpStatusCode.ServiceUnavailable, res.StatusCode);
    }

    [Fact]
    public async Task Reindex_Returns401_WhenHeaderMissingOrWrong()
    {
        await using var factory = new RagWebApplicationFactory(configureKey: "secret");
        var client = factory.CreateClient();

        var resMissing = await client.PostAsJsonAsync("/internal/v1/rag/reindex", new { mode = "incremental" });
        Assert.Equal(HttpStatusCode.Unauthorized, resMissing.StatusCode);

        using var req = new HttpRequestMessage(HttpMethod.Post, "/internal/v1/rag/reindex")
        {
            Content = JsonContent.Create(new { mode = "incremental" })
        };
        req.Headers.Add("X-Rag-Ingestion-Key", "wrong");
        var resWrong = await client.SendAsync(req);
        Assert.Equal(HttpStatusCode.Unauthorized, resWrong.StatusCode);
    }

    [Fact]
    public async Task Reindex_Returns409_WhenSingleFlightBusy()
    {
        await using var factory = new RagWebApplicationFactory(configureKey: "secret");
        var client = factory.CreateClient();

        var gate = factory.Services.GetRequiredService<CvIa.Api.RagIngestionSingleFlightGate>();
        Assert.True(gate.TryEnter());
        try
        {
            using var req = new HttpRequestMessage(HttpMethod.Post, "/internal/v1/rag/reindex")
            {
                Content = JsonContent.Create(new { mode = "incremental" })
            };
            req.Headers.Add("X-Rag-Ingestion-Key", "secret");

            var res = await client.SendAsync(req);
            Assert.Equal(HttpStatusCode.Conflict, res.StatusCode);
        }
        finally
        {
            gate.Exit();
        }
    }

    [Fact]
    public async Task Reindex_Returns200_AndCallsService()
    {
        var fake = new FakeRagIngestionService();
        await using var factory = new RagWebApplicationFactory(configureKey: "secret", fake);
        var client = factory.CreateClient();

        using var req = new HttpRequestMessage(HttpMethod.Post, "/internal/v1/rag/reindex")
        {
            Content = JsonContent.Create(new { mode = "incremental", sourceIds = new[] { "cv" } })
        };
        req.Headers.Add("X-Rag-Ingestion-Key", "secret");

        var res = await client.SendAsync(req);
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        Assert.Equal(RagIngestionMode.Incremental, fake.LastRequest?.Mode);
        Assert.Equal(["cv"], fake.LastRequest?.SourceIds);
    }
}
