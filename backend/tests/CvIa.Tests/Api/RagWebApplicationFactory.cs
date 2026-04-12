using CvIa.Application.Configuration;
using CvIa.Application.Rag;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace CvIa.Tests.Api;

internal sealed class RagWebApplicationFactory : WebApplicationFactory<Program>
{
    private readonly string _key;
    private readonly IRagIngestionService? _ingestionOverride;

    public RagWebApplicationFactory(string configureKey, IRagIngestionService? ingestionOverride = null)
    {
        _key = configureKey;
        _ingestionOverride = ingestionOverride;
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");
        builder.UseSetting($"{RagOptions.SectionName}:IngestionApiKey", _key);
        builder.UseSetting($"{RagOptions.SectionName}:Enabled", "false");

        if (_ingestionOverride is not null)
        {
            builder.ConfigureServices(services =>
            {
                services.RemoveAll(typeof(IRagIngestionService));
                services.AddSingleton(_ingestionOverride);
            });
        }
    }
}
