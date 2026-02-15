# CV-0005 — Contact Section: Card Layout and Buttons

**Status:** Implemented

## Implementation Summary

- **ContactSection.tsx:** New component that parses contact markdown (`- Label: value`), renders a single card with Open to, Location, Preferences fields, and primary "Contact me" (mailto) plus secondary LinkedIn/GitHub buttons. Uses profile data for email and links.
- **content/en/sections/contact.md:** Open to, Location, Preferences format.
- **content/es/sections/contact.md:** Disponible para, Ubicación, Preferencias format.
- **page.tsx:** Conditionally renders `ContactSection` for `contact` section, passes `config.profile` and `locale`.
- **Styling:** Same card layout as EducationSection, CertificationsSection (rounded-xl, border, surface, hover); buttons use `profile-card-btn` / `profile-card-btn-primary`.

---

## Context

- The Contact section was previously rendered by the generic `Section` component (plain markdown).
- Design reference: card with label/value rows and primary/secondary action buttons.
- Profile data (email, links) comes from `content/site.json`; contact markdown holds Open to, Location, Preferences text.

## Goal

Implement a dedicated ContactSection with card layout, parsed fields, and Contact me / LinkedIn / GitHub buttons, following the same visual styles as other sections.

---

## Requirements (Met)

### 1. Markdown Format

- `- Label: value` per line (e.g. `- Open to: Full Stack Developer, Senior Software Engineer`).
- Labels rendered bold; values in muted text.

### 2. Buttons

- **Contact me:** Primary (blue), mailto using `profile.email`.
- **LinkedIn / GitHub:** Secondary (bordered), URLs from `profile.links`.

### 3. Styling

- Card: `rounded-xl border border-border bg-surface`, hover `-translate-y-0.5`, `shadow-md`.
- Buttons: `profile-card-btn` and `profile-card-btn-primary` for primary; `profile-card-btn` with border for secondary.

### 4. Data

- Fields from markdown; email and social links from `profile`.

---

## Files Changed

| File | Changes |
|------|---------|
| `apps/web/src/components/ContactSection.tsx` | New component |
| `content/en/sections/contact.md` | Open to, Location, Preferences |
| `content/es/sections/contact.md` | Disponible para, Ubicación, Preferencias |
| `apps/web/src/app/[locale]/page.tsx` | Render ContactSection for contact, pass profile |

---

## Verification

- Manual: View Contact section; verify fields and buttons; click Contact me, LinkedIn, GitHub.
- Dev: `yarn lint`, `yarn build`
