using CvIa.Api;
using CvIa.Api.Middleware;
using CvIa.Application.Configuration;
using CvIa.Infrastructure;
using CvIa.Infrastructure.Rag.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

var builder = WebApplication.CreateBuilder(args);

builder.Services.Configure<SiteCorsOptions>(builder.Configuration.GetSection(SiteCorsOptions.SectionName));
builder.Services.Configure<ApiAccessOptions>(builder.Configuration.GetSection(ApiAccessOptions.SectionName));
builder.Services.Configure<ChatRateLimitingOptions>(builder.Configuration.GetSection(ChatRateLimitingOptions.SectionName));

builder.Services.AddControllers();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddSingleton<RagIngestionSingleFlightGate>();

const string CorsPolicyName = "CvIaBrowser";
builder.Services.AddConfiguredForwardedHeaders(builder.Configuration);
builder.Services.AddChatRateLimiting();
builder.Services.AddSiteCors(builder.Configuration, CorsPolicyName);

var app = builder.Build();

await ApplyRagMigrationsIfConfiguredAsync(app);

DevelopmentMode.LogOpenAiDevelopmentSummary(app.Environment, builder.Configuration, app.Logger);

if (builder.Configuration.GetValue("ForwardedHeaders:Enabled", true))
{
    app.UseForwardedHeaders();
}

app.UseCors(CorsPolicyName);
app.UseMiddleware<ApiAccessBearerMiddleware>();
app.UseMiddleware<GlobalExceptionMiddleware>();
app.UseRateLimiter();
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
