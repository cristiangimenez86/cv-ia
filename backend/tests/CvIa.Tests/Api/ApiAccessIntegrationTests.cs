using System.Net;
using System.Net.Http.Json;
using CvIa.Application.Contracts;
using Xunit;

namespace CvIa.Tests.Api;

public sealed class ApiAccessIntegrationTests
{
    [Fact]
    public async Task WhenRequireTokenTrue_MissingBearer_Should401OnApiV1()
    {
        await using var factory = new ApiAccessWebApplicationFactory(requireToken: true, token: "integration-secret");
        var client = factory.CreateClient();

        var cv = await client.GetAsync("/api/v1/cv?lang=en");
        Assert.Equal(HttpStatusCode.Unauthorized, cv.StatusCode);
        var err = await cv.Content.ReadFromJsonAsync<ErrorResponse>();
        Assert.NotNull(err);
        Assert.Equal("unauthorized", err.Code);

        var chat = await client.PostAsJsonAsync(
            "/api/v1/chat/completions",
            new ChatRequestDto("en", [new ChatMessageDto("user", "hi")]));
        Assert.Equal(HttpStatusCode.Unauthorized, chat.StatusCode);
    }

    [Fact]
    public async Task WhenRequireTokenTrue_WrongBearer_Should401()
    {
        await using var factory = new ApiAccessWebApplicationFactory(requireToken: true, token: "integration-secret");
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.TryAddWithoutValidation("Authorization", "Bearer wrong");

        var response = await client.PostAsJsonAsync(
            "/api/v1/chat/completions",
            new ChatRequestDto("en", [new ChatMessageDto("user", "Hello")]));

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task WhenRequireTokenTrue_ValidBearer_ShouldAllowChat()
    {
        await using var factory = new ApiAccessWebApplicationFactory(requireToken: true, token: "integration-secret");
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.TryAddWithoutValidation("Authorization", "Bearer integration-secret");

        var response = await client.PostAsJsonAsync(
            "/api/v1/chat/completions",
            new ChatRequestDto("en", [new ChatMessageDto("user", "Hello")]));

        response.EnsureSuccessStatusCode();
    }

    [Fact]
    public async Task WhenRequireTokenTrue_Health_ShouldNotRequireBearer()
    {
        await using var factory = new ApiAccessWebApplicationFactory(requireToken: true, token: "integration-secret");
        var client = factory.CreateClient();

        var response = await client.GetAsync("/health");
        response.EnsureSuccessStatusCode();
    }

    [Fact]
    public async Task WhenRequireTokenTrue_OptionsPreflight_ShouldNotRequireBearer()
    {
        await using var factory = new ApiAccessWebApplicationFactory(requireToken: true, token: "integration-secret");
        var client = factory.CreateClient();

        using var request = new HttpRequestMessage(HttpMethod.Options, "/api/v1/chat/completions");
        request.Headers.TryAddWithoutValidation("Origin", "http://localhost:3000");
        request.Headers.TryAddWithoutValidation("Access-Control-Request-Method", "POST");
        request.Headers.TryAddWithoutValidation("Access-Control-Request-Headers", "authorization,content-type");

        var response = await client.SendAsync(request);
        Assert.NotEqual(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}
