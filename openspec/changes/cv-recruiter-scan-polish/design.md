## Context

The public CV (`frontend/src/app/[locale]/page.tsx`) is a server-rendered Next.js App Router page composed of:

- A sticky `Header` (name + nav scroll-spy + Download PDF + locale + theme toggle).
- A 2-column grid: a `ProfileCard` aside (foto, contacto, social, PDF) sticky on `lg+`; a content card hosting all sections in `sectionsOrder` from `content/site.json`.
- One section component per id: `Section` (generic markdown), `ExperienceSection`, `CoreSkillsSection`, `KeyAchievementsSection`, `EducationSection`, `CertificationsSection`, `LanguagesSection`, `ContactSection`.
- A floating chat widget (`frontend/src/components/chat/*`).

Visual tokens are defined in `frontend/src/app/globals.css` (Tailwind v4 `@theme inline` mapping HSL CSS vars: `--bg`, `--surface`, `--surface-2`, `--border`, `--divider`, `--text`, `--muted`, `--subtle`, `--primary`, `--ring`, `--shadow`). The dark theme overrides them under `.dark`.

The current design already scores well for ATS (semantic HTML, content-in-DOM, correct `lang`, anchored sections) and for navigation (scroll-spy, sticky sidebar). The HR/UX review in the conversation thread identified seven defects that this design addresses:

1. The `about` section reuses the generic `Section` component, so the elevator pitch — the most-read paragraph — has no visual hierarchy.
2. All section `<h2>` titles are plain text → no quick visual anchors when scanning.
3. Skill chips use `bg-primary/15 text-primary border border-primary/25` everywhere → low contrast on light, washed out, and the page reads "all blue".
4. Company logos in `ExperienceSection` are wrapped in `bg-white` (hardcoded) → 8 stark white squares interrupt the dark theme.
5. `CoreSkillsSection` uses a literal `border-slate-200` instead of the semantic `border-border` token → bypasses the design-system contract.
6. `globals.css` applies a 0.3s `transition` to `* , *::before, *::after` for theme switching → adds perceptible lag to every hover, scroll-spy underline, and chip color change.

(A previously planned change to introduce a sidebar CTA hierarchy — LinkedIn as a full-width primary, GitHub/WhatsApp demoted to secondaries — was reverted after design review: the three equal-weight social squares read better with the existing card rhythm and stay symmetrical in both themes.)

## Goals / Non-Goals

**Goals:**
- Sharpen the first-scroll information hierarchy for recruiters: the elevator pitch reads as a hero, section anchors are scannable, the primary contact CTA is unambiguous.
- Restore design-token discipline: no literal Tailwind palette colors, no hardcoded `bg-white`, no global `*` transitions.
- Make the dark theme feel "designed" instead of "inverted": logo wells respect the theme, chips don't tint the whole page blue.
- Keep the change purely visual: no content-schema migration, no API change, no copy/translation work, no responsive layout rework.
- Preserve ATS compliance and accessibility (semantic landmarks, real `<button>`/`<a>`, decorative icons marked `aria-hidden`, contrast ≥ AA on chips and text).

**Non-Goals:**
- Adding new content fields to `content/site.json` or to per-locale markdown (KPIs are extracted from the existing About body, not authored).
- Reordering sections, restructuring the 2-column layout, or rebuilding the timeline.
- Changing copy, adding new translations, or touching the chat widget contract.
- Adding new dependencies (icons come from the already-installed `lucide-react`).
- Touching the backend, the PDF export pipeline, or the RAG/embeddings flow.
- Changing the date-format or computing per-role tenure (deferred to a follow-up change).
- Visually differentiating the "Professional Transition" entry (deferred to a follow-up change).

## Decisions

### 1. Dedicated `AboutSection` with auto-extracted KPI strip

`AboutSection.tsx` (new) replaces the generic `Section` for the `about` section id. It:

- Renders the body as one or more paragraphs; the first paragraph uses `text-[17px] leading-relaxed` (lead style), subsequent paragraphs use `text-base text-muted`.
- Runs a small client-safe regex pass over the body to extract numeric highlights:
  - Patterns: `/([+\-]?\s?\d+(?:[.,]\d+)?\s?%)/g` for percentages, `/(\d+\+?\s+(?:años|years|year))/giu` for years-of-experience.
  - First 3 unique matches become a horizontal "KPI strip" rendered above the lead, each as a chip: `<dt>` numeric + `<dd>` short label derived from up to 4 surrounding words.
  - If the parser yields fewer than 2 KPIs, the strip is omitted entirely → the section degrades to "lead paragraph only", which is still better than the current rendering.
