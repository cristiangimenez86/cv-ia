using System.Text.Json;
using CvIa.Application.Contracts;

namespace CvIa.Api.Middleware;

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
            logger.LogError(ex, "Unhandled exception while processing request {Method} {Path}", context.Request.Method, context.Request.Path);

            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            context.Response.ContentType = "application/json";

            var error = new ErrorResponse(
                Code: "internal_error",
                Message: "An unexpected error occurred.",
                Details: new Dictionary<string, object?> { ["traceId"] = context.TraceIdentifier }
            );

            await context.Response.WriteAsync(JsonSerializer.Serialize(error, JsonOptions));
        }
    }
}

