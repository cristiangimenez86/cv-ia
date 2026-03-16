using CvIa.Application.Contracts;

namespace CvIa.Application;

public interface ICvQueryService
{
    Task<CvPdfAssetDto> GetPdfAsync(string lang, CancellationToken cancellationToken);
}

