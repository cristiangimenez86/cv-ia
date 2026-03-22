using CvIa.Application;
using CvIa.Application.Configuration;
using CvIa.Application.Contracts;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace CvIa.Infrastructure.Services;

public sealed class CvPdfAssetService(
    IOptions<CvApiOptions> options,
    IHostEnvironment hostEnvironment,
    ILogger<CvPdfAssetService> logger
) : ICvQueryService
{
    public Task<CvPdfAssetDto> GetPdfAsync(string lang, CancellationToken cancellationToken)
    {
        var opts = options.Value;
        var langKey = lang.ToLowerInvariant();
        string relativePath;
        if (opts.PdfAssetPaths?.TryGetValue(langKey, out var configured) == true
            && !string.IsNullOrWhiteSpace(configured))
        {
            relativePath = configured;
        }
        else
        {
            relativePath = opts.PdfAssetPath;
        }

        var absolutePath = Path.GetFullPath(Path.Combine(hostEnvironment.ContentRootPath, relativePath));

        if (!File.Exists(absolutePath))
        {
            logger.LogError("CV PDF asset not found. Checked path: {PdfPath}", absolutePath);
            throw new FileNotFoundException("Configured CV PDF asset was not found.", absolutePath);
        }

        var downloadFileName = $"cv_cristian_gimenez_{lang}.pdf";
        return Task.FromResult(new CvPdfAssetDto(absolutePath, downloadFileName, "application/pdf"));
    }
}
