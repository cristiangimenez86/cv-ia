namespace CvIa.Application.Rag;

public interface IRagSourceLoaderRegistry
{
    IRagSourceLoader Resolve(string type);
}
