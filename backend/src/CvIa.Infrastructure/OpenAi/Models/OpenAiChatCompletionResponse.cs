using System.Text.Json.Serialization;

namespace CvIa.Infrastructure.OpenAi.Models;

internal sealed class OpenAiChatCompletionResponse
{
    [JsonPropertyName("id")]
    public string? Id { get; set; }

    [JsonPropertyName("created")]
    public long Created { get; set; }

    [JsonPropertyName("choices")]
    public List<OpenAiChoice>? Choices { get; set; }
}
