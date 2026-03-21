using System.Text.Json.Serialization;

namespace CvIa.Infrastructure.OpenAi.Models;

internal sealed class OpenAiChatApiMessage
{
    [JsonPropertyName("role")]
    public string Role { get; set; } = "";

    [JsonPropertyName("content")]
    public string Content { get; set; } = "";
}
