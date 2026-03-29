namespace CvIa.Application.Configuration;

public sealed class RagSourceOptions
{
    public string Id { get; set; } = "cv";

    /// <summary>
    /// Source type used by the loader registry (e.g. <c>cv-sections</c>).
    /// </summary>
    public string Type { get; set; } = "cv-sections";

    /// <summary>
    /// Root folder for this source. For CV sections, this should point to the repo <c>content/</c> root.
    /// </summary>
    public string ContentRoot { get; set; } = "../../../content";
}
