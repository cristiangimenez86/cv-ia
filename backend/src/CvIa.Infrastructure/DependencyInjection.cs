using CvIa.Application;
using CvIa.Infrastructure.Services;
using Microsoft.Extensions.DependencyInjection;

namespace CvIa.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services)
    {
        services.AddScoped<ICvQueryService, CvPdfAssetService>();
        services.AddScoped<IChatCompletionService, StubChatCompletionService>();
        return services;
    }
}

