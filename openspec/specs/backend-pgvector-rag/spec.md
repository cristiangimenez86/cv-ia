# backend-pgvector-rag Specification

## Purpose
TBD - created by archiving change add-pgvector-rag-chat. Update Purpose after archive.
## Requirements
### Requirement: PostgreSQL MUST store chunks with source identity and pgvector embeddings

Each chunk row SHALL include **`source_id`** (stable string, e.g. `cv`, `travel-oceania`), **`document_key`** (stable within the source, e.g. section id or relative file path), optional **`section_id`** when the source maps to CV-like sections (nullable for free-form documents), `lang` (`en` | `es` where applicable), **`chunk_index`**, `text`, **`embedding vector(1536)`**, and `updated_at`. Chunks from different **`source_id`** values SHALL coexist in the same table.

#### Scenario: Chunks are scoped by source and language

- **WHEN** ingestion has completed
- **THEN** rows can be filtered by **`source_id`** and `lang` and ordered by `document_key` and `chunk_index`

#### Scenario: CV source uses existing section files

- **WHEN** `source_id` is the configured CV source (e.g. `cv`)
- **THEN** chunk text SHALL be derived from `content/{en|es}/sections/{sectionId}.md` using stable ids aligned with `shared/section-ids.json`

### Requirement: Embedding model and vector dimension MUST be configuration-defined

The system SHALL read embedding model identifier and expected vector size from backend configuration so that the database column dimension and OpenAI embedding API usage stay consistent across environments.

#### Scenario: Configuration mismatch is rejected

- **WHEN** configured embedding output dimension does not match the database vector column dimension
- **THEN** ingestion or application startup SHALL fail with a clear error (and SHALL NOT silently truncate vectors)

#### Scenario: Repository defaults use text-embedding-3-small at 1536 dimensions

- **WHEN** deployment uses the repository’s default `appsettings` values for embedding model and dimension (no override)
- **THEN** the embedding model SHALL be `text-embedding-3-small` and the vector dimension SHALL be `1536`

### Requirement: Health endpoint MUST actively verify PostgreSQL when RAG is enabled

When `Rag:Enabled` is true, `GET /health` SHALL **actively verify** PostgreSQL connectivity (for example by opening a connection or executing a trivial query against the configured connection string). If that check fails, the endpoint SHALL return a non-success HTTP status (for example **503**). When `Rag:Enabled` is false, `GET /health` SHALL NOT perform or depend on PostgreSQL connectivity.

#### Scenario: RAG disabled without Postgres

- **WHEN** `Rag:Enabled` is false
- **THEN** `GET /health` SHALL succeed even if PostgreSQL is not running

#### Scenario: RAG enabled with Postgres down

- **WHEN** `Rag:Enabled` is true and PostgreSQL is unreachable
- **THEN** `GET /health` SHALL indicate the service is not ready (for example HTTP 503)

#### Scenario: Container healthcheck uses the same health endpoint

- **WHEN** the API container defines a `HEALTHCHECK` (or equivalent) that invokes `GET /health`
- **AND** `Rag:Enabled` is true and PostgreSQL is healthy
- **THEN** the healthcheck SHALL succeed
- **AND** when PostgreSQL is unreachable, the healthcheck SHALL fail (non-zero exit or failed probe) as a result of the same `GET /health` behavior

### Requirement: Similarity search MUST scope by chat locale across all indexed sources

The retrieval API used by chat SHALL restrict candidate chunks to the request’s `lang` matching the chat `lang` field. Search SHALL consider chunks from **every** ingested **`source_id`** for that language unless a future, explicitly scoped filter is added.

#### Scenario: English chat does not retrieve Spanish chunks

- **WHEN** a chat completion request uses `lang` = `en`
- **THEN** vector search SHALL only return rows with `lang` = `en`

#### Scenario: Multiple sources contribute to retrieval

- **WHEN** chunks exist for `lang` = `en` under **`source_id`** `cv` and under another source
- **THEN** top-K similarity MAY return chunks from either source ordered by relevance

