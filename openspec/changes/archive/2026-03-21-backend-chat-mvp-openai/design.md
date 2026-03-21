## Context

The current backend chat path is contract-wired but stubbed (`StubChatCompletionService`), so frontend chat does not deliver real candidate information. The API contract and DTOs are already stable, and this phase must preserve that public contract while replacing internals with a provider-backed implementation. Constraints: backend-only secret management, bilingual behavior (`en|es`), no streaming in this iteration, and no RAG/pgvector work in this iteration. Streaming over HTTP (e.g. SSE) is a **planned follow-up**; this MVP should be shaped so that migration is mostly additive.

## Goals / Non-Goals

**Goals:**

- Replace stub chat completion logic with a real OpenAI integration in backend infrastructure.
- Keep `POST /api/v1/chat/completions` request/response shape unchanged.
- Add robust provider error handling and operational logging.
- Make configuration explicit and environment-driven for local and deployment parity.

**Non-Goals:**

- No SSE/streaming transport **in this phase** (streaming will be implemented later; see [Future streaming and forward compatibility](#future-streaming-and-forward-compatibility)).
- No retrieval pipeline, embeddings, or vector search.
- No persistence of sessions/messages.
- No frontend redesign beyond existing contract consumption.

## Decisions

1. **Provider adapter behind existing application interface**
  Implement `OpenAiChatCompletionService : IChatCompletionService` and keep controller + DTO contracts unchanged.  
   **Why:** Minimizes API churn and limits change surface.  
   **Alternative considered:** Introducing a new API endpoint/version; rejected because current contract is already consumed by frontend.
2. **Typed options for OpenAI configuration**
  Add strongly-typed settings (API key, model, timeout, default max tokens/temperature, optional base URL) bound from ASP.NET Core configuration.  
   **Why:** Improves deployment safety and testability.  
   **Alternative considered:** Reading raw env vars directly inside service; rejected due to weak validation and poor maintainability.
3. **Prompt guardrails for CV-scoped answers**
  Use a fixed system prompt enforcing CV-only scope, truthfulness, and locale alignment.  
   **Why:** Delivers immediate safety/value without full RAG complexity.  
   **Alternative considered:** No guardrails in MVP; rejected due to risk of hallucinations and off-topic responses.
4. **Preserve optional citations field in MVP**
   Return empty or minimal citations where no retrieval source mapping exists yet.  
   **Why:** Keeps forward compatibility with future RAG phase while honoring current response schema.
5. **Default OpenAI model for production chat**
   Use **`gpt-4o-mini`** as the default model name in configuration (overridable per environment).  
   **Why:** Strong cost/quality balance for short bilingual Q&A; aligns with public API pricing tier for small workloads.  
   **Alternative considered:** Smaller `nano` variants for minimum cost; deferred until quality is validated for ES/EN CV prompts.
6. **Provider HTTP timeout: appsettings only**
   Define the OpenAI client timeout **only** in `appsettings.json` and environment-specific files such as `appsettings.Production.json`. Do **not** document or require a dedicated environment variable for timeout; operators change values by editing the appsettings file shipped or mounted for that deployment.  
   **Why:** Single place for non-secret tuning; keeps timeout policy versioned with the app configuration.  
   **Alternative considered:** Timeout only via environment variables in production; rejected.
7. **CV markdown for chat: load at startup, keep in memory**
   Read `CvSectionIds.json` and locale `content/{lang}/sections/*.md` **once** when the host starts (`IHostedService`), store concatenated markdown per locale in a singleton (`CvMarkdownContentStore`), and inject that store into `OpenAiChatCompletionService`. Do **not** re-read those files on every chat request.  
   **Why:** CV source files are static in normal operation; avoids redundant disk I/O and latency on every completion.  
   **Trade-off:** Content changes require an API **restart** (or redeploy) to take effect in chat.

## Future streaming and forward compatibility

A future change will add **streaming** (typically SSE or chunked responses) so the assistant text can arrive incrementally. This non-streaming MVP should be built so that switch has **minimal blast radius**:

- **Isolate provider calls** in Infrastructure behind a small, testable surface (e.g. completion service + internal helpers for building system/user messages and calling the OpenAI API). Avoid spreading raw HTTP client or provider-specific types across the API layer.
- **Keep prompt construction and message normalization in one place** so the same logic can feed either a buffered completion (today) or a streaming completion (later) without duplicating guardrails.
- **Preserve the current public contract** for `POST /api/v1/chat/completions` as the non-streaming response; streaming can be added as a **separate route or opt-in** (e.g. `POST .../stream` or `Accept: text/event-stream`) so existing clients keep working unchanged.
- **Do not couple** the controller to “must return a single JSON body built inline”; delegate to application/infrastructure services so adding a streaming action later is mostly new transport code, not a rewrite of business rules.
- **Logging and error mapping** should remain structured and provider-agnostic so streaming endpoints can reuse the same classification (timeouts, auth, rate limits) with incremental delivery semantics.

With these constraints, the later streaming work is expected to be **additive** (new endpoint + stream adapter + frontend consumer) rather than a redesign of the completion pipeline.

## Risks / Trade-offs

- **[Provider outage/rate limits]** -> Mitigation: map errors to normalized API responses; keep logs with correlation id and status class.
- **[Hallucinated answers without retrieval]** -> Mitigation: strict system prompt + explicit fallback wording when confidence is low.
- **[Cost/latency variability]** -> Mitigation: clamp `maxTokens`, use conservative defaults, and trim conversation window.
- **[Config drift between environments]** -> Mitigation: document appsettings profiles and secrets (e.g. API key) and validate startup options.

## Migration Plan

1. Add OpenAI settings and env examples.
2. Implement OpenAI-backed service in Infrastructure.
3. Switch DI registration from stub default to provider-backed service (keep optional stub flag for dev/test fallback).
4. Extend tests for happy path and provider-failure mapping.
5. Update API/runtime docs and run backend verification pipeline.

Rollback: restore DI to stub service and redeploy; public endpoint contract remains unchanged.

## Resolved decisions

- Default chat model for OpenAI API usage: **`gpt-4o-mini`** (see Decisions).
- Provider HTTP timeout: **`appsettings` only** (see Decision 6).

