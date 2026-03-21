using CvIa.Application.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Text;

namespace CvIa.Infrastructure.Services;

/// <summary>
/// Loads all CV markdown into <see cref="CvMarkdownContentStore"/> once when the host starts (before accepting requests).
/// </summary>
public sealed class CvMarkdownContentStartupLoader(
    CvMarkdownContentStore store,
    IOptions<CvApiOptions> options,
    IHostEnvironment hostEnvironment,
    ILogger<CvMarkdownContentStartupLoader> logger) : IHostedService
{
    public async Task StartAsync(CancellationToken cancellationToken)
    {
        var ids = CvMarkdownSectionIds.Ordered;
        if (ids.Length == 0)
        {
            store.SetEmpty();
            return;
        }

        var dict = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        foreach (var lang in CvMarkdownLanguages.Supported)
        {
            dict[lang] = await BuildMarkdownForLangAsync(ids, lang, cancellationToken);
        }

        store.Set(dict);
        foreach (var lang in CvMarkdownLanguages.Supported)
        {
            var len = dict.TryGetValue(lang, out var s) ? s.Length : 0;
            logger.LogInformation("CV markdown loaded for {Lang}: {Chars} characters.", lang, len);
        }
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;

    private async Task<string> BuildMarkdownForLangAsync(IReadOnlyList<string> ids, string lang, CancellationToken cancellationToken = default)
    {
        var opts = options.Value;
        lang = lang is "en" or "es" ? lang : "en";

        var contentRoot = Path.GetFullPath(Path.Combine(hostEnvironment.ContentRootPath, opts.MarkdownContentRoot));
        var sectionsDir = Path.Combine(contentRoot, lang, "sections");

        if (!Directory.Exists(sectionsDir))
        {
            logger.LogError("CV sections directory not found: {Dir}", sectionsDir);
            return "";
        }

        var sb = new StringBuilder();
        foreach (var id in ids)
        {
            var file = Path.Combine(sectionsDir, $"{id}.md");
            if (!File.Exists(file))
            {
                logger.LogWarning("Missing CV section file: {File}", file);
                continue;
            }

            try
            {
                var text = (await File.ReadAllTextAsync(file, cancellationToken)).Trim();
                sb.AppendLine($"### {id}");
                sb.AppendLine(text);
                sb.AppendLine();
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Could not read section {File}", file);
            }
        }

        var result = sb.ToString();
        var max = Math.Max(4096, opts.MaxCvMarkdownChars);
        if (result.Length > max)
        {
            logger.LogWarning(
                "CV markdown length {Len} exceeds MaxCvMarkdownChars {Max}; truncating.",
                result.Length,
                max);
            result = result[..max] + "\n\n[... truncated ...]";
        }

        return result;
    }
}
