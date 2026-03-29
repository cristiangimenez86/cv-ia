namespace CvIa.Api.Models;

public sealed record ReindexRequestDto(string? Mode, string[]? SourceIds);
