using System.Net;
using System.Net.Http.Json;
using CvIa.Application.Contracts;
using CvIa.Tests;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace CvIa.Tests.Api;

/// <summary>Smoke tests against the API host (stub chat; no real OpenAI).</summary>
public sealed class ApiScaffoldTests : IClassFixture<StubOpenAiWebApplicationFactory>
{
    private readonly HttpClient _client;

    public ApiScaffoldTests(StubOpenAiWebApplicationFactory factory) =>
        _client = factory.CreateClient();

    [Fact]
    public async Task Health_ShouldReturnExpectedPayloadShape()
    {
        var response = await _client.GetAsync("/health");
        response.EnsureSuccessStatusCode();

        var payload = await response.Content.ReadFromJsonAsync<Dictionary<string, object?>>();
        Assert.NotNull(payload);
        Assert.True(payload.ContainsKey("status"));
        Assert.True(payload.ContainsKey("service"));
        Assert.True(payload.ContainsKey("timestampUtc"));
    }

    [Fact]
    public async Task CvController_ShouldReturnBadRequest_OnInvalidLang()
    {
        var response = await _client.GetAsync("/api/v1/cv?lang=fr");
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        var payload = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        Assert.NotNull(payload);
        Assert.Equal("invalid_request", payload.Code);
    }

    [Fact]
    public async Task CvController_ShouldBeAccessibleWithoutAuthentication()
    {
        var response = await _client.GetAsync("/api/v1/cv?lang=en");
        Assert.NotEqual(HttpStatusCode.Unauthorized, response.StatusCode);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task ChatController_ShouldReturnOpenApiCompatibleShape()
    {
        var request = new ChatRequestDto(
            Lang: "en",
            Messages: [new ChatMessageDto("user", "Hello")]
        );

        var response = await _client.PostAsJsonAsync("/api/v1/chat/completions", request);
        response.EnsureSuccessStatusCode();

        var payload = await response.Content.ReadFromJsonAsync<Dictionary<string, object?>>();
        Assert.NotNull(payload);
        Assert.True(payload.ContainsKey("id"));
        Assert.True(payload.ContainsKey("createdAt"));
        Assert.True(payload.ContainsKey("message"));
    }

    [Fact]
    public async Task GlobalExceptionMiddleware_ShouldReturnNormalizedErrorResponse()
    {
        var request = new ChatRequestDto(
            Lang: "en",
            Messages: [new ChatMessageDto("user", "throw")]
        );

        var response = await _client.PostAsJsonAsync("/api/v1/chat/completions", request);

        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
        var payload = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        Assert.NotNull(payload);
        Assert.Equal("internal_error", payload.Code);
    }
}

