## Why

The CV chat currently relies on prompt-only guardrails, which are insufficient against prompt injection (including malicious content inside RAG chunks). We need server-enforced protections now to reduce the risk of out-of-scope answers, unsafe links, and accidental disclosure of internal details.

## What Changes

- Add backend-enforced defenses against prompt injection for `POST /api/v1/chat/completions`.
- Harden RAG context injection to treat retrieved text as untrusted data (not instructions).
- Enforce response constraints server-side (allowed links only; CV-scope fallback on violations).
- Add automated tests covering common injection patterns and RAG injection scenarios.
- Keep the existing API DTOs stable (`ChatResponseDto`) while improving safety and consistency.

## Capabilities

### New Capabilities
- `cv-chat-prompt-injection-defense`: Backend validation and enforcement to mitigate prompt injection for CV chat (input normalization, RAG hardening, and response policy checks).

### Modified Capabilities
- `backend-chat-openai-mvp`: Strengthen guardrails beyond prompt-only by adding server-side enforcement of allowed link targets and explicit handling of prompt-injection attempts.
- `backend-pgvector-rag`: Treat retrieved chunks as untrusted content; add requirements for quoting/delimiting and explicit non-instruction rules to reduce RAG prompt injection impact.

## Impact

- **Backend**: `CvIa.Api` and `CvIa.Infrastructure` chat pipeline (prompt builder, RAG context assembly, response mapping) and tests.
- **API**: No breaking changes intended; may return safer “policy” responses when output violates constraints.
- **Dependencies**: No new external services; may add small parsing/validation helpers and tests.

## Non-goals

- Implementing a full moderation platform or abuse detection system.
- Adding new chat UI features or streaming transport.
- Changing the CV content model or rewriting RAG ingestion.
