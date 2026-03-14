## Context

The live bilingual CV content shows quality inconsistencies in the ES locale: mixed-language bullets, uneven terminology, and compact technology lists that are harder to parse. The project architecture already treats `/content` as the single source of truth and renders locale pages from markdown, so the change should be content-first and non-invasive to runtime behavior.

Stakeholders are recruiters/ATS parsers (primary) and technical interviewers (secondary). The design must improve readability and machine parsing without changing API schemas or UI layout.

## Goals / Non-Goals

**Goals:**
- Enforce single-language consistency per locale section (especially `/content/es/sections/*`).
- Normalize markdown list formatting for ATS-friendly keyword extraction.
- Improve selected experience bullets to emphasize outcomes and ownership using existing facts only.
- Keep frontend and backend ingestion behavior compatible with current content mapping.

**Non-Goals:**
- Redesign frontend components or visual layout.
- Introduce new backend endpoints or schema changes.
- Add unverifiable metrics, achievements, or timeline changes.

## Decisions

### Decision: Treat this as a content-spec change, not an architecture change
- **Rationale:** Existing rendering/aggregation pipeline already supports bilingual markdown.
- **Alternative considered:** Modify parsing logic in frontend/backend.
- **Why not chosen:** Adds implementation risk for a problem caused by source content quality.

### Decision: Add explicit locale-consistency and ATS-format requirements in specs
- **Rationale:** Quality guardrails should be contract-level so future edits do not reintroduce mixed-language content.
- **Alternative considered:** Keep quality checks informal in documentation.
- **Why not chosen:** Informal guidance is less enforceable and easier to regress.

### Decision: Use structured bullet/list normalization for technologies and achievements
- **Rationale:** Comma-separated or list-based formatting improves ATS tokenization and recruiter scanning speed.
- **Alternative considered:** Preserve free-form compact text.
- **Why not chosen:** Compact text is less parseable and less readable.

## Risks / Trade-offs

- **[Risk]** Over-editing may alter meaning of prior achievements.  
  **Mitigation:** Rewrite only for clarity and consistency; preserve factual claims and scope.
- **[Risk]** EN/ES drift if one locale is improved more than the other.  
  **Mitigation:** Verify section-level parity and align terminology where content intends the same claim.
- **[Trade-off]** Stricter wording rules may reduce stylistic flexibility.  
  **Mitigation:** Prioritize parser/recruiter clarity over stylistic variation for core CV sections.

## Migration Plan

1. Update proposal-linked specs for new and modified capabilities.
2. Apply content edits in `content/es/sections/*` (and EN alignment only where needed for parity).
3. Run frontend build/verification to confirm content renders correctly in `/es` and `/en`.
4. Rollback strategy: revert content-only changes by commit if any rendering or consistency regression appears.

## Open Questions

- Should EN wording be strictly mirrored to ES for all rewritten bullets, or only for shared high-priority sections?
- Do we need a lightweight automated check for mixed-language tokens per locale in the verification workflow?
