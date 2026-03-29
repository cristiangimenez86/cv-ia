using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Npgsql;

namespace CvIa.Infrastructure.Rag.Persistence;

public sealed class RagDbContextFactory : IDesignTimeDbContextFactory<RagDbContext>
{
    public RagDbContext CreateDbContext(string[] args)
    {
        var connectionString =
            Environment.GetEnvironmentVariable("ConnectionStrings__Rag") ??
            "Host=localhost;Port=5432;Database=cvia;Username=cvia;Password=cvia";

        var dataSourceBuilder = new NpgsqlDataSourceBuilder(connectionString);
        dataSourceBuilder.UseVector();
        var dataSource = dataSourceBuilder.Build();

        var options = new DbContextOptionsBuilder<RagDbContext>()
            .UseNpgsql(dataSource, npgsql =>
            {
                npgsql.UseVector();
                npgsql.MigrationsAssembly("CvIa.Api");
            })
            .Options;

        return new RagDbContext(options);
    }
}
