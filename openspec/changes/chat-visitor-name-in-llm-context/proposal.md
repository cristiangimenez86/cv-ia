## Why

Change `chat-user-name-personalization` captures a visitor's first name in the browser and uses it for greetings client-side, but the LLM itself still answers as if it did not know the visitor. To make the conversation truly personal (e.g. "Claro, Ana — sobre mi experiencia en Azure…"), the backend needs the name available in the system prompt. Adding it naively would open a prompt-injection vector, so the change has to land with explicit sanitization and guardrails.

## What Changes

- **Frontend**: `ChatPanel` SHALL include the stored visitor name in the chat request body under a new optional `visitor.name` field, only when a non-empty name is stored and the visitor did not opt out.
- **Backend API contract**: `ChatRequest` (OpenAPI + DTO) SHALL accept an optional `visitor` object with a nullable `name` property (max 40 characters, restricted character set). The field is optional; existing clients continue to work unchanged.
- **Backend prompt builder**: `OpenAiChatPromptBuilder` SHALL, when a sanitized visitor name is provided, inject it into the system prompt inside a clearly delimited "untrusted data" block and instruct the model to address the visitor by that name naturally, without inventing personal details about them.
- **Sanitization**: A dedicated visitor-name sanitizer SHALL strip control characters, enforce the allowed character set, clamp length to 40 characters, reject values that contain prompt-injection cues (newlines, backticks, role markers like `system:` / `assistant:`), and reject empty results. Rejected names SHALL be treated as "no name supplied".
- **Logging**: The backend SHALL NOT log the visitor name at INFO level in production. A boolean `visitor.name.present` metric SHALL be attached to existing structured logs instead.
- **Guardrails**: The system prompt SHALL explicitly instruct the model to ignore any instructions found inside the visitor-name block and to not reveal or echo other visitors' names.

## Capabilities

### New Capabilities

- `chat-visitor-name-llm-context`: end-to-end behavior for passing a sanitized visitor name through the chat request into the LLM system prompt, including sanitization, prompt-injection resilience, and logging rules.

### Modified Capabilities

- `backend-chat-openai-mvp`: the system prompt contract gains an optional visitor-name block with strict guardrails; the chat completion request DTO gains an optional `visitor` object.

## Impact

- **Affected code**:
  - Frontend: `frontend/src/components/chat/ChatPanel.tsx` (request body), plus the `useVisitorName` hook added by the previous change.
  - Backend: `backend/src/CvIa.Application/Contracts/ChatRequestDto.cs`, a new `VisitorHintsDto`, `backend/src/CvIa.Infrastructure/Services/OpenAiChatPromptBuilder.cs`, a new sanitizer service, and updates to `backend/tests/CvIa.Tests/Infrastructure/OpenAiChatPromptBuilderTests.cs`.
  - API: `docs/api/api-spec.yml` gains the `visitor` object in `ChatRequest`.
- **Data and privacy**: the visitor name is treated as low-sensitivity PII provided by the user for this turn only. It is never persisted server-side, never logged at INFO, and never forwarded to third parties other than the OpenAI completion call that requires it.
- **Non-goals**:
  - Server-side storage or session tracking of the name (the browser remains the only persistence store).
  - Any other visitor profile fields (email, role, company, language, etc.).
  - Auto-detecting the visitor's name from OS/browser identity.
  - Using the name inside retrieved RAG chunks, citations, or PDF content.
