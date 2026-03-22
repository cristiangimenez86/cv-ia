namespace CvIa.Application.Configuration;

/// <summary>Typed <c>CvApi</c> settings (PDF download + chat markdown source).</summary>
public sealed class CvApiOptions
{
    public const string SectionName = "CvApi";

    /// <summary>
    /// Fallback PDF when <see cref="PdfAssetPaths"/> has no entry for the requested language.
    /// Relative to <see cref="Microsoft.Extensions.Hosting.IHostEnvironment.ContentRootPath"/>.
    /// </summary>
    public string PdfAssetPath { get; set; } = "Assets/Cv/cv.en.pdf";

    /// <summary>Relative paths per language (<c>en</c>, <c>es</c>), keyed by lowercase code.</summary>
    public Dictionary<string, string>? PdfAssetPaths { get; set; }

    /// <summary>
    /// Root folder that contains <c>en/sections</c> and <c>es/sections</c> (repo <c>content/</c>).
    /// Relative to ContentRootPath (API project folder).
    /// </summary>
    public string MarkdownContentRoot { get; set; } = "../../../content";

    /// <summary>Max characters of concatenated markdown sent to the model (rest truncated).</summary>
    public int MaxCvMarkdownChars { get; set; } = 120_000;
}
