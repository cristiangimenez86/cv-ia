using System.Collections.ObjectModel;

namespace CvIa.Infrastructure.Services;

/// <summary>
/// In-memory CV markdown built once at startup (<see cref="CvMarkdownContentStartupLoader"/>).
/// </summary>
public sealed class CvMarkdownContentStore
{
    private IReadOnlyDictionary<string, string> _byLang =
        new ReadOnlyDictionary<string, string>(new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase));

    public void Set(IReadOnlyDictionary<string, string> byLang) =>
        _byLang = new ReadOnlyDictionary<string, string>(
            new Dictionary<string, string>(byLang, StringComparer.OrdinalIgnoreCase));

    public void SetEmpty() =>
        _byLang = new ReadOnlyDictionary<string, string>(
            new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase));

    /// <summary>Normalized to <c>en</c> or <c>es</c>; returns empty string if missing.</summary>
    public string Get(string lang)
    {
        lang = lang is "en" or "es" ? lang : "en";
        return _byLang.TryGetValue(lang, out var s) ? s : "";
    }
}