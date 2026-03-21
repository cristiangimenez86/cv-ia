namespace CvIa.Application.Contracts;

/// <summary>Role + content for a single message in an OpenAI-style chat request (infrastructure-neutral).</summary>
public readonly record struct OpenAiChatMessagePayload(string Role, string Content);
