using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using CvIa.Application.Configuration;
using CvIa.Application.Contracts;
using Microsoft.Extensions.Options;
using Microsoft.Net.Http.Headers;

namespace CvIa.Api.Middleware;

/// <summary>
/// Requires <c>Authorization: Bearer</c> for <c>/api/v1/*</c> when <see cref="ApiAccessOptions.RequireToken"/> is true.
/// Skips <c>OPTIONS</c> (CORS preflight). Does not apply to <c>/health</c> or <c>/internal/*</c>.
/// </summary>
public sealed class ApiAccessBearerMiddleware(
    RequestDelegate next,
    IOptions<ApiAccessOptions> options,
    ILogger<ApiAccessBearerMiddleware> logger)
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public async Task InvokeAsync(HttpContext context)
    {
        var opts = options.Value;
        if (!opts.RequireToken || string.IsNullOrWhiteSpace(opts.Token))
        {
            if (opts.RequireToken && string.IsNullOrWhiteSpace(opts.Token))
            {
                logger.LogWarning(
                    "ApiAccess:RequireToken is true but ApiAccess:Token is empty; skipping bearer enforcement.");
            }

            await next(context);
            return;
        }

        var path = context.Request.Path.Value ?? string.Empty;
        if (!path.StartsWith("/api/v1/", StringComparison.OrdinalIgnoreCase))
        {
            await next(context);
            return;
        }

        if (HttpMethods.IsOptions(context.Request.Method))
        {
            await next(context);
            return;
        }

        var presented = ExtractBearerToken(context.Request.Headers[HeaderNames.Authorization]);
        if (!ConstantTimeTokenEquals(opts.Token, presented))
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            context.Response.ContentType = "application/json";
            var error = new ErrorResponse(
                Code: "unauthorized",
                Message: "Missing or invalid API access token.",
                Details: new Dictionary<string, object?> { ["traceId"] = context.TraceIdentifier }
            );
            await context.Response.WriteAsync(JsonSerializer.Serialize(error, JsonOptions));
            return;
        }

        await next(context);
    }

    internal static string? ExtractBearerToken(string? authorizationHeader)
    {
        if (string.IsNullOrWhiteSpace(authorizationHeader))
        {
            return null;
        }

        const string prefix = "Bearer ";
        if (!authorizationHeader.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        return authorizationHeader[prefix.Length..].Trim();
    }

    /// <summary>
    /// Compares UTF-8 token strings via SHA-256 to reduce timing leakage vs raw byte comparison.
    /// </summary>
    internal static bool ConstantTimeTokenEquals(string expected, string? actual)
    {
        if (actual is null)
        {
            return false;
        }

        var e = SHA256.HashData(Encoding.UTF8.GetBytes(expected));
        var a = SHA256.HashData(Encoding.UTF8.GetBytes(actual));
        return CryptographicOperations.FixedTimeEquals(e, a);
    }
}
