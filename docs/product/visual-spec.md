# Visual Design Specification - CV UI (Rebuild Contract)

## Objective

This document is the exhaustive visual/UI contract to rebuild the CV in `/frontend` from scratch, aligned with:

- Live behavior:
  - `https://cv.cristiangimenez.com`
  - `https://cv.cristiangimenez.com/es`
- Existing implementation in `web`:
  - components
  - `src/app/globals.css`
  - app layouts/pages
- Normative references:
  - `docs/product/theme.md`
  - `docs/product/ui-design.md`
  - `docs/product/header-design.md`

It intentionally specifies both **what** must be rendered and **how** it must look/behave.

---

## 1. Source Artifacts Audited

## 1.1 Live

- EN and ES routes observed for rendered structure, class usage, and behavior parity.
- Live CSS bundle inspected for exact token and class rules:
  - `/_next/static/chunks/6b7103f73957f3cb.css`

## 1.2 Implementation (`web`)

- Global/theme/layout:
  - `web/src/app/globals.css`
  - `web/src/app/layout.tsx`
  - `web/src/app/[locale]/layout.tsx`
  - `web/src/app/[locale]/page.tsx`
  - `web/src/middleware.ts`
- Core components:
  - `Header`, `NavLinks`, `ProfileCard`, `Section`
  - `CoreSkillsSection`, `KeyAchievementsSection`, `ExperienceSection`
  - `EducationSection`, `CertificationsSection`, `LanguagesSection`, `ContactSection`
- Chat:
  - `ChatWidget`, `ChatPanel`, `ChatMessageList`, `ChatInput`, `ChatNudge`

---

## 2. Global Design System

## 2.1 Theme tokens (exact values)

From `web/src/app/globals.css`:

### Light
- `--bg: 220 14% 91%`
- `--color-bg: #f5f7fa`
- `--surface: 0 0% 100%`
- `--surface-2: 220 10% 96%`
- `--border: 214 32% 91%`
- `--divider: 220 12% 88%`
- `--text: 220 20% 14%`
- `--muted: 220 10% 36%`
- `--subtle: 220 8% 52%`
- `--primary: 210 80% 46%`
- `--primary-contrast: 210 40% 98%`
- `--ring: 210 80% 46%`
- `--shadow: 220 18% 16%`

### Dark (`.dark`)
- `--bg: 220 18% 10%`
- `--color-bg: hsl(var(--bg))`
- `--surface: 220 18% 13%`
- `--surface-2: 220 18% 16%`
- `--border: 220 14% 22%`
- `--divider: 220 14% 20%`
- `--text: 220 20% 92%`
- `--muted: 220 10% 72%`
- `--subtle: 220 8% 60%`
- `--primary: 210 85% 62%`
- `--primary-contrast: 220 18% 12%`
- `--ring: 210 85% 62%`
- `--shadow: 220 30% 2%`

## 2.2 Theme mapping

Tailwind semantic mapping (must preserve):

- `--color-background`, `--color-surface`, `--color-surface-2`
- `--color-border`, `--color-divider`
- `--color-foreground`, `--color-muted`, `--color-subtle`
- `--color-primary`, `--color-primary-contrast`, `--color-primary-foreground`
- `--color-ring`

## 2.3 Typography and spacing tokens

Observed tokens:

- `--spacing: .25rem` (4px scale)
- `--radius-md: .375rem`
- `--radius-lg: .5rem`
- `--radius-xl: .75rem`
- `--text-xs: .75rem`
- `--text-sm: .875rem`
- `--text-base: 1rem`
- `--text-lg: 1.125rem`
- `--text-xl: 1.25rem`
- `--leading-tight: 1.25`
- `--leading-snug: 1.375`
- `--leading-relaxed: 1.625`
- `--tracking-wider: .05em`

## 2.4 Global transitions

Applied globally:

- `background-color 0.3s ease`
- `border-color 0.3s ease`
- `color 0.3s ease`
- `box-shadow 0.3s ease`

