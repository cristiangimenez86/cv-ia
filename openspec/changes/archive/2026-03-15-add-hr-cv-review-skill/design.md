## Context

This change introduces a project-level Cursor skill focused on CV review from a Senior HR and ATS perspective. The repository already includes technical workflows, but lacks a reusable review process for employability-focused content quality across bilingual CV materials.

The implementation is documentation-driven (skill markdown files) and does not modify runtime services. Constraints include: concise instructions, deterministic output structure, and explicit ATS checks aligned with recruiter expectations.

## Goals / Non-Goals

**Goals:**
- Provide a reusable skill under `.cursor/skills/` for HR-grade CV analysis.
- Standardize a rubric-based review with measurable scoring and priority levels.
- Produce output that is directly actionable (diagnosis, risks, fix list, rewrite examples).
- Support role-targeted feedback for different job applications.

**Non-Goals:**
- Automatic edits to source CV content files.
- Region-specific legal or compensation advice.
- Changes to frontend rendering, backend APIs, or RAG retrieval logic.

## Decisions

1. **Create a project skill (`.cursor/skills/hr-cv-review/SKILL.md`)**
   - **Why**: Keeps the capability versioned with the repository and available to all collaborators.
   - **Alternative considered**: Personal skill (`~/.cursor/skills/`) was rejected because it is not shared in-team.

2. **Use a fixed review output contract**
   - **Why**: Predictable structure improves usability and comparison across revisions.
   - **Alternative considered**: Fully free-form feedback was rejected due to inconsistent quality and prioritization.

3. **Separate stable rubric from optional examples**
   - **Why**: Keeps `SKILL.md` concise while allowing extensibility.
   - **Alternative considered**: Single large file was rejected to avoid bloated prompts and maintainability issues.

4. **Include ATS and recruiter lenses in one pass**
   - **Why**: Real-world hiring combines parser constraints and human screening.
   - **Alternative considered**: Two separate skills was rejected to reduce switching overhead for the user.

## Risks / Trade-offs

- **[Risk] Overly generic advice for specialized roles** -> **Mitigation**: Require role target and seniority context in the input section.
- **[Risk] Skill output verbosity** -> **Mitigation**: Define hard output sections and concise bullet limits.
- **[Risk] Subjective scoring drift** -> **Mitigation**: Use explicit scoring dimensions and definitions.
- **[Risk] Mixed-language feedback confusion** -> **Mitigation**: Instruct skill to mirror user language while preserving role keywords as provided.

## Migration Plan

1. Add new skill directory and `SKILL.md`.
2. Add optional supporting reference files (`rubric.md`, `examples.md`) if needed.
3. Validate discoverability by prompting for CV review in both Spanish and English.
4. No deployment or rollback procedure is required because there are no runtime service changes.

## Open Questions

- Should the skill enforce a single scoring scale (0-100) or support both percentage and letter grades?
- Should the skill include a stricter ATS keyword-match matrix for each target job description by default?
