## ADDED Requirements

### Requirement: About section MUST render as a recruiter-scannable hero
The frontend SHALL render the `about` section through a dedicated `AboutSection` component that visually distinguishes the elevator pitch from generic markdown sections, and SHALL surface up to three numeric KPIs extracted from the existing About body when at least two are present, without modifying any content file.

#### Scenario: About body renders with hero-level lead typography
- **WHEN** the locale CV page (`/es` or `/en`) is rendered and the `about` section is part of `sectionsOrder`
- **THEN** the first paragraph of the About body MUST render at a larger size than the standard body (`text-[17px]` lead, `leading-relaxed`)
- **AND** subsequent paragraphs MUST render with muted color
- **AND** no content file under `/content/` is modified

#### Scenario: KPI strip is rendered when at least two numeric highlights are detected
- **WHEN** the About body contains two or more numeric highlights matching the percentage pattern (e.g. `+25%`, `-30%`, `+20%`) or the years-of-experience pattern (e.g. `14+ years`, `14+ años`)
- **THEN** the AboutSection MUST render a horizontal KPI strip above the lead paragraph with up to three KPIs in source order
- **AND** each KPI MUST display the numeric value visually emphasized and a short caption derived from the surrounding context

#### Scenario: KPI strip is omitted when fewer than two highlights are detected
- **WHEN** the About body yields fewer than two KPI matches
- **THEN** the AboutSection MUST omit the KPI strip entirely and render only the lead paragraph treatment

### Requirement: Every CV section heading MUST display a visual anchor icon
The frontend SHALL render a `lucide-react` icon to the left of every section `<h2>` for the canonical section ids (`about`, `core-skills`, `key-achievements`, `experience`, `education`, `certifications`, `languages`, `contact`), keeping the icon decorative for assistive technologies and falling back to a plain title when the section id is not in the icon map.

#### Scenario: Known section id renders icon next to title
- **WHEN** a CV section is rendered with one of the canonical ids
- **THEN** an icon corresponding to that id MUST appear inline before the `<h2>` text
- **AND** the icon MUST carry `aria-hidden` so screen readers announce only the heading text

#### Scenario: Unknown section id falls back to plain heading
- **WHEN** a section is rendered with an id that is not present in the icon map
- **THEN** only the `<h2>` text MUST be rendered (no icon, no broken layout)

### Requirement: Skill and technology chips MUST default to a neutral, design-token palette
The frontend SHALL render Core Skills chips and Experience technology chips using a neutral chip class backed by the existing design tokens (`--surface-2`, `--text`, `--border`), and MUST keep the primary-tinted chip variant available only as an explicit opt-in, so the page no longer reads as predominantly tinted.

#### Scenario: Core Skills chips use the neutral variant
- **WHEN** the Core Skills section renders any skill chip
- **THEN** the chip MUST use the neutral chip class (`surface-2` background, `border-border` border, `text` foreground)
- **AND** the chip MUST NOT depend on hardcoded Tailwind palette colors such as `slate-200` or `bg-white`

#### Scenario: Experience technology chips use the neutral variant
- **WHEN** an Experience entry renders its `technologies` chips
- **THEN** every chip MUST use the same neutral chip class as Core Skills
- **AND** chip text MUST achieve at least WCAG AA contrast (≥ 4.5:1 for body text, ≥ 3:1 for non-text indicators) against the chip background in both light and dark themes

### Requirement: Dark theme MUST NOT be broken by hardcoded `bg-white` logo wells
The Experience timeline SHALL wrap company logos in a theme-aware light surface that integrates visually with the dark theme rather than rendering as a stark `bg-white` square, while keeping the logo asset itself readable.

#### Scenario: Logo wells in dark theme use a softened surface
- **WHEN** the user views the Experience timeline with the dark theme active
- **THEN** the logo wrappers MUST NOT use the literal `bg-white` Tailwind utility
- **AND** the logo background MUST be a softened light surface (e.g. `bg-slate-100`) so it integrates with the surrounding card surface without overpowering it

#### Scenario: Logo wells in light theme remain readable
- **WHEN** the user views the Experience timeline with the light theme active
- **THEN** the logo wrappers MUST keep a light background that matches the surrounding card visually
- **AND** the logo asset MUST remain fully visible without contrast issues

### Requirement: Section components MUST use semantic border tokens, not literal palette values
The frontend SHALL replace every literal `border-slate-*` (and equivalent palette literals) used for section dividers, chip borders, and card borders with the semantic `border-border` token so that light/dark consistency follows the design-system contract.

#### Scenario: CoreSkillsSection group cards use the semantic border token
- **WHEN** the Core Skills section renders its category cards
- **THEN** each card MUST use `border-border` for its border in both light and dark themes
- **AND** no `border-slate-*` literal MUST appear in the rendered class list

### Requirement: Theme toggle transitions MUST NOT lag every interaction
The frontend SHALL scope the cross-theme color transition so it is applied only during a deliberate theme change, removing the global `*` transition rule from `globals.css` and replacing it with an opt-in class added by `ThemeToggle` for the duration of the transition only.

#### Scenario: Hover and scroll interactions are not delayed by theme transitions
- **WHEN** the user hovers a chip, a card, or a nav link without changing the theme
- **THEN** the visual response (color, border, shadow) MUST be effectively instant
- **AND** the page MUST NOT carry a global `* { transition: ... }` rule that applies to non-theme interactions

#### Scenario: Theme toggle still animates background and color smoothly
- **WHEN** the user toggles between light and dark themes
- **THEN** background-color, color, border-color, and box-shadow MUST animate over approximately 300ms across all elements affected by the theme change
- **AND** the opt-in class MUST be removed within ~350ms of the toggle so that subsequent hover interactions are no longer animated by it
