using CvIa.Application.Configuration;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace CvIa.Infrastructure.Rag.Configuration;

/// <summary>
/// Fails fast at startup if RAG is enabled but the configuration is incomplete or incompatible
/// with the current schema (missing connection string, wrong embedding dimension, missing 'cv' source).
/// </summary>
public sealed class RagConfigurationStartupValidator(
    IOptions<RagOptions> ragOptions,
    IConfiguration configuration,
    ILogger<RagConfigurationStartupValidator> logger) : IHostedService
{
    private const int RequiredEmbeddingDimensions = 1536;
    private const string RequiredSourceId = "cv";
    private const string RagConnectionStringName = "Rag";

    public Task StartAsync(CancellationToken cancellationToken)
    {
        var options = ragOptions.Value;
        if (!options.Enabled)
        {
            return Task.CompletedTask;
        }

        EnsureConnectionString();
        EnsureEmbeddingDimensions(options);
        EnsureCvSourcePresent(options);

        return Task.CompletedTask;
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;

    private void EnsureConnectionString()
    {
        var connectionString = configuration.GetConnectionString(RagConnectionStringName);
        if (!string.IsNullOrWhiteSpace(connectionString))
        {
            return;
        }

        logger.LogError("RAG is enabled but ConnectionStrings:{Name} is empty.", RagConnectionStringName);
        throw new InvalidOperationException(
            $"RAG is enabled but ConnectionStrings:{RagConnectionStringName} is not configured.");
    }

    private void EnsureEmbeddingDimensions(RagOptions options)
    {
        if (options.EmbeddingDimensions == RequiredEmbeddingDimensions)
        {
            return;
        }

        logger.LogError(
            "RAG EmbeddingDimensions must be {Expected} for current schema. Got {Actual}.",
            RequiredEmbeddingDimensions, options.EmbeddingDimensions);
        throw new InvalidOperationException(
            $"RAG EmbeddingDimensions mismatch (expected {RequiredEmbeddingDimensions}).");
    }

    private void EnsureCvSourcePresent(RagOptions options)
    {
        var hasCv = options.Sources
            .Any(source => string.Equals(source.Id, RequiredSourceId, StringComparison.OrdinalIgnoreCase));
        if (hasCv)
        {
            return;
        }

        logger.LogError("RAG Sources must include the '{SourceId}' source in v1.", RequiredSourceId);
        throw new InvalidOperationException($"Rag:Sources must include '{RequiredSourceId}'.");
    }
}
