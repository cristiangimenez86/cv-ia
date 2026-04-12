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

builder.Services.AddControllers();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddSingleton<RagIngestionSingleFlightGate>();

var corsOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
const string CorsPolicyName = "CvIaBrowser";
builder.Services.AddCors(options =>
{
    options.AddPolicy(
        CorsPolicyName,
        policy =>
        {
            if (corsOrigins.Length == 0)
            {
                policy
                    .AllowAnyHeader()
                    .AllowAnyMethod()
                    .SetIsOriginAllowed(_ => true);
            }
            else
            {
                policy
                    .WithOrigins(corsOrigins)
                    .WithMethods("GET", "POST", "OPTIONS")
                    .WithHeaders("Authorization", "Content-Type")
                    .SetPreflightMaxAge(TimeSpan.FromHours(1));
            }
        });
});

var app = builder.Build();

await ApplyRagMigrationsIfConfiguredAsync(app);

DevelopmentMode.LogOpenAiDevelopmentSummary(app.Environment, builder.Configuration, app.Logger);

app.UseCors(CorsPolicyName);
app.UseMiddleware<ApiAccessBearerMiddleware>();
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
