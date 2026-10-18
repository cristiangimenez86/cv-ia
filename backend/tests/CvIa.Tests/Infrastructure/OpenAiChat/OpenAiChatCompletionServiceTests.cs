using System.Net;
using System.Net.Http;
using System.Text.Json;
using CvIa.Application.Contracts;
using CvIa.Application.Exceptions;
using CvIa.Infrastructure.Services;
using Moq;
using Moq.Protected;
using Xunit;
using static CvIa.Tests.Infrastructure.OpenAiChat.OpenAiChatCompletionServiceTestSupport;
using static CvIa.Tests.Infrastructure.OpenAiChat.OpenAiChatCompletionServiceSampleBodies;

namespace CvIa.Tests.Infrastructure.OpenAiChat;

/// <summary>Tests for <see cref="OpenAiChatCompletionService"/> with stubbed HTTP (Moq) and deterministic CV context.</summary>
public sealed class OpenAiChatCompletionServiceTests
{
    [Fact]
    public async Task CompleteAsync_maps_successful_openai_json_to_chat_response()
    {
        var response = JsonResponse(HttpStatusCode.OK, SuccessfulChatCompletion);
        var handler = CreateHttpMessageHandlerMock(response);
        using var client = CreateHttpClient(handler.Object);
        var service = CreateService(client);

        var request = new ChatRequestDto("en", [new ChatMessageDto("user", "Hi")]);

        var result = await service.CompleteAsync(request, CancellationToken.None);

        Assert.Equal("chatcmpl_test", result.Id);
        Assert.Equal("assistant", result.Message.Role);
        Assert.Equal("Hello from CV", result.Message.Content);
        handler.Protected().Verify(
            "SendAsync",
            Times.Once(),
            ItExpr.IsAny<HttpRequestMessage>(),
            ItExpr.IsAny<CancellationToken>());
    }

    [Theory]
    [InlineData("gpt-6-luna", "none")]
    [InlineData("gpt-4o-mini", null)]
    public async Task CompleteAsync_sends_model_compatible_completion_parameters(string model, string? reasoningEffort)
    {
        string? capturedBody = null;
        var handler = new Mock<HttpMessageHandler>();
        handler.Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>())
            .Returns<HttpRequestMessage, CancellationToken>(async (message, cancellationToken) =>
            {
                capturedBody = await message.Content!.ReadAsStringAsync(cancellationToken);
                return JsonResponse(HttpStatusCode.OK, SuccessfulChatCompletion);
            });

        using var client = CreateHttpClient(handler.Object);
        var options = CreateOptions(o =>
        {
            o.Model = model;
            o.MaxTokens = 320;
            o.Temperature = 0.4;
        });
        var service = CreateService(client, options);

        await service.CompleteAsync(MinimalChatRequest(), CancellationToken.None);

        using var body = JsonDocument.Parse(capturedBody ?? throw new InvalidOperationException("No provider request was sent."));
        var root = body.RootElement;
        Assert.Equal(model, root.GetProperty("model").GetString());
        Assert.Equal(320, root.GetProperty("max_completion_tokens").GetInt32());
        Assert.Equal(0.4, root.GetProperty("temperature").GetDouble());
        Assert.False(root.TryGetProperty("max_tokens", out _));

        if (reasoningEffort is null)
        {
            Assert.False(root.TryGetProperty("reasoning_effort", out _));
        }
        else
        {
            Assert.Equal(reasoningEffort, root.GetProperty("reasoning_effort").GetString());
        }
    }

    [Fact]
    public async Task CompleteAsync_after_three_429_responses_throws_rate_limited()
    {
        var (handler, getSendCount) = CreateHttpMessageHandlerMockReturning429();
        using var client = CreateHttpClient(handler.Object);
        var service = CreateService(client);

        var ex = await Assert.ThrowsAsync<OpenAiChatException>(() =>
            service.CompleteAsync(MinimalChatRequest(), CancellationToken.None));

        Assert.Equal(429, ex.StatusCode);
        Assert.Equal("rate_limited", ex.Error.Code);
        Assert.Equal(3, getSendCount());
    }

    [Fact]
    public async Task CompleteAsync_maps_403_body_to_provider_forbidden()
    {
        var response = JsonResponse(HttpStatusCode.Forbidden, ErrorMissingScopes);
        var handler = CreateHttpMessageHandlerMock(response);
        using var client = CreateHttpClient(handler.Object);
        var service = CreateService(client);

        var ex = await Assert.ThrowsAsync<OpenAiChatException>(() =>
            service.CompleteAsync(MinimalChatRequest(), CancellationToken.None));

        Assert.Equal(403, ex.StatusCode);
        Assert.Equal("provider_forbidden", ex.Error.Code);
        Assert.Equal("Missing scopes: model.request", ex.Error.Message);
    }

    [Fact]
    public async Task CompleteAsync_maps_401_scope_error_to_provider_forbidden_not_generic_auth()
    {
        var response = JsonResponse(HttpStatusCode.Unauthorized, ErrorInsufficientPermissionsModelRequest);
        var handler = CreateHttpMessageHandlerMock(response);
        using var client = CreateHttpClient(handler.Object);
        var service = CreateService(client);

        var ex = await Assert.ThrowsAsync<OpenAiChatException>(() =>
            service.CompleteAsync(MinimalChatRequest(), CancellationToken.None));

        Assert.Equal(502, ex.StatusCode);
        Assert.Equal("provider_forbidden", ex.Error.Code);
        Assert.Contains("model.request", ex.Error.Message, StringComparison.Ordinal);
    }
}
