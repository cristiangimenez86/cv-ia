namespace CvIa.Domain.Rag;

public sealed record RagSourceDocument(
    string SourceId,
    string DocumentKey,
    string? Lang,
    string? SectionId,
    string Text
);
