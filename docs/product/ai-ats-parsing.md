# AI & ATS Parsing — CV Website

## Purpose

This document defines how the CV website must be **usable by AI tools and ATS (Applicant Tracking Systems)** that HR/recruiters use to extract and analyze CV data. The site must be machine-parseable without requiring JavaScript execution, so that:

- ATS parsers can scrape the HTML and extract structured data
- AI-powered CV analysis tools can reliably read roles, skills, experience, and achievements
- Recruiters using browser extensions or automation get accurate content

## Non-negotiable requirements

### 1. Content in initial HTML (SSR/SSG)

- All critical CV content must be present in the **initial HTML response** at request/build time.
- No content may depend on client-side JavaScript hydration to appear.
- Use **Static Site Generation (SSG)** for CV pages when possible.
- Avoid client-only rendering for core content (no "empty HTML + hydrate to show text").

**Rationale:** Many ATS tools and crawlers do not execute JavaScript. If content is rendered only after hydration, it will not be extracted.

### 2. Semantic HTML structure

- Use semantic headings: H1 for page title (candidate name), H2 for sections, H3 for subsections.
- Use lists (`<ul>`, `<ol>`, `<li>`) for bullet achievements and skill items.
- Use `<section>` with stable `id` attributes for each CV section.
- Use `<a href>` for contact links (email, phone, LinkedIn, GitHub).

**Rationale:** Parsers rely on heading hierarchy and list structure to identify sections and extract items.

### 3. Text in DOM, not images

- All extractable data (name, title, experience, skills, achievements) must be **text in the DOM**.
- Do not render key content as images, canvas, or SVG text.
- Profile photo may be an image; use empty or descriptive `alt` as appropriate.

**Rationale:** AI/ATS tools parse text from the DOM. Content inside images is not extractable.

### 4. No hidden content

- Do not hide critical CV information behind accordions, tabs, modals, or hover-only UI.
- All sections must be visible in the initial render (no "click to expand" for core content).
- Optional: collapsible sections are allowed only for non-critical supplementary info.

**Rationale:** Hidden content is often not indexed or extracted by parsers.

### 5. Correct language attribute

- The `<html lang="...">` attribute must match the page locale (`es` or `en`).
- Use middleware or layout to set `lang` based on the URL segment.

**Rationale:** Correct `lang` helps tools detect language and parse content correctly.

### 6. Metadata for crawlers

- Use `generateMetadata()` to set `title` and `description` per locale.
- Title should include the candidate name; description may include headline.

**Rationale:** Improves SEO and helps tools understand page purpose.

## Extractable data (what parsers expect)

The following must be present as text in the DOM and easily identifiable:

| Data point        | Where in HTML                          |
|-------------------|----------------------------------------|
| Full name         | H1 or prominent text                   |
| Job title/headline| Near name or in profile                |
| Location          | Profile section                        |
| Email             | `mailto:` link                         |
| Phone             | `tel:` link or text                    |
| Experience        | Section with company, role, dates      |
| Skills/tech stack | Section with keyword-rich text         |
| Achievements      | Bullet lists with measurable outcomes  |
| Education         | Institution, degree, dates             |
| Certifications    | Name, issuer, date                     |
| Languages         | Language name and level                |

## Implementation checklist

- [x] SSG for `/es` and `/en` pages
- [x] Server Components for content rendering (Section, ProfileCard, and dedicated section components: ExperienceSection, ContactSection, etc.)
- [x] Semantic headings (H1, H2) and lists
- [x] Dynamic `html lang` per locale
- [x] `generateMetadata()` with title and description per locale
- [ ] JSON-LD structured data (optional, future ticket)

## References

- `docs/product/target-audience.md` — Primary audience (recruiters, ATS)
- `docs/product/ui-design.md` — ATS & Semantics section
- `ai-specs/specs/frontend-standards.mdc` — Rendering Strategy
