# Theme Tokens — CV (Light/Dark)

## Goals
- Neutral, modern palette (Portainer/ChatGPT-like): graphite surfaces, subtle borders, minimal glow.
- ATS-first: keep contrast strong and typography readable.
- Theme is defined via CSS variables (tokens) and consumed through Tailwind semantic colors.

## Token Strategy
- Define the default Copper tokens in `frontend/src/app/globals.css` and alternate palettes in `frontend/src/app/palettes.css` using CSS variables.
- Use `.dark` class on `<html>` to switch theme.
- Tailwind maps semantic colors to tokens (no hardcoded blues in components).

## Appearance selector

- Dark mode and Copper remain the defaults. Moon/sun controls change the mode directly; a discreet chevron in the same control opens the accent palette popover.
- Palettes: Copper, Forest, Ocean, Plum, and Graphite. Each provides coordinated light/dark accents, backgrounds, surfaces, borders, and text colors.
- The palette is independent of light/dark mode and locale. `<html data-palette>` selects the CSS overrides for both the hexadecimal and semantic HSL tokens.
- `PaletteProvider` shares the selection between desktop and mobile controls. `cv.palette` persists it in browser storage, alongside the existing `cv.theme` preference. A bootstrap script applies the saved palette before paint; invalid or unavailable storage falls back to Copper. Keep it as the first body child so scripts inserted into the head by browser extensions do not get mistaken for this inline script during hydration.
- The popover uses native radio inputs, moves focus to the current palette, and closes on Escape, outside click, or focus leaving the control. Reset appearance restores Copper and dark mode.
- Printed CVs retain the existing light Copper palette.

## Favicon

- The favicon uses the same rounded gradient tile and Code2 symbol as the header.
- `DynamicFavicon` renders a single React-managed icon link. It reads the current CSS palette tokens after palette/theme changes and updates an SVG data URL without reloading the document.
- `frontend/public/favicon.ico` provides the default Copper icon before hydration and for direct favicon requests. Keep it outside `src/app` so Next.js does not add a second competing icon link.
- The fallback includes 16, 32, 48, 64, 128, and 256 px sizes. Generate it from `createFaviconSvg` in `frontend/src/lib/favicon.ts` so its geometry matches the live icon.

## Core Tokens
### Background & surfaces
- --bg: page background
- --surface: primary card surface
- --surface-2: secondary surface (nested cards / chips)
- --border: default border color
- --divider: subtle separators

### Text
- --text: primary text
- --muted: secondary text
- --subtle: tertiary text (placeholders, hints)

### Accent
- --primary: primary action color (use sparingly)
- --primary-contrast: text/icon on primary
- --ring: focus ring color

### Shadows
- --shadow: subtle elevation (prefer borders over heavy shadows)

## Light Theme (neutral, not blue)
- Use cool-neutral grays, soft borders, minimal shadow.
- Primary should be restrained (not saturated).

## Dark Theme (Portainer/ChatGPT-like)
- Avoid pure black. Use near-black backgrounds and graphite surfaces.
- Prefer borders and subtle gradients over glow.
- Maintain readable contrast for text and chips.

## Component Guidance
- Cards use `--surface` with `--border`.
- Chips use `--surface-2` and must remain readable in both themes.
- Buttons:
  - Primary uses `--primary`
  - Secondary uses surface + border
- Focus states must be visible in both themes (`--ring`).

## Theme Transitions
- Switching between light and dark themes uses a smooth 300 ms CSS transition on `background-color`, `border-color`, `color`, and `box-shadow` (applied globally via `*` selector in `globals.css`).
- `ThemeProvider` (next-themes) does **not** set `disableTransitionOnChange`, so the browser applies the CSS transitions when the `.dark` class toggles on `<html>`.

## Implementation Notes (non-negotiable)
- No `bg-blue-*` / `text-blue-*` (or any direct palette classes) in UI components.
- Use only semantic Tailwind classes:
  - bg-background, bg-surface, border-border, text-foreground, text-muted, bg-primary, ring-ring, etc.
