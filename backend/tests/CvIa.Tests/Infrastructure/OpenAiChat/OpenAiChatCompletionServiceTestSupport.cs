using System.Net;
using System.Net.Http;
using System.Text;
using CvIa.Application.Configuration;
using CvIa.Application.Contracts;
using CvIa.Infrastructure.OpenAi;
using CvIa.Infrastructure.Rag.Services;
using CvIa.Infrastructure.Services;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;
using Moq.Protected;

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
            new DisabledChatRagContextBuilder(),
            new AllowlistChatOutputPolicy(),
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
}
