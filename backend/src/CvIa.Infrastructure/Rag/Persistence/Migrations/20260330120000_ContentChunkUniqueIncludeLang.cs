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
        // IF EXISTS: startup repair may have dropped the old index before this migration runs.
        migrationBuilder.Sql(
            """
            DROP INDEX IF EXISTS "IX_content_chunk_source_id_document_key_chunk_index";
            CREATE UNIQUE INDEX IF NOT EXISTS "IX_content_chunk_source_id_document_key_chunk_index_lang"
              ON content_chunk (source_id, document_key, chunk_index, lang);
            """);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(
            """
            DROP INDEX IF EXISTS "IX_content_chunk_source_id_document_key_chunk_index_lang";
            CREATE UNIQUE INDEX IF NOT EXISTS "IX_content_chunk_source_id_document_key_chunk_index"
              ON content_chunk (source_id, document_key, chunk_index);
            """);
    }
}
