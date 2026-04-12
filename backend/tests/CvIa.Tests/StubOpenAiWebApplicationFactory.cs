using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;

namespace CvIa.Tests;

/// <summary>
/// <see cref="WebApplicationFactory{TEntryPoint}"/> with chat stubbed so integration tests never hit OpenAI.
/// </summary>
public sealed class StubOpenAiWebApplicationFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        // Avoid appsettings.Production.json (RAG on, no Postgres in test host).
        builder.UseEnvironment("Development");
        builder.UseSetting("OpenAiChat:UseStubChatService", "true");
        builder.UseSetting("OpenAiChat:ApiKey", "");
        builder.UseSetting("OpenAiChat:OpenAiProjectId", "");
    }
}
