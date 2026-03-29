namespace CvIa.Domain.Rag;

public sealed record RagReindexResult(
    RagIngestionMode Mode,
    IReadOnlyDictionary<string, int> ChunksWrittenBySource,
    TimeSpan Duration
);
