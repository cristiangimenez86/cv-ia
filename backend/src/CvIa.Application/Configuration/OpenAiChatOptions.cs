namespace CvIa.Application.Configuration;

/// <summary>
/// Typed configuration for OpenAI-backed chat completions.
/// Bind from appsettings section <see cref="SectionName"/> (see design: timeout lives in appsettings only).
/// </summary>
public sealed class OpenAiChatOptions
{
    public const string SectionName = "OpenAiChat";

    /// <summary>API key for Bearer authentication. Empty forces stub implementation at startup.</summary>
    public string ApiKey { get; set; } = "";

    /// <summary>
    /// Project id for <c>OpenAI-Project</c> header (e.g. <c>proj_...</c>).
    /// Required when using project-scoped keys (<c>sk-proj-...</c>); without it OpenAI returns 401.
    /// </summary>
    public string OpenAiProjectId { get; set; } = "";

    /// <summary>Optional org id for <c>OpenAI-Organization</c> header (e.g. <c>org-...</c>).</summary>
    public string OpenAiOrganizationId { get; set; } = "";

    public string Model { get; set; } = "gpt-4o-mini";

    /// <summary>Base URL including /v1, e.g. https://api.openai.com/v1</summary>
    public string BaseUrl { get; set; } = "https://api.openai.com/v1";

    /// <summary>HTTP client timeout for OpenAI requests (seconds). Appsettings only per project decision.</summary>
    public int HttpTimeoutSeconds { get; set; } = 60;

    /// <summary>Chat sampling temperature (OpenAI <c>temperature</c>). Set only in configuration.</summary>
    public double Temperature { get; set; } = 0.3;

    /// <summary>Max completion tokens per response (OpenAI <c>max_tokens</c>). Set only in configuration.</summary>
    public int MaxTokens { get; set; } = 512;

    /// <summary>Maximum chat messages (after system) to send to the provider.</summary>
    public int MaxMessagesInWindow { get; set; } = 20;

    /// <summary>When true, or when <see cref="ApiKey"/> is empty, the stub chat service is used.</summary>
    public bool UseStubChatService { get; set; } = true;
}
