namespace CvIa.Domain.Rag;

public sealed record RagRetrievedChunk(
    string SourceId,
    string DocumentKey,
    string? Lang,
    string? SectionId,
    int ChunkIndex,
    string Text,
    double Score
);
