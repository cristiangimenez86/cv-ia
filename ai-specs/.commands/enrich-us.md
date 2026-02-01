Input: $ARGUMENTS

Your job: turn a rough idea into a high-quality SDD spec for CV.

## Output
Create or update:
- `ai-specs/specs/<NNNN>-<slug>/spec.md`
- `ai-specs/specs/<NNNN>-<slug>/tasks.md`

## Requirements
- Follow `ai-specs/specs/documentation-standards.mdc`.
- Specs must be clear, testable, and scoped.
- Tasks must be **baby steps**: one change per task, with a verification step.

## spec.md must include
- Goal
- Scope (included + excluded)
- Acceptance Criteria (pass/fail)
- Constraints (architecture, bilingual, no secrets in frontend, CV-context-only chat)
- Verification

## tasks.md must include
A short sequential list. Each task ends with a verification command, for example:
- Frontend: `yarn lint`, `yarn build`
- Backend: `dotnet build Services.slnx` (or project-only build)
