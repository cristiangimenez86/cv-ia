## Why

The backend chat endpoint currently returns a scaffold stub and does not provide real AI answers. We need a production-usable MVP now so frontend chat can deliver recruiter-facing value while keeping backend ownership of AI secrets and behavior.

## What Changes

- Backend: replace the stub `IChatCompletionService` implementation with a real OpenAI-backed completion service.
- Backend: add typed OpenAI configuration (API key, model, timeout, default generation params) and environment wiring for local/dev/prod. **Default model: `gpt-4o-mini`** (documented; override per environment).
- Backend: keep `POST /api/v1/chat/completions` request/response contract unchanged and map provider responses to existing DTOs.
- Backend: add basic guardrails via system prompt (CV-focused scope, no fabricated facts, locale-aware response).
- Backend: improve provider error mapping/logging so failures return normalized API errors.
- Backend: structure completion logic so a future **streaming** endpoint (e.g. SSE) can be added with minimal churn—provider calls and prompt assembly isolated from HTTP transport; controller stays thin.
- Backend tests: add unit/integration coverage for happy path and provider-failure scenarios.
- Docs: update API and runtime configuration docs for the new backend chat behavior.

## Capabilities

### New Capabilities
- `backend-chat-openai-mvp`: Real backend chat completions using OpenAI **without streaming or RAG in this phase**; implementation MUST remain easy to extend later with streaming (see `design.md` — Future streaming and forward compatibility).

### Modified Capabilities
- `service-integration-baseline`: Update chat integration requirements from scaffold stub behavior to provider-backed runtime behavior and configuration.

## Non-goals

- No streaming/SSE responses **in this phase** (streaming is planned later; the MVP is built so migration is mostly additive—see `design.md`).
- No retrieval pipeline, embeddings, or pgvector integration in this phase.
- No chat history persistence/session storage in this phase.
- No frontend UX redesign in this phase.

## Impact

- Affected service: backend (`CvIa.Api`, `CvIa.Infrastructure`, backend tests).
- API surface remains the same (`/api/v1/chat/completions`) for non-streaming responses; runtime behavior becomes provider-backed. Future streaming can ship as a separate route or opt-in without breaking this contract.
- New operational dependency: OpenAI credentials and model configuration in backend environment.
- Documentation updates required in `docs/api/api-spec.yml` and root runtime docs.
