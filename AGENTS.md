# CV-IA Agent Instructions

## Project goal
Build a bilingual (es/en) CV website with a public chat that answers strictly from CV content.

## Architecture (non-negotiable)
- Frontend: Next.js (App Router) in `/apps/web`
- Backend: .NET 10 API in `/services/CV.Api`
- CV content: filesystem data under `/content/es` and `/content/en` (Markdown/JSON)
- The frontend must never call OpenAI directly (no secrets in the browser). OpenAI keys live only in the backend.

## Working style
- Baby steps only: one small change at a time.
- Do not assume missing info; ask before deciding.
- Every change must include a clear verification command (build/test/lint or minimal manual check).

## Language policy
- All technical artifacts are English-only (code, docs, logs, configs, tests, commit messages).
- CV content is bilingual only under `/content/{es|en}`.

## Verification commands
Frontend (`/apps/web`):
- `yarn lint`
- `yarn build`

Backend (`/services` when solution exists):
- `dotnet build Services.slnx`
- `dotnet test Services.slnx`

Or backend project-only (`/services/CV.Api`):
- `dotnet build`

## Standards reference
- Base: `ai-specs/specs/base-standards.mdc`
- Backend: `ai-specs/specs/backend-standards.mdc`
- Frontend: `ai-specs/specs/frontend-standards.mdc`
- Docs: `ai-specs/specs/documentation-standards.mdc`
