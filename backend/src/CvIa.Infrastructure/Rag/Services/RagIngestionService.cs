using CvIa.Application.Configuration;
using CvIa.Application.Rag;
using CvIa.Domain.Rag;
using CvIa.Infrastructure.OpenAi;
using CvIa.Infrastructure.Rag.Chunking;
using CvIa.Infrastructure.Rag.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace CvIa.Infrastructure.Rag.Services;

public sealed class RagIngestionService(
    RagDbContext db,
    IOptions<RagOptions> ragOptions,
    IRagSourceLoaderRegistry loaderRegistry,
    IOpenAiEmbeddingsClient embeddingsClient) : IRagIngestionService
{
    public async Task<RagReindexResult> ReindexAsync(RagReindexRequest request, CancellationToken cancellationToken)
    {
        var startedAt = DateTimeOffset.UtcNow;
        var options = ragOptions.Value;

        if (options.Sources.Count == 0)
        {
            throw new InvalidOperationException("Rag:Sources must define at least one source.");
        }

        var selectedSources = SelectSources(options, request);

        if (request.Mode == RagIngestionMode.Full)
        {
            await db.Database.ExecuteSqlRawAsync("DELETE FROM content_chunk;", cancellationToken);
        }
        else
        {
            foreach (var source in selectedSources)
            {
                await db.ContentChunks
                    .Where(x => x.SourceId == source.Id)
                    .ExecuteDeleteAsync(cancellationToken);
            }
        }

        var writtenBySource = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);

        foreach (var source in selectedSources)
        {
            var loader = loaderRegistry.Resolve(source.Type);
            var docs = await loader.LoadDocumentsAsync(source, cancellationToken);

            var chunks = docs.SelectMany(d => RagChunker.ChunkDocument(d)).ToList();
            var entities = new List<RagContentChunk>(chunks.Count);

            foreach (var chunk in chunks)
            {
                var embedding = await embeddingsClient.CreateEmbeddingAsync(chunk.Text, options.EmbeddingModel, cancellationToken);
                if (embedding.Length != options.EmbeddingDimensions)
                {
                    throw new InvalidOperationException(
                        $"Embedding vector length mismatch. Expected {options.EmbeddingDimensions}, got {embedding.Length}.");
                }

                entities.Add(new RagContentChunk
                {
                    Id = Guid.NewGuid(),
                    SourceId = chunk.SourceId,
                    DocumentKey = chunk.DocumentKey,
                    Lang = chunk.Lang,
                    SectionId = chunk.SectionId,
                    ChunkIndex = chunk.ChunkIndex,
                    Text = chunk.Text,
                    Embedding = embedding,
                    UpdatedAtUtc = DateTimeOffset.UtcNow
                });
            }

            if (entities.Count > 0)
            {
                await db.ContentChunks.AddRangeAsync(entities, cancellationToken);
                await db.SaveChangesAsync(cancellationToken);
            }

            writtenBySource[source.Id] = entities.Count;
        }

        var duration = DateTimeOffset.UtcNow - startedAt;
        return new RagReindexResult(request.Mode, writtenBySource, duration);
    }

    private static IReadOnlyList<RagSourceOptions> SelectSources(RagOptions options, RagReindexRequest request)
    {
        if (request.SourceIds is null || request.SourceIds.Count == 0)
        {
            return options.Sources;
        }

        var set = new HashSet<string>(request.SourceIds, StringComparer.OrdinalIgnoreCase);
        var selected = options.Sources.Where(s => set.Contains(s.Id)).ToList();
        if (selected.Count != set.Count)
        {
            var missing = set.Except(selected.Select(s => s.Id), StringComparer.OrdinalIgnoreCase);
            throw new InvalidOperationException($"Unknown Rag sourceIds: {string.Join(", ", missing)}");
        }

        return selected;
    }
}
