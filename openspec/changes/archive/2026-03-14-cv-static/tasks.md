## 1. Frontend Baseline Copy from `web`

- [x] 1.1 Copy `/web/src/app/globals.css` into `/frontend/src/app/globals.css` and align frontend app structure with copied route conventions.
- [x] 1.2 Copy `/web/tailwind.config.ts` into `/frontend/tailwind.config.ts` and adjust only project path globs/import references needed for frontend build.
- [x] 1.3 Copy `/web/public/` assets into `/frontend/public/` and verify referenced image/icon paths resolve in locale pages.

## 2. Component and Route Migration

- [x] 2.1 Copy `/web/src/components/` into `/frontend/src/components/` and adapt imports/aliases without changing component visual behavior.
- [x] 2.2 Copy `/web/src/app/[locale]/` into `/frontend/src/app/[locale]/` and adapt route wiring to frontend app directory structure.
- [x] 2.3 Keep component/layout parity with `docs/product/visual-spec.md` and remove any conflicting legacy frontend implementations.

## 3. Markdown Content Wiring

- [x] 3.1 Replace hardcoded CV data wiring with server/build-time loaders reading `content/site.json` and `/content/{en|es}/sections/*.md`.
- [x] 3.2 Ensure locale pages (`/en`, `/es`) render required section order and stable section IDs from shared contract files.
- [x] 3.3 Verify no core CV content relies on client-side fetching/hydration to appear in initial HTML.

## 4. ATS and Integration Guardrails

- [x] 4.1 Ensure locale-correct document semantics (`<html lang>`, section headings/lists, visible DOM text) for both routes.
- [x] 4.2 Update/align verification scripts and docs for rebuilt frontend checks (ATS, locale pages, section-id contract, health readiness).
- [x] 4.3 Update CI verification steps so parity/ATS regressions in rebuilt frontend fail the pipeline.

## 5. Verification

- [x] 5.1 Run frontend verification: `npm run lint:frontend && npm run build:frontend && npm run verify:cv:ats && npm run verify:cv-pages`.
- [x] 5.2 Run contract/integration verification: `npm run verify:section-ids && npm run verify:health`.
- [x] 5.3 Run full project verification: `npm run verify` and confirm EN/ES pages preserve visual/structural parity expectations.
