using System.Net;
using Microsoft.Extensions.Logging;
using Polly;
using Polly.Retry;

namespace CvIa.Infrastructure.OpenAi;

internal static class OpenAiChatHttpRetryPipeline
{
    /// <summary>Initial request plus retries (matches previous max loop iterations).</summary>
    internal const int MaxAttempts = 3;

    internal static readonly ResiliencePropertyKey<string> CorrelationIdProperty = new("CvIa.OpenAi.CorrelationId");

    internal static ResiliencePipeline<HttpResponseMessage> Create429RetryPipeline(ILogger logger) =>
        new ResiliencePipelineBuilder<HttpResponseMessage>()
            .AddRetry(new RetryStrategyOptions<HttpResponseMessage>
            {
                MaxRetryAttempts = MaxAttempts - 1,
                ShouldHandle = new PredicateBuilder<HttpResponseMessage>()
                    .HandleResult(static r => r.StatusCode == HttpStatusCode.TooManyRequests),
                DelayGenerator = static args =>
                {
                    if (args.Outcome.Result?.Headers.RetryAfter?.Delta is { } d)
                    {
                        return new ValueTask<TimeSpan?>(d);
                    }

                    return new ValueTask<TimeSpan?>(
                        TimeSpan.FromMilliseconds(1500 * (args.AttemptNumber + 1)));
                },
                OnRetry = args =>
                {
                    args.Context.Properties.TryGetValue(CorrelationIdProperty, out string? correlationId);
                    logger.LogWarning(
                        "OpenAI returned 429, retry {Attempt}/{Max} after {DelayMs}ms. CorrelationId={CorrelationId}",
                        args.AttemptNumber + 1,
                        MaxAttempts,
                        args.RetryDelay.TotalMilliseconds,
                        correlationId ?? "");
                    return ValueTask.CompletedTask;
                }
            })
            .Build();
}
