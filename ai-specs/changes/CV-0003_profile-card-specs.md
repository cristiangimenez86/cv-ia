# CV-0003 — Profile Card (Left Sidebar) Specification

**Status:** Implemented

## Implementation Summary

- **ProfileCard.tsx:** Photo with `object-cover object-[center_60%]` to reduce bottom crop; contact info with MapPin/Mail/Phone icons; LinkedIn/GitHub/WhatsApp icon buttons; Download PDF/JSON buttons (no action); `.profile-card-btn` for navbar-style hover animation.
- **site.json:** LinkedIn URL updated to `https://www.linkedin.com/in/cristiangimenez86/`.
- **globals.css:** Added `.profile-card-btn` and `.profile-card-btn-primary` for card button animations.
- **page.tsx:** Sidebar uses `position: fixed` on lg breakpoint (not sticky) so the card stays fully static when scrolling. Mobile keeps inline layout.

---

## Context

- The project has a ProfileCard component in `apps/web/src/components/ProfileCard.tsx`.
- It appears in the left sidebar on desktop (lg+ breakpoint).
- Layout: `apps/web/src/app/[locale]/page.tsx` uses a grid with `lg:grid-cols-[320px_minmax(0,1fr)]`.
- Profile data comes from `content/site.json` (profile.fullName, headline, location, email, phone, links, photoSrc).
- Navbar buttons use `.header-btn-secondary` and `.header-btn-primary` with hover animation: `transform: translateY(-2px)`.

## Goal

Update the ProfileCard to match the design from the reference image and satisfy the listed requirements, without changing the current color scheme for light or dark themes.

---

## Requirements (Must Have)

### 1. Profile Photo — Complete Circle

- **Current issue:** The bottom of the profile image is cut off inside the circular frame.
- **Requirement:** The photo must display fully inside a perfect circle (no visible cropping at the bottom).
- **Approach:** Adjust `object-fit` and/or `object-position` on the Image component. If needed, try `object-position: center` or experiment with values so the whole face/body is visible. Avoid cropping that makes the circle look incomplete.

### 2. Color Scheme

- **Requirement:** Keep the current color scheme for both **dark** and **light** themes.
- **Do not:** Introduce new hardcoded colors (e.g., `bg-blue-*`, `text-blue-*`).
- **Use:** Semantic tokens (e.g., `bg-surface`, `text-foreground`, `text-muted`, `text-primary`, `border-divider`).

### 3. Social Links — URLs and Icons

- **LinkedIn:** `https://www.linkedin.com/in/cristiangimenez86/`
- **GitHub:** `https://github.com/cristiangimenez86`
- **Update:** `content/site.json` profile.links to use these exact URLs (site.json currently has a different LinkedIn URL: `https://www.linkedin.com/in/cristian-gimenez-dev/`).
- **Display:** Match the reference image: square/rounded buttons with icons (LinkedIn, GitHub, WhatsApp) side by side, using primary background color.

### 4. Email as mailto: Link

- **Requirement:** Email must be a clickable `mailto:` link that opens the default email client with a new message.
- **Implementation:** Use `<a href={`mailto:${profile.email}`}>` (already present; ensure it remains and is styled consistently).

### 5. Phone as tel: Link

- **Requirement:** Phone must be a clickable `tel:` link for calling.
- **Implementation:** Use `<a href={`tel:${profile.phone.replace(/\s/g, "")}`}>` (already present; ensure it remains and is styled consistently).

### 6. WhatsApp Option

- **Requirement:** Add a WhatsApp link/button using the same phone number as profile.phone.
- **Format:** `https://wa.me/${phoneDigits}` where `phoneDigits` = country code + number without spaces or `+` (e.g., `+34 685 890 502` → `34685890502`).
- **Display:** Same style as LinkedIn and GitHub (icon button, primary background).

### 7. Download PDF and Download JSON

