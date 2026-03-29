namespace CvIa.Infrastructure.Rag.Persistence.Models;

internal sealed record RagDistanceRow(
    string SourceId,
    string DocumentKey,
    string? Lang,
    string? SectionId,
    int ChunkIndex,
    string Text,
    double Distance);
