namespace CvIa.Application.Configuration;

/// <summary>
/// Typed configuration for chat endpoint rate limiting.
/// </summary>
public sealed class ChatRateLimitingOptions
{
    public const string SectionName = "OpenAiChat:RateLimiting";

    /// <summary>
    /// Maximum permitted requests per window per client IP.
    /// </summary>
    public int PermitLimit { get; set; } = 20;

    /// <summary>
    /// Window size in seconds.
    /// </summary>
    public int WindowSeconds { get; set; } = 60;

    /// <summary>
    /// Max queued requests when the limiter is saturated. 0 disables queueing.
    /// </summary>
    public int QueueLimit { get; set; } = 0;
}

