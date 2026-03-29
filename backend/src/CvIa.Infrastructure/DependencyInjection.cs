using CvIa.Application;
using CvIa.Application.Configuration;
using CvIa.Application.Rag;
using CvIa.Infrastructure.OpenAi;
using CvIa.Infrastructure.Rag.Configuration;
using CvIa.Infrastructure.Rag.Persistence;
using CvIa.Infrastructure.Rag.Persistence.Repositories;
using CvIa.Infrastructure.Rag.Services;
using CvIa.Infrastructure.Rag.SourceLoaders;
using CvIa.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Npgsql;
using Pgvector;

namespace CvIa.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<OpenAiChatOptions>(configuration.GetSection(OpenAiChatOptions.SectionName));
        services.Configure<CvApiOptions>(configuration.GetSection(CvApiOptions.SectionName));
        services.Configure<RagOptions>(configuration.GetSection(RagOptions.SectionName));

        services.AddScoped<ICvQueryService, CvPdfAssetService>();

        services.AddSingleton<CvMarkdownContentStore>();
        services.AddHostedService<CvMarkdownContentStartupLoader>();

        var ragConnectionString = configuration.GetConnectionString("Rag");
        if (!string.IsNullOrWhiteSpace(ragConnectionString))
        {
            services.AddSingleton(sp =>
            {
                var dataSourceBuilder = new NpgsqlDataSourceBuilder(ragConnectionString);
                dataSourceBuilder.UseVector();
                return dataSourceBuilder.Build();
            });

            services.AddDbContext<RagDbContext>((sp, options) =>
            {
                var dataSource = sp.GetRequiredService<NpgsqlDataSource>();
                // Migrations live in CvIa.Api (EF Core 10: MigrationsAssembly on relational builder, not UseMigrationsAssembly).
                options.UseNpgsql(dataSource, npgsql =>
                {
                    npgsql.UseVector();
                    npgsql.MigrationsAssembly("CvIa.Api");
                });
            });

            services.AddScoped<IRagSourceLoader, CvSectionsRagSourceLoader>();
            services.AddScoped<IRagSourceLoaderRegistry, RagSourceLoaderRegistry>();
            services.AddScoped<RagChunkSimilarityRepository>();
            services.AddScoped<IRagIngestionService, RagIngestionService>();
            services.AddScoped<IRagRetrievalService, RagRetrievalService>();
            services.AddHostedService<RagConfigurationStartupValidator>();
            services
                .AddHttpClient<OpenAiEmbeddingsClient>((sp, client) =>
                {
                    var options = sp.GetRequiredService<IOptions<OpenAiChatOptions>>().Value;
                    var baseUrl = options.BaseUrl.TrimEnd('/');
                    if (!baseUrl.EndsWith("/v1", StringComparison.OrdinalIgnoreCase))
                    {
                        baseUrl = $"{baseUrl}/v1";
                    }

                    client.BaseAddress = new Uri($"{baseUrl}/");
                    client.Timeout = TimeSpan.FromSeconds(Math.Max(1, options.HttpTimeoutSeconds));
                })
                .SetHandlerLifetime(TimeSpan.FromMinutes(5));

            services.AddScoped<IOpenAiEmbeddingsClient>(sp => sp.GetRequiredService<OpenAiEmbeddingsClient>());
        }
        else
        {
            services.AddScoped<IRagIngestionService, DisabledRagIngestionService>();
            services.AddScoped<IRagRetrievalService, DisabledRagRetrievalService>();
            services.AddScoped<IRagSourceLoaderRegistry, DisabledRagSourceLoaderRegistry>();
        }

        services.AddScoped<IOpenAiChatPromptBuilder, OpenAiChatPromptBuilder>();
        services.AddHostedService<OpenAiChatConfigurationStartupValidator>();
        services.AddScoped<IOpenAiHttpRequestHeadersApplier, OpenAiHttpRequestHeadersApplier>();
        services.AddScoped<IOpenAiChatHttpResponseProcessor, OpenAiChatHttpResponseProcessor>();

        var openAiSection = configuration.GetSection(OpenAiChatOptions.SectionName);
        var snapshot = openAiSection.Get<OpenAiChatOptions>() ?? new OpenAiChatOptions();
        var useStub = snapshot.UseStubChatService || string.IsNullOrWhiteSpace(snapshot.ApiKey);

        if (useStub)
        {
            services.AddScoped<IChatCompletionService, StubChatCompletionService>();
        }
        else
        {
            services
                .AddHttpClient<OpenAiChatCompletionService>((sp, client) =>
                {
                    var options = sp.GetRequiredService<IOptions<OpenAiChatOptions>>().Value;
                    var baseUrl = options.BaseUrl.TrimEnd('/');
                    if (!baseUrl.EndsWith("/v1", StringComparison.OrdinalIgnoreCase))
                    {
                        baseUrl = $"{baseUrl}/v1";
                    }

                    // Auth and OpenAI-* headers are set per-request in OpenAiChatCompletionService
                    // (DefaultRequestHeaders on HttpClient is unreliable for some OpenAI key types).
                    client.BaseAddress = new Uri($"{baseUrl}/");
                    client.Timeout = TimeSpan.FromSeconds(Math.Max(1, options.HttpTimeoutSeconds));
                })
                .SetHandlerLifetime(TimeSpan.FromMinutes(5));

            services.AddScoped<IChatCompletionService>(sp => sp.GetRequiredService<OpenAiChatCompletionService>());
        }

        return services;
    }
}