- **Requirement:** Show both buttons visually.
- **Functionality:** Do **not** implement download logic yet. Buttons must be present but have no action (e.g., `onClick` empty or `event.preventDefault()` only).
- **Labels:** Localized: "Download PDF" / "Descargar PDF" and "Download JSON" / "Descargar JSON".
- **Style (from reference):**
  - Download PDF: primary background (blue, same as social buttons).
  - Download JSON: secondary/darker background (similar to card background).

### 8. Button Animations

- **Requirement:** All buttons in the ProfileCard (social links, Download PDF, Download JSON) must use the same hover animation as the navbar buttons.
- **Reference:** `globals.css` — `.header-btn-secondary` and `.header-btn-primary`:
  - `transition: transform 0.15s ease, ...`
  - `transform: translateY(-2px)` on hover.
- **Approach:** Reuse `.header-btn-secondary` and `.header-btn-primary` classes, or create a shared utility class and apply to ProfileCard buttons.

### 9. Static Position on Scroll

- **Requirement:** The card must remain static (fixed) when the user scrolls — it should not move.
- **Implemented:** `position: fixed` on lg breakpoint. CSS vars `--sidebar-left` and `--sidebar-offset` align the card with the grid column. A spacer div reserves layout space; the fixed card overlays. Mobile uses inline (non-fixed) layout.

---

## Out of Scope

- Changing the headline text (e.g., "Senior Full Stack Software Engineer (.NET / React)") — keep from site.json.
- Implementing PDF or JSON download functionality.
- Adding new theme tokens or changing existing color tokens.

---

## Data Changes

### content/site.json

- Update `profile.links`:
  - LinkedIn: `{"label":"LinkedIn","href":"https://www.linkedin.com/in/cristiangimenez86/"}`
  - GitHub: `{"label":"GitHub","href":"https://github.com/cristiangimenez86"}`
- Add WhatsApp: either as a new link in `profile.links` or derive from `profile.phone` in the component (recommended: derive from phone in component to avoid duplication).

### Profile type (optional)

- If WhatsApp is always derived from phone, no type change needed.
- If preferred, add an optional `whatsapp` or `links` entry for WhatsApp — ask before adding.

---

## Files to Change

| File | Changes |
|------|---------|
| `apps/web/src/components/ProfileCard.tsx` | Photo circle fix, layout, links (email, tel, social + WhatsApp), Download buttons, animations |
| `content/site.json` | Update LinkedIn URL; optionally add WhatsApp link (or derive from phone) |
| `apps/web/src/app/globals.css` | Maybe add shared button class if ProfileCard needs it (or reuse existing) |

---

## Layout Structure (from reference image)

1. Profile photo (circle, centered)
2. Name (bold, centered)
3. Headline (smaller, muted, centered)
4. Contact info (vertical list with icons):
   - Location
   - Email (mailto link)
   - Phone (tel link)
5. Social buttons (horizontal): LinkedIn, GitHub, WhatsApp (icon buttons)
6. Download buttons (stacked, full width): Download PDF, Download JSON

---

## Acceptance Criteria

1. Profile photo displays fully inside a circle with no visible bottom crop.
2. Light and dark themes use existing semantic tokens without new hardcoded colors.
3. LinkedIn, GitHub, and WhatsApp links work and use the specified URLs/phone.
4. Email opens mail client; phone opens dialer.
5. Download PDF and Download JSON buttons are visible but do nothing on click.
6. All ProfileCard buttons have the same hover animation as navbar buttons (translateY(-2px)).
7. Card remains static when scrolling (no undesired movement).
8. `yarn lint` and `yarn build` succeed.

---

## Verification

- Manual:
  - Check photo circle on desktop and mobile.
  - Toggle light/dark theme; verify no color regressions.
  - Click email, phone, LinkedIn, GitHub, WhatsApp — verify correct behavior.
  - Verify Download buttons do nothing.
  - Scroll the page; confirm the card stays fixed.
- Dev:
  - `yarn lint`
  - `yarn build`
