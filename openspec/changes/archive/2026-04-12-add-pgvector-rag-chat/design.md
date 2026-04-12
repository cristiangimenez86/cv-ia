## Context

CV-IA serves a bilingual static CV from `content/` and exposes `POST /api/v1/chat/completions` backed by OpenAI. Today, `CvMarkdownContentStartupLoader` reads all section Markdown per locale into memory and `OpenAiChatPromptBuilder` injects that full text into the system prompt. Docker Compose already includes a `pgvector` PostgreSQL service (`infra/docker-compose.yml`), but the .NET API does not connect to it. The data model (`docs/architecture/data-model.md`) already describes `ContentChunk` for RAG.

## Goals / Non-Goals

**Goals:**

- Persist **chunked** text with **embeddings** in PostgreSQL (pgvector) from **multiple logical sources** (corpora), each with a stable **`sourceId`** (e.g. `cv` today; future: travel notes, work context). Within a source, chunks are keyed by **`documentKey`** (e.g. section file id or file path), **`lang`** where applicable, and **`chunkIndex`**.
- **Incremental reindex per source:** operators can refresh **one** corpus (e.g. add `travel-oceania` or update only `cv`) **without** re-embedding unrelated sources — matching how large teams operate (bounded cost, no global downtime).
- **Full rebuild** remains available for disaster recovery, embedding model changes, or schema migrations.
- At chat time, **embed the user’s latest question**, run **top-K** similarity search **scoped to `lang`** across **all indexed sources** (unless a future filter is added), and pass retrieved chunks into the OpenAI chat flow.
- Keep **guardrails** from `backend-chat-openai-mvp` (Markdown, internal section links only, no external URLs, no invented facts).
- **Primary** operator interface: **`POST /internal/v1/rag/reindex`** with a JSON body selecting **incremental** vs **full** and optional **`sourceIds`**; documented for CI/local/prod.
- Document **connection strings**, **embedding model**, **dimensions**, **`Rag:Sources`**, and ingestion semantics in `appsettings` and `docs/local-integration.md`.

**Non-Goals:**

- Changing the public OpenAPI contract for chat (same `ChatRequest` / `ChatResponse` unless optional fields already allow richer citations).
- Frontend changes beyond what already consumes citations.
- Hybrid search (BM25 + vector) or reranking models in v1.
- Running embeddings from the Next.js build; ingestion stays **backend-side** (HTTP endpoint + services). Optional CLI may wrap the same application service later; **no** reliance on one-off temporary scripts as the only path.

## Decisions

