## Why

The chat API currently loads all CV Markdown into memory at startup and injects it into the OpenAI system prompt. As content grows, this increases token cost, latency, and noise. The repo already defines a `ContentChunk` model and runs PostgreSQL with **pgvector** in Docker, but the backend does not use retrieval yet. Implementing **RAG** (chunk → embed → store → similarity search per question) aligns implementation with the documented architecture and keeps answers grounded in CV text with retrievable citations.

## What Changes

- **Backend**: Add PostgreSQL/pgvector persistence for chunk embeddings with **`source_id`** + **`document_key`** so **multiple corpora** coexist (CV first; future docs without re-embedding everything). OpenAI **embeddings** API (**default `text-embedding-3-small`**, **1536** dims). **Configurable sources** (`Rag:Sources`): v1 includes **`cv`** from `content/{en,es}/sections` + `CvMarkdownSectionIds` / `shared/section-ids.json`; additional sources added via config and content roots.
- **Backend**: Change chat completion flow to **retrieve top-K chunks** by language (and optionally hybrid filters), assemble a bounded context window for `OpenAiChatPromptBuilder`, and keep existing guardrails (CV-only, Markdown, section link rules). **BREAKING** for operators only: new **required** connection/configuration for PostgreSQL in environments where chat runs with RAG (local Docker already exposes `pgvector`; prod must wire the same).
- **Infra / docs**: Document connection string, defaults (embedding model, dimensions, `TopK` default **8**, `MaxRetrievedContextTokens` default **4000**), and how to run **initial index + on-demand reindex** when `content/` changes.
- **Backend (operations API)**: **`POST /internal/v1/rag/reindex`** — body includes **`mode`**: **`incremental`** (refresh one or more **`sourceIds`**, or all configured sources if omitted) vs **`full`** (global rebuild for recovery / model changes). **Incremental** deletes and re-embeds **only** the targeted sources’ rows — **simulates enterprise** partial updates without full reindex. **Auth:** **`X-Rag-Ingestion-Key`** / **`Rag:IngestionApiKey`**. **Concurrency:** **`SemaphoreSlim(1,1)`** → **409** if busy. **Not** exposed via public nginx / Next **`/api`**. Document in `docs/local-integration.md`.
- **Verification**: Automated tests for retrieval, **integration tests for the ingestion endpoint**, and smoke commands documented (`npm run` / `dotnet test`).

## Capabilities

### New Capabilities

- `backend-pgvector-rag`: PostgreSQL + pgvector, **multi-source** chunk model, **incremental + full** ingestion via internal HTTP endpoint, similarity search over **all** sources for a given `lang`, docs (health, proxy exclusion, auth, `Rag:Sources`).

### Modified Capabilities

- `backend-chat-openai-mvp`: Grounding requirement updates from “full CV markdown in system prompt” to “retrieved CV chunks plus explicit fallback when retrieval is empty or DB unavailable,” without changing the public `POST /api/v1/chat/completions` JSON contract.

## Impact

- **Affected**: `backend` (Infrastructure, Application, API), `infra` (compose/env examples; **no** new `location` on public proxy for ingestion), `docs/architecture/data-model.md`, `docs/local-integration.md`, internal API documentation (e.g. `docs/api/` fragment or dedicated doc for `POST /internal/v1/rag/reindex`).
- **Dependencies**: Npgsql + pgvector-capable PostgreSQL; OpenAI API for embeddings + existing chat model.
- **Unaffected**: Frontend CV pages and ATS rendering; chat **route** and **request/response** shapes remain the same unless explicitly extended (e.g. richer citations already in contract).

## Non-goals

- Frontend UI changes beyond consuming existing `ChatResponse` citations (no new widgets required for MVP).
- Replacing the chat completion model or adding streaming.
- Multi-user RAG, analytics dashboards, or automatic crawling of external sites.
- Migrating CV **rendering** or PDF generation to the database.
- Publishing **`POST /internal/v1/rag/reindex`** through the **public nginx** front door (8055) or documenting it as callable via the same path pattern as **`/api/v1/chat/completions`** through the Next.js proxy — operators use **direct API access** instead.
- **Per-file content-hash skip** inside a source (avoid re-embedding unchanged files) in v1 — optional v2; v1 incremental still re-embeds **all files** for the targeted **`sourceIds`**.
