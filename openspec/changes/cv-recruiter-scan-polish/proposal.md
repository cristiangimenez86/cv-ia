## Why

A senior HR/UX review of the live CV (https://cv.cristiangimenez.com, both light and dark themes) confirms a solid baseline (sticky 2-column layout, scroll-spy, bilingual, theme tokens) but identifies seven recurring frictions that hurt the first 6–10 seconds a recruiter spends on the page: the elevator pitch lacks visual hierarchy, section titles read flat, the sidebar shows three identical-weight CTAs, the dark theme is broken by hardcoded `bg-white` logo wells and an inconsistent `border-slate-200`, the skill chips are a wall of low-contrast pale-blue, and a global `*` CSS transition makes every hover feel sluggish. These are pure visual/UX defects — content, contracts, and backend stay untouched.

## What Changes

- **Frontend only.** No backend, content schema, or API change.
- New `AboutSection` component dedicated to the "About / Sobre mí" slot, with a lead paragraph in larger type and an auto-extracted KPI strip (numeric highlights like `+25%`, `-30%`, `14+ años`) parsed from the existing markdown body — falls back to lead-only when no KPIs are detected.
- Add an icon-per-section convention: every CV `<h2>` (Experience, Skills, Achievements, Education, Certifications, Languages, Contact, About) renders a small left-aligned `lucide-react` icon for fast visual anchoring.
- Skill chip restraint: introduce a neutral chip variant (surface-2 + border-border + foreground text) used by default, and keep the primary-tinted variant only as an opt-in highlight. Apply the neutral variant to Core Skills and Experience technology lists.
- Dark-mode logo wells: replace the hardcoded `bg-white` wrapper around company logos with a theme-aware light surface (`bg-slate-100 dark:bg-slate-100`) plus a subtle border so the dark page is no longer interrupted by 8 bright squares.
- Replace the bug `border-slate-200` literal in `CoreSkillsSection` with the semantic `border-border` token so light/dark consistency is restored.
- Scope the cross-theme transition to actual theme toggles only: remove the global `* { transition: ... }` rule and replace it with a `html.theme-transition` opt-in class that the `ThemeToggle` adds for ~350ms when the user switches theme. Hover, focus, and scroll-spy interactions go back to instant.

## Capabilities

### New Capabilities

- `cv-recruiter-scan-polish`: visual polish contract for the public CV pages — defines the about-section hero treatment, section-title iconography, sidebar CTA hierarchy, skill-chip variants, dark-mode logo well treatment, semantic-token discipline, and the theme-transition scoping rule.

### Modified Capabilities

- *(none — this change adds a new visual-polish capability layered on top of existing rendering specs without altering their requirements)*

## Impact

- **Affected code (frontend only):**
  - `frontend/src/app/globals.css` — drop universal `*` transition, add `.theme-transition` opt-in, add neutral chip class, refine logo-well surface.
  - `frontend/src/components/ThemeToggle.tsx` — toggle the `theme-transition` class around `setTheme`.
  - `frontend/src/components/Section.tsx` and all section components (`AboutSection.tsx` (new), `ExperienceSection.tsx`, `CoreSkillsSection.tsx`, `KeyAchievementsSection.tsx`, `EducationSection.tsx`, `CertificationsSection.tsx`, `LanguagesSection.tsx`, `ContactSection.tsx`) — render section icon next to `<h2>`; new `AboutSection` parses KPIs and renders the lead.
  - `frontend/src/app/[locale]/page.tsx` — wire the new `AboutSection` for the `about` section id.
  - `frontend/src/components/ExperienceSection.tsx` and `frontend/src/components/CoreSkillsSection.tsx` — switch chip class to neutral default; replace the `border-slate-200` literal in the latter; refine logo well wrapper.
- **Storage / API / data:** none.
- **Accessibility:** keep all interactive elements as real buttons/links; new icons are decorative (`aria-hidden`); chips retain `text-foreground` contrast on `surface-2`.
- **Non-goals:** no content-schema change (no new fields in `site.json`), no new section reordering, no responsive layout rework, no chat-widget change, no PDF export change, no copy translation change.
