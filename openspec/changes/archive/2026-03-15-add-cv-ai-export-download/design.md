## Context

The profile card currently shows a "Download JSON" button but does not trigger a real export. External AI tools need a deterministic machine-readable payload that can be consumed without scraping HTML or parsing markdown manually.

This change is frontend-first because locale site config and section content are already loaded in the page runtime. The export can be generated client-side from the canonical loaded data and downloaded as a file.

## Goals / Non-Goals

**Goals:**
- Implement a working locale-aware JSON download from the existing profile card action.
- Define a stable AI-oriented JSON schema with explicit metadata, profile, and section payloads.
- Ensure export content remains aligned with the same locale content rendered in the page.

**Non-Goals:**
- Generating PDF files.
- Adding a new backend export endpoint.
- Adding vendor-specific AI formats or proprietary schemas.

## Decisions

### Decision: Use JSON as the primary export format
- **Rationale:** JSON is deterministic, easy to parse, and most interoperable for external AI pipelines.
- **Alternative considered:** Markdown-only export.
- **Why not chosen:** Markdown is less structured for downstream automation and schema validation.

### Decision: Generate export on the client from loaded locale data
- **Rationale:** Reuses existing data flow and avoids backend/API expansion.
- **Alternative considered:** Server endpoint for export.
- **Why not chosen:** Adds complexity and operational surface with limited benefit for v1.

### Decision: Include both `markdown` and normalized `plainText` per section
- **Rationale:** Supports mixed AI workflows (raw section fidelity + easier text indexing).
- **Alternative considered:** Only markdown or only plain text.
- **Why not chosen:** Single representation limits interoperability for consumers.

## Risks / Trade-offs

- **[Risk]** Export schema drift over time.  
  **Mitigation:** Include `version` and keep field names stable; update via spec changes.
- **[Risk]** Filename collisions across locales.  
  **Mitigation:** Locale-aware filename convention (`cv.<locale>.ai.json`).
- **[Trade-off]** Client-side generation exposes exactly what is rendered, not hidden internal metadata.  
  **Mitigation:** Keep schema intentionally focused on CV content and metadata needed by AI consumers.

## Migration Plan

1. Add export serializer utility and wire it to the profile card "Download JSON" action.
2. Emit locale-aware filename and download blob in browser.
3. Verify output structure manually for EN and ES.
4. Run frontend lint and section verification checks.

## Open Questions

- Should we also expose a markdown download in v1 for human sharing, or keep JSON-only for now?
- Do we want an optional `sourceCommit` field in the export metadata?
