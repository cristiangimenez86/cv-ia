# CV-0004 — Experience Section: Company Logos as Clickable Buttons

**Status:** Implemented

## Implementation Summary

- **globals.css:** Restored `.card` hover animation (translateY(-2px), box-shadow) and subtle default shadow.
- **site.json:** Added `experienceCompanies` array with name, logo, url for Pay Retailers, Travelport, UST, Adrenalin Media, Stratos Technology Partners, Globant.
- **types.ts:** Added `ExperienceCompany` interface, extended `SiteConfig`.
- **ExperienceSection.tsx:** New component that parses experience markdown, extracts company from "Role — Company", renders logo as clickable link with `.profile-card-btn` animation.
- **page.tsx:** Conditionally renders `ExperienceSection` for `experience` section, passes `config.experienceCompanies`.

---

## Context

- The central content card (right column on desktop) renders CV sections from `/content/{es|en}/sections/*.md`.
- The Experience section is rendered by `Section.tsx` using ReactMarkdown — plain markdown, no logos.
- Company logos exist in `apps/web/public/assets/`:
  - `PayRetailers-Logo.png`
  - `Travelport-logo.png`
  - `UST-logo.png`
  - `Adrenalin-logo.jpg`
  - `Stratos-logo.jpg`
  - `Globant-logo.png`
- Experience markdown uses headings like `### Role — Company` (e.g. "### Senior Software Engineer — Pay Retailers").
- Other buttons (ProfileCard, navbar) use `.profile-card-btn` / `.header-btn-primary` with hover animation: `transform: translateY(-2px)`, `box-shadow` on hover.

## Goal

Turn company logos in the Experience section into clickable "buttons" that link to each company's website, with the same hover animation as existing buttons. Logos must be data-driven (no hardcoded content).

---

## Requirements (Must Have)

### 1. Logo Source

- **Location:** `/public/assets/` (served as `/assets/filename`).
- **Existing files:** PayRetailers-Logo.png, Travelport-logo.png, UST-logo.png, Adrenalin-logo.jpg, Stratos-logo.jpg, Globant-logo.png.

### 2. Logo as Clickable Button

- Each logo must be a link (`<a>`) that opens the company website in a new tab (`target="_blank"`, `rel="noopener noreferrer"`).
- Logos must be visually styled as buttons (rounded corners, border, consistent padding).
- On hover: same animation as ProfileCard/navbar buttons — `transform: translateY(-2px)` and subtle `box-shadow`.

### 3. Data-Driven (No Hardcoded Content)

- Company, logo path, and URL must come from config (e.g. `site.json` or dedicated JSON).
- Map markdown headings (e.g. "Pay Retailers") to config entries to resolve logo + URL.

### 4. Company URLs (Reference)

| Company (markdown) | Logo file              | URL                      |
|--------------------|------------------------|--------------------------|
| Pay Retailers      | PayRetailers-Logo.png | https://www.payretailers.com |
| Travelport         | Travelport-logo.png   | https://www.travelport.com   |
| UST                | UST-logo.png          | https://www.ust.com          |
| Adrenalin Media    | Adrenalin-logo.jpg    | (add when known)            |
| Stratos Technology Partners | Stratos-logo.jpg | (add when known)            |
| Globant            | Globant-logo.png      | https://www.globant.com     |

---

## Out of Scope

- Changing the markdown structure or content of experience entries.
- Adding logos for "Freelance" (no company site).
- PDF/JSON download functionality.

---

## Data Model

### Option A: Add to `content/site.json`

```json
"experienceCompanies": [
  { "name": "Pay Retailers", "logo": "/assets/PayRetailers-Logo.png", "url": "https://www.payretailers.com" },
  { "name": "Travelport", "logo": "/assets/Travelport-logo.png", "url": "https://www.travelport.com" },
  { "name": "UST", "logo": "/assets/UST-logo.png", "url": "https://www.ust.com" },
  { "name": "Adrenalin Media", "logo": "/assets/Adrenalin-logo.jpg", "url": "https://adrenalin.com.au" },
  { "name": "Stratos Technology Partners", "logo": "/assets/Stratos-logo.jpg", "url": "https://www.stratos.net.nz" },
  { "name": "Globant", "logo": "/assets/Globant-logo.png", "url": "https://www.globant.com" }
]
```

### Option B: Separate `content/experience.json`

Same structure, loaded by the loader when `section.id === "experience"`.

**Recommendation:** Option A keeps config centralized; preferred unless config grows too large.

---

## Implementation Approach

1. **Extend `SiteConfig` / loader:** Add `experienceCompanies?: ExperienceCompany[]` to types and `site.json`.
2. **ExperienceSection component:** When `section.id === "experience"`, render a custom `ExperienceSection` instead of generic `Section`.
3. **Parse markdown:** Split body by `### `; for each block, extract company from "Role — Company" (part after "—").
4. **Lookup:** Match company name (case-insensitive, trim) to `experienceCompanies`; if found, render logo as link.
5. **Layout:** Logo left of role/company text; logo in a small square container (e.g. 48×48 or 56×56) with rounded corners, border.
6. **Animation:** Apply `.profile-card-btn` or equivalent class for hover effect.
7. **Fallback:** If no config match, render as before (no logo).

---

## Files to Change

| File | Changes |
|------|---------|
| `content/site.json` | Add `experienceCompanies` array |
| `apps/web/src/lib/content/types.ts` | Add `ExperienceCompany` interface, extend `SiteConfig` |
| `apps/web/src/lib/content/loader.ts` | Pass through `experienceCompanies` from config |
| `apps/web/src/components/Section.tsx` or `page.tsx` | Conditionally render `ExperienceSection` for `experience` |
| `apps/web/src/components/ExperienceSection.tsx` | New component: parse markdown, render entries with logos |
| `apps/web/src/app/globals.css` | Optionally add `.experience-logo-btn` if needed (or reuse `.profile-card-btn`) |

---

## Acceptance Criteria

1. Experience entries with a matching company in config show a logo.
2. Logo is clickable and opens company URL in a new tab.
3. Logo has the same hover animation as ProfileCard/navbar buttons (lift + shadow).
4. No hardcoded company names, URLs, or logo paths in components.
5. Entries without a config match render without logo (no regression).
6. `yarn lint` and `yarn build` succeed.

---

## Verification

- Manual: Click each logo; verify correct URL and new tab. Check hover animation.
- Dev: `yarn lint`, `yarn build`
