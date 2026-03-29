-- Fix duplicate key on reindex when both en + es share (source_id, document_key, chunk_index).
-- Run against the RAG database (e.g. cvia) if the API image with EF migration is not deployed yet.
--
-- After running, optionally register the migration so EF does not re-apply:
--   INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
--   VALUES ('20260330120000_ContentChunkUniqueIncludeLang', '10.0.5')
--   ON CONFLICT DO NOTHING;

DROP INDEX IF EXISTS "IX_content_chunk_source_id_document_key_chunk_index";

CREATE UNIQUE INDEX IF NOT EXISTS "IX_content_chunk_source_id_document_key_chunk_index_lang"
  ON content_chunk (source_id, document_key, chunk_index, lang);
