namespace CvIa.Application.Configuration;

/// <summary>
/// Allowed browser origins for CORS. Bound from configuration section <c>Cors</c>.
/// </summary>
public sealed class SiteCorsOptions
{
    public const string SectionName = "Cors";

    /// <summary>
    /// Explicit allow list. When empty, the API uses a permissive development policy (any origin).
    /// </summary>
    public string[] AllowedOrigins { get; set; } = [];
}
