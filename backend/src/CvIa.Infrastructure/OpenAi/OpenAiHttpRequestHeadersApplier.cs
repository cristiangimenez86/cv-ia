using System.Net.Http.Headers;
using CvIa.Application.Configuration;

namespace CvIa.Infrastructure.OpenAi;

public sealed class OpenAiHttpRequestHeadersApplier : IOpenAiHttpRequestHeadersApplier
{
    public void Apply(HttpRequestMessage request, OpenAiChatOptions options)
    {
        var apiKey = options.ApiKey.Trim();
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

        var projectId = options.OpenAiProjectId.Trim();
        if (!string.IsNullOrEmpty(projectId))
        {
            request.Headers.TryAddWithoutValidation("OpenAI-Project", projectId);
        }

        var orgId = options.OpenAiOrganizationId.Trim();
        if (!string.IsNullOrEmpty(orgId))
        {
            request.Headers.TryAddWithoutValidation("OpenAI-Organization", orgId);
        }
    }
}
