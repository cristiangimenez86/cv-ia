using System.Collections.ObjectModel;
using CvIa.Application;

namespace CvIa.Infrastructure.Services;

/// <summary>
/// In-memory CV markdown built once at startup (<see cref="CvMarkdownContentStartupLoader"/>).
/// </summary>
public sealed class CvMarkdownContentStore
{
    private static readonly IReadOnlyDictionary<string, string> Empty =
        new ReadOnlyDictionary<string, string>(new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase));

    private IReadOnlyDictionary<string, string> _byLang = Empty;

    public void Set(IReadOnlyDictionary<string, string> byLang) =>
        _byLang = new ReadOnlyDictionary<string, string>(
            new Dictionary<string, string>(byLang, StringComparer.OrdinalIgnoreCase));

    public void SetEmpty() => _byLang = Empty;

    /// <summary>Normalized to <c>en</c> or <c>es</c>; returns empty string if missing.</summary>
    public string Get(string lang)
    {
        var normalized = SupportedLanguages.NormalizeOrDefault(lang);
        return _byLang.TryGetValue(normalized, out var content) ? content : string.Empty;
    }
}
