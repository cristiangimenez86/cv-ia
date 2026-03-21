using System.Net;
using System.Net.Http;
using System.Text;
using CvIa.Application.Configuration;
using CvIa.Application.Contracts;
using CvIa.Application.Exceptions;
using CvIa.Infrastructure.OpenAi;
using CvIa.Infrastructure.Services;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;
using Moq.Protected;
using Xunit;
using static CvIa.Tests.Infrastructure.OpenAiChat.OpenAiChatCompletionServiceTestSupport;
using static CvIa.Tests.Infrastructure.OpenAiChat.OpenAiChatCompletionServiceTestSupport.SampleBodies;

namespace CvIa.Tests.Infrastructure.OpenAiChat;

/// <summary>Wiring, Moq HTTP doubles, and sample payloads for <see cref="OpenAiChatCompletionService"/> tests (test assembly only).</summary>
internal static class OpenAiChatCompletionServiceTestSupport
{
    internal const string OpenAiV1BaseUrl = "https://api.openai.com/v1/";

    internal static IOptions<OpenAiChatOptions> CreateOptions(Action<OpenAiChatOptions>? configure = null)
    {
        var o = new OpenAiChatOptions
        {
            Model = "gpt-4o-mini",
            HttpTimeoutSeconds = 60
        };
        configure?.Invoke(o);
        return Options.Create(o);
    }

    internal static HttpClient CreateHttpClient(HttpMessageHandler handler) =>
        new(handler) { BaseAddress = new Uri(OpenAiV1BaseUrl) };

    internal static OpenAiChatCompletionService CreateService(
        HttpClient client,
        IOptions<OpenAiChatOptions>? options = null,
        CvMarkdownContentStore? cvMarkdownStore = null)
    {
        options ??= CreateOptions();
        cvMarkdownStore ??= DefaultCvMarkdownStore();
        var promptBuilder = new OpenAiChatPromptBuilder(options, cvMarkdownStore, NullLogger<OpenAiChatPromptBuilder>.Instance);
        return new OpenAiChatCompletionService(
            client,
            options,
            promptBuilder,
            new OpenAiHttpRequestHeadersApplier(),
            new OpenAiChatHttpResponseProcessor(options, NullLogger<OpenAiChatHttpResponseProcessor>.Instance),
            NullLogger<OpenAiChatCompletionService>.Instance);
    }

    internal static ChatRequestDto MinimalChatRequest(string lang = "en", string userMessage = "x") =>
        new(lang, [new ChatMessageDto("user", userMessage)]);

    internal static CvMarkdownContentStore DefaultCvMarkdownStore(
        string markdown = "## experience\nStub CV line for tests.")
    {
        var store = new CvMarkdownContentStore();
        store.Set(new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["en"] = markdown,
            ["es"] = markdown
        });
        return store;
    }

    /// <summary>Moq <see cref="HttpMessageHandler"/> so every <c>SendAsync</c> returns the same response.</summary>
    internal static Mock<HttpMessageHandler> CreateHttpMessageHandlerMock(HttpResponseMessage response)
    {
        var mock = new Mock<HttpMessageHandler>();
        mock.Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>())
            .ReturnsAsync(response);
        return mock;
    }

    /// <summary>429 on every send; use <paramref name="getSendCount"/> after the act (retries).</summary>
    internal static (Mock<HttpMessageHandler> Handler, Func<int> GetSendCount) CreateHttpMessageHandlerMockReturning429()
    {
        var sendCount = 0;
        var mock = new Mock<HttpMessageHandler>();
        mock.Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>())
            .Returns<HttpRequestMessage, CancellationToken>((_, _) =>
            {
                sendCount++;
                return Task.FromResult(new HttpResponseMessage((HttpStatusCode)429));
            });
        return (mock, () => sendCount);
    }

    internal static HttpResponseMessage JsonResponse(HttpStatusCode status, string json) =>
        new(status) { Content = new StringContent(json, Encoding.UTF8, "application/json") };

    internal static class SampleBodies
    {
        internal const string SuccessfulChatCompletion =
            """
            {"id":"chatcmpl_test","created":1700000000,"choices":[{"message":{"role":"assistant","content":"Hello from CV"}}]}
            """;

        internal const string ErrorMissingScopes =
            """
            {"error":{"message":"Missing scopes: model.request","type":"invalid_request_error"}}
            """;

        internal const string ErrorInsufficientPermissionsModelRequest =
            """
            {"error":{"message":"You have insufficient permissions for this operation. Missing scopes: model.request","type":"invalid_request_error"}}
            """;
    }
}

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