---

## 3. Layout Architecture

## 3.1 Layout constants

- `--max-content-width: 1440px`
- `--header-height-mobile: 64px`
- `--header-height-desktop: 72px`
- `--sidebar-offset: 96px`
- `--sidebar-width: 280px`
- `--sidebar-left: max(1.5rem, calc((100vw - var(--max-content-width))/2 + 1.5rem))`

## 3.2 Page shell

From `web/src/app/[locale]/page.tsx`:

- Sticky full-width header on top.
- Main container centered:
  - `max-w-[var(--max-content-width)]`
  - horizontal padding `px-4 md:px-6`
- Desktop grid:
  - `lg:grid-cols-[var(--sidebar-width)_minmax(0,1fr)]`
  - gap `gap-6 lg:gap-8`
- Left sidebar behavior:
  - mobile: inline card (`lg:hidden`)
  - desktop: fixed card with spacer:
    - fixed at `left: var(--sidebar-left)`
    - top offset `var(--sidebar-offset)`
    - width `var(--sidebar-width)`
- Right panel:
  - single card wrapper (`card p-6 md:p-8`)
  - section stack (`space-y-6`)

## 3.3 Section order

Rendered in this order (from content config and page mapping):

1. About
2. Core Skills (EN) / Habilidades (ES)
3. Key Achievements
4. Experience
5. Education
6. Certifications
7. Languages
8. Contact

---

## 4. Responsive Behavior

## 4.1 Breakpoints in use

- `sm` = 40rem (640)
- `md` = 48rem (768)
- `lg` = 64rem (1024)
- `xl` = 80rem (1280)
- `2xl` = 96rem (1536)

## 4.2 Desktop (`lg+`)

- Header visible and sticky.
- Sidebar fixed/sticky.
- Right content card is the visual primary column.
- Header nav visible (`md:flex`, effectively desktop/tablet+).

## 4.3 Mobile (`<lg`)

- Header still mounted, but nav is hidden under `md` and density becomes compact.
- Sidebar card moves inline at top of content.
- One-column sequential section flow.
- Chat FAB remains fixed; chat panel uses inset full-screen style on small devices.

---

## 5. Core Reusable Visual Patterns

## 5.1 Card primitives

- `.card`
  - background `hsl(var(--surface))`
  - border `1px solid hsl(var(--border))`
  - radius `1rem`
  - shadow `0 1px 3px hsl(var(--shadow)/0.06)`
- `.card-header`
  - `border-bottom: 1px solid hsl(var(--border))`

## 5.2 Divider

- `.divider` -> top border with `hsl(var(--divider))`

## 5.3 Header container

- `.header`
  - top border light: `hsl(220 18% 16% / 0.15)`
  - dark override: `hsl(220 14% 22%)`

## 5.4 Button motion language

Shared hover behavior:

- slight lift: `translateY(-2px)`
- subtle shadow increase
- transition duration around 150ms

Implemented in:

- `.profile-card-btn`
- `.header-btn-secondary`
- `.header-btn-primary`

---

## 6. Header Spec (Exact)

From `Header.tsx`, `NavLinks.tsx`, `globals.css`, and live output.

## 6.1 Structure

- Left block:
  - full name (`text-xl`, semibold)
  - headline (`text-sm`, muted)
  - left padding alignment `pl-[7px]`
- Right block:
  - section nav links
  - primary Download PDF button
  - locale toggle
  - theme toggle

## 6.2 Nav links

- `.nav-link` with pseudo underline:
  - line height 2px
  - color `hsl(var(--primary))`
  - initial `scaleX(0)`, hover/active `scaleX(1)`
  - origin center (`left: 50%` + translate)
- active state class: `.nav-link-active`
- Scroll-spy:
  - `NavLinks` client component tracks section visibility
  - activation line at 120px viewport offset

## 6.3 Header buttons