### Requirement: OpenAI API keys for embeddings MUST remain backend-only

Embedding generation SHALL use the same backend-only secret policy as chat: no embedding calls from the frontend; credentials only via backend configuration or deployment secrets.

#### Scenario: Frontend cannot trigger embedding

- **WHEN** a client uses only the public website
- **THEN** no embedding API keys are exposed to the browser

### Requirement: Configured sources MUST define ingestion roots

The backend SHALL read **`Rag:Sources`** from configuration: a list of sources, each with a unique **`id`** and rules to resolve content files (at minimum the **`cv`** source for current CV Markdown). Adding a new source SHALL be possible by configuration and content layout **without** requiring a full reindex of existing sources when using **incremental** mode for the new source only.

#### Scenario: CV source is always available in v1

- **WHEN** RAG ingestion is enabled
- **THEN** configuration SHALL include a source whose **`id`** identifies the CV corpus mapped to `content/{en|es}/sections`

### Requirement: Internal HTTP endpoint SHALL support incremental and full reindex

The backend SHALL expose **`POST /internal/v1/rag/reindex`** with a JSON body including **`mode`**: **`incremental`** or **`full`**.

- **`incremental`:** For each `sourceId` listed in **`sourceIds`**, or for **every** configured source if **`sourceIds`** is omitted, the system SHALL **delete** existing rows with that **`source_id`**, then chunk, embed, and insert fresh rows for that source only. Other sources’ rows SHALL remain unchanged.
- **`full`:** The system SHALL rebuild **all** configured sources after clearing all chunk rows (or equivalent full reset), for recovery or global embedding model changes.

The response SHALL include a machine-readable outcome (for example per-`sourceId` counts, duration, errors).

#### Scenario: Incremental reindex updates only the CV source

- **WHEN** an operator sends `{ "mode": "incremental", "sourceIds": ["cv"] }` after editing CV Markdown
- **THEN** rows with **`source_id`** other than `cv` SHALL be unchanged
- **AND** `cv` rows SHALL match the new content

#### Scenario: Add a new source without touching CV

- **WHEN** a new source is configured and ingested with `{ "mode": "incremental", "sourceIds": ["travel-oceania"] }`
- **THEN** only that source’s rows are written or replaced
- **AND** existing `cv` chunks SHALL remain unless `cv` is explicitly included in **`sourceIds`**

#### Scenario: Full rebuild for recovery

- **WHEN** an operator sends `{ "mode": "full" }`
- **THEN** the index SHALL be consistent with a complete rebuild of all configured sources

#### Scenario: Initial index on new environment

- **WHEN** the chunk table is empty
- **THEN** either **`incremental`** (per source) or **`full`** SHALL populate the table sufficiently for retrieval-backed chat

#### Scenario: Not exposed through public reverse-proxy path to chat API

- **WHEN** traffic uses the documented public browser entrypoint (reverse proxy and Next.js) for normal site usage
- **THEN** `POST /internal/v1/rag/reindex` SHALL NOT be documented as reachable via the same mechanism as `POST /api/v1/chat/completions` through the frontend proxy

### Requirement: Internal ingestion endpoint MUST validate shared secret from configuration

The shared secret SHALL be read from configuration key **`Rag:IngestionApiKey`**, typically supplied by the environment variable **`Rag__IngestionApiKey`** (e.g. Portainer stack variables). Clients SHALL send the secret in the **`X-Rag-Ingestion-Key`** HTTP header on **`POST /internal/v1/rag/reindex`**.

#### Scenario: Valid secret allows reindex

- **WHEN** `Rag:IngestionApiKey` is non-empty and the request includes **`X-Rag-Ingestion-Key`** equal to that value
- **THEN** the request MAY proceed to ingestion (subject to single-flight rules)

#### Scenario: Missing or wrong secret when key is configured

- **WHEN** `Rag:IngestionApiKey` is non-empty and the header is missing or incorrect
- **THEN** the endpoint SHALL return **401** (or **403**) and SHALL NOT modify stored chunks

#### Scenario: Ingestion key not configured

