using CvIa.Domain.Rag;

namespace CvIa.Infrastructure.Rag.Chunking;

public static class RagChunker
{
    public static IReadOnlyList<RagChunk> ChunkDocument(RagSourceDocument doc, int maxChunkChars = 1800)
    {
        if (string.IsNullOrWhiteSpace(doc.Text))
        {
            return [];
        }

        var paragraphs = doc.Text
            .Replace("\r\n", "\n", StringComparison.Ordinal)
            .Split("\n\n", StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        var chunks = new List<RagChunk>();
        var current = "";
        var chunkIndex = 0;

        void Flush()
        {
            var text = current.Trim();
            if (text.Length == 0) return;
            chunks.Add(new RagChunk(doc.SourceId, doc.DocumentKey, doc.Lang, doc.SectionId, chunkIndex++, text));
            current = "";
        }

        foreach (var p in paragraphs)
        {
            if (p.Length > maxChunkChars)
            {
                Flush();
                for (var i = 0; i < p.Length; i += maxChunkChars)
                {
                    var part = p.Substring(i, Math.Min(maxChunkChars, p.Length - i)).Trim();
                    if (part.Length == 0) continue;
                    chunks.Add(new RagChunk(doc.SourceId, doc.DocumentKey, doc.Lang, doc.SectionId, chunkIndex++, part));
                }

                continue;
            }

            if (current.Length == 0)
            {
                current = p;
                continue;
            }

            if (current.Length + 2 + p.Length <= maxChunkChars)
            {
                current = $"{current}\n\n{p}";
            }
            else
            {
                Flush();
                current = p;
            }
        }

        Flush();
        return chunks;
    }
}
