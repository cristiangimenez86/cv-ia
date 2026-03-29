## Context

The **`add-pgvector-rag-chat`** change implemented RAG persistence, ingestion, and chat grounding; capability deltas live under that change folder until archived into `openspec/specs/`. This follow-up change **only** extends those requirements (and `backend-chat-openai-mvp` in the main tree) so that security, wiring clarity, throughput, and observability expectations are **testable** before a separate implementation PR.

## Goals / Non-Goals

**Goals:**

- Capture **normative** requirements for: constant-time ingestion secret handling, documented HTTP/CORS posture for public vs internal routes, bounded concurrency for embedding calls during ingestion, explicit constructor-time dependencies for chat+RAG orchestration (no ad-hoc service locator), and request-scoped correlation for logs across chat and RAG paths.

- Keep all deltas **additive** (`## ADDED Requirements`) to avoid archive merge mistakes until `backend-pgvector-rag` is promoted to `openspec/specs/`.

**Non-Goals:**

- Selecting specific libraries (e.g. Polly vs built-in rate limiter) or nginx snippets—those belong to implementation changes.

- Defining SLIs/SLOs with numeric targets (latency percentiles)—optional later.

## Decisions

1. **Spec-first, code second** — This change merges only Markdown deltas; implementation is a separate change once `openspec validate` passes.

2. **Constant-time comparison** — Spec SHALL require a timing-safe comparison for the ingestion shared secret (e.g. `CryptographicOperations.FixedTimeEquals` over UTF-8 bytes) when both expected and provided values are non-empty; reject before comparison if lengths differ, without leaking which side failed.

3. **Parallelism** — Spec SHALL require an upper bound on concurrent OpenAI embedding calls per ingestion run (configurable or fixed constant documented in design of the implementation change), not unbounded `Task.WhenAll`.

4. **DI clarity** — Spec SHALL require optional RAG embedding clients to be resolved via **constructor injection** of an abstraction or a registered no-op, not `GetService` from a raw `IServiceProvider` in the chat completion service.

5. **Correlation** — Spec SHALL require that chat and RAG-related log scopes include a **correlation id** aligned with `HttpContext.TraceIdentifier` or an explicit `Activity` id when available.

## Risks / Trade-offs

- **Risk**: Over-specifying deployment (nginx) in OpenSpec → **Mitigation**: Keep requirements at “public site MUST NOT expose internal ingestion route” level; details stay in `docs/` and infra repo.

- **Risk**: Duplicate capability definitions if `backend-pgvector-rag` is archived twice → **Mitigation**: Archive `add-pgvector-rag-chat` before merging this change to main specs, or fold this delta into the same archive batch.

## Migration Plan

1. Land this change (specs only).
2. Run `openspec validate spec-backend-rag-chat-followups`.
3. After review, either archive with `add-pgvector-rag-chat` or sequentially so `openspec/specs/` gains `backend-pgvector-rag` + merged deltas.

## Open Questions

- Whether **rate limiting** for `POST /api/v1/chat/completions` belongs in `backend-chat-openai-mvp` or `service-integration-baseline` (deferred until product priority is set).
