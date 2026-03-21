using System.Text.Json.Serialization;

namespace CvIa.Infrastructure.OpenAi.Models;

internal sealed class OpenAiChatCompletionRequest
{
    [JsonPropertyName("model")]
    public string Model { get; set; } = "";

    [JsonPropertyName("messages")]
    public List<OpenAiChatApiMessage> Messages { get; set; } = new();

    [JsonPropertyName("temperature")]
    public double Temperature { get; set; }

    [JsonPropertyName("max_tokens")]
    public int MaxTokens { get; set; }
}
