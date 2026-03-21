using CvIa.Application;
using CvIa.Application.Configuration;
using CvIa.Infrastructure.OpenAi;
using CvIa.Infrastructure.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace CvIa.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<OpenAiChatOptions>(configuration.GetSection(OpenAiChatOptions.SectionName));
        services.Configure<CvApiOptions>(configuration.GetSection(CvApiOptions.SectionName));

        services.AddScoped<ICvQueryService, CvPdfAssetService>();

        services.AddSingleton<CvMarkdownContentStore>();
        services.AddHostedService<CvMarkdownContentStartupLoader>();

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