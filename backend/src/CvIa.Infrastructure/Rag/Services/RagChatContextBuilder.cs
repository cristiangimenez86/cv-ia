using System.Globalization;
using System.Text;
using CvIa.Application;
using CvIa.Application.Configuration;
using CvIa.Application.Contracts;
using CvIa.Application.Rag;
using CvIa.Infrastructure.OpenAi;
using CvIa.Infrastructure.Services;
using Microsoft.Extensions.Options;

namespace CvIa.Infrastructure.Rag.Services;

/// <summary>
/// Builds RAG context for chat completions: embeds the latest user message, retrieves matching chunks,
/// formats them into a single markdown block, and produces matching citations.
/// </summary>
public sealed class RagChatContextBuilder(
    IOptions<RagOptions> ragOptions,
    IOptions<OpenAiChatOptions> openAiOptions,
    IRagRetrievalService retrieval,
    IOpenAiEmbeddingsClient embeddings) : IChatRagContextBuilder
{
    private const int CitationSnippetMaxLength = 240;
    private const int MinContextBudgetChars = 200;
    private const int CharsPerToken = 4;

    public async Task<ChatRagContext> BuildAsync(ChatRequestDto request, string normalizedLang, CancellationToken cancellationToken)
    {
        var rag = ragOptions.Value;
        if (!rag.Enabled)
        {
            return ChatRagContext.Empty;
        }

        var lastUser = LastUserMessageOrNull(request);
        if (lastUser is null)
        {
            return ChatRagContext.Empty;
        }

        var maxMessageChars = Math.Max(MinContextBudgetChars, openAiOptions.Value.MaxMessageChars);
        var queryText = ChatInputNormalizer.NormalizeAndTruncate(lastUser, maxMessageChars);

        var queryEmbedding = await embeddings.CreateEmbeddingAsync(queryText, rag.EmbeddingModel, cancellationToken);
        var chunks = await retrieval.RetrieveAsync(normalizedLang, queryEmbedding, rag.TopK, cancellationToken);
        if (chunks.Count == 0)
        {
            return ChatRagContext.Empty;
        }

        var maxChars = Math.Max(MinContextBudgetChars, rag.MaxRetrievedContextTokens * CharsPerToken);
        var contextBuilder = new StringBuilder();
        var citations = new List<ChatCitationDto>(chunks.Count);
        var currentChars = 0;

        foreach (var chunk in chunks)
        {
            var block = FormatContextBlock(chunk);
            if (currentChars + block.Length + 2 > maxChars)
            {
                break;
            }

            if (contextBuilder.Length > 0)
            {
                contextBuilder.Append("\n\n");
                currentChars += 2;
            }

            contextBuilder.Append(block);
            currentChars += block.Length;
            citations.Add(BuildCitation(chunk, normalizedLang));
        }

        if (contextBuilder.Length == 0)
        {
            return ChatRagContext.Empty;
        }

        return new ChatRagContext(contextBuilder.ToString(), citations);
    }

    private static string? LastUserMessageOrNull(ChatRequestDto request)
    {
        var content = request.Messages
            .LastOrDefault(m => string.Equals(m.Role, "user", StringComparison.OrdinalIgnoreCase))
            ?.Content;

        return string.IsNullOrWhiteSpace(content) ? null : content;
    }

    private static string FormatContextBlock(Domain.Rag.RagRetrievedChunk chunk)
    {
        var header = string.Create(
            CultureInfo.InvariantCulture,
            $"[source={chunk.SourceId} document={chunk.DocumentKey} section={chunk.SectionId ?? string.Empty} score={chunk.Score:F3}]");

        return $"{header}\n{chunk.Text}".Trim();
    }

    private static ChatCitationDto BuildCitation(Domain.Rag.RagRetrievedChunk chunk, string normalizedLang)
    {
        var sourceId = chunk.SourceId.Equals("cv", StringComparison.OrdinalIgnoreCase) && !string.IsNullOrWhiteSpace(chunk.SectionId)
            ? $"content/{normalizedLang}/sections/{chunk.SectionId}.md"
            : $"rag/{chunk.SourceId}/{chunk.DocumentKey}";

        var title = chunk.SectionId ?? chunk.DocumentKey;
        var snippet = chunk.Text.Length <= CitationSnippetMaxLength
            ? chunk.Text
            : chunk.Text[..CitationSnippetMaxLength];

        return new ChatCitationDto(sourceId, title, snippet);
    }
}
