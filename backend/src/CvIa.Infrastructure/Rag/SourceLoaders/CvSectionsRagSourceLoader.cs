using CvIa.Application.Configuration;
using CvIa.Application.Rag;
using CvIa.Domain.Rag;
using CvIa.Infrastructure.Services;

namespace CvIa.Infrastructure.Rag.SourceLoaders;

/// <summary>
/// Loads CV section markdown documents from <c>content/{lang}/sections/{sectionId}.md</c>.
/// </summary>
public sealed class CvSectionsRagSourceLoader : IRagSourceLoader
{
    public string Type => "cv-sections";

    public async Task<IReadOnlyList<RagSourceDocument>> LoadDocumentsAsync(RagSourceOptions source, CancellationToken cancellationToken)
    {
        var contentRoot = source.ContentRoot;
        var docs = new List<RagSourceDocument>();

        foreach (var lang in new[] { "en", "es" })
        {
            foreach (var sectionId in CvMarkdownSectionIds.Ordered)
            {
                var path = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, contentRoot, lang, "sections", $"{sectionId}.md"));
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
