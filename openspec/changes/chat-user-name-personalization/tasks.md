## 1. Visitor-name storage hook

- [x] 1.1 Create `frontend/src/components/chat/visitorNameStorage.ts` with typed read/write/remove helpers for the `cv-ia:visitor-name` `localStorage` key (schema: `{ v: 1, name: string | null, optedOut: boolean, updatedAt: string }`), including try/catch around every storage access so private mode / disabled storage never throws.
- [x] 1.2 Create `frontend/src/components/chat/renameDetection.ts` exporting `detectRename(text, locale)`, `detectOptOut(text, locale)`, and `extractBareName(text)` helpers that apply the bilingual regex heuristics from `design.md`, trim/clamp to 40 chars, reject fillers ("hola", "hi", "thanks", …), digits-only, and invalid character sets. Unit tests cover ES/EN positives and common false positives.
- [x] 1.3 Create `frontend/src/components/chat/useVisitorName.ts` hook that wraps the storage helpers and rename detection, exposing `{ name, optedOut, setName, optOut, forget, detectRename }`, and is safe to call during SSR (no storage access until `useEffect`).

## 2. Bilingual copy for the conversational flow

- [x] 2.1 Add bilingual strings for the name question (`askForName.message`), first-time greeting (`greeting.firstTime`), returning-visitor greeting (`greeting.returning`), neutral welcome (`greeting.anonymous`), rename confirmation, and "forget my name" label in a single dictionary module (`frontend/src/components/chat/visitorNameStrings.ts`) so all new copy lives in one place.
- [x] 2.2 Add a small "forget my name" control to `ChatPanel.tsx` header that is visible when a visitor name is stored OR when the visitor opted out, calls `forget()` from the hook, and does not close the panel.

## 3. Integrate the conversational flow into the chat panel

- [x] 3.1 In `ChatPanel.tsx`, consume `useVisitorName`. On panel mount with an empty message list, seed a single assistant message depending on status: `needs-prompt` → seed the bilingual `askForName.message`; `has-name` → seed `greeting.returning` with the stored name; `opted-out` → seed `greeting.anonymous`. Keep the main message input enabled in every state.
- [x] 3.2 Ensure the opening message is seeded exactly once per panel mount and is never replaced when the locale changes mid-conversation.
- [x] 3.3 In `sendMessage`, when status is `needs-prompt` interpret the first reply as: (a) name via rename phrase or bare-text `extractBareName` → save name, append `greeting.firstTime`, do NOT forward; (b) opt-out via `detectOptOut` → save opt-out, append `greeting.anonymous`, do NOT forward; (c) otherwise → leave `localStorage` untouched and forward as a normal backend message (the question is re-seeded on the next session).
- [x] 3.4 Keep the existing mid-chat rename flow for subsequent messages: `detectRename` → update storage + synthesize confirmation + still forward original user text to the backend.

## 4. Safety, accessibility, and i18n

- [x] 4.1 Sanitize display of the stored name: clamp to 40 characters on write, strip ASCII control characters, and rely on React's default text escaping when injecting into greetings/confirmations (no `dangerouslySetInnerHTML`).
- [x] 4.2 Ensure the conversational name flow is accessible: the assistant question, acknowledgements, and greetings are rendered via the existing Markdown assistant-bubble path (already announced by assistive tech), and the header "forget my name" button has a proper `aria-label` and tooltip.
- [x] 4.3 Verify the returning-visitor greeting is produced in the currently active locale (`es` | `en`) and the rename confirmation uses the same locale as the triggering user message.

## 5. Verification

- [x] 5.1 Add unit tests for `visitorNameStorage` (read/write/remove, corrupt JSON fallback, storage-throws fallback), `detectRename` (ES/EN patterns, edge cases, max length), `detectOptOut` (ES/EN opt-out phrases, non-matches), and `extractBareName` (positives, rejects fillers, questions, digits). → `frontend/tests/visitor-name.test.mjs`.
- [ ] 5.2 Add a component test (React Testing Library) covering: first open seeds the name question; name reply stores name and seeds firstTime greeting without calling the backend; opt-out reply stores opt-out without calling the backend; passthrough reply opts out silently and calls the backend; rename mid-chat updates storage and still calls the backend; "forget my name" returns the panel to the first-use state on next open. — DEFERRED: the frontend currently uses `node --test` only (no RTL / jsdom wiring). Pure logic is covered by 5.1; UI behavior is exercised via 5.3. Adding RTL is out of scope for this change.
- [ ] 5.3 Manual QA pass in both locales verifying: the assistant asks for the name conversationally on first open; a name reply produces a personalized firstTime greeting; an opt-out reply produces the neutral greeting; a passthrough reply (e.g. "hola" or a CV question) is answered normally by the backend AND the name question is re-seeded on the next reload; rename works mid-chat; forget control returns to the question on next open; no name is ever included in the network payload to `POST /api/v1/chat/completions` (check DevTools Network tab). — PENDING USER: requires running the dev stack locally; all code paths are in place.
- [x] 5.4 Run `openspec validate chat-user-name-personalization --strict` and the frontend lint/type check (`npm run lint` and `npm run typecheck` or project equivalents) and confirm all pass. → `tsc --noEmit` OK, `npm test` 15/15 OK, `openspec validate --strict` OK.
