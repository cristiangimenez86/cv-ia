using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CvIa.Infrastructure.Rag.Persistence.Migrations;

/// <inheritdoc />
[Migration("20260330120000_ContentChunkUniqueIncludeLang")]
public partial class ContentChunkUniqueIncludeLang : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(
            name: "IX_content_chunk_source_id_document_key_chunk_index",
            table: "content_chunk");

        migrationBuilder.CreateIndex(
            name: "IX_content_chunk_source_id_document_key_chunk_index_lang",
            table: "content_chunk",
            columns: new[] { "source_id", "document_key", "chunk_index", "lang" },
            unique: true);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(
            name: "IX_content_chunk_source_id_document_key_chunk_index_lang",
            table: "content_chunk");

        migrationBuilder.CreateIndex(
            name: "IX_content_chunk_source_id_document_key_chunk_index",
            table: "content_chunk",
            columns: new[] { "source_id", "document_key", "chunk_index" },
            unique: true);
    }
}
