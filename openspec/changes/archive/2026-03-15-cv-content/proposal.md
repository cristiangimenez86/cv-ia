## Why

The current published CV content in Spanish is partially mixed with English and has inconsistent ATS formatting in skills and experience bullets. This reduces recruiter trust and may lower keyword parsing quality for the Spain market.

## What Changes

- Update CV content files for `es` locale to ensure language consistency, professional tone, and ATS-readable formatting.
- Standardize skill and technology lists with clear separators and stable wording for parser compatibility.
- Strengthen selected experience bullets to emphasize outcomes and ownership without introducing new facts or metrics.
- Keep frontend rendering and backend API contract compatible with existing bilingual content flow.

## Capabilities

### New Capabilities
- `cv-content-quality-optimization`: Defines content quality standards for bilingual CV text focused on ATS readability and recruiter clarity, with explicit ES locale consistency rules.

### Modified Capabilities
- `markdown-driven-cv-rendering`: Tighten requirements for locale consistency and parser-friendly list formatting in markdown content consumed by frontend and backend.
- `ats-ssg-cv-guardrails`: Extend ATS guardrails to include prohibited mixed-language sections within a single locale.

## Impact

- **Frontend:** No component redesign expected; consumes improved markdown text and structure.
- **Backend:** No endpoint changes expected; uses updated content source with cleaner locale data.
- **Content:** `content/es/sections/*` and potentially mirrored wording alignment in `content/en/sections/*`.
- **Dependencies/Systems:** No new runtime dependencies.

## Non-goals

- Redesigning UI layout or visual styles.
- Changing public API schemas.
- Adding new professional achievements or unverifiable metrics.
