using System.Diagnostics.Metrics;

namespace CvIa.Api;

internal static class RateLimitMetrics
{
    private static readonly Meter Meter = new("CvIa.RateLimiting", "1.0.0");

    internal static readonly Counter<long> ChatThrottled =
        Meter.CreateCounter<long>("chat_throttled_total");
}

