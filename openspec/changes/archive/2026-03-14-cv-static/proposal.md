## Why

The current `/frontend` diverges from the live CV and from the exact visual contract now documented in `docs/product/visual-spec.md`. Rebuilding it from `/web` is needed to restore visual parity quickly and safely while keeping ATS-critical SSR/SSG behavior and content sourced from `/content/{en|es}/sections/`.

## What Changes

- Reimplement **frontend** UI from scratch by copying canonical assets/components/styles from `/web` into `/frontend`:
  - `/web/src/app/globals.css` -> `/frontend/src/app/globals.css`
  - `/web/src/components/` -> `/frontend/src/components/` (import/path adaptation only)
  - `/web/public/` -> `/frontend/public/`
  - `/web/tailwind.config.ts` -> `/frontend/tailwind.config.ts`
  - `/web/src/app/[locale]/` -> `/frontend/src/app/[locale]/`
- Wire **frontend** content loading to `/content/{en|es}/sections/*.md` and `content/site.json` with no hardcoded CV text.
- Preserve **frontend** ATS non-negotiables: SSR/SSG-only CV content, semantic HTML, visible content, locale-correct `<html lang>`.
- Update **both services** verification contracts/checks where section IDs and frontend output assumptions are validated.

## Capabilities

### New Capabilities
- `web-parity-frontend-rebuild`: Recreate frontend design and component behavior by reusing `/web` implementation and assets without inventing new styles/components.
- `markdown-driven-cv-rendering`: Render EN/ES CV routes from `/content/{en|es}/sections/` and `content/site.json` as the single source of truth.
- `ats-ssg-cv-guardrails`: Enforce SSR/SSG-only rendering and ATS semantic constraints for all core CV sections.

### Modified Capabilities
- `developer-verification-workflow`: Expand verification to ensure rebuilt frontend parity, locale routes, and ATS checks are enforced in local/CI workflows.
- `service-integration-baseline`: Keep frontend/backend contracts aligned after the frontend rebuild (section IDs, readiness assumptions, and integration checks).

## Impact

- **Frontend**: full UI replacement, routing/layout/components/styles/assets, content-loading integration.
- **Backend**: no feature expansion; only compatibility checks impacted.
- **Both services**: validation workflows, contract checks, and CI expectations updated for rebuilt frontend behavior.

## Non-goals

- Designing new components, tokens, interactions, or visual experiments not present in `/web` and `docs/product/visual-spec.md`.
- Implementing new backend API features (chat/RAG/CV endpoints) beyond existing contract alignment checks.
- Altering content model ownership away from `/content` Markdown + `content/site.json`.
