using CvIa.Application.Configuration;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace CvIa.Infrastructure.Rag.Configuration;

public sealed class RagConfigurationStartupValidator(
    IOptions<RagOptions> ragOptions,
    IConfiguration configuration,
    ILogger<RagConfigurationStartupValidator> logger) : IHostedService
{
    public Task StartAsync(CancellationToken cancellationToken)
    {
        var options = ragOptions.Value;
        if (!options.Enabled)
        {
            return Task.CompletedTask;
        }

        var conn = configuration.GetConnectionString("Rag");
        if (string.IsNullOrWhiteSpace(conn))
        {
            logger.LogError("RAG is enabled but ConnectionStrings:Rag is empty.");
            throw new InvalidOperationException("RAG is enabled but ConnectionStrings:Rag is not configured.");
        }

        if (options.EmbeddingDimensions != 1536)
        {
            logger.LogError("RAG EmbeddingDimensions must be 1536 for current schema. Got {Dim}.", options.EmbeddingDimensions);
            throw new InvalidOperationException("RAG EmbeddingDimensions mismatch (expected 1536).");
        }

        if (options.Sources.Count == 0 || options.Sources.All(s => !string.Equals(s.Id, "cv", StringComparison.OrdinalIgnoreCase)))
        {
            logger.LogError("RAG Sources must include the 'cv' source in v1.");
            throw new InvalidOperationException("Rag:Sources must include 'cv'.");
        }

        return Task.CompletedTask;
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
