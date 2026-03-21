## 1. OpenAI Configuration and Dependency Wiring

- [x] 1.1 Add typed chat provider settings (API key, model default `gpt-4o-mini`, timeout, defaults) and bind them from backend configuration.
- [x] 1.2 Update backend environment templates/documented variables for local and deployment runtime.
- [x] 1.3 Replace default chat service registration with OpenAI-backed implementation and keep optional stub fallback toggle for dev/test.

## 2. Chat Provider Implementation

- [x] 2.1 Implement `OpenAiChatCompletionService` using `IChatCompletionService` and map request/response to existing DTOs.
- [x] 2.2 Add prompt-building for MVP guardrails (CV-scoped behavior, locale-aware responses, safe fallback handling) in a **single reusable place** (same logic must be reusable for a future streaming path).
- [x] 2.3 Add runtime safeguards for generation parameters (`temperature`, `maxTokens`) and conversation window trimming.
- [x] 2.4 Keep API/controllers thin: no inline OpenAI HTTP or prompt logic in controllers; isolate provider-specific types to Infrastructure so a future streaming endpoint is mostly new transport + adapter (per `design.md` — Future streaming and forward compatibility).

## 3. Error Mapping and Observability

- [x] 3.1 Map provider failures (auth, timeout, rate limit, upstream errors) to normalized API error responses.
- [x] 3.2 Add structured logs for chat calls with correlation metadata and latency while excluding message/secret leakage.
- [x] 3.3 Ensure health endpoint and non-chat routes remain unaffected by chat provider misconfiguration.

## 4. Verification and Test Coverage

- [x] 4.1 Add unit tests for OpenAI service request mapping, response mapping, and guardrail behavior.
- [x] 4.2 Add integration tests for `POST /api/v1/chat/completions` happy path and provider-failure paths.
- [x] 4.3 Run verification commands: `dotnet test backend/tests/CvIa.Tests/CvIa.Tests.csproj` and `dotnet build backend/src/CvIa.Api/CvIa.Api.csproj`.

## 5. Documentation and Contract Alignment

- [x] 5.1 Update `docs/api/api-spec.yml` to reflect MVP runtime behavior and machine-readable error cases.
- [x] 5.2 Update `README.md` and local integration docs with required backend chat environment variables and run notes.
- [x] 5.3 Confirm `proposal.md`, `design.md`, `tasks.md`, and specs stay aligned on forward-compatibility for future streaming; validate OpenSpec artifacts consistency and ensure change is apply-ready.
