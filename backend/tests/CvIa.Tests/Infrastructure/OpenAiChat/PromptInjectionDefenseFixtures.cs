using CvIa.Infrastructure.Services;

namespace CvIa.Tests.Infrastructure.OpenAiChat;

internal static class PromptInjectionDefenseFixtures
{
    internal static readonly IReadOnlyList<string> AllowedSectionIds = CvMarkdownSectionIds.Ordered;

    internal static readonly IReadOnlyList<string> AllowedTargets =
    [
        "/en#experience",
        "/es#experience",
        "/api/v1/cv?lang=en",
        "/api/v1/cv?lang=es"
    ];
}

