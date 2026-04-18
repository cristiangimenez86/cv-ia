using System.Globalization;
using System.Net;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Threading.RateLimiting;
using CvIa.Application.Configuration;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Options;

namespace CvIa.Api;

internal static class ServiceCollectionExtensions
{
    private const int DefaultWindowSeconds = 60;
    private const int DefaultPermitLimit = 20;

    internal static IServiceCollection AddConfiguredForwardedHeaders(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<ForwardedHeadersOptions>(options =>
        {
            if (!configuration.GetValue("ForwardedHeaders:Enabled", true))
            {
                return;
            }

            options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
            options.ForwardLimit = 1;

            AddKnownProxies(options, configuration.GetSection("ForwardedHeaders:KnownProxies").Get<string[]>());
            AddKnownNetworks(options, configuration.GetSection("ForwardedHeaders:KnownNetworks").Get<string[]>());
        });

        return services;
    }

    internal static IServiceCollection AddChatRateLimiting(this IServiceCollection services)
    {
        services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
            options.OnRejected = WriteRateLimitRejectionAsync;
            options.AddPolicy(ApiConstants.ChatRateLimitPolicy, BuildPerIpChatLimiterPartition);
        });

        return services;
    }

    internal static IServiceCollection AddSiteCors(this IServiceCollection services, IConfiguration configuration, string policyName)
    {
        var corsOrigins = configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];

        services.AddCors(options =>
        {
            options.AddPolicy(policyName, policy =>
            {
                if (corsOrigins.Length == 0)
                {
                    policy
                        .AllowAnyHeader()
                        .AllowAnyMethod()
                        .SetIsOriginAllowed(_ => true);
                    return;
                }

                policy
                    .WithOrigins(corsOrigins)
                    .WithMethods("GET", "POST", "OPTIONS")
                    .WithHeaders("Authorization", "Content-Type")
                    .SetPreflightMaxAge(TimeSpan.FromHours(1));
            });
        });

        return services;
    }

    private static RateLimitPartition<string> BuildPerIpChatLimiterPartition(HttpContext httpContext)
    {
        var cfg = httpContext.RequestServices
            .GetRequiredService<IOptionsMonitor<ChatRateLimitingOptions>>()
            .CurrentValue;

        var windowSeconds = cfg.WindowSeconds <= 0 ? DefaultWindowSeconds : cfg.WindowSeconds;
        var permitLimit = cfg.PermitLimit <= 0 ? DefaultPermitLimit : cfg.PermitLimit;
        var queueLimit = cfg.QueueLimit < 0 ? 0 : cfg.QueueLimit;
        var ip = httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";

        return RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: ip,
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = permitLimit,
                Window = TimeSpan.FromSeconds(windowSeconds),
                QueueLimit = queueLimit,
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                AutoReplenishment = true
            });
    }

    private static async ValueTask WriteRateLimitRejectionAsync(OnRejectedContext context, CancellationToken cancellationToken)
    {
        var http = context.HttpContext;

        WriteRetryAfterHeaderIfPresent(http.Response, context.Lease);
        LogAndCountRejection(http);

        http.Response.ContentType = "application/problem+json";
        var problem = new ProblemDetails
        {
            Status = StatusCodes.Status429TooManyRequests,
            Title = "Too Many Requests",
            Type = "about:blank",
            Detail = "Rate limit exceeded for this endpoint. Please retry later."
        };
        problem.Extensions["error"] = "rate_limited";
        problem.Extensions["traceId"] = http.TraceIdentifier;

        await http.Response.WriteAsync(JsonSerializer.Serialize(problem), cancellationToken);
    }

    private static void WriteRetryAfterHeaderIfPresent(HttpResponse response, RateLimitLease lease)
    {
        if (!lease.TryGetMetadata(MetadataName.RetryAfter, out TimeSpan retryAfter))
        {
            return;
        }

        var seconds = (int)Math.Ceiling(retryAfter.TotalSeconds);
        if (seconds <= 0)
        {
            return;
        }

        response.Headers.RetryAfter = seconds.ToString(CultureInfo.InvariantCulture);
    }

    private static void LogAndCountRejection(HttpContext http)
    {
        var services = http.RequestServices;
        var env = services.GetRequiredService<IHostEnvironment>();
        var logger = services.GetRequiredService<ILoggerFactory>().CreateLogger("CvIa.Api.RateLimiting");

        var ip = http.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var ipForLog = env.IsDevelopment() ? ip : HashForLog(ip);

        RateLimitMetrics.ChatThrottled.Add(1,
            new KeyValuePair<string, object?>("endpoint", ApiConstants.ChatCompletionsPath),
            new KeyValuePair<string, object?>("key_type", "ip"));

        logger.LogWarning(
            "Rate limited chat completion request. keyType={KeyType} ip={Ip} traceId={TraceId} path={Path}",
            "ip",
            ipForLog,
            http.TraceIdentifier,
            http.Request.Path.Value);
    }

    private static void AddKnownProxies(ForwardedHeadersOptions options, string[]? proxies)
    {
        if (proxies is null)
        {
            return;
        }

        foreach (var raw in proxies)
        {
            if (IPAddress.TryParse(raw, out var ip))
            {
                options.KnownProxies.Add(ip);
            }
        }
    }

    private static void AddKnownNetworks(ForwardedHeadersOptions options, string[]? networks)
    {
        if (networks is null)
        {
            return;
        }

        foreach (var raw in networks)
        {
            // Format: "ip/cidr", e.g. "10.0.0.0/8".
            var parts = raw.Split('/', 2, StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length != 2)
            {
                continue;
            }

            if (!IPAddress.TryParse(parts[0], out var networkIp))
            {
                continue;
            }

            if (!int.TryParse(parts[1], NumberStyles.Integer, CultureInfo.InvariantCulture, out var prefixLength))
            {
                continue;
            }

            options.KnownIPNetworks.Add(new System.Net.IPNetwork(networkIp, prefixLength));
        }
    }

    private static string HashForLog(string raw)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(raw));
        return Convert.ToHexString(bytes)[..12];
    }
}
