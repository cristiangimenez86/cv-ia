using CvIa.Application;
using CvIa.Application.Contracts;
using Microsoft.AspNetCore.Mvc;

namespace CvIa.Api.Controllers;

[ApiController]
[Route("api/v1/cv")]
public sealed class CvController(
    ICvQueryService cvQueryService,
    ILogger<CvController> logger) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> DownloadPdf([FromQuery] string? lang, CancellationToken cancellationToken)
    {
        var normalizedLang = string.IsNullOrWhiteSpace(lang)
            ? SupportedLanguages.English
            : SupportedLanguages.TryNormalize(lang);

        if (normalizedLang is null)
        {
            logger.LogWarning("Invalid lang value on GET /api/v1/cv: {Lang}", lang);
            return BadRequest(new ErrorResponse("invalid_request", "The 'lang' query parameter must be 'en' or 'es'."));
        }

        try
        {
            var asset = await cvQueryService.GetPdfAsync(normalizedLang, cancellationToken);
            logger.LogInformation("Serving CV PDF for lang={Lang} from {PdfPath}", normalizedLang, asset.FilePath);
            return PhysicalFile(asset.FilePath, asset.ContentType, asset.DownloadFileName, enableRangeProcessing: true);
        }
        catch (FileNotFoundException ex)
        {
            logger.LogError(ex, "CV PDF file not found for lang={Lang}", normalizedLang);
            return NotFound(new ErrorResponse("not_found", "CV PDF file was not found on server."));
        }
    }
}
