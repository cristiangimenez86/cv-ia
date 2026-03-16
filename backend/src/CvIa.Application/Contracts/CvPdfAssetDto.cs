namespace CvIa.Application.Contracts;

public sealed record CvPdfAssetDto(
    string FilePath,
    string DownloadFileName,
    string ContentType
);

