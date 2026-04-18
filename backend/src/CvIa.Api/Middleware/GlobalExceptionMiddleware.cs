using System.Text.Json;
using CvIa.Application.Contracts;

namespace CvIa.Api.Middleware;

/// <summary>
/// Catches any unhandled exception in the request pipeline, logs it with method/path context,
/// and returns a generic <c>500</c> <see cref="ErrorResponse"/> envelope. Exception details are
/// never leaked in the response body — clients only get a <c>traceId</c> for correlation.
/// </summary>
public sealed class GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex)
        {
            logger.LogError(ex,
                "Unhandled exception while processing request {Method} {Path}",
                context.Request.Method, context.Request.Path);

            await WriteInternalErrorAsync(context);
        }
    }

    private static Task WriteInternalErrorAsync(HttpContext context)
    {
        // If the response already started streaming we cannot rewrite headers/body; surface to logs only.
        if (context.Response.HasStarted)
        {
            return Task.CompletedTask;
        }

        context.Response.Clear();
        context.Response.StatusCode = StatusCodes.Status500InternalServerError;
        context.Response.ContentType = "application/json";

        var error = new ErrorResponse(
            Code: "internal_error",
            Message: "An unexpected error occurred.",
            Details: new Dictionary<string, object?> { ["traceId"] = context.TraceIdentifier });

        return context.Response.WriteAsync(JsonSerializer.Serialize(error, JsonOptions), context.RequestAborted);
    }
}
