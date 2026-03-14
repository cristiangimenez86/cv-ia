# Markdown-Driven CV Rendering Specification

## Purpose
Define how locale CV pages are rendered from markdown and metadata sources so content remains canonical, deterministic, and locale-consistent.

## Requirements
### Requirement: Locale CV pages MUST render from markdown content source
The frontend MUST render `/en` and `/es` CV pages from `/content/{en|es}/sections/*.md` and locale metadata in `content/site.json`, without hardcoded CV body content in UI components.

#### Scenario: Locale page build with markdown source
- **WHEN** the frontend builds or server-renders a locale CV route
- **THEN** section bodies are derived from locale markdown files and section order/profile metadata are derived from `content/site.json`
- **AND** the rendered page does not depend on client-side data fetching to populate core CV content

### Requirement: Content structure MUST preserve stable section mapping
The rendering pipeline MUST map markdown files to stable section IDs and preserve the required section order for both locales.

#### Scenario: Stable section mapping across locales
- **WHEN** EN and ES locale pages are rendered
- **THEN** both pages include the same section ID set and canonical ordering required by product docs
- **AND** missing or mismatched section IDs fail verification
