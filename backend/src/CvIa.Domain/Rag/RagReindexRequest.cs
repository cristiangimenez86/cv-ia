namespace CvIa.Domain.Rag;

public sealed record RagReindexRequest(RagIngestionMode Mode, IReadOnlyList<string>? SourceIds);
