# Theme Tokens — CV (Light/Dark)

## Goals
- Neutral, modern palette (Portainer/ChatGPT-like): graphite surfaces, subtle borders, minimal glow.
- ATS-first: keep contrast strong and typography readable.
- Theme is defined via CSS variables (tokens) and consumed through Tailwind semantic colors.

## Token Strategy
- Define tokens in `apps/web/src/app/globals.css` using CSS variables.
- Use `.dark` class on `<html>` to switch theme.
- Tailwind maps semantic colors to tokens (no hardcoded blues in components).

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

## Implementation Notes (non-negotiable)
- No `bg-blue-*` / `text-blue-*` (or any direct palette classes) in UI components.
- Use only semantic Tailwind classes:
  - bg-background, bg-surface, border-border, text-foreground, text-muted, bg-primary, ring-ring, etc.
