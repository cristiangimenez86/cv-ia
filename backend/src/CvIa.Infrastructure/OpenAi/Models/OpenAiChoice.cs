using System.Text.Json.Serialization;

namespace CvIa.Infrastructure.OpenAi.Models;

internal sealed class OpenAiChoice
{
    [JsonPropertyName("message")]
    public OpenAiChatApiMessage? Message { get; set; }
}
