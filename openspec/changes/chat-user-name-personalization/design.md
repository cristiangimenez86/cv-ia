## Context

The chat widget (`frontend/src/components/chat/*`) is a Next.js App Router client component. State is in-memory (`useState` for `messages`), the locale comes from the URL (`/en` or `/es`), and the panel talks to the backend via `POST /api/v1/chat/completions`. There is no auth, no cookies, no user profile.

The user wants the chat to feel personal: ask for a first name once, remember it between visits, greet the returning visitor by name on every new chat, and accept a rename on the fly. No login, no server-side storage, no new API contract.

Relevant existing files:
- `frontend/src/components/chat/ChatWidget.tsx`: holds `messages` state and the open/close FAB.
- `frontend/src/components/chat/ChatPanel.tsx`: header, message list, input, backend call.
- `frontend/src/components/chat/ChatMessageList.tsx`: renders messages and suggestion chips.
- `cv-chat-widget-polish` spec defines the panel's existing UX contract (size, backdrop, markdown, link safety).

## Goals / Non-Goals

**Goals:**
- Capture a visitor's first name once, bilingually, with an explicit "prefer not to say" path.
- Persist the name in `localStorage` only; zero server involvement.
- On every newly opened chat that has no messages yet, greet the returning visitor by name in the active locale and invite them to keep or change the name.
- Detect common rename phrases in user input ("call me X", "mejor llamame X", etc.) and update the stored name with a confirmation bubble.
- Offer a visible "Forget my name" control inside the panel.
- Respect current privacy posture: no PII leaves the browser, the LLM never receives the name.

**Non-Goals:**
- Sending the name to the backend or LLM.
- Cross-device or cross-browser persistence (no accounts, no cookies).
- Using the name for analytics, citations, or any backend personalization.
- Validating/sanitizing the name beyond basic trimming and length clamping.
- Detecting the visitor's name from OS/browser identity (not feasible from a browser sandbox).

## Decisions

### 1. Storage: a single `localStorage` key with a small JSON payload

- Key: `cv-ia:visitor-name`.
- Value shape: `{ "name": string | null, "optedOut": boolean, "updatedAt": string /* ISO */ }`.
- Read on panel mount; write on capture, rename, or forget.
- `optedOut = true` means the visitor chose "prefer not to say"; in that case `name` is `null` and we do not re-prompt on later visits (until they clear state).

**Why JSON instead of a raw string?** We need to distinguish "never asked" from "explicitly opted out" so we don't harass the visitor every visit.

**Alternatives considered:**
- Cookies: require server handling and add bytes to every request; overkill for a pure-client feature.
- `sessionStorage`: loses the name between visits, which defeats the use case.
- IndexedDB: unnecessary complexity for a scalar.

### 2. UX flow: conversational, no form

All flows happen entirely inside the chat panel's message list; the main input is always enabled and no form, modal, or browser `prompt()` is introduced:

- **Fresh, no name, not opted out** → seed a single bilingual assistant message asking how the visitor would like to be called, making clear the answer is optional:
  - ES: "¡Hola! Antes de arrancar, ¿cómo te gustaría que te llame? Podés decirme tu nombre, escribir *"prefiero no decirlo"*, o directamente preguntarme lo que quieras y seguimos."
  - EN equivalent.
  The first user reply is then interpreted entirely client-side:
  1. If a rename phrase is detected ("call me X", "llamame X") **or** the reply looks like a short bare-text name ("Ana", "Ana María"), the name is sanitized, stored in `localStorage`, and the chat appends a personalized acknowledgement assistant message (`greeting.firstTime`). The first reply is **not** forwarded to the backend.
  2. If the reply matches a bilingual opt-out phrase (`"prefer not to say"`, `"prefiero no decirlo"`, `"anónimo"`, etc.), the chat stores the opt-out flag and appends a neutral welcome. The first reply is **not** forwarded.
  3. Otherwise (the visitor ignored the question and asked something else, including bare greetings such as "hola" / "hi") the chat leaves `localStorage` untouched and forwards the reply to the backend as a normal chat message. The name question will be re-seeded on the next panel session — the earlier "silent opt-out on passthrough" rule was rejected because it would permanently lose personalization for a benign "hola".

  Bare-name detection rejects common fillers ("hola", "hi", "thanks", "ok", "sí", etc.), question marks, digits, and anything outside a Unicode letter / mark / space / dash / apostrophe / period set, so greetings do not get mistakenly stored as a name.

- **Fresh, has name (or opted out), messages empty** → seed a single assistant message on first render:
  - Has name (returning): "Hola {name}, ¿puedo seguir llamándote {name}? Si preferís otro nombre, decime 'mejor llamame …'. ¿En qué te ayudo hoy?" / EN equivalent (`greeting.returning`).
  - Opted out: neutral welcome (`greeting.anonymous`).

