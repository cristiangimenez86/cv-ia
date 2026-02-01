# CV-0002 — Theme Tokens (Neutral Light + Graphite Dark)

## Context
- The project is named **CV**.
- Frontend is a Next.js app under `apps/web`.
- Current UI uses hardcoded palette classes (e.g., `bg-blue-*`, `text-blue-*`) in some places.
- Desired look: neutral gray light theme and a refined graphite dark theme (Portainer/ChatGPT-like).

## Goal
Introduce a token-based theming system using CSS variables as the source of truth,
so both light and dark themes are consistent, easy to maintain, and avoid hardcoded colors.

## Scope (in-scope)
- Add theme tokens (CSS variables) for:
  - background/surfaces, borders/dividers
  - text (primary/muted/subtle)
  - accent (primary + contrast + focus ring)
  - shadow (subtle)
- Define both **light (neutral gray)** and **dark (graphite)** themes.
- Map Tailwind semantic colors to tokens (no direct palette usage in UI).
- Ensure base page background and text use tokens.
- Provide a minimal toggle mechanism expectation (theme switch already exists or will be implemented later).

## Out of scope
- Full UI refactor of every component styling (can be incremental).
- Pixel-perfect redesign.
- Chat UI implementation.

## Rules / Constraints
- No `bg-blue-*`, `text-blue-*` (or any direct palette classes) in CV UI components for new changes.
- Use semantic Tailwind classes that map to tokens.
- Keep shadows subtle; prefer borders over glow in dark mode.

## Files to change
- `apps/web/src/app/globals.css` (define tokens in `:root` and `.dark`)
- `apps/web/tailwind.config.*` (map semantic colors to CSS variables)

## Acceptance Criteria
1. `globals.css` defines tokens for both `:root` (light) and `.dark` (dark).
2. Base page background and foreground text are driven by tokens.
3. Tailwind exposes semantic classes that reference tokens (e.g., background, surface, border, foreground, muted, primary, ring).
4. Switching `.dark` on the root element changes the theme without breaking readability/contrast.
5. No secrets or env changes are required.
6. `yarn lint` and `yarn build` succeed.

## Verification
- Manual:
  - Toggle dark mode and verify neutral light + graphite dark appearance.
  - Check key surfaces (cards), borders, text contrast, and buttons/chips.
- Dev:
  - `yarn lint`
  - `yarn build`
