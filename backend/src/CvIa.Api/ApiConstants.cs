namespace CvIa.Api;

/// <summary>Cross-cutting strings used by routing, middleware, and configuration.</summary>
internal static class ApiConstants
{
    internal const string CorsPolicyName = "CvIaBrowser";

    internal const string ChatRateLimitPolicy = "ChatCompletions";

    internal const string ChatCompletionsPath = "/api/v1/chat/completions";

    internal const string PublicApiPathPrefix = "/api/v1/";

    internal const string RagIngestionKeyHeader = "X-Rag-Ingestion-Key";
}
