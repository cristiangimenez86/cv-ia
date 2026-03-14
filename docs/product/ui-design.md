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
- Floating chat widget is implemented (see Chat Widget section below).

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
  - Section links with active state (scroll-spy)
  - Language toggle (ES/EN) — bordered button style
  - Theme toggle (Light/Dark) — moon/sun icon in bordered button
  - Primary CTA: Download PDF — blue button with shadow
  - Button styles: primary (blue) vs secondary (bordered)
  - See `docs/product/header-design.md` for visual specs
- ProfileCard
  - Photo
  - Name + title
  - Location + contact
  - Social links (LinkedIn/GitHub)
  - Download actions (PDF/JSON)
- Section
  - Title (H2)
  - Content blocks
- CoreSkillsSection
  - Title (H2) "Core Skills / Keywords"
  - Grid of categories (2 cols mobile, 4 cols desktop)
  - Each category: uppercase label + blue pill tags for skills
  - HR-friendly: scannable, ATS keywords, no repetition across categories
- KeyAchievementsSection
  - Title (H2), larger spacing below
  - Bulleted list with blue checkmark icons (✓) instead of disc bullets
  - Each item: checkmark + text, consistent vertical spacing
- SkillGroups
  - Group cards (Backend/Frontend/Data/Cloud/DevOps/etc.)
  - Keyword chips (must be text in DOM)
- ExperienceTimeline
  - Company block (logo, role, location, dates)
  - Logo: clickable link to company website, same hover animation as ProfileCard/navbar buttons (see `ai-specs/changes/CV-0004_experience-logos-specs.md`)
  - Project/initiative cards with bullet highlights + tech chips
- EducationSection
  - Title (H2), card layout
  - Each block (degree, additional courses): card with rounded corners, border, bg-surface
  - Main degree: title + institution; Additional courses: title + bullet list
- CertificationsSection
  - Title (H2), 2-column responsive grid
  - Each certification: card with name, date, ID (if present)
  - Uses surface/border theme vars (light + dark)
- LanguagesSection
  - Title (H2), 2-column responsive grid
  - Each language: card with name + proficiency level
  - Uses surface/border theme vars (light + dark)
- ContactSection
  - Title (H2), single card layout
  - Parses markdown: `- Label: value` for Open to, Location, Preferences (EN) / Disponible para, Ubicación, Preferencias (ES)
  - Primary button "Contact me" (mailto) and secondary buttons LinkedIn, GitHub — URLs from `profile.links` / `profile.email`
  - Same card/button styles as other sections (rounded-xl, border, surface; profile-card-btn)

## Chat Widget (Floating — Implemented)
- **Status:** Implemented. Components: `ChatWidget`, `ChatPanel`, `ChatInput`, `ChatMessageList` under `apps/web/src/components/chat/`.
- Integrated in root layout (`layout.tsx`). Reads locale reactively via `usePathname()` so UI strings update on locale toggle.
- FAB (floating action button) anchored bottom-right (`position: fixed`, `z-index: 50`).
- Desktop: panel 380×520 px, bottom-right. Mobile: nearly fullscreen (`inset-3`).
- Panel uses `.card` class, same tokens as CV cards (surface, border, shadow).
- User bubbles: `bg-primary text-primary-foreground`. Assistant bubbles: `bg-surface-2 text-foreground border-border`.
- Suggestion chips shown before first message; bilingual (es/en).
- Backend is mocked; replace `mockChatCompletion` in `ChatPanel.tsx` with real fetch (see `apps/web/src/components/chat/README.md`).
- Accessibility:
  - Keyboard-focusable; Escape closes panel; auto-focus on input.
  - Accessible labels on FAB and close button.
  - Does not block scrolling or interactions with the content.

## ATS & Semantics (non-negotiable)

The site must be **usable by AI tools and ATS** that HR/recruiters use to extract CV data. See `docs/product/ai-ats-parsing.md` for full requirements.

- Core content must be present in initial HTML (SSR/SSG), not only after hydration.
- Use semantic headings (H1 page title, H2 sections, H3 subsections).
- Use lists for bullet achievements.
- Do not hide critical content behind accordions/tabs/hover-only UI.
- Avoid rendering key content as images.
- `<html lang>` must match the page locale (es/en).
- Use Server Components for content rendering; avoid `"use client"` for CV sections.

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