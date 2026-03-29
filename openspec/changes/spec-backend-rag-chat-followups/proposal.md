## Why

The **`add-pgvector-rag-chat`** change established RAG + internal ingestion in code; the corresponding OpenSpec deltas (`backend-pgvector-rag`, `backend-chat-openai-mvp`) should now be **extended** with explicit requirements for **operational hardening** (security boundaries, dependency clarity, performance expectations, observability) so future implementation work stays spec-driven and reviewable. This proposal **does not implement code**—it only updates the **spec artifacts** for the current backend RAG/chat surface.

## What Changes

- **OpenSpec only**: Add requirement deltas under this change for existing capabilities; align wording with the architect review (CORS/rate limiting posture, constant-time secret comparison for internal ingestion, removal of service-locator patterns in chat wiring, ingestion throughput expectations, structured correlation/logging expectations).
- **Backend (future, out of scope here)**: No application code in this change—tasks will reference verification after a later implementation change.

## Capabilities

### New Capabilities

- (none for this iteration—focus is extending existing specs)

### Modified Capabilities

- **`backend-pgvector-rag`**: Add requirements for **secure comparison** of `X-Rag-Ingestion-Key`, **documented** CORS/proxy posture for public vs internal routes, and **ingestion performance** expectations (e.g. bounded parallelism for embeddings) without changing the public chat JSON contract.
- **`backend-chat-openai-mvp`**: Add requirements for **explicit dependency injection** of optional RAG/embedding collaborators (no `IServiceProvider.GetService` as the primary wiring), and **observability** (correlation id / trace continuity across chat + RAG paths).

## Impact

- **Affected**: `openspec/changes/spec-backend-rag-chat-followups/specs/**`, later `openspec/specs/**` when archived; **docs** only if spec references existing `docs/api` fragments.
- **Unaffected**: Frontend contracts; `POST /api/v1/chat/completions` request/response shapes.

## Non-goals

- Implementing rate limiting, CORS changes, or code refactors (separate change after specs land).
- Changing embedding model defaults, `TopK`, or DB schema.
- New public API routes or OpenAPI breaking changes.
- Frontend or nginx edits in this change.
