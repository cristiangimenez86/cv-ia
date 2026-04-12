namespace CvIa.Application.Configuration;

/// <summary>
/// Optional bearer gate for <c>/api/v1/*</c>. Bound from configuration section <c>ApiAccess</c>.
/// Set via <c>ApiAccess__RequireToken</c> and <c>ApiAccess__Token</c> (Portainer / env).
/// </summary>
public sealed class ApiAccessOptions
{
    public const string SectionName = "ApiAccess";

    public bool RequireToken { get; set; }

    /// <summary>
    /// Expected raw token (without "Bearer " prefix).
    /// </summary>
    public string Token { get; set; } = string.Empty;
}
