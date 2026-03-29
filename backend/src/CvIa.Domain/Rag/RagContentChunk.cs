namespace CvIa.Domain.Rag;

/// <summary>
/// Persisted RAG chunk row. Embeddings are stored as <see cref="float"/>[] in the domain;
/// infrastructure maps to PostgreSQL <c>vector</c>.
/// </summary>
public sealed class RagContentChunk
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string SourceId { get; set; } = string.Empty;
    public string DocumentKey { get; set; } = string.Empty;
    public string? SectionId { get; set; }
    public string? Lang { get; set; }
    public int ChunkIndex { get; set; }
    public string Text { get; set; } = string.Empty;

    /// <summary>Embedding vector (e.g. 1536 dims for text-embedding-3-small).</summary>
    public float[] Embedding { get; set; } = [];

    public DateTimeOffset UpdatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
}
