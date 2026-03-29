using CvIa.Infrastructure.Rag.Persistence;
using Microsoft.EntityFrameworkCore;
using Pgvector;
using Xunit;

namespace CvIa.Tests.Infrastructure.Rag;

/// <summary>
/// Regression: EF Core only lists migrations that declare <see cref="Microsoft.EntityFrameworkCore.Infrastructure.DbContextAttribute" />
/// matching <see cref="RagDbContext"/>; missing it yields an empty set and MigrateAsync applies nothing.
/// </summary>
public sealed class RagMigrationsDiscoveryTests
{
    [Fact]
    public void RagDbContext_GetMigrations_Includes_InitRag_From_CvIa_Api_Assembly()
    {
        var options = new DbContextOptionsBuilder<RagDbContext>()
            .UseNpgsql(
                "Host=127.0.0.1;Port=5432;Database=cvia;Username=cvia;Password=cvia",
                npgsql =>
                {
                    npgsql.UseVector();
                    npgsql.MigrationsAssembly("CvIa.Api");
                })
            .Options;

        using var db = new RagDbContext(options);
        Assert.Contains("20260331120000_InitRag", db.Database.GetMigrations());
    }
}
