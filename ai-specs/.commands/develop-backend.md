You are working on CV.

Input: $ARGUMENTS

Interpret $ARGUMENTS as one of:
- a spec folder under `ai-specs/specs/<NNNN>-<slug>` (preferred), or
- a short description of the change.

## Workflow (baby steps)
1) Identify the active task from `ai-specs/specs/<NNNN>-<slug>/tasks.md` (or create the minimal next task if missing).
2) Make **one small change** in the backend (`services/CV.Api`) that satisfies only that task.
3) Keep all technical artifacts in **English**.
4) Do not add dependencies unless explicitly requested by the user.

## Backend rules
- Follow `ai-specs/specs/base-standards.mdc` and `ai-specs/specs/backend-standards.mdc`.
- No secrets in the frontend; OpenAI keys stay backend-only.
- Use `ProblemDetails` for errors and include `traceId` as an extension field when available.

## Verification (must include)
Run one of:
- From `services/`: `dotnet build Services.slnx`
- Or from `services/CV.Api`: `dotnet build`

Then report:
- What changed (files)
- What task is now complete
- What to do next (the next single task)
