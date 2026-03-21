# OpenAI chat backend layout

The chat completion path is split under `backend/src/CvIa.Infrastructure/OpenAi/`:

| Piece | Role |
|-------|------|
| `OpenAiChatCompletionService` | Orchestration: CV markdown → prompt → HTTP POST with retries (429) → `MapResponseOrThrow`. |
| `OpenAiChatConfigurationValidator` | Validates `OpenAiChatOptions` before the HTTP call (e.g. `sk-proj-` requires project id). |
| `OpenAiHttpRequestHeadersApplier` | Sets `Authorization`, `Accept`, `OpenAI-Project`, `OpenAI-Organization`. |
| `OpenAiChatHttpResponseProcessor` | Maps status codes + JSON to `ChatResponseDto` or `OpenAiChatException`. |
| `OpenAiErrorParser` | Static helpers: parse `error.message` / `error.code`, permission heuristics, log truncation. |
| `OpenAi/Models/*` + `OpenAiChatJsonOptions` | Request/response DTOs and JSON options (snake_case out, case-insensitive in). |

`OpenAiChatPromptBuilder` stays in `Services/` (prompt + message window only).

Other chat-related types in `Services/`:

| Piece | Role |
|-------|------|
| `CvMarkdownSectionIds` | Hardcoded ordered section ids (keep in sync with `shared/section-ids.json`; `npm run verify:section-ids`). |
| `CvMarkdownContentStartupLoader` | `IHostedService` — runs before the server accepts traffic; fills `CvMarkdownContentStore`. |
| `CvMarkdownContentStore` | Singleton holding markdown strings per locale; injected into `OpenAiChatCompletionService` for prompt building. |

Register new services in `DependencyInjection.AddInfrastructure`.

## CV markdown context

CV sections (`CvMarkdownSectionIds` + `content/{lang}/sections/*.md`) are read **once at host startup** by `CvMarkdownContentStartupLoader` (`IHostedService`) into `CvMarkdownContentStore` (singleton). `OpenAiChatCompletionService` calls `CvMarkdownContentStore.Get(lang)` (no disk I/O per chat request). **Operational note:** editing markdown on disk does not update running instances until the process restarts.

## Tests

`backend/tests/CvIa.Tests/Infrastructure/OpenAiChat/`:

- `OpenAiChatCompletionServiceTests.cs` — happy path, 429 retries, 403, 401 scope; in-memory `CvMarkdownContentStore` + Moq `HttpMessageHandler` (`SendAsync`), JSON samples in nested `SampleBodies`.
