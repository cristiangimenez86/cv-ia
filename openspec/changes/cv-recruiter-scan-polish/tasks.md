## 1. Tokens, chip class, and theme-transition scoping

- [x] 1.1 In `frontend/src/app/globals.css`, remove the universal `*, *::before, *::after { transition: ... }` rule.
- [x] 1.2 In `frontend/src/app/globals.css`, add a scoped `html.theme-transition, html.theme-transition *, html.theme-transition *::before, html.theme-transition *::after` rule that animates `background-color`, `color`, `border-color`, `fill`, `stroke`, and `box-shadow` over 0.3s, with `!important` and zero delay.
- [x] 1.3 In `frontend/src/app/globals.css`, add a `.chip-neutral` class implementing the neutral chip palette described in design §4 (surface-2 background, border-border border, text foreground, `text-xs`, `font-medium`, `whitespace-nowrap`, `inline-block`, `rounded-md`, `px-2.5 py-1`).
- [x] 1.4 In `frontend/src/components/ThemeToggle.tsx`, before each `setTheme(...)` call, add the `theme-transition` class to `document.documentElement` and remove it after ~350ms via a single `setTimeout` (clear any previous timer to avoid leaks across rapid toggles).

## 2. Section icon helper

- [x] 2.1 Create `frontend/src/components/sectionIcons.tsx` exporting a `SECTION_ICONS` map keyed by canonical section id (`about`, `core-skills`, `key-achievements`, `experience`, `education`, `certifications`, `languages`, `contact`) → corresponding `lucide-react` icon component (`User`, `Code2`, `Award`, `Briefcase`, `GraduationCap`, `BadgeCheck`, `Languages`, `Mail`).
- [x] 2.2 In the same file, export a `SectionHeading` React component that takes `{ id: string; title: string }` and renders the icon (when present in the map, `size={20}`, `className="text-primary shrink-0"`, `aria-hidden`) inline before an `<h2>` styled with the existing `text-xl font-semibold text-foreground` rules; gracefully falls back to icon-less heading when the id is unknown.

## 3. Replace section headings with `SectionHeading`

- [x] 3.1 In `frontend/src/components/Section.tsx`, replace the current `<h2>` with `<SectionHeading id={section.id} title={section.title} />`.
- [x] 3.2 In `frontend/src/components/ExperienceSection.tsx`, replace the current `<h2>` with the shared `SectionHeading`.
- [x] 3.3 In `frontend/src/components/CoreSkillsSection.tsx`, replace the current `<h2>` with the shared `SectionHeading`.
- [x] 3.4 In `frontend/src/components/KeyAchievementsSection.tsx`, replace the current `<h2>` with the shared `SectionHeading`.
- [x] 3.5 In `frontend/src/components/EducationSection.tsx`, replace the current `<h2>` with the shared `SectionHeading`.
- [x] 3.6 In `frontend/src/components/CertificationsSection.tsx`, replace the current `<h2>` with the shared `SectionHeading`.
- [x] 3.7 In `frontend/src/components/LanguagesSection.tsx`, replace the current `<h2>` with the shared `SectionHeading`.
- [x] 3.8 In `frontend/src/components/ContactSection.tsx`, replace the current `<h2>` with the shared `SectionHeading`.

## 4. AboutSection with KPI extraction

- [x] 4.1 Create `frontend/src/components/AboutSection.tsx` accepting `{ section: SectionContent }`, parsing the body into paragraphs (split on blank lines), rendering the first paragraph as a lead (`text-[17px] leading-relaxed text-foreground`) and subsequent paragraphs in `text-base text-muted leading-relaxed`.
- [x] 4.2 In `AboutSection.tsx`, implement a pure helper `extractAboutKpis(body: string)` that strips inline code/fences, scans for `[+\-]?\s?\d+(?:[.,]\d+)?\s?%` and `\d+\+?\s+(?:años|years|year)\b` matches in source order, deduplicates, caps at 3, and derives a short caption (≤ 4 surrounding words to the right of the match) for each KPI.
- [x] 4.3 In `AboutSection.tsx`, when `extractAboutKpis` returns ≥ 2 entries, render a horizontal KPI strip above the lead using a `<dl>` with `flex flex-wrap gap-3` and per-KPI `<div class="rounded-lg border border-border bg-surface-2 px-3 py-2"><dt class="text-lg font-semibold text-foreground">{value}</dt><dd class="text-xs text-muted">{caption}</dd></div>`. When fewer than 2 entries, omit the strip entirely.
- [x] 4.4 In `AboutSection.tsx`, render the section heading via the shared `SectionHeading` (id `about`).
- [x] 4.5 In `frontend/src/app/[locale]/page.tsx`, import `AboutSection` and add a `case "about": block = <AboutSection section={section} />;` arm in the `switch (section.id)` dispatch (above the `default`).

## 5. Sidebar CTAs (reverted — kept as original equal-weight squares)

- [x] 5.1 ~~Make LinkedIn the primary full-width CTA in `ProfileCard.tsx`~~ — **REVERTED after design review**. `ProfileCard.tsx` keeps the original 3-square row (LinkedIn / GitHub / WhatsApp, all `h-9 w-9 bg-primary`).
- [x] 5.2 ~~Render GitHub and WhatsApp as secondary squares~~ — **REVERTED**. All three social buttons remain equal-weight primary squares.
- [x] 5.3 PDF download button position unchanged.

## 6. Neutral chip class wired into Skills and Experience

- [x] 6.1 In `frontend/src/components/CoreSkillsSection.tsx`, replace the inline `bg-primary/15 text-primary border border-primary/25 shadow-sm` chip class chain with `chip-neutral`.
- [x] 6.2 In `frontend/src/components/ExperienceSection.tsx`, replace the equivalent inline chip class chain (technologies pills) with `chip-neutral`.

## 7. Logo well + border-token bug fixes

- [x] 7.1 In `frontend/src/components/CoreSkillsSection.tsx`, replace the `border-slate-200 ... dark:border-border` group-card class fragment with the single semantic `border-border` token (drop the `dark:border-border` override that becomes redundant).
- [x] 7.2 In `frontend/src/components/ExperienceSection.tsx`, replace the company logo wrapper class `bg-white` with `bg-slate-100 dark:bg-slate-100` and update the wrapper border to `border border-border dark:border-slate-200/40` so the logo well integrates with the dark theme.

## 8. Verification

- [x] 8.1 Run `npm --prefix frontend run lint` and ensure there are no new lint errors introduced by this change.
- [x] 8.2 Run `npm --prefix frontend run dev` and manually verify on `http://localhost:3000/es` and `http://localhost:3000/en` that: section headings show icons; the About lead is visibly larger; if KPIs are present, the KPI strip renders above the lead; the sidebar shows LinkedIn as a single primary CTA with GitHub/WhatsApp as secondary squares; chips no longer dye the page blue; dark-mode logo wells no longer appear as stark white squares; hover on chips/cards/links is instant; toggling the theme still animates smoothly.
- [x] 8.3 Run `openspec validate cv-recruiter-scan-polish --strict` and confirm it passes.
