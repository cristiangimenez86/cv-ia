namespace CvIa.Application.Contracts;

public sealed record ErrorResponse(
    string Code,
    string Message,
    IReadOnlyDictionary<string, object?>? Details = null
);

