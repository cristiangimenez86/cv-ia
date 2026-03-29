using CvIa.Domain.Rag;
using CvIa.Infrastructure.Rag.Persistence.Models;
using Microsoft.EntityFrameworkCore;
using Pgvector;

namespace CvIa.Infrastructure.Rag.Persistence.Repositories;

public sealed class RagChunkSimilarityRepository(RagDbContext db)
{
    public async Task<IReadOnlyList<RagRetrievedChunk>> SearchAsync(
        string lang,
        float[] queryEmbedding,
        int topK,
        CancellationToken cancellationToken)
    {
        if (topK <= 0) return [];

        var vector = new Vector(queryEmbedding);

        var sql = """
                  SELECT
                    source_id AS "SourceId",
                    document_key AS "DocumentKey",
                    lang AS "Lang",
                    section_id AS "SectionId",
                    chunk_index AS "ChunkIndex",
                    text AS "Text",
                    (embedding <=> {0}) AS "Distance"
                  FROM content_chunk
                  WHERE lang = {1}
                  ORDER BY embedding <=> {0}
                  LIMIT {2}
                  """;

        var rows = await db.Database
            .SqlQueryRaw<RagDistanceRow>(sql, vector, lang, topK)
            .ToListAsync(cancellationToken);

        return rows.Select(r => new RagRetrievedChunk(
            r.SourceId,
            r.DocumentKey,
            r.Lang,
            r.SectionId,
            r.ChunkIndex,
            r.Text,
            Score: -r.Distance)).ToList();
    }
}
