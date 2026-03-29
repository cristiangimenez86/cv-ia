using CvIa.Application.Rag;
using Microsoft.Extensions.DependencyInjection;

namespace CvIa.Infrastructure.Rag.SourceLoaders;

public sealed class RagSourceLoaderRegistry(IServiceProvider serviceProvider) : IRagSourceLoaderRegistry
{
    public IRagSourceLoader Resolve(string type)
    {
        var loaders = serviceProvider.GetServices<IRagSourceLoader>();
        var loader = loaders.FirstOrDefault(x => string.Equals(x.Type, type, StringComparison.OrdinalIgnoreCase));
        return loader ?? throw new InvalidOperationException($"No RAG source loader registered for type '{type}'.");
    }
}
