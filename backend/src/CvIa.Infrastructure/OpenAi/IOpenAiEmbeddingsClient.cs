namespace CvIa.Infrastructure.OpenAi;

public interface IOpenAiEmbeddingsClient
{
    Task<float[]> CreateEmbeddingAsync(string input, string model, CancellationToken cancellationToken);
}