- **WHEN** `Rag:IngestionApiKey` is empty or whitespace-only
- **THEN** `POST /internal/v1/rag/reindex` SHALL return **503** (or equivalent) with a clear error and SHALL NOT run ingestion

### Requirement: Reindex MUST be single-flight

Concurrent **`POST /internal/v1/rag/reindex`** calls SHALL NOT run overlapping ingestion runs (incremental or full). The implementation SHALL use a process-wide mutual exclusion mechanism (for example **`SemaphoreSlim(1, 1)`** owned by a singleton service). A second request while a run is in progress SHALL receive **409 Conflict** with a machine-readable indication that ingestion is already active.

#### Scenario: Second request during active ingestion

- **WHEN** an ingestion run is already executing
- **AND** another `POST /internal/v1/rag/reindex` arrives
- **THEN** the second request SHALL fail with **409** without starting a parallel run

### Requirement: Ingestion orchestration SHALL use layered, testable services

Chunking, embedding calls, and persistence SHALL live in **application and infrastructure services** (not inlined in the endpoint handler). Automated **unit** and **integration** tests SHALL cover the ingestion pipeline and the internal endpoint’s success and failure responses.

#### Scenario: Thin API surface

- **WHEN** `POST /internal/v1/rag/reindex` is implemented
- **THEN** the HTTP adapter SHALL delegate to an application-level orchestrator
- **AND** the solution SHALL avoid “temporary” or throwaway code paths as the sole implementation

#### Scenario: Documentation lists direct API access

- **WHEN** an operator reads `docs/local-integration.md` (or equivalent)
- **THEN** the documentation SHALL describe **`POST /internal/v1/rag/reindex`** using the **API’s direct base URL** (for example host port **8056** in local Docker, or `http://api:8080` from another container), not the public proxy port alone
- **AND** it SHALL document **`mode`**, **`sourceIds`**, and examples of **incremental** (single source) vs **full** rebuild
- **AND** it SHALL distinguish this from calling **`POST /api/v1/chat/completions`** through the Next.js `/api` proxy

### Requirement: Ingestion shared secret MUST be compared in constant time

When validating `X-Rag-Ingestion-Key` against the configured ingestion secret, the backend SHALL compare secrets using a **constant-time** algorithm over the raw key material (for example fixed-time equality over UTF-8 bytes). The implementation SHALL NOT use short-circuit string equality that leaks timing information about the expected prefix.

#### Scenario: Equal keys authorize

- **WHEN** the header value and configured secret are identical byte sequences
- **THEN** the request SHALL be authorized for ingestion

#### Scenario: Unequal keys reject without timing leaks

- **WHEN** the header value differs from the configured secret
- **THEN** the request SHALL be rejected
- **AND** comparison SHALL not branch on the first differing character position in a way that replaces constant-time guarantees (normative: use cryptographic fixed-time compare APIs provided by the runtime)

### Requirement: Internal ingestion route MUST remain off the public site front door

Production deployment documentation SHALL state that `POST /internal/v1/rag/reindex` is reachable only via **direct API** or **private network** access (for example Docker network, admin VPN, or management port), and SHALL NOT be exposed through the same public reverse-proxy path as the marketing site or Next.js `/api` proxy unless explicitly justified and secured.

#### Scenario: Operator uses non-public access

- **WHEN** an operator runs ingestion in production
- **THEN** documentation SHALL describe how to reach the backend internal route without exposing it on the public internet hostname used for the CV site

### Requirement: Ingestion MUST bound concurrent OpenAI embedding calls

During a single reindex execution, the backend SHALL NOT issue an unbounded number of concurrent OpenAI embedding requests. The implementation SHALL apply an explicit **maximum degree of parallelism** (fixed constant or configuration) so that large sources do not exhaust connection pools or hit provider rate limits unpredictably.

#### Scenario: Large source still completes

- **WHEN** ingestion produces many chunks in one source
- **THEN** embedding calls SHALL be limited by the configured or built-in parallelism cap
- **AND** ingestion SHALL still complete successfully absent provider errors

