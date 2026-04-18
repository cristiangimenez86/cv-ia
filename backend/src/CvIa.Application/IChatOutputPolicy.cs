using CvIa.Application.Contracts;

namespace CvIa.Application;

/// <summary>
/// Server-side policy that inspects an assistant message before it is returned to the client.
/// Used to enforce content rules (e.g. link allowlist) and substitute a safe fallback when violated.
/// </summary>
public interface IChatOutputPolicy
{
    /// <summary>
    /// Reviews <paramref name="assistantMessage"/> against the policy. Returns the original message when compliant,
    /// or a safe fallback message when a violation is detected. Implementations should not throw on violations.
    /// </summary>
    /// <param name="assistantMessage">The message returned by the model.</param>
    /// <param name="request">Original chat request, used to localize / contextualize fallbacks.</param>
    /// <param name="normalizedLang">Language code already normalized (e.g. <c>en</c>, <c>es</c>).</param>
    ChatOutputPolicyResult Review(ChatMessageDto assistantMessage, ChatRequestDto request, string normalizedLang);
}

/// <summary>
/// Result of <see cref="IChatOutputPolicy.Review"/>.
/// <see cref="ViolationReason"/> is populated only when the original message was replaced.
/// </summary>
public readonly record struct ChatOutputPolicyResult(ChatMessageDto Message, string? ViolationReason)
{
    public bool WasReplaced => ViolationReason is not null;
}
