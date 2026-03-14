var builder = WebApplication.CreateBuilder(args);

var app = builder.Build();

app.MapGet(
    "/health",
    () =>
    {
        var payload = new HealthPayload(
            Status: "healthy",
            Service: builder.Configuration["SERVICE_NAME"] ?? "cv-ia-backend",
            TimestampUtc: DateTimeOffset.UtcNow.ToString("O")
        );

        return TypedResults.Ok(payload);
    }
);

app.Run();

public sealed record HealthPayload(string Status, string Service, string TimestampUtc);
