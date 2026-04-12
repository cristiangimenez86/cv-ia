using CvIa.Application.Configuration;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;

namespace CvIa.Tests.Api;

/// <summary>
/// API host with optional public bearer gate for <c>/api/v1/*</c> integration tests.
/// </summary>
internal sealed class ApiAccessWebApplicationFactory : WebApplicationFactory<Program>
{
    private readonly bool _requireToken;
    private readonly string _token;

    public ApiAccessWebApplicationFactory(bool requireToken, string token)
    {
        _requireToken = requireToken;
        _token = token;
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");
        builder.UseSetting($"{ApiAccessOptions.SectionName}:RequireToken", _requireToken ? "true" : "false");
        builder.UseSetting($"{ApiAccessOptions.SectionName}:Token", _token);
        builder.UseSetting("OpenAiChat:UseStubChatService", "true");
        builder.UseSetting("OpenAiChat:ApiKey", "");
        builder.UseSetting("OpenAiChat:OpenAiProjectId", "");
    }
}
