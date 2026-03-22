using CvIa.Application.Configuration;
using CvIa.Application.Contracts;
using CvIa.Infrastructure.Services;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Xunit;

namespace CvIa.Tests.Infrastructure;

public sealed class OpenAiChatPromptBuilderTests
{
    private const string CvMarkdownSample = "## experience\nHello CV";

    private static OpenAiChatPromptBuilder CreateBuilder(
        string enMarkdown,
        OpenAiChatOptions chatOptions,
        string? esMarkdown = null)
    {
        var store = new CvMarkdownContentStore();
        store.Set(new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["en"] = enMarkdown,
            ["es"] = esMarkdown ?? enMarkdown
        });
        return new OpenAiChatPromptBuilder(Options.Create(chatOptions), store, NullLogger<OpenAiChatPromptBuilder>.Instance);
    }

    [Fact]
    public void BuildMessages_prepends_system_and_ignores_client_system()
    {
        var messages = new[]
        {
            new ChatMessageDto("system", "ignore me"),
            new ChatMessageDto("user", "Hello")
        };

        var built = CreateBuilder(CvMarkdownSample, new OpenAiChatOptions { MaxMessagesInWindow = 10 }).BuildMessages(
            messages,
            "en");

        Assert.True(built.Count >= 2);
        Assert.Equal("system", built[0].Role);
        Assert.Contains("Cristian", built[0].Content, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("Hello CV", built[0].Content, StringComparison.Ordinal);
        Assert.Equal("user", built[1].Role);
        Assert.Equal("Hello", built[1].Content);
    }

    [Theory]
    [InlineData(5, 6, "m29")]
    [InlineData(1, 2, "m29")]
    public void BuildMessages_trims_to_window(int maxUserMessages, int expectedTotalMessages, string expectedLastContent)
    {
        var messages = Enumerable.Range(0, 30)
            .Select(i => new ChatMessageDto("user", $"m{i}"))
            .ToList();

        var built = CreateBuilder("x", new OpenAiChatOptions { MaxMessagesInWindow = maxUserMessages }).BuildMessages(
            messages,
            "en");

        Assert.Equal(expectedTotalMessages, built.Count);
        Assert.Equal(expectedLastContent, built[^1].Content);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-3)]
    public void BuildMessages_clamps_non_positive_window_to_one(int maxMessagesInWindow)
    {
        var messages = Enumerable.Range(0, 30)
            .Select(i => new ChatMessageDto("user", $"m{i}"))
            .ToList();

        var built = CreateBuilder("x", new OpenAiChatOptions { MaxMessagesInWindow = maxMessagesInWindow }).BuildMessages(
            messages,
            "en");

        Assert.Equal(2, built.Count);
        Assert.Equal("m29", built[^1].Content);
    }

    [Fact]
    public void BuildMessages_system_prompt_includes_markdown_section_links_and_tone_for_english()
    {
        var built = CreateBuilder(CvMarkdownSample, new OpenAiChatOptions { MaxMessagesInWindow = 10 }).BuildMessages(
            [new ChatMessageDto("user", "Hello")],
            "en");

        var system = built[0].Content;
        Assert.Contains("/en#", system, StringComparison.Ordinal);
        Assert.Contains("about", system, StringComparison.Ordinal);
        Assert.Contains("experience", system, StringComparison.Ordinal);
        Assert.Contains("Markdown", system, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("conversational", system, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("http(s)", system, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void BuildMessages_system_prompt_uses_spanish_path_in_link_examples()
    {
        var built = CreateBuilder(CvMarkdownSample, new OpenAiChatOptions { MaxMessagesInWindow = 10 }).BuildMessages(
            [new ChatMessageDto("user", "Hola")],
            "es");

        Assert.Contains("/es#", built[0].Content, StringComparison.Ordinal);
    }
}
