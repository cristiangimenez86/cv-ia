## Why

The CV UI already exposes a "Download JSON" action, but it is currently non-functional. Providing a machine-consumable export now enables external AI tools to parse the profile reliably without scraping rendered HTML.

## What Changes

- Implement a functional CV JSON download from the frontend profile card for the active locale (`/en` or `/es`).
- Define a stable AI-oriented export schema that includes profile metadata, section data, and normalized text fields.
- Ensure downloaded JSON filenames are locale-aware and versioned for downstream tool compatibility.
- Keep the export generated from canonical loaded content (site config + rendered sections), not duplicated hardcoded data.

## Capabilities

### New Capabilities
- `cv-ai-export-download`: Provide a user-triggered, locale-aware JSON export optimized for external AI ingestion.

### Modified Capabilities
- `markdown-driven-cv-rendering`: Extend requirements so downloaded export content remains aligned with locale markdown-rendered content.

## Impact

- **Frontend:** `ProfileCard` download action wiring, export serializer utility, and locale-aware filename generation.
- **Backend:** No API changes required for v1 (export generated from frontend-loaded content).
- **Content:** No source markdown format changes required.
- **Dependencies/Systems:** No new runtime dependencies expected.

## Non-goals

- Implementing PDF generation.
- Creating a new backend export endpoint.
- Adding proprietary AI vendor-specific payload formats.
