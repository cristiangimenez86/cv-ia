namespace CvIa.Application.Configuration;

public sealed class RagOptions
{
    public const string SectionName = "Rag";

    public bool Enabled { get; set; } = false;

    public string EmbeddingModel { get; set; } = "text-embedding-3-small";

    public int EmbeddingDimensions { get; set; } = 1536;

    public int TopK { get; set; } = 8;

    /// <summary>
    /// Soft budget for retrieved context size (implementation may approximate).
    /// </summary>
    public int MaxRetrievedContextTokens { get; set; } = 4000;

    /// <summary>
    /// Shared secret required to invoke the internal ingestion endpoint.
    /// Set via environment variable <c>Rag__IngestionApiKey</c> (Portainer) or other config providers.
    /// </summary>
    public string IngestionApiKey { get; set; } = string.Empty;

    public List<RagSourceOptions> Sources { get; set; } = [];
}
