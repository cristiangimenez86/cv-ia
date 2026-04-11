using CvIa.Application.Configuration;
using CvIa.Application.Rag;
using CvIa.Domain.Rag;
using CvIa.Infrastructure.Services;
using Microsoft.Extensions.Hosting;

namespace CvIa.Infrastructure.Rag.SourceLoaders;

/// <summary>
/// Loads CV section markdown documents from <c>content/{lang}/sections/{sectionId}.md</c>,
/// including <see cref="CvMarkdownSectionIds.RagIngestionOnly"/> (not part of the public site <c>sectionsOrder</c>).
/// Uses <see cref="IHostEnvironment.ContentRootPath"/> with <see cref="RagSourceOptions.ContentRoot"/> so paths match
/// <see cref="CvMarkdownContentStartupLoader"/> (project root when running <c>dotnet run</c>; publish/Docker layout unchanged).
/// </summary>
public sealed class CvSectionsRagSourceLoader(IHostEnvironment hostEnvironment) : IRagSourceLoader
{
    public string Type => "cv-sections";

    public async Task<IReadOnlyList<RagSourceDocument>> LoadDocumentsAsync(RagSourceOptions source, CancellationToken cancellationToken)
    {
        var contentRoot = source.ContentRoot;
        var docs = new List<RagSourceDocument>();

        foreach (var lang in new[] { "en", "es" })
        {
            foreach (var sectionId in CvMarkdownSectionIds.Ordered.Concat(CvMarkdownSectionIds.RagIngestionOnly))
            {
                var path = Path.GetFullPath(Path.Combine(hostEnvironment.ContentRootPath, contentRoot, lang, "sections", $"{sectionId}.md"));
                if (!File.Exists(path))
                {
                    continue;
                }

                var text = await File.ReadAllTextAsync(path, cancellationToken);
                docs.Add(new RagSourceDocument(source.Id, DocumentKey: sectionId, lang, sectionId, text));
            }
        }

        return docs;
    }
}
