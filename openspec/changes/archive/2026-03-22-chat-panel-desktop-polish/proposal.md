## Why

The floating chat works but feels visually small on desktop, competes with the page for attention without a focus treatment, and renders assistant replies as plain text so Markdown (bold, lists) and section references are hard to read. We want a clearer desktop layout, focus on the conversation, rich text rendering, and safe deep links into CV sections—driven by backend instructions so links stay consistent with real section IDs.

## What Changes

- **Frontend**: Larger panel on medium-and-up viewports (target **600×700px** on desktop); **backdrop blur + dim** while open; remove overlay when the panel closes (X, outside click, Escape).
- **Frontend**: Render assistant messages with **Markdown** (bold, italic, lists, inline code, block structure); **sanitize and restrict** links to same-origin locale home + allowed fragment IDs from `shared/section-ids.json`; **close the chat** when the user follows an in-app section link.
- **Backend**: Extend the **system prompt** in `OpenAiChatPromptBuilder` so the model answers in **Markdown**, uses **only** fragment links to known CV section IDs when pointing to the page, and adopts a **warmer, conversational** tone while staying accurate and recruiter-appropriate.
- **Tests**: Update or add backend tests for prompt content; frontend tests or manual verification checklist as in `tasks.md`.

### Already completed

- **Backend config**: Default **`OpenAiChat:Temperature`** is set to **0.5** in `backend/src/CvIa.Api/appsettings.json`, with matching default on **`OpenAiChatOptions`** and the commented example in **`backend/src/CvIa.Api/.env.example`** (decision: bump in appsettings, not env-only).

## Capabilities

### New Capabilities

- `cv-chat-widget-polish`: Desktop/tablet/mobile layout rules for the chat shell; backdrop; Markdown rendering for assistant bubbles; safe section navigation and chat-dismiss behavior.

### Modified Capabilities

- `backend-chat-openai-mvp`: Extend normative requirements so chat guardrails explicitly include Markdown output rules, allowed section-link patterns, and conversational tone—without changing the HTTP API contract.

## Impact

- **Frontend**: `frontend/src/components/chat/*`, new dependency(ies) for Markdown (e.g. `react-markdown`, `remark-gfm`, sanitization stack as in `design.md`).
- **Backend**: **`OpenAiChatPromptBuilder`** (prompt: Markdown, section links, tone); unit tests under `backend/tests`. Temperature default is **already** applied (see **Already completed** above).
- **API**: No breaking changes to `POST /api/v1/chat/completions` request/response shapes.

## Non-goals

- Streaming/SSE responses, new chat endpoints, or persisted chat history.
- RAG/embeddings or changes to how CV markdown is loaded.
- Allowing arbitrary external URLs from model output (explicitly out of scope; links must be restricted).
