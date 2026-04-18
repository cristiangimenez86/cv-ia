using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using CvIa.Application.Configuration;
using CvIa.Application.Contracts;
using Microsoft.Extensions.Options;
using Microsoft.Net.Http.Headers;

namespace CvIa.Api.Middleware;

/// <summary>
/// Requires <c>Authorization: Bearer &lt;token&gt;</c> for <c>/api/v1/*</c> when
/// <see cref="ApiAccessOptions.RequireToken"/> is true. Skips <c>OPTIONS</c> (CORS preflight)
/// and routes outside the public API prefix (e.g. <c>/health</c>, <c>/internal/*</c>).
/// The configured token's SHA-256 hash is cached and refreshed on demand to avoid hashing it
/// on every request.
/// </summary>
public sealed class ApiAccessBearerMiddleware
{
    private const string BearerPrefix = "Bearer ";

    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private readonly RequestDelegate _next;
    private readonly IOptionsMonitor<ApiAccessOptions> _options;
    private readonly ILogger<ApiAccessBearerMiddleware> _logger;
    private TokenHash? _cachedTokenHash;

    public ApiAccessBearerMiddleware(
        RequestDelegate next,
        IOptionsMonitor<ApiAccessOptions> options,
        ILogger<ApiAccessBearerMiddleware> logger)
    {
        _next = next;
        _options = options;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var opts = _options.CurrentValue;

        if (!ShouldEnforceBearer(opts, context, out var skipReason))
        {
            if (skipReason is not null)
            {
                _logger.LogWarning("{Reason}", skipReason);
            }

            await _next(context);
            return;
        }

        var presented = ExtractBearerToken(context.Request.Headers[HeaderNames.Authorization]);
        if (!IsPresentedTokenValid(opts.Token, presented))
        {
            await WriteUnauthorizedAsync(context);
            return;
        }

        await _next(context);
    }

    internal static string? ExtractBearerToken(string? authorizationHeader)
    {
        if (string.IsNullOrWhiteSpace(authorizationHeader))
        {
            return null;
        }

        if (!authorizationHeader.StartsWith(BearerPrefix, StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        return authorizationHeader[BearerPrefix.Length..].Trim();
    }

    /// <summary>
    /// Constant-time comparison of <paramref name="presented"/> against <paramref name="expected"/>
    /// using cached SHA-256 hashes. Hashing the expected token only once per token rotation
    /// keeps hot-path cost bounded to a single hash + fixed-time compare.
    /// </summary>
    private bool IsPresentedTokenValid(string expected, string? presented)
    {
        if (presented is null)
        {
            return false;
        }

        var expectedHash = GetOrCreateTokenHash(expected);
        var presentedHash = SHA256.HashData(Encoding.UTF8.GetBytes(presented));
        return CryptographicOperations.FixedTimeEquals(expectedHash, presentedHash);
    }

    /// <summary>For unit tests only. Mirrors <see cref="IsPresentedTokenValid"/> without cache state.</summary>
    internal static bool ConstantTimeTokenEquals(string expected, string? actual)
    {
        if (actual is null)
        {
            return false;
        }

        var expectedHash = SHA256.HashData(Encoding.UTF8.GetBytes(expected));
        var actualHash = SHA256.HashData(Encoding.UTF8.GetBytes(actual));
        return CryptographicOperations.FixedTimeEquals(expectedHash, actualHash);
    }

    private byte[] GetOrCreateTokenHash(string expected)
    {
        var snapshot = _cachedTokenHash;
        if (snapshot is not null && string.Equals(snapshot.Token, expected, StringComparison.Ordinal))
        {
            return snapshot.Hash;
        }

        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(expected));
        _cachedTokenHash = new TokenHash(expected, hash);
        return hash;
    }

    private bool ShouldEnforceBearer(ApiAccessOptions opts, HttpContext context, out string? skipReason)
    {
        skipReason = null;

        if (!opts.RequireToken)
        {
            return false;
        }

        if (string.IsNullOrWhiteSpace(opts.Token))
        {
            skipReason = "ApiAccess:RequireToken is true but ApiAccess:Token is empty; skipping bearer enforcement.";
            return false;
        }

        var path = context.Request.Path.Value ?? string.Empty;
        if (!path.StartsWith(ApiConstants.PublicApiPathPrefix, StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        if (HttpMethods.IsOptions(context.Request.Method))
        {
            return false;
        }

        return true;
    }

    private static Task WriteUnauthorizedAsync(HttpContext context)
    {
        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
        context.Response.ContentType = "application/json";

        var error = new ErrorResponse(
            Code: "unauthorized",
            Message: "Missing or invalid API access token.",
            Details: new Dictionary<string, object?> { ["traceId"] = context.TraceIdentifier });

        return context.Response.WriteAsync(JsonSerializer.Serialize(error, JsonOptions), context.RequestAborted);
    }

    /// <summary>Immutable cache entry pairing the configured token with its precomputed SHA-256 hash.</summary>
    private sealed record TokenHash(string Token, byte[] Hash);
}