- Wired in `[locale]/page.tsx` via the existing `switch (section.id)` dispatch (a new `case "about"` arm).

**Why parse instead of authoring KPIs in `site.json`?** Avoids a content-schema change in this slice and lets the existing markdown remain canonical. A future change can promote KPIs to typed content if we want them editable.

**Alternatives considered:**
- Hardcoded KPIs in the component → rejected (violates "no hardcoded CV content" rule).
- New `metrics: { value, label }[]` field in `Profile` → defers this change and forces a backend ContractDocument update; deferred to a follow-up.

### 2. Section icons via a single `SECTION_ICONS` map

A lightweight `frontend/src/components/sectionIcons.ts` module exports a `Record<string, LucideIcon>`:

```ts
export const SECTION_ICONS = {
  about: User,
  "core-skills": Code2,
  "key-achievements": Award,
  experience: Briefcase,
  education: GraduationCap,
  certifications: BadgeCheck,
  languages: Languages,
  contact: Mail,
} as const;
```

Every section component imports the map and renders `<Icon size={20} className="text-primary" aria-hidden />` flexed left of `<h2>`. The header markup becomes a small shared helper `SectionHeading` (`Icon + title`) reused across `Section`, `ExperienceSection`, `CoreSkillsSection`, `KeyAchievementsSection`, `EducationSection`, `CertificationsSection`, `LanguagesSection`, `ContactSection`, `AboutSection`. If the section id is not in the map, the helper falls back to a plain title — backwards compatible.

**Why a shared helper?** Single place to evolve the heading style; avoids 8 near-duplicate JSX blocks.

### 3. Sidebar CTAs (reverted to original equal-weight squares)

`ProfileCard.tsx` keeps the original 3-square row (LinkedIn / GitHub / WhatsApp, all `h-9 w-9 bg-primary text-primary-foreground`) plus the existing PDF download button below.

A previous iteration of this change introduced a CTA hierarchy (LinkedIn primary full-width, GitHub/WhatsApp demoted to secondaries). After visual review it was reverted: the three equal-weight squares preserve symmetry with the rounded photo and the divider rhythm of the card, and the recruiter-first goal is already served by the section icons + sticky Download PDF in the header. No code change ships in this slice for the sidebar.

### 4. Neutral-default skill chips

A new shared CSS class `.chip-neutral` (in `globals.css`) replaces the inline primary-tinted chip in Core Skills and Experience technologies:

```css
.chip-neutral {
  display: inline-block;
  padding: 0.25rem 0.625rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
  background-color: hsl(var(--surface-2));
  color: hsl(var(--text));
  border: 1px solid hsl(var(--border));
  white-space: nowrap;
}
```

The existing primary-tinted look survives as `.chip-primary` (kept for opt-in highlights such as future "featured skill" badges) so we don't lose the option.

`CoreSkillsSection` and `ExperienceSection` switch their chip JSX from the long Tailwind utility chain to `<span className="chip-neutral">`. The result: chips read as understated tags on light, and stay legible on dark without dyeing the whole page blue.

