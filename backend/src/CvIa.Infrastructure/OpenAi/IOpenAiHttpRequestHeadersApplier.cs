using CvIa.Application.Configuration;

namespace CvIa.Infrastructure.OpenAi;

/// <summary>Applies Authorization and OpenAI-* headers to outbound API requests.</summary>
public interface IOpenAiHttpRequestHeadersApplier
{
    void Apply(HttpRequestMessage request, OpenAiChatOptions options);
}
