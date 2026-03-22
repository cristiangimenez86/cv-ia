## Context

The chat widget (`ChatWidget`, `ChatPanel`, `ChatMessageList`) is mounted from the root layout. The assistant message body is today a string shown as plain text with `whitespace-pre-wrap`. The backend builds a single **system prompt** in `OpenAiChatPromptBuilder.FormatSystemPrompt` and sends `Temperature` from `OpenAiChatOptions` (default **0.5** in `appsettings.json`). Section anchors on the site match **section IDs** in `shared/section-ids.json` / `CvMarkdownSectionIds` (`about`, `core-skills`, `experience`, etc.), rendered as `<section id="…">` on the locale home page (`/[locale]`).

## Goals / Non-Goals

**Goals:**

- Desktop-class panel sizing with sensible behavior on tablets and phones.
- Backdrop **blur + dim** when the chat is open; no overlay when closed.
- Assistant bubbles render **CommonMark / GFM-style** Markdown (paragraphs, **bold**, *italic*, lists, inline `code`, fenced code blocks if present).
- **Safe links only**: user-facing `href` values MUST be limited to the locale home path plus an allowed fragment (e.g. `/en#experience`), never arbitrary `https://` URLs from model output.
- **Backend-owned behavior**: prompt lists allowed section IDs and instructs the model to use Markdown links like `[Experience](/es#experience)` (exact shape to match implementation).
- **Close chat** when the user activates a validated in-app section link.
- **More human tone** via prompt wording (and optionally a small temperature tweak)—see below.

**Non-goals:**

- New API fields, streaming, or citation objects in the JSON response.
- Trusting the model for security: **defense in depth**—prompt rules **plus** frontend sanitization and URL allowlists.

## Decisions

### 1. Responsive panel sizing

- **Below `sm` (<640px)**: Keep the current near-full-bleed pattern (`inset-3`, max height vs `dvh`) so phones stay usable.
- **`sm`–`md`**: Use **fluid** max dimensions so tablets in portrait are not clipped: e.g. `w-[min(600px,calc(100vw-2rem))]` and `h-[min(700px,calc(100dvh-5rem))]` (exact classes in implementation).
- **`md` and up**: Apply the requested **600×700px** panel (still clamp height to `dvh` if the viewport is short).

**Rationale:** Raw 600×700 at `sm` can crowd 640px-wide viewports; anchoring “full desktop size” at `md` matches common “tablet vs desktop” expectations.

### 2. Backdrop

- Reuse the existing full-screen click layer in `ChatWidget`: add **`backdrop-blur-md`** (or `sm`) plus **`bg-background/40`** (or similar token-aware scrim). `z-index` stays below the panel but above page content.
- **Rationale:** Blur + semi-transparent dim is the common 2024–2025 pattern for modals and aligns with “focus on chat.”

### 3. Markdown stack (frontend)

- Use **`react-markdown`** with **`remark-gfm`** for tables/strikethrough where needed.
- Style via Tailwind on generated elements (`prose` with `prose-invert` in dark theme, or custom classes scoped to the assistant bubble).
- **Sanitization**: use **`rehype-sanitize`** with a schema that allows safe typography; **custom link handler** or post-process: only emit `<a>` for URLs that pass the allowlist.

**Rationale:** Industry-standard, avoids `dangerouslySetInnerHTML` without a sanitizer, and keeps user messages as plain text (no change required).

### 4. Link allowlist and navigation

- **Allowed paths**: `/${locale}` only (same locale as chat from URL), fragments must be in the **section-ids** list (read from `shared/section-ids.json` or a small duplicated constant in frontend—prefer importing shared JSON if the bundler already allows it, else a single TS module mirroring the list).
- **Normalize** model output: if the model emits `[text](#experience)` or wrong host, rewrite to `/${locale}#experience` before render; strip or render as span any non-compliant link.
- **On click**: `preventDefault` + **`router.push(`/${locale}#${id}`)** (or equivalent) and **`onClose()`** so the chat closes and the shell scrolls to the anchor.

**Rationale:** Answers the “what if I’m not on the home page?” concern: always navigate to the **locale home** with hash so anchors exist; single-page CV is the canonical target.

### 5. Backend prompt and “personality”

**How tone works in this architecture:** The model has no persistent personality; behavior comes from **(1) system prompt**, **(2) decoding parameters** (`Temperature`, `MaxTokens`), and **(3) the user message**. There is no separate “personality API”—we steer output by instructions.

**Planned adjustments:**

- **System prompt**: Add explicit instructions to sound **conversational and warm**—first person when describing the profile (“I worked on…”), short paragraphs, avoid robotic fillers (“As an AI language model…”), remain **fact-grounded** in the CV block.
- **Markdown + links**: Inject the **ordered list of section IDs** and require that references to sections use Markdown links: `[Label](/{lang}#section-id)` with `lang` matching the request (`es`/`en`). Forbid other URLs in prose (no marketing links, no external sites).
- **Temperature**: Default **0.5** in `appsettings.json` (and `OpenAiChatOptions`) to reduce stiffness versus **0.3**; **must not** compromise factual discipline—if manual tests show drift, lower via config or env (`OpenAiChat__Temperature`).

## Risks / Trade-offs

- **[Risk] Model emits forbidden links** → **Mitigation:** Frontend allowlist + strip; prompt says “only these IDs.”
- **[Risk] Markdown XSS** → **Mitigation:** `rehype-sanitize`, no raw HTML from model unless explicitly allowed and sanitized.
- **[Risk] Higher temperature hallucinations** → **Mitigation:** Prefer prompt-first; cap temperature bump; keep tests on “do not invent employers.”
- **[Risk] `backdrop-filter` unsupported** → **Mitigation:** Dimming still works; blur degrades gracefully (older browsers).

## Migration Plan

1. Ship frontend + backend changes together (prompt without frontend sanitization would be unsafe).
2. Rollback: revert prompt text and UI; no DB migrations.

## Resolved decisions

- **Default `OpenAiChat:Temperature`**: **0.5** in `appsettings.json` (with matching code default and `.env.example` override); not env-only.
