# UI Design Brief — CV (ATS-first)

## Goals
- Primary audience: Recruiters/HR and ATS parsers. Secondary: Tech reviewers.
- Text-first and scannable. No critical information hidden behind interactions.
- Bilingual structure (es/en) must preserve meaning and section structure.

## Navigation & Page Structure
- The top navigation/header is **sticky** (always visible at the top).
- Desktop layout uses a **two-panel** design:
  - Left: Profile sidebar card (photo + contact) stays visible while scrolling.
  - Right: Main content card is the primary scroll container.
- Scrolling behavior:
  - Prefer internal scrolling on desktop (right panel) to keep header and sidebar visible.
  - The **right content panel** scrolls vertically (internal scroll).
  - The **left profile card** remains sticky/visible relative to the viewport.
- Download actions (PDF/JSON) are visible without requiring scroll (desktop).
- Floating chat entry is planned for a future ticket.

## Information Architecture (sections)
Required sections (order):
1. About
2. Core Skills
3. Key Achievements
4. Experience
5. Education
6. Certifications
7. Languages
8. Contact

## Layout
### Desktop
- Sticky top header (always visible).
- Two-column layout:
  - Left: Profile sidebar (sticky).
  - Right: Main content panel (scroll container).
- The right content panel contains all CV sections in order.
- Anchor navigation should scroll the **right panel** to the target section (not the whole page).
- Anchor scroll must account for the sticky header height (offset) so section titles are not hidden.

### Mobile
- Single-column layout with normal **body scrolling** (no internal scroll containers).
- The top navigation/header is **hidden on mobile** (no sticky nav).
- The Profile card (photo + contact) moves to the **top of the page** as the first section.
- Sections render sequentially below the profile card (About → Skills → Achievements → Experience → ...).
- Keep content fully visible (no accordions/tabs for critical CV sections).

## Responsive Behavior
### Desktop
- Sticky top header is visible at all times.
- Left profile sidebar is sticky.
- Right content panel is the primary scroll container (internal scroll).
- Anchor navigation scrolls the right content panel with a header offset.

### Mobile
- Header/navigation is hidden.
- Body scrolling is used.
- Profile card moves to the top.

## Scrolling Implementation Notes
- On desktop, the main vertical scrolling should occur inside the right content panel (`overflow-y: auto`).
- The sticky header must remain visible while the right panel scrolls.
- The left profile card must remain visible while the right panel scrolls.
- Ensure section anchors work with an internal scroll container (scroll the container, not `window`).

## Component Inventory
- Header/NavBar
  - Section links
  - Language toggle (ES/EN)
  - Theme toggle (Light/Dark)
  - Primary CTA: Download PDF
- ProfileCard
  - Photo
  - Name + title
  - Location + contact
  - Social links (LinkedIn/GitHub)
  - Download actions (PDF/JSON)
- Section
  - Title (H2)
  - Content blocks
- SkillGroups
  - Group cards (Backend/Frontend/Data/Cloud/DevOps/etc.)
  - Keyword chips (must be text in DOM)
- ExperienceTimeline
  - Company block (logo, role, location, dates)
  - Project/initiative cards with bullet highlights + tech chips
- SimpleCardGrid
  - Education / Certifications / Languages / Contact

## Chat Entry (Floating Button)
- The chat entry is a floating action button (FAB) anchored to the bottom-right.
- Desktop:
  - A compact pill/button is allowed (e.g., icon + label "Ask the CV").
- Mobile:
  - The button remains bottom-right and must not overlap critical content.
  - Use safe-area padding (iOS) and a minimum margin from edges.
- Accessibility:
  - Must be keyboard-focusable and have an accessible label.
  - Must not block scrolling or interactions with the content.
- Visual:
  - Subtle elevation, consistent with the current design language.
  - Avoid excessive glow in dark mode.
- Implementation constraints:
  - `position: fixed`, `z-index` above content
  - Respect `env(safe-area-inset-bottom)` and `env(safe-area-inset-right)` on mobile

## ATS & Semantics (non-negotiable)
- Core content must be present in initial HTML (SSR/SSG), not only after hydration.
- Use semantic headings (H1 page title, H2 sections, H3 subsections).
- Use lists for bullet achievements.
- Do not hide critical content behind accordions/tabs/hover-only UI.
- Avoid rendering key content as images.

## Accessibility
- Keyboard navigation for toggles and nav links
- Visible focus states
- Sufficient contrast in both themes
- Buttons/links must have accessible labels

## Visual Style (baseline)
- Clean, minimal, professional
- Consistent spacing scale and radius
- Subtle shadows (light) / elevation (dark) without heavy glow
- Chips: consistent size, padding, and wrapping behavior

## “Polish” checklist (to be addressed in a later ticket)
- Consistent spacing and alignment across cards and section headers
- Consistent chip styling and wrapping
- Dark theme refinement (contrast, borders, shadows)
- Typography rhythm (line-height, paragraph width, heading scale)
- Download button hierarchy and placement (desktop + mobile)