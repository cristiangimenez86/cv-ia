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

    // Older deployments only had InitRag (unique on source_id, document_key, chunk_index) which breaks
    // en+es rows. Images without migration ContentChunkUniqueIncludeLang never fix the index — repair here.
    await RepairRagContentChunkUniqueIndexAsync(db, app.Logger);

    app.Logger.LogInformation("RAG database schema is up to date (EF migrations applied).");
}

static async Task RepairRagContentChunkUniqueIndexAsync(RagDbContext db, ILogger logger)
{
    try
    {
        await db.Database.ExecuteSqlRawAsync(
            """
            DROP INDEX IF EXISTS "IX_content_chunk_source_id_document_key_chunk_index";
            CREATE UNIQUE INDEX IF NOT EXISTS "IX_content_chunk_source_id_document_key_chunk_index_lang"
              ON content_chunk (source_id, document_key, chunk_index, lang);
            """);
    }
    catch (Exception ex)
    {
        logger.LogWarning(ex,
            "Could not repair content_chunk unique index (table may not exist yet). Reindex may fail until this succeeds.");
    }
}
