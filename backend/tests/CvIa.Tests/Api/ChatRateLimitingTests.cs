using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using CvIa.Application.Contracts;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace CvIa.Tests.Api;

public sealed class ChatRateLimitingTests
{
    [Fact]
    public async Task WhenExceedingLimit_ShouldReturn429_WithMachineReadableJson()
    {
        await using var factory = new RateLimitingWebApplicationFactory(permitLimit: 2, windowSeconds: 60);
        var client = factory.CreateClient();

        var request = new ChatRequestDto("en", [new ChatMessageDto("user", "Hello")]);

        var ok1 = await PostChatAsync(client, request, forwardedFor: "203.0.113.10");
        Assert.Equal(HttpStatusCode.OK, ok1.StatusCode);

        var ok2 = await PostChatAsync(client, request, forwardedFor: "203.0.113.10");
        Assert.Equal(HttpStatusCode.OK, ok2.StatusCode);

        var limited = await PostChatAsync(client, request, forwardedFor: "203.0.113.10");
        Assert.Equal((HttpStatusCode)429, limited.StatusCode);

        Assert.Equal("application/problem+json", limited.Content.Headers.ContentType?.MediaType);

        var json = await limited.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;
        Assert.Equal(429, root.GetProperty("status").GetInt32());
        Assert.Equal("rate_limited", root.GetProperty("error").GetString());
        Assert.True(root.TryGetProperty("traceId", out _));

        if (limited.Headers.TryGetValues("Retry-After", out var values))
        {
            var raw = values.Single();
            Assert.True(int.TryParse(raw, out var seconds));
            Assert.True(seconds > 0);
        }
    }

    [Fact]
    public async Task Partitioning_ByIp_ShouldNotShareLimitsAcrossDifferentForwardedIps()
    {
        await using var factory = new RateLimitingWebApplicationFactory(permitLimit: 1, windowSeconds: 60);
        var client = factory.CreateClient();

        var request = new ChatRequestDto("en", [new ChatMessageDto("user", "Hello")]);

        var ipA1 = await PostChatAsync(client, request, forwardedFor: "203.0.113.11");
        Assert.Equal(HttpStatusCode.OK, ipA1.StatusCode);

        var ipB1 = await PostChatAsync(client, request, forwardedFor: "203.0.113.12");
        Assert.Equal(HttpStatusCode.OK, ipB1.StatusCode);

        var ipA2 = await PostChatAsync(client, request, forwardedFor: "203.0.113.11");
        Assert.Equal((HttpStatusCode)429, ipA2.StatusCode);

        var ipB2 = await PostChatAsync(client, request, forwardedFor: "203.0.113.12");
        Assert.Equal((HttpStatusCode)429, ipB2.StatusCode);
    }

    private static async Task<HttpResponseMessage> PostChatAsync(HttpClient client, ChatRequestDto request, string forwardedFor)
    {
        using var msg = new HttpRequestMessage(HttpMethod.Post, "/api/v1/chat/completions");
        msg.Headers.TryAddWithoutValidation("X-Forwarded-For", forwardedFor);
        msg.Content = JsonContent.Create(request);
        return await client.SendAsync(msg);
    }

    private sealed class RateLimitingWebApplicationFactory(int permitLimit, int windowSeconds) : WebApplicationFactory<Program>
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseEnvironment("Development");
            builder.UseSetting("OpenAiChat:UseStubChatService", "true");
            builder.UseSetting("OpenAiChat:ApiKey", "");
            builder.UseSetting("OpenAiChat:OpenAiProjectId", "");

            builder.UseSetting("ForwardedHeaders:Enabled", "true");

            builder.UseSetting("OpenAiChat:RateLimiting:PermitLimit", permitLimit.ToString());
            builder.UseSetting("OpenAiChat:RateLimiting:WindowSeconds", windowSeconds.ToString());
            builder.UseSetting("OpenAiChat:RateLimiting:QueueLimit", "0");
        }
    }
}

