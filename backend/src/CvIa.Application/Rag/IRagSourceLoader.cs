using CvIa.Application.Configuration;
using CvIa.Domain.Rag;

namespace CvIa.Application.Rag;

public interface IRagSourceLoader
{
    string Type { get; }

    Task<IReadOnlyList<RagSourceDocument>> LoadDocumentsAsync(RagSourceOptions source, CancellationToken cancellationToken);
}