### Secondary (`header-btn-secondary`)
- height/min-width: 36px (`2.25rem`)
- radius: 8px (`.5rem`)
- border: `1px solid hsl(var(--border))`
- bg: `hsl(var(--surface))`
- font: `0.875rem`, medium
- hover:
  - border -> primary
  - bg -> surface-2
  - lift and shadow

### Primary (`header-btn-primary`)
- visual style supplied by utility classes:
  - `h-9 px-4 text-sm font-semibold rounded-lg`
  - `bg-primary text-primary-foreground shadow-sm`
- hover via class:
  - lift
  - `0 4px 8px hsl(var(--primary)/0.3)`

---

## 7. Profile Card Spec

From `ProfileCard.tsx` and live class output.

## 7.1 Photo block

- circle container: `w-[140px] h-[140px] rounded-full overflow-hidden`
- background fallback: `bg-surface-2`
- image:
  - `object-fit: cover`
  - exact face alignment: `object-position: 47% 55%`

## 7.2 Identity and contact

- Name: `text-lg font-semibold`
- Headline: `text-sm text-muted`
- Contact rows:
  - icon + label in horizontal rows
  - subtle text tone with hover to foreground

## 7.3 Social + actions

- Social icon buttons:
  - square `h-9 w-9`, rounded-lg
  - primary background
- Downloads:
  - primary full-width button (PDF link to `/api/v1/cv`)
  - JSON sidebar button removed (restore via `ProfileCard` + `[locale]/page.tsx` if needed)
- Top separators:
  - `border-t border-divider` between card subgroups

---

## 8. Content Section Specs

## 8.1 Generic section wrapper (`Section.tsx`)

- Root: `section` with `id` and `scroll-mt-20`
- H2 title: `text-xl font-semibold mb-3`
- Body:
  - markdown rendered
  - `prose prose-neutral dark:prose-invert`
  - width unconstrained (`max-w-none`)

## 8.2 CoreSkillsSection

- Grid:
  - mobile: 1 col
  - `sm` and up: 3 cols (`grid-cols-1 sm:grid-cols-3`)
- Each group card:
  - rounded-xl, border, surface, p-4
  - light mode: `border-slate-200`; dark: `dark:border-border`
  - hover lift + shadow
- Group title:
  - `text-xs uppercase tracking-wider text-muted`
- Chips:
  - `px-2.5 py-1`
  - `text-xs font-medium`
  - rounded-md
  - `bg-primary/15`
  - `text-primary`
  - `border border-primary/25`
  - `shadow-sm`

## 8.3 KeyAchievementsSection

- List style: custom checklist, not browser bullets.
- Item layout:
  - left icon (`lucide check`, primary color)
  - right text (`text-base`, relaxed leading)
- Vertical spacing: `space-y-3`.

## 8.4 ExperienceSection

- Timeline rail:
  - left column width 4
  - vertical border line centered
  - prominent primary dots per company
- Company header row:
  - logo (if mapped) in bordered white square (`w-14 h-14 rounded-lg`)
  - company name + role/location
  - dates aligned right on larger widths
- Project cards:
  - `.experience-card` + rounded-xl border p-4/5
  - hover lift + shadow
  - bullet list for description/achievements
  - technology chips reuse same skill chip style; `Technologies:` / `Tecnologías:` line is split on commas **outside parentheses** so one chip can contain `AWS (Service A, Service B, …)`
- Dark override:
  - `.dark .experience-card { background-color: hsl(var(--surface-2)); }`

## 8.5 EducationSection

- Vertical stack of cards (`space-y-4`).
- Card style reused.
- Title in card: base semibold.
- Institution/secondary text muted.
- Additional course bullets inside card.

## 8.6 CertificationsSection

- Grid:
  - mobile 1 col
  - `sm` 2 cols
- Card contents:
  - certification name
  - date
  - optional ID line

## 8.7 LanguagesSection

- Same grid/card pattern as certifications.
- Name + optional level.

## 8.8 ContactSection

