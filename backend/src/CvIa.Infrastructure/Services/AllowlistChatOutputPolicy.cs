using CvIa.Application;
using CvIa.Application.Contracts;

namespace CvIa.Infrastructure.Services;

/// <summary>
/// Output policy that scans markdown links in the assistant reply and replaces the message with a
/// safe deterministic fallback whenever any link target is outside the allowlist
/// (see <see cref="ChatLinkAllowlistPolicy"/>).
/// </summary>
public sealed class AllowlistChatOutputPolicy : IChatOutputPolicy
{
    public ChatOutputPolicyResult Review(ChatMessageDto assistantMessage, ChatRequestDto request, string normalizedLang)
    {
        var targets = ChatMarkdownLinkTargetExtractor.ExtractTargets(assistantMessage.Content);
        if (targets.Count == 0)
        {
            return new ChatOutputPolicyResult(assistantMessage, null);
        }

        var disallowed = targets.Where(t => !ChatLinkAllowlistPolicy.IsAllowedTarget(t)).ToArray();
        if (disallowed.Length == 0)
        {
            return new ChatOutputPolicyResult(assistantMessage, null);
        }

        var safe = ChatSafeFallbackResponseGenerator.CreateSafeAssistantMessage(normalizedLang, request);
        return new ChatOutputPolicyResult(safe, $"disallowed_link_targets:{string.Join(",", disallowed)}");
    }
}
