## Why

The chat today greets every visitor anonymously, which feels impersonal for recruiters/tech leads exploring the CV. Asking for a first name once and reusing it makes the conversation warmer and more memorable, without requiring any login or PII server-side.

## What Changes

- **Frontend only**. The chat widget asks for a first name the first time a visitor opens it, stores it in `localStorage` under a single key, and reuses it on future sessions.
- **First visit (no stored name)**: before any message is sent, the chat shows a friendly bilingual prompt asking how the visitor would like to be called, with a "prefer not to say" escape so the chat is still usable anonymously.
- **Returning visit (stored name, fresh chat)**: when the panel opens with an empty message list, the assistant seeds a greeting like *"Hi {name}, should I keep calling you {name}? What can I help you with today?"* (ES/EN depending on the active locale).
- **Rename detection**: when the user sends a message that matches a bilingual heuristic ("call me X", "my name is X", "mejor llamame X", "prefiero que me llames X", etc.), the frontend extracts the new name, replaces the value in `localStorage`, and appends a short confirmation. The original message is still sent to the backend.
- **Forget control**: the chat panel exposes a small "Forget my name" / "Olvidar mi nombre" action so the visitor can clear the stored name at any time.
- The backend chat API contract (`POST /api/v1/chat/completions`) is **not** modified in this change. The name is not sent to the LLM.

## Capabilities

### New Capabilities

- `chat-user-name-personalization`: client-side capture, storage, greeting, rename detection, and erasure of a visitor's first name in the chat widget, across locales.

### Modified Capabilities

- `cv-chat-widget-polish`: add requirements for the name gate, the fresh-chat greeting, and the forget-name control so the panel's UX contract covers the new flows.

## Impact

- **Affected code**: `frontend/src/components/chat/*` (`ChatWidget.tsx`, `ChatPanel.tsx`, `ChatMessageList.tsx`, new `useVisitorName` hook, new name-prompt and rename-detection helpers), plus bilingual UI strings.
- **Storage**: adds one `localStorage` key (e.g. `cv-ia:visitor-name`) with a small JSON value (name + optional "prefer not to say" flag). No cookies, no server state.
- **Privacy**: data stays in the browser; a user-visible control clears it. No change to the backend, OpenAI calls, logs, or observability.
- **Non-goals**: sending the name to the backend/LLM, cross-device persistence, account system, multi-user profiles, analytics on the captured name.
