using System.Globalization;
using System.Text;
using CvIa.Domain.Rag;
using CvIa.Infrastructure.Rag.Persistence.Models;
using Microsoft.EntityFrameworkCore;

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

        // Text form + CAST avoids Npgsql 8+ failing to bind Pgvector.Vector on EF SqlQueryRaw parameters
        // ("datatype was not found in the current database info" / NpgsqlDbType resolution).
        var vectorText = ToVectorLiteral(queryEmbedding);

        var sql = """
                  SELECT
                    c.source_id AS "SourceId",
                    c.document_key AS "DocumentKey",
                    c.lang AS "Lang",
                    c.section_id AS "SectionId",
                    c.chunk_index AS "ChunkIndex",
                    c.text AS "Text",
                    (c.embedding <=> emb.v) AS "Distance"
                  FROM content_chunk AS c
                  CROSS JOIN (SELECT CAST({0} AS vector) AS v) AS emb
                  WHERE c.lang = {1}
                  ORDER BY c.embedding <=> emb.v
                  LIMIT {2}
                  """;

        var rows = await db.Database
            .SqlQueryRaw<RagDistanceRow>(sql, vectorText, lang, topK)
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

    private static string ToVectorLiteral(float[] embedding)
    {
        var sb = new StringBuilder(embedding.Length * 12 + 2);
        sb.Append('[');
        for (var i = 0; i < embedding.Length; i++)
        {
            if (i > 0) sb.Append(',');
            sb.Append(embedding[i].ToString(CultureInfo.InvariantCulture));
        }

        sb.Append(']');
        return sb.ToString();
    }
}
