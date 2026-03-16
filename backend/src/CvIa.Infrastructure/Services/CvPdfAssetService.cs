using CvIa.Application;
using CvIa.Application.Contracts;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace CvIa.Infrastructure.Services;

public sealed class CvPdfAssetService(
    IConfiguration configuration,
    IHostEnvironment hostEnvironment,
    ILogger<CvPdfAssetService> logger
) : ICvQueryService
{
    public Task<CvPdfAssetDto> GetPdfAsync(string lang, CancellationToken cancellationToken)
    {
        var relativePath = configuration["CvApi:PdfAssetPath"] ?? "Assets/Cv/cv.pdf";
        var absolutePath = Path.GetFullPath(Path.Combine(hostEnvironment.ContentRootPath, relativePath));

        if (!File.Exists(absolutePath))
        {
            logger.LogError("CV PDF asset not found. Checked path: {PdfPath}", absolutePath);
            throw new FileNotFoundException("Configured CV PDF asset was not found.", absolutePath);
        }

        var downloadFileName = $"cv.{lang}.pdf";
        return Task.FromResult(new CvPdfAssetDto(absolutePath, downloadFileName, "application/pdf"));
    }
}

