## Why

Recruiters and ATS systems evaluate CVs with different criteria than technical reviewers, and current project workflows do not provide a specialized HR-quality review assistant. Adding a dedicated skill now improves feedback quality for CV content before publishing updates to the bilingual CV.

## What Changes

- Add a new project skill for structured CV analysis from a Senior HR perspective, with ATS-aware checks and actionable rewrite guidance.
- Define a consistent evaluation rubric (clarity, impact, relevance, ATS compatibility, language quality, risk flags) and scoring model.
- Standardize output format to include overall diagnosis, strengths, issues, prioritized fixes, and rewritten bullet examples.
- Scope impact to repository documentation and skill assets only (no frontend/backend runtime behavior changes).

## Capabilities

### New Capabilities
- `hr-cv-review-skill`: Provides a reusable Cursor skill that reviews CV content as a Senior HR evaluator and returns actionable, prioritized improvements.

### Modified Capabilities
- None.

## Impact

- **Service affected**: both (indirectly, through shared authoring workflow and content quality process).
- New files under `.cursor/skills/hr-cv-review/`.
- OpenSpec change artifacts under `openspec/changes/add-hr-cv-review-skill/`.
- No API, database, or deployment changes.

## Non-goals

- Building an automatic CV rewriter that edits production content without user confirmation.
- Changing `frontend` rendering, `backend` endpoints, or RAG behavior.
- Replacing domain-specific reviews for legal, salary, or region-specific labor compliance.
