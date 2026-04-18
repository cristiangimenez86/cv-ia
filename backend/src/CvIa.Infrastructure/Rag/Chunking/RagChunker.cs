using System.Text;
using CvIa.Domain.Rag;

namespace CvIa.Infrastructure.Rag.Chunking;

/// <summary>
/// Splits a <see cref="RagSourceDocument"/> into <see cref="RagChunk"/> instances bounded by
/// <c>maxChunkChars</c>. Paragraphs (separated by blank lines) are kept together when they fit;
/// paragraphs larger than the budget are sliced into fixed-size pieces.
/// </summary>
public static class RagChunker
{
    private const string ParagraphSeparator = "\n\n";

    public static IReadOnlyList<RagChunk> ChunkDocument(RagSourceDocument doc, int maxChunkChars = 1800)
    {
        if (string.IsNullOrWhiteSpace(doc.Text))
        {
            return [];
        }

        var paragraphs = doc.Text
            .Replace("\r\n", "\n", StringComparison.Ordinal)
            .Split(ParagraphSeparator, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        var chunks = new List<RagChunk>();
        var current = new StringBuilder(maxChunkChars);
        var chunkIndex = 0;

        foreach (var paragraph in paragraphs)
        {
            if (paragraph.Length > maxChunkChars)
            {
                FlushCurrent(chunks, doc, current, ref chunkIndex);
                AddSlicedParagraph(chunks, doc, paragraph, maxChunkChars, ref chunkIndex);
                continue;
            }

            if (current.Length == 0)
            {
                current.Append(paragraph);
                continue;
            }

            if (current.Length + ParagraphSeparator.Length + paragraph.Length <= maxChunkChars)
            {
                current.Append(ParagraphSeparator).Append(paragraph);
            }
            else
            {
                FlushCurrent(chunks, doc, current, ref chunkIndex);
                current.Append(paragraph);
            }
        }

        FlushCurrent(chunks, doc, current, ref chunkIndex);
        return chunks;
    }

    private static void FlushCurrent(List<RagChunk> chunks, RagSourceDocument doc, StringBuilder current, ref int chunkIndex)
    {
        if (current.Length == 0)
        {
            return;
        }

        var text = current.ToString().Trim();
        current.Clear();
        if (text.Length == 0)
        {
            return;
        }

        chunks.Add(new RagChunk(doc.SourceId, doc.DocumentKey, doc.Lang, doc.SectionId, chunkIndex++, text));
    }

    private static void AddSlicedParagraph(List<RagChunk> chunks, RagSourceDocument doc, string paragraph, int maxChunkChars, ref int chunkIndex)
    {
        for (var i = 0; i < paragraph.Length; i += maxChunkChars)
        {
            var length = Math.Min(maxChunkChars, paragraph.Length - i);
            var part = paragraph.Substring(i, length).Trim();
            if (part.Length == 0)
            {
                continue;
            }

            chunks.Add(new RagChunk(doc.SourceId, doc.DocumentKey, doc.Lang, doc.SectionId, chunkIndex++, part));
        }
    }
}
