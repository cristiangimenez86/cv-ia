namespace CvIa.Domain.Rag;

public sealed record RagChunk(
    string SourceId,
    string DocumentKey,
    string? Lang,
    string? SectionId,
    int ChunkIndex,
    string Text
);