- Single card with label/value rows.
- Action row separated by top divider.
- Buttons:
  - primary mail CTA (`Contact me` / `Contactar`)
  - secondary LinkedIn/GitHub/WhatsApp outlined buttons.

---

## 9. Chat Widget Spec

From `ChatWidget.tsx`, `ChatPanel.tsx`, `ChatMessageList.tsx`, `ChatInput.tsx`, `ChatNudge.tsx`.

## 9.1 FAB

- Fixed bottom-right (`bottom-4 right-4 z-50`).
- Circular button `h-12 w-12`.
- Uses primary style and profile-card hover behavior.
- AI badge:
  - top-right mini pill
  - text `AI`, `text-[10px]`, bordered surface token.

## 9.2 Panel

- Desktop:
  - `sm:w-[380px] sm:h-[520px]`
  - anchored bottom-right above FAB
- Mobile:
  - `inset-3`
  - `max-h-[calc(100dvh-1.5rem)]`
- Container uses `.card` and column layout.

## 9.3 Inner structure

- Header row with icon + localized title + close button.
- Scrollable message list:
  - user bubble: primary background
  - assistant bubble: surface-2 + border
  - max width 85%
- Suggestion chips shown before first message.
- Typing indicator uses animated bouncing dots.
- Input footer:
  - textarea in bordered surface-2
  - send icon button in primary style.

## 9.4 Nudge bubble

- Desktop-only (`hidden sm:flex`) appears 4 seconds after load.
- One-time per session (sessionStorage key `cv_chat_nudge_seen`).
- Card bubble with pointer arrow toward FAB.

---

## 10. Interaction States

## 10.1 Hover

- Nav links: underline expansion animation.
- Secondary buttons: border-color + bg shift + lift.
- Primary buttons: lift + accent shadow.
- Cards: subtle upward movement and shadow increase in many content cards.

## 10.2 Active

- Nav active state controlled by scroll-spy + hash priority logic.

## 10.3 Focus

Input/focus classes used:

- `focus:outline-none`
- `focus:ring-2`
- `focus:ring-ring/40`

Must preserve visible focus in light and dark themes.

## 10.4 Disabled

Used in chat input/send:

- `disabled:opacity-40` / `disabled:opacity-50`
- `disabled:cursor-not-allowed`

---

## 11. Locale and Content Parity Contract

- Locale routes: `/en`, `/es`.
- `<html lang>` must match locale (set via middleware header + root layout).
- Same structural classes/layout in EN and ES.
- Only text labels/content vary by locale.

---

## 12. Rebuild Requirements for `/frontend`

This is the minimum acceptable fidelity checklist.

1. Implement exact token system and semantic mapping from section 2.
2. Implement sticky header + two-panel desktop + single-column mobile.
3. Keep section order and card composition identical to current production.
4. Reproduce class-level behavior patterns:
   - `.card`, `.header`, `.card-header`, `.nav-link`, `.profile-card-btn`,
   - `.header-btn-secondary`, `.header-btn-primary`, `.experience-card`.
5. Preserve all key spacing/sizing constants:
   - max content width, header heights, sidebar width/offset/left.
6. Preserve interaction language (lift/shadow/underline timings).
7. Preserve chat widget placement and behavior.
8. Preserve ATS-safe semantics (text in DOM, visible sections, heading/list structure).

---

## 13. Validation Checklist

- [ ] `/en` and `/es` have identical structural layout and component ordering.
- [ ] Header is sticky, with left identity and right nav/actions.
- [ ] Desktop grid uses fixed/sticky sidebar + right content panel.
- [ ] Mobile stacks profile card then sections.
- [ ] Tokens match values from section 2 exactly.
- [ ] Card/chip/button styles match section specs.
- [ ] Hover/focus/disabled states match current behavior.
- [ ] Chat FAB/panel/nudge behavior matches current implementation.
- [ ] Visual parity against live site confirmed on desktop and mobile widths.

