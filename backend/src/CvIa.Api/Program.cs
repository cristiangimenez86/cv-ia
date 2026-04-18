using CvIa.Api;
using CvIa.Api.Middleware;
using CvIa.Application.Configuration;
using CvIa.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

builder.Services.Configure<SiteCorsOptions>(builder.Configuration.GetSection(SiteCorsOptions.SectionName));
builder.Services.Configure<ApiAccessOptions>(builder.Configuration.GetSection(ApiAccessOptions.SectionName));
builder.Services.Configure<ChatRateLimitingOptions>(builder.Configuration.GetSection(ChatRateLimitingOptions.SectionName));

builder.Services.AddControllers();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddSingleton<RagIngestionSingleFlightGate>();

builder.Services.AddConfiguredForwardedHeaders(builder.Configuration);
builder.Services.AddChatRateLimiting();
builder.Services.AddSiteCors(builder.Configuration, ApiConstants.CorsPolicyName);

var app = builder.Build();

await app.ApplyRagMigrationsIfConfiguredAsync();

DevelopmentMode.LogOpenAiDevelopmentSummary(app.Environment, builder.Configuration, app.Logger);

app.UseForwardedHeadersIfEnabled();
app.UseCors(ApiConstants.CorsPolicyName);
app.UseMiddleware<ApiAccessBearerMiddleware>();
app.UseMiddleware<GlobalExceptionMiddleware>();
app.UseRateLimiter();
app.MapControllers();

app.Run();

/// <summary>Marker so <c>WebApplicationFactory&lt;Program&gt;</c> can locate the entry assembly from the test project.</summary>
public partial class Program;