**Contrast check (target ≥ 4.5:1 for `text-base` body text and ≥ 3:1 for `text-xs` chips):**
- Light: `--text` (#1d2433-ish) on `--surface-2` (#ecedf1-ish) ≈ 14:1 → AAA.
- Dark: `--text` (#e6e9ee) on `--surface-2` (#262d36) ≈ 11:1 → AAA.

### 5. Theme-aware logo well

`ExperienceSection` replaces:

```tsx
className="... bg-white ..."
```

with:

```tsx
className="... bg-slate-100 dark:bg-slate-100 border-border dark:border-slate-200/40 ..."
```

That single change keeps logos readable (vendors deliver light-background-friendly assets) but removes the harsh white-on-near-black contrast. We deliberately keep the wrapper light in dark mode because we don't have dark-variant logo assets — the slight dimming + softer border integrates them visually.

**Alternatives considered:**
- Per-vendor dark logo asset → out of scope (asset work, requires vendor approval).
- CSS `filter: invert()` → produces ugly artifacts on multi-color logos (Pay Retailers, Travelport).

### 6. `border-slate-200` → `border-border` token fix

`CoreSkillsSection.tsx` line that currently reads:

```tsx
className="... border border-slate-200 ... dark:border-border ..."
```

becomes:

```tsx
className="... border border-border ..."
```

This is a one-token bug fix (the design-system value already adapts to the active theme). No visual regression in dark mode (already used `border-border`), and a subtle improvement in light mode (border now follows `--border` HSL instead of slate-200).

### 7. Scoped theme transitions via `.theme-transition` opt-in

The current global rule:

```css
*, *::before, *::after {
  transition: background-color .3s ease, border-color .3s ease,
              color .3s ease, box-shadow .3s ease;
}
```

is removed. It is replaced by:

```css
html.theme-transition,
html.theme-transition *,
html.theme-transition *::before,
html.theme-transition *::after {
  transition: background-color .3s ease, border-color .3s ease,
              color .3s ease, fill .3s ease, stroke .3s ease,
              box-shadow .3s ease !important;
  transition-delay: 0ms !important;
}
```

`ThemeToggle.tsx` adds `theme-transition` to `document.documentElement` immediately before calling `setTheme(...)`, and removes it after `~350ms` (single `setTimeout`). All other interactions (hover, focus, scroll-spy underline expand/collapse) regain their natural snappiness.

**Why `!important`?** Forces the transition to win even if a child element has its own `transition: none` (e.g. Tailwind `transition-none`). The class is only present for ~350ms during a deliberate theme change, so collateral risk is bounded.

**Edge case:** if the user toggles theme twice in <350ms, the last `setTimeout` removes the class even though a new transition is in flight. The existing transitions still complete because the rule applies for the duration of the in-flight 0.3s period; visually equivalent to single-toggle behaviour.

### 8. No content / no API touch

No file under `/content/`, no `site.json` field, no API contract, no backend file is modified. The KPI strip parses existing markdown text. The icon map and chip class live entirely in `frontend/`.

## Risks / Trade-offs

- **[Risk] KPI extraction yields false positives** ("3.0.3", "100%" inside a URL or a code span) → Mitigation: the parser only runs over the About markdown body (small, controlled), strips the body to text first via a basic regex (`replace(/`[^`]*`/g, "")` to drop inline code, drop fenced blocks), and caps to 3 KPIs. The fallback "lead-only" rendering means a parser miss never produces a broken UI.
- **[Risk] Section icons add visual noise instead of helping** → Mitigation: icons are 20px, `text-primary`, single line with the title (no extra row). They behave as anchors, not decorations. Dark/light both inherit `--primary`. Easy to revert by emptying the `SECTION_ICONS` map.
- **[Risk] Sidebar restructure pushes the card height past the viewport on small `lg` breakpoints** → Mitigation: the sticky sidebar is always scrollable inside its container (existing `lg:fixed lg:left-... lg:top-...` block does not constrain max-height). Worst case the user scrolls the page; the new full-width LinkedIn button is only ~36px taller than the old icon row (gain offset by removing the WhatsApp icon button when it migrates inline as a square below).
- **[Risk] `chip-neutral` reads "boring" compared to the current blue chips** → Trade-off accepted: HR review prioritises legibility and color discipline over decoration. The `chip-primary` class is still available for future highlights (e.g. "top 3 skills" badge).
- **[Risk] `bg-slate-100` in dark mode introduces a Tailwind palette literal in the codebase** → Trade-off accepted: consistent with the deliberate decision in §5 to keep logos on a light surface; documented in this design as the only sanctioned literal. A future change can introduce a `--logo-well` token if more vendors are added.
- **[Risk] `theme-transition` class collides with `view-transition-name` API or future Next.js transitions** → Mitigation: the name is namespaced and only added imperatively from `ThemeToggle`; if a conflict arises, rename to `cv-theme-transition` in one place.
- **[Trade-off] No section icons or KPIs in the printed/PDF rendering** → Acceptable for v1: the PDF export is generated from the canonical markdown, not the React tree, so this change does not affect it. Visual parity for PDF can be a follow-up.
- **[Trade-off] Career-break, per-role tenure, and ATS-summary header are deferred** → Acceptable: this change is the visual-polish slice; the deferred items live in the HR review notes and can be promoted to their own change.

## Migration Plan

- Pure additive frontend change. No data migration, no flag, no backend deploy.
- On deploy, the only user-visible diffs are: the About lead, the section title icons, the sidebar button arrangement, the chip neutral palette, the dark-mode logo wells, and the absence of the "all-elements transition lag" on hover.
- Rollback: revert the frontend PR. No persistent state, no schema migration, no cache to invalidate beyond the standard Vercel/CDN deploy.

## Open Questions

- Should the KPI strip render in the PDF/print view too? Defaulting to **no** for this change because the PDF is generated from markdown, but worth a follow-up if we keep the UI strip past a sprint.
- Should the section-icon color follow `--primary` or be muted (`text-muted`)? Defaulting to `--primary` because it doubles as a visual anchor; can be revisited if it competes with chips.
- Do we want to expose the `chip-primary` class as a content-authored highlight in `core-skills.md` (e.g. via a `**bold**` convention)? Out of scope here; tracked as a possible follow-up.
