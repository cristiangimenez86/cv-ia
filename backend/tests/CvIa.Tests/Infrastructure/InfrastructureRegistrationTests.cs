using CvIa.Application;
using CvIa.Infrastructure;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Xunit;

namespace CvIa.Tests.Infrastructure;

public sealed class InfrastructureRegistrationTests
{
    [Fact]
    public void AddInfrastructure_ShouldRegisterApplicationServices()
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(
                new Dictionary<string, string?>
                {
                    ["CvApi:PdfAssetPath"] = "Assets/Cv/cv.pdf"
                }
            )
            .Build();

        var services = new ServiceCollection();
        services.AddLogging();
        services.AddSingleton<IConfiguration>(configuration);
        services.AddSingleton<IHostEnvironment>(
            new FakeHostEnvironment { ContentRootPath = AppContext.BaseDirectory }
        );
        services.AddInfrastructure();
        var provider = services.BuildServiceProvider();

        Assert.NotNull(provider.GetService<ICvQueryService>());
        Assert.NotNull(provider.GetService<IChatCompletionService>());
    }
}

file sealed class FakeHostEnvironment : IHostEnvironment
{
    public string EnvironmentName { get; set; } = "Development";
    public string ApplicationName { get; set; } = "CvIa.Tests";
    public string ContentRootPath { get; set; } = AppContext.BaseDirectory;
    public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
}

