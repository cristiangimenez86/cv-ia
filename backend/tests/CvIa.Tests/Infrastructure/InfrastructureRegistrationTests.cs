using CvIa.Application;
using CvIa.Infrastructure;
using CvIa.Infrastructure.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using Moq;
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
                    ["CvApi:PdfAssetPath"] = "Assets/Cv/cv.en.pdf",
                    ["OpenAiChat:UseStubChatService"] = "true",
                    ["OpenAiChat:ApiKey"] = ""
                }
            )
            .Build();

        var hostEnv = new Mock<IHostEnvironment>();
        hostEnv.Setup(e => e.ContentRootPath).Returns(AppContext.BaseDirectory);
        hostEnv.Setup(e => e.ApplicationName).Returns("CvIa.Tests");
        hostEnv.Setup(e => e.EnvironmentName).Returns("Development");
        hostEnv.Setup(e => e.ContentRootFileProvider).Returns(new NullFileProvider());

        var services = new ServiceCollection();
        services.AddLogging();
        services.AddSingleton<IConfiguration>(configuration);
        services.AddSingleton(hostEnv.Object);
        services.AddInfrastructure(configuration);
        var provider = services.BuildServiceProvider();

        Assert.NotNull(provider.GetService<ICvQueryService>());
        Assert.NotNull(provider.GetService<CvMarkdownContentStore>());
        Assert.NotNull(provider.GetService<IOpenAiChatPromptBuilder>());
        Assert.NotNull(provider.GetService<IChatCompletionService>());
    }
}