| Decision | Choice | Rationale | Alternatives considered |
|----------|--------|-----------|-------------------------|
| Embedding provider | OpenAI Embeddings API; **default model `text-embedding-3-small`** | Same vendor as chat; single API key; cost/quality fit for CV-sized text. | Larger models (`text-embedding-3-large`); local embeddings. |
| Embedding vector size | **1536** dimensions (OpenAI default for `text-embedding-3-small`) | Must match pgvector column `vector(1536)`; do not use the API `dimensions` reduction unless explicitly configured and schema updated. | Lower-dimension API output (requires migration + reindex). |
| Retrieval limits | **Top-K = 8**; **max ~4000 tokens** of retrieved chunk text combined into the prompt context (config keys, these are defaults) | Bounds latency and cost; leaves room for system + user messages under model limits. | Higher K / no cap (noisy, expensive). |
| Health vs database | **When `Rag:Enabled` is false**, `GET /health` does not check PostgreSQL. **When `Rag:Enabled` is true**, `GET /health` **MUST** run an **active PostgreSQL connectivity check** (e.g. open connection or trivial query); if the DB is unreachable, respond **503**. Container **HEALTHCHECK** / orchestrator probes that call `/health` then treat a bad DB as an unhealthy container. | Ops visibility: RAG cannot work without a live DB; same probe for humans and automation. | Reporting DB “ok” without probing (misleading). |
| Chunking strategy | Per **document** within a **source**: split into chunks with max token/character budget; preserve **`document_key`**, optional `section_id` (CV), **`chunkIndex`**; optional overlap | Balances recall vs noise; citations can cite `source_id` + fragment. | One row per whole file regardless of size. |
| Vector index | pgvector `vector(dim)` + IVFFlat or HNSW per Postgres/pgvector version | Already in compose; no new managed service. | Dedicated vector SaaS (extra cost and ops). |
| .NET data access | **EF Core** with **Npgsql** (`Npgsql.EntityFrameworkCore.PostgreSQL`) | Migrations, testability, and a single ORM for chunk entities; pgvector types may use mapped columns plus raw SQL or ADO for similarity queries where the provider does not map operators. | Dapper-only (less structure); raw ADO for everything (more boilerplate). |
| When to embed user query | Embed the latest **user** message text (or concatenation of last N user turns) as query vector | Simple MVP; cheap. | LLM-generated search query (extra call). |
| Fallback if DB empty or error | Config flag or degraded mode: **fall back to current full-markdown-in-memory behavior** so chat still works in dev without Postgres | Reduces blast radius; matches “incremental rollout.” | Hard fail (bad DX). |
| Reindex trigger | **`POST /internal/v1/rag/reindex`** with JSON body: **`mode`: `incremental` | `full`**; optional **`sourceIds`** string array. **Incremental:** for each listed source (or **all configured sources** if `sourceIds` omitted), **delete** existing rows for that `sourceId` only, then chunk + embed + insert for that source’s files — **other sources untouched**. **Full:** truncate or delete all chunk rows, then rebuild every configured source (use after model/dimension change or corruption). Initial prod index: incremental per source or full once. | Mirrors enterprise RAG ops (partial updates); avoids re-embedding unrelated corpora. | Global truncate on every edit (current naive approach). |
| Content sources | **`Rag:Sources`** in configuration: ordered list of **`{ id, contentRoot, ... }`**. First source **`id` = `cv`** maps to existing `content/{en,es}/sections` + `CvMarkdownSectionIds`. New sources add new roots under `content/` or repo paths (e.g. `content-extra/travel/`) without code changes beyond config + optional new loader strategy per type. | Extensible; interview story: multi-corpus incremental indexing. | Single hardcoded path only. |
| Ingestion route visibility | Path prefix **`/internal/`** on Kestrel so it is **not** routed by `location /api/` in nginx (proxy to API) nor by Next.js `app/api/[...path]` (which forwards `...` to backend `/api/...`). Public entrypoint **8055** serves `/` → Next and `/api/` → API only — **`/internal`** hits Next **static** routes and does **not** reach this endpoint. | Ingestion only via **direct API bind** (e.g. host `8056` → `8080`) or `docker exec` / internal network. | Placing ingestion under `/api/v1/...` (would be exposed through public proxy). |
| Implementation quality | **Application service** owns orchestration (chunk → embed → persist); API **controller is thin**; structured errors and logging; **integration + unit tests**; aligns with existing **CvIa.Application / Domain / Infrastructure** split | Maintainable production code; review bar equivalent to **senior backend + architect** (no temporary scaffolding). | Fat controllers; untested one-off endpoints. |
| Ingestion shared secret | **`Rag:IngestionApiKey`** read from configuration; **operators set environment variable `Rag__IngestionApiKey`** in Portainer (or User Secrets / `.env` locally). Clients send **`X-Rag-Ingestion-Key: <secret>`** on `POST /internal/v1/rag/reindex`. If the key is **empty**, the endpoint SHALL **not** run ingestion (respond with **503** and a clear body — avoids an accidentally open endpoint). | Matches existing ASP.NET Core env binding; no secrets in repo. | Anonymous ingestion (unsafe); Bearer-only (more moving parts). |
| Reindex concurrency (single-flight) | A process-wide **`SemaphoreSlim(1, 1)`** (or equivalent) guarding the **entire** reindex operation. First caller holds the lock; a second concurrent `POST` **does not** start another run — returns **409 Conflict** with a machine-readable message (e.g. `reindexInProgress`). **Dispose** with the app host / register as singleton so the semaphore lifetime matches the API process. | Prevents overlapping OpenAI spend and DB corruption from parallel full rebuilds. | Queue second request (complex); DB advisory locks only (heavier). |

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| **Missed recall** (wrong chunks) leads to wrong or incomplete answers | Tune K and chunk size; include section title in chunk text; monitor with manual Q&A; optional fallback to inject minimal “profile” chunk. |
| **Embedding cost** on reindex | Batch embedding API calls; **incremental** reindex limits work to the requested **`sourceIds`**; full rebuild only when necessary. |
| **Schema drift** between Markdown and DB | Optional v2: content hash per `documentKey` to skip unchanged files; v1 may re-embed all files in a source on each incremental run for that source. |
| **Ops complexity** (Postgres in prod) | Document connection string for API container; when `Rag:Enabled` is true, `/health` fails if DB is down (see Decisions). |
| **Vector operators vs LINQ** | EF Core may not express pgvector distance in LINQ; use `FromSqlRaw` / parameterized SQL for top-K similarity while keeping CRUD and migrations on EF Core. |

