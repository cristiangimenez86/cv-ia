using System;
using CvIa.Infrastructure.Rag.Persistence;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Pgvector;

#nullable disable

namespace CvIa.Api.Migrations;

/// <summary>RAG schema: pgvector extension, content_chunk, unique (source_id, document_key, chunk_index, lang).</summary>
/// <remarks>
/// Migrations live in CvIa.Api (not Infrastructure) so they ship in the published entry assembly;
/// EF was not discovering migrations in CvIa.Infrastructure.dll in some Docker/publish setups.
/// <see cref="DbContextAttribute"/> is required: EF Core only loads migrations whose context matches the active DbContext.
/// </remarks>
[DbContext(typeof(RagDbContext))]
[Migration("20260331120000_InitRag")]
public sealed class InitRag : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AlterDatabase()
            .Annotation("Npgsql:PostgresExtension:vector", ",,");

        migrationBuilder.CreateTable(
            name: "content_chunk",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                source_id = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                document_key = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: false),
                section_id = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                lang = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: true),
                chunk_index = table.Column<int>(type: "integer", nullable: false),
                text = table.Column<string>(type: "text", nullable: false),
                embedding = table.Column<Vector>(type: "vector(1536)", nullable: false),
                updated_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_content_chunk", x => x.Id);
            });

        migrationBuilder.CreateIndex(
            name: "IX_content_chunk_source_id_document_key_chunk_index_lang",
            table: "content_chunk",
            columns: new[] { "source_id", "document_key", "chunk_index", "lang" },
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_content_chunk_source_id_lang",
            table: "content_chunk",
            columns: new[] { "source_id", "lang" });
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(
            name: "content_chunk");
    }
}
