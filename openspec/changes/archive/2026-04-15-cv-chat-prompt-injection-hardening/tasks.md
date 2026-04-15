## 1. Baseline analysis and test scaffolding

- [x] 1.1 Identify where chat responses are mapped into `ChatResponseDto` and where to inject output policy enforcement.
- [x] 1.2 Add a focused unit test suite file for prompt-injection defenses (input + RAG + output) in `backend/tests`.
- [x] 1.3 Add test fixtures for allowed section ids and allowed link targets (EN/ES anchors + PDF endpoints).

## 2. Output policy enforcement (server-side)

- [x] 2.1 Implement a Markdown link target extractor (handles `[label](target)` and ignores code blocks where feasible).
- [x] 2.2 Implement allowlist validation for link targets: `/{lang}#{section-id}` and `/api/v1/cv?lang=es|en` only.
- [x] 2.3 Add deterministic safe fallback response generator (language-aware; CV-scoped; no disallowed links).
- [x] 2.4 Wire output validation into the chat completion pipeline so disallowed links never reach clients.
- [x] 2.5 Add unit tests: external URL link → fallback; mailto → fallback; arbitrary path → fallback; allowed anchors → pass-through.

## 3. RAG prompt-injection hardening

- [x] 3.1 Update system prompt assembly to mark retrieved chunks as untrusted and explicitly non-instructional.
- [x] 3.2 Wrap retrieved chunks in a clearly delimited block (header + boundaries) to reduce instruction “bleed”.
- [x] 3.3 Add unit tests: retrieved chunk contains “ignore instructions” and external URL; ensure output enforcement still blocks disallowed links.

## 4. Input normalization hardening

- [x] 4.1 Add per-message max length safeguards for `ChatMessageDto.content` before forwarding to provider (configurable default).
- [x] 4.2 Add tests for oversized prompt-injection payloads to ensure truncation/normalization is applied and request remains valid.

## 5. Verification

- [x] 5.1 Run backend unit tests and ensure new injection defense tests pass.
- [x] 5.2 Manual verification script/notes: example injection prompts and expected safe behavior (no disallowed links; CV-scoped).