- **Rename mid-chat** → unchanged. Before sending each user message, the client runs the bilingual rename heuristic; on match it updates `localStorage`, appends a short assistant confirmation, and **still** forwards the original user text to the backend so the conversation continues naturally. This path runs only when the initial name flow has already been resolved (status is `has-name` or `opted-out`), so it does not collide with the first-reply interpretation above.

The "Forget my name" control lives in the panel header and is visible both when a name is stored and when the visitor opted out (either state is a preference the visitor may want to reset). It clears the key and returns the panel to the "fresh, no name" state without closing the chat.

**Alternatives considered:**
- **Inline form / name gate** (initial design): rejected after UX review — it felt like a registration step and broke the chat's conversational tone.
- **LLM-driven rename**: ask the backend to return a structured `{ newName }` signal. Rejected for this change because it requires an API contract change and backend prompt updates; revisit in a follow-up if we want the LLM to use the name in its replies (tracked by the `chat-visitor-name-in-llm-context` change).
- **Browser `prompt()` dialog**: rejected — bad UX, not theme-aware, not bilingual, and blocks the UI.

### 3. Rename detection heuristic

Client-side only, run once per user message before the API call. Patterns (case-insensitive, Unicode-aware):

- ES: `/(?:llamame|llámame|decime|dec[ií]me|prefiero que me llames|mi nombre es|soy)\s+([\p{L}\p{M}'’\-\s]{2,40})/iu`
- EN: `/(?:call me|please call me|my name is|i am|i'm|im)\s+([\p{L}\p{M}'’\-\s]{2,40})/iu`

Post-processing:
- Trim trailing punctuation and connectors (", por favor", ", please", ".", "!").
- Take only the first 1–3 whitespace-separated tokens to avoid capturing the whole sentence.
- Reject empty, single-character, or digits-only matches.

We accept some false positives (e.g. "my name is used for …"); the impact is limited because the visitor can always hit "Forget my name" or overwrite again.

### 4. Locale strategy

- The panel already knows `locale` (`"es" | "en"`). All new strings live in the same bilingual dictionaries as existing UI strings (`PLACEHOLDER`, `HEADER_TITLE`…), kept in one place per component or extracted into a small `chatStrings.ts`.
- Locale can change while the panel is mounted (the user toggles language). The greeting is only re-seeded when messages is empty, so we never overwrite mid-conversation text.

### 5. Isolation via a `useVisitorName` hook and pure helpers

A small hook wraps read/write/remove + rename detection and exposes:

```ts
{
  name: string | null,
  optedOut: boolean,
  status: "loading" | "needs-prompt" | "has-name" | "opted-out",
  setName(name: string): void,
  optOut(): void,
  forget(): void,
  detectRename(userText: string, locale: "es" | "en"): string | null,
}
```

Two additional pure helpers live alongside the hook (in `renameDetection.ts`) and are used by the first-reply flow:

```ts
detectOptOut(text: string, locale: "es" | "en"): boolean;
extractBareName(text: string): string | null;
```

This keeps `ChatPanel.tsx` focused on chat orchestration and makes the logic unit-testable without DOM.

## Risks / Trade-offs

- **[Risk] False positives in rename regex (e.g. "my name is mentioned in the CV")** → Mitigation: conservative token count, minimum 2 characters, "Forget my name" control, and the confirmation message shows the extracted name so the visitor can notice and correct it.
- **[Risk] Server-side rendering mismatch with `localStorage`** → Mitigation: the name gate and greeting seeding run inside `useEffect` after mount; the panel is already a client component behind `"use client"`.
- **[Risk] Disabled `localStorage` (private mode, quota, third-party cookie blocks)** → Mitigation: wrap access in try/catch; fall back to session-only in-memory state and skip the greeting seeding, treating the visit as anonymous.
- **[Risk] Name contains HTML or control characters** → Mitigation: the name is injected only into plain text nodes (React escapes by default); we still clamp length to 40 characters and strip control chars.
- **[Trade-off] Name lives only in one browser** → Acceptable: matches the feature scope explicitly (no accounts) and is transparent to the user because we state "only in this browser" in the prompt copy.
- **[Trade-off] LLM does not know the name** → Acceptable for this change; the greeting + confirmation are synthesized locally. A future change can pass the name to the backend if we want the model to use it in replies.

## Migration Plan

- Pure additive feature, no data migration, no backend change, no feature flag required.
- On deploy, existing sessions have no stored name → they hit the "first visit" flow, which is indistinguishable from a new visitor.
- Rollback: revert the frontend changes; the `localStorage` key becomes inert and will be ignored by older code. No cleanup needed.

## Open Questions

- Should the stored JSON include a schema version field for forward compatibility (e.g. `v: 1`)? Defaulting to yes to keep future migrations cheap; will confirm during implementation.
- Should the "Forget my name" control live in the header (icon) or under the input (text button)? To be finalized during UI implementation; both satisfy the spec.
