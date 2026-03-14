# Header Design — Visual Specifications

Reference: design mockup for CV header (light theme).

## Structure

- **Left**: Name (primary) + title/headline (secondary)
- **Right**: Nav links + Download PDF button + Locale toggle + Theme toggle

## Colors (light theme)

| Element | Value |
|---------|-------|
| Background | White (#FFFFFF) |
| Top border | Dark gray (#333333) |
| Bottom border | Light gray (#E2E8F0) |
| Primary text (name, links) | Dark blue-gray (#1A202C) |
| Secondary text (title) | Medium gray (#718096) |
| Accent (active nav, primary button) | Blue (#4285F4) |
| Primary button text | White (#FFFFFF) |

## Button styles

### Primary (Download PDF)

- Background: blue (--primary)
- Text: white (--primary-foreground)
- Rounded corners (8px / rounded-lg)
- Subtle drop shadow
- Font: semibold

### Secondary (Locale, Theme)

- Background: white (--surface)
- Border: 1px solid #E2E8F0 (--border)
- Rounded corners (8px / rounded-lg)
- Square or compact pill shape
- Height: 36px (h-9)

## Nav links

- Default: dark text, no underline
- Hover: primary color, underline
- **Active**: blue underline 2–3px, ~70–80% of text width
- Active state driven by scroll-spy (IntersectionObserver)

## Icons

- **Theme toggle**: Moon icon (dark mode) / Sun icon (light mode)
- Use lucide-react (Moon, Sun components)

## Typography

- Name: large, bold (text-xl font-semibold)
- Title: smaller, regular (text-sm), muted color
- Nav links: medium size (text-sm), regular weight
- Download PDF: medium, semibold
- Locale label (EN/ES): medium, regular

## Borders

- Top: thin dark line for visual separation
- Bottom: thin light line (--border)
