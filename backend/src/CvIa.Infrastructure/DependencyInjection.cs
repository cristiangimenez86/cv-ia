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
    private static readonly TimeSpan HttpClientHandlerLifetime = TimeSpan.FromMinutes(5);

    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        BindOptions(services, configuration);
        AddCvServices(services);
        AddRagInfrastructure(services, configuration);
        AddOpenAiChatInfrastructure(services, configuration);
        return services;
    }

    private static void BindOptions(IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<OpenAiChatOptions>(configuration.GetSection(OpenAiChatOptions.SectionName));
        services.Configure<CvApiOptions>(configuration.GetSection(CvApiOptions.SectionName));
        services.Configure<RagOptions>(configuration.GetSection(RagOptions.SectionName));
    }

    private static void AddCvServices(IServiceCollection services)
    {
        services.AddScoped<ICvQueryService, CvPdfAssetService>();
        services.AddSingleton<CvMarkdownContentStore>();
        services.AddHostedService<CvMarkdownContentStartupLoader>();
    }

    private static void AddRagInfrastructure(IServiceCollection services, IConfiguration configuration)
    {
        var ragConnectionString = configuration.GetConnectionString("Rag");
        if (string.IsNullOrWhiteSpace(ragConnectionString))
        {
            services.AddScoped<IRagIngestionService, DisabledRagIngestionService>();
            services.AddScoped<IRagRetrievalService, DisabledRagRetrievalService>();
            services.AddScoped<IRagSourceLoaderRegistry, DisabledRagSourceLoaderRegistry>();
            services.AddScoped<IChatRagContextBuilder, DisabledChatRagContextBuilder>();
            return;
        }

        services.AddSingleton(_ =>
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
            .AddHttpClient<OpenAiEmbeddingsClient>(ConfigureOpenAiHttpClient)
            .SetHandlerLifetime(HttpClientHandlerLifetime);

        services.AddScoped<IOpenAiEmbeddingsClient>(sp => sp.GetRequiredService<OpenAiEmbeddingsClient>());
        services.AddScoped<IChatRagContextBuilder, RagChatContextBuilder>();
    }

    private static void AddOpenAiChatInfrastructure(IServiceCollection services, IConfiguration configuration)
    {
        services.AddScoped<IOpenAiChatPromptBuilder, OpenAiChatPromptBuilder>();
        services.AddHostedService<OpenAiChatConfigurationStartupValidator>();
        services.AddSingleton<IOpenAiHttpRequestHeadersApplier, OpenAiHttpRequestHeadersApplier>();
        services.AddSingleton<IOpenAiChatHttpResponseProcessor, OpenAiChatHttpResponseProcessor>();
        services.AddSingleton<IChatOutputPolicy, AllowlistChatOutputPolicy>();

        var snapshot = configuration.GetSection(OpenAiChatOptions.SectionName).Get<OpenAiChatOptions>() ?? new OpenAiChatOptions();
        var useStub = snapshot.UseStubChatService || string.IsNullOrWhiteSpace(snapshot.ApiKey);

        if (useStub)
        {
            services.AddScoped<IChatCompletionService, StubChatCompletionService>();
            return;
        }

        services
            .AddHttpClient<OpenAiChatCompletionService>(ConfigureOpenAiHttpClient)
            .SetHandlerLifetime(HttpClientHandlerLifetime);

        services.AddScoped<IChatCompletionService>(sp => sp.GetRequiredService<OpenAiChatCompletionService>());
    }

    /// <summary>
    /// Sets <c>BaseAddress</c> and <c>Timeout</c> for OpenAI HTTP clients. Authorization and OpenAI-* headers
    /// are intentionally set per-request (DefaultRequestHeaders are unreliable for some OpenAI key types).
    /// </summary>
    private static void ConfigureOpenAiHttpClient(IServiceProvider sp, HttpClient client)
    {
        var options = sp.GetRequiredService<IOptions<OpenAiChatOptions>>().Value;
        client.BaseAddress = OpenAiBaseUrl.ResolveBaseAddress(options.BaseUrl);
        client.Timeout = TimeSpan.FromSeconds(Math.Max(1, options.HttpTimeoutSeconds));
    }
}
