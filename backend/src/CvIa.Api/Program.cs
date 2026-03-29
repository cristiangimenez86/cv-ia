using CvIa.Api;
using CvIa.Api.Middleware;
using CvIa.Application.Configuration;
using CvIa.Infrastructure;
using CvIa.Infrastructure.Rag.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddSingleton<RagIngestionSingleFlightGate>();
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy
            .AllowAnyHeader()
            .AllowAnyMethod()
            .SetIsOriginAllowed(_ => true)
    );
});

var app = builder.Build();

await ApplyRagMigrationsIfConfiguredAsync(app);

DevelopmentMode.LogOpenAiDevelopmentSummary(app.Environment, builder.Configuration, app.Logger);

app.UseCors();
app.UseMiddleware<GlobalExceptionMiddleware>();
app.MapControllers();

app.Run();

static async Task ApplyRagMigrationsIfConfiguredAsync(WebApplication app)
{
    await using var scope = app.Services.CreateAsyncScope();
    if (!scope.ServiceProvider.GetRequiredService<IOptions<RagOptions>>().Value.Enabled)
    {
        return;
    }

    var db = scope.ServiceProvider.GetService<RagDbContext>();
    if (db is null)
    {
        return;
    }

    await db.Database.MigrateAsync();
    app.Logger.LogInformation("RAG database schema is up to date (EF migrations applied).");
}
