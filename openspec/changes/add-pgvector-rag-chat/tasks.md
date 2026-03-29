## 1. Database and configuration

- [x] 1.1 Add PostgreSQL connection and RAG options to `appsettings` with defaults: `Rag:Enabled` false; `Rag:EmbeddingModel` `text-embedding-3-small`; `Rag:EmbeddingDimensions` **1536**; `Rag:TopK` **8**; `Rag:MaxRetrievedContextTokens` **4000**; **`Rag:IngestionApiKey`**; **`Rag:Sources`** (minimum **`cv`** source → `content/{lang}/sections`). Bind **`Rag__*`** from Portainer. `.env.example` / `docs/local-integration.md` for pgvector host, port `5432`, **`X-Rag-Ingestion-Key`**, and **incremental** vs **full** examples.
- [x] 1.2 Create schema for chunk storage: **`source_id`**, **`document_key`**, optional **`section_id`**, `lang`, `chunk_index`, `text`, `vector(1536)`, `updated_at` (pgvector + indexes). EF Core migrations; validate dimensions at startup.
- [x] 1.3 Implement `GET /health` per spec: when `Rag:Enabled` is true, run an **active DB connectivity check** (connection open or trivial query); HTTP **503** if PostgreSQL fails; when `Rag:Enabled` is false, do not probe Postgres. Ensure Docker `HEALTHCHECK` / orchestrator probes that target `/health` inherit this behavior.

## 2. Ingestion and embeddings

- [x] 2.1 Implement **source registry** from `Rag:Sources`: at minimum **`cv`** loader ( `content/{en,es}/sections` + `CvMarkdownSectionIds` / `shared/section-ids.json` ); design **extensible** loader interface for future sources (new roots / file patterns).
- [x] 2.2 Implement **application service** orchestrating per-source: chunk → OpenAI embeddings (batching, retries) → EF Core upsert; **`source_id`** + **`document_key`** on every row.
- [x] 2.3 Expose **`POST /internal/v1/rag/reindex`** with JSON body: **`mode`** = **`incremental`** or **`full`**; optional **`sourceIds`**. **Incremental:** delete `WHERE source_id IN (...)` then re-ingest only those sources; if **`sourceIds`** omitted, process **all** configured sources one-by-one. **Full:** clear all chunk rows, rebuild every source. Validate **`X-Rag-Ingestion-Key`**; **503** / **401** as per spec. **Do not** register under `/api/v1/`.
- [x] 2.4 **`SemaphoreSlim(1, 1)`** around any ingestion run (incremental or full); busy → **409**.
- [x] 2.5 **Integration tests:** incremental `sourceIds: ["cv"]` leaves other sources untouched (use two sources in test config); **full** clears all; auth + **409** paths; unit tests for chunking per source.
- [ ] 2.6 **Verification:** `dotnet test`; `curl` incremental vs full; confirm **not** exposed via `8055` Next proxy for `/api`.

## 3. Retrieval service

- [x] 3.1 Implement vector similarity search scoped by `lang`; expose an internal service used by chat (retrieval is **not** the same as the ingestion HTTP endpoint).
- [x] 3.2 **Verification:** Unit test retrieval with fake vectors or a small seeded DB to assert locale isolation and top-K ordering.

## 4. Chat integration

- [x] 4.1 Extend `OpenAiChatPromptBuilder` / completion flow: embed latest user message, retrieve chunks, inject into system prompt; map chunks to `RetrievalCitation` fields per existing `ChatResponse` contract where applicable.
- [x] 4.2 Implement fallback to `CvMarkdownContentStore` full text when RAG is disabled, DB unreachable, or retrieval empty (per delta spec).
- [x] 4.3 **Verification:** `dotnet test backend/tests/CvIa.Tests/CvIa.Tests.csproj`; manual smoke: `POST /api/v1/chat/completions` with RAG on/off.

## 5. Infra and documentation

- [x] 5.1 Ensure `infra/docker-compose.yml` wires API service to `pgvector` when running the full stack (depends_on, connection string env); **do not** add `location /internal/` (or similar) to the **public nginx** config — ingestion stays on **direct API port** / internal network only.
- [x] 5.2 Update `docs/architecture/data-model.md` (and `docs/architecture/openai-chat-backend.md`) for **multi-source** chunks, incremental vs full ingestion, and **`POST /internal/v1/rag/reindex`**.
- [x] 5.3 Document internal ingestion in `docs/local-integration.md` (**`Rag:Sources`**, **`mode`/`sourceIds`**, port **8056**, auth, **`curl`** examples for incremental single-source vs full); add `docs/api/internal-rag-ingestion.md` or OpenAPI fragment.
- [x] 5.4 **Verification:** `npm run lint:backend` and `npm run build:backend` from repo root; `openspec validate add-pgvector-rag-chat` if available.
