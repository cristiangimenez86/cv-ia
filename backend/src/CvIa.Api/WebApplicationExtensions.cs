using CvIa.Application.Configuration;
using CvIa.Infrastructure.Rag.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace CvIa.Api;

internal static class WebApplicationExtensions
{
    /// <summary>Applies pending EF Core migrations for the RAG database when RAG is enabled and a DbContext is registered.</summary>
    internal static async Task ApplyRagMigrationsIfConfiguredAsync(this WebApplication app)
    {
        await using var scope = app.Services.CreateAsyncScope();
        var ragOptions = scope.ServiceProvider.GetRequiredService<IOptions<RagOptions>>().Value;
        if (!ragOptions.Enabled)
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

    /// <summary>Activates <see cref="Microsoft.AspNetCore.Builder.ForwardedHeadersExtensions.UseForwardedHeaders"/> when configured (default true).</summary>
    internal static IApplicationBuilder UseForwardedHeadersIfEnabled(this WebApplication app)
    {
        if (app.Configuration.GetValue("ForwardedHeaders:Enabled", true))
        {
            app.UseForwardedHeaders();
        }

        return app;
    }
}
