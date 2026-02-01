# CV-0001 — Frontend: Render CV from Content (Bilingual)

## Context
- The CV lives under `content/` as Markdown/JSON (no hardcoded CV data inside UI components).
- The website is Next.js (app located at `apps/web`).
- The CV pages must be **ATS/SEO friendly**, meaning core CV content must be present in the initial HTML.
- A separate .NET backend exists for **specific features** (e.g., CV-scoped chat and OpenAI key handling), but **the CV rendering itself must NOT depend on the backend**.
- The chat feature is public, bilingual, and restricted to CV context (this ticket does NOT implement chat).

## Goal
As a visitor, I want to view the CV rendered correctly and switch language (ES/EN),
so I can consume the content without relying on hardcoded data in components.

## Scope (in-scope)
- CV main page with a clean, basic ATS-friendly layout and required sections (rendered in this order):
  - about
  - core-skills
  - key-achievements
  - experience
  - education
  - certifications
  - languages
  - contact
- Top nav shows only links for section ids listed in navSections (from content/site.json).
- Language toggle (ES/EN) that updates the displayed content.
- Content loading strategy:
  - Read from content/{es|en}/** on the server (build time or request time)
  - Render as SSR/SSG so the initial HTML contains the CV content
- UI states:
  - error (missing/invalid content)
  - Optional: loading (only if applicable; prefer SSG where possible)
- No backend dependency for CV rendering.

## Out of scope
- Chat UI/feature
- Authentication
- Persistence / database
- Pixel-perfect styling (only clean and readable UI)
- Calling the .NET backend for CV content

## Rules / Constraints
- Use **Yarn** (no npm).
- Do not store API keys or secrets in the frontend.
- Monorepo layout: Next app lives in `apps/web`.
- Do NOT hardcode CV content in React components (render from `content/`).
- No critical CV content behind client-only rendering.

## ATS-first constraints
- Primary audience: Recruiters/HR and ATS parsers. Secondary audience: Tech reviewers.
- Core CV content must be present in the initial HTML response (SSR/SSG), not only after hydration.
- Do not hide critical content behind interactions (accordions/tabs/hover-only).
- Use semantic headings (H1/H2/H3) and predictable section structure.

## Layout
- **Desktop (md+/lg+):** 2-column layout. Left: sticky ProfileCard (~320px). Right: a single large **ContentCard** that wraps all CV sections.
- **ContentCard:** Rounded corners, border, and padding (like cv.cristiangimenez.com). All CV sections render inside it; it is the right column’s main container, not plain text on the page background.
- **Mobile:** ProfileCard stacks on top; ContentCard below (same card wraps all sections).
- **Top nav:** Renders only links for sections listed in `navSections` (from `content/site.json`).

## Acceptance Criteria
1. Opening the CV home page renders the CV using server-side data loading (SSR/SSG) and the initial HTML contains the CV content (not an empty shell).
2. Switching to EN updates the rendered content using the English files under `content/en` (no mixing languages in the same page).
3. If required content files are missing or invalid, the UI shows a readable error (and does not silently render empty sections).
4. Optional missing sections do not break the UI (conditional rendering).
5. CV sections are rendered with semantic headings and text-first HTML suitable for ATS parsing (no critical content behind client-only rendering).
6. No `.env.local` files or secrets are committed.
7. **ProfileCard:** Content comes from `content/site.json` (`profile` object); no hardcoded text in components.
8. **Photo:** Profile photo is loaded from public assets via `next/image` (e.g. `photoSrc` in profile).
9. **Hydration:** Browser extensions (e.g. Grammarly) can inject attributes; ensure our components do not cause SSR/client markup divergence. Keep `suppressHydrationWarning` on `html` and `body`. Avoid rendering the theme toggle until mounted (e.g. `mounted` state set in `useEffect`).
10. **ContentCard:** Right column renders inside a single ContentCard container (rounded, bordered, padded); not plain text on background.

## Edge Cases
- Missing required config (content/site.json) or required section file(s) → handled error page/state.
- Empty response / missing optional sections → UI does not break.
- Locale not supported → handled error or redirect to default locale.

## Verification
- Manual:
  - navigate to CV home page
  - toggle ES/EN
  - temporarily remove/rename a required content file and validate error handling
- Dev:
  - `yarn lint` passes
  - `yarn build` passes