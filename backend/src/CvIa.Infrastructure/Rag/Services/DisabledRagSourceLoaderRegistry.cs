using CvIa.Application.Rag;

namespace CvIa.Infrastructure.Rag.Services;

internal sealed class DisabledRagSourceLoaderRegistry : IRagSourceLoaderRegistry
{
    public IRagSourceLoader Resolve(string type) =>
        throw new InvalidOperationException("RAG sources are not available because the RAG database is not configured.");
}