## Migration Plan

1. Add DB schema via **EF Core migrations** creating `content_chunk` (or equivalent) with **`source_id`** (string), **`document_key`** (string, stable within source), `lang`, **`section_id`** (optional; populated for CV sections, nullable for free-form docs), `chunk_index`, `text`, **`embedding vector(1536)`**, `updated_at` (enable pgvector extension in migration SQL where needed).
2. Implement **config-driven sources** (`Rag:Sources`) and **ingestion application service** + **`POST /internal/v1/rag/reindex`** supporting **incremental** (per `sourceId`) and **full** modes per request body.
3. Wire retrieval into `OpenAiChatCompletionService` / prompt builder behind configuration (`Rag:Enabled`); retrieval queries **all** sources for the user’s `lang` unless a later feature filters by source.
4. Update Docker Compose / Portainer env for API → `pgvector` host on internal network.
5. Rollback: set `Rag:Enabled` false and redeploy; DB can remain unused.

## Default configuration (implementation)

These values SHALL be the **defaults in `appsettings`** (overridable per environment):

| Key (conceptual) | Default | Notes |
|------------------|---------|--------|
| `Rag:Enabled` | `false` | No Postgres required for local chat until RAG is turned on. |
| `Rag:EmbeddingModel` | `text-embedding-3-small` | Same model for **ingestion** and **query** embedding. |
| `Rag:EmbeddingDimensions` | `1536` | Must match DB column and API response; validate at startup. |
| `Rag:TopK` | `8` | Nearest chunks per question. |
| `Rag:MaxRetrievedContextTokens` | `4000` | Soft budget when assembling retrieved text for the prompt (implementation may approximate via characters). |
| `Rag:IngestionApiKey` | *(empty)* | **Required for ingestion:** set via **`Rag__IngestionApiKey`** in Portainer (stack env). Request header **`X-Rag-Ingestion-Key`** must match. If empty, **`POST /internal/v1/rag/reindex`** returns **503** (not configured). |
| `Rag:Sources` | See implementation | Array of source definitions; **minimum** one entry **`id: cv`** for current CV Markdown. Additional entries add future corpora without full-table reindex when using **`mode: incremental`** + **`sourceIds`**. |

**Healthcheck alignment:** The API container’s `HEALTHCHECK` (or equivalent) SHOULD continue to use **`GET /health`** (or the same URL the stack already uses). With `Rag:Enabled` true, that request **must** fail if PostgreSQL is down, so Docker/Kubernetes marks the replica unhealthy without a separate DB-only probe.

**Ingestion endpoint:** **`POST /internal/v1/rag/reindex`** — JSON body, e.g. `{ "mode": "incremental", "sourceIds": ["cv"] }` or `{ "mode": "incremental" }` (all sources), or `{ "mode": "full" }`. Response: structured JSON (per-`sourceId` chunk counts, duration, errors). **Auth:** **`X-Rag-Ingestion-Key`**. **Concurrency:** **`SemaphoreSlim(1,1)`** — one ingestion run at a time → **409** if busy.

## Open Questions

_None — ingestion auth, env binding, and single-flight are locked above._
