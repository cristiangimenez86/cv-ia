using System.Text.Json;
using System.Text.Json.Serialization;

namespace CvIa.Infrastructure.OpenAi;

internal static class OpenAiChatJsonOptions
{
    /// <summary>Outgoing request body: snake_case property names.</summary>
    public static readonly JsonSerializerOptions Request = new(JsonSerializerDefaults.Web)
    {
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    /// <summary>Incoming responses: tolerate casing differences.</summary>
    public static readonly JsonSerializerOptions Response = new()
    {
        PropertyNameCaseInsensitive = true
    };
}
