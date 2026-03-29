using System.Net.Http.Json;
using System.Text.Json;
using CvIa.Application.Contracts;
using CvIa.Application.Configuration;
using CvIa.Application.Exceptions;
using Microsoft.Extensions.Options;

namespace CvIa.Infrastructure.OpenAi;

public sealed class OpenAiEmbeddingsClient(
    HttpClient httpClient,
    IOptions<OpenAiChatOptions> openAiOptions,
    IOpenAiHttpRequestHeadersApplier headersApplier) : IOpenAiEmbeddingsClient
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
        PropertyNameCaseInsensitive = true
    };

    public async Task<float[]> CreateEmbeddingAsync(string input, string model, CancellationToken cancellationToken)
    {
        var options = openAiOptions.Value;
        if (string.IsNullOrWhiteSpace(options.ApiKey))
        {
            throw new InvalidOperationException("OpenAI API key is not configured.");
        }

        using var request = new HttpRequestMessage(HttpMethod.Post, "embeddings");
        headersApplier.Apply(request, options);

        request.Content = JsonContent.Create(
            new OpenAiEmbeddingsRequest(model, input),
            options: JsonOptions
        );

        using var response = await httpClient.SendAsync(request, cancellationToken);
        var body = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            throw new OpenAiChatException(
                (int)response.StatusCode,
                new ErrorResponse(
                    Code: "openai_embeddings_failed",
                    Message: $"OpenAI embeddings request failed ({(int)response.StatusCode})",
                    Details: new Dictionary<string, object?>
                    {
                        ["statusCode"] = (int)response.StatusCode,
                        ["body"] = body
                    }
                )
            );
        }

        var parsed = JsonSerializer.Deserialize<OpenAiEmbeddingsResponse>(body, JsonOptions)
                     ?? throw new InvalidOperationException("Failed to deserialize embeddings response.");

        var vector = parsed.Data.FirstOrDefault()?.Embedding;
        if (vector is null || vector.Length == 0)
        {
            throw new InvalidOperationException("Embeddings response contained no vectors.");
        }

        return vector;
    }
}
