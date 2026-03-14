## Context

Frontend deployment currently depends on manual steps after merge, which introduces delay and operator error risk. The requested scope is a mainline-only delivery path: build from `frontend/Dockerfile` with repository-root context (so `/content` is present), push `cristiangimenez86/cv-web:latest`, then trigger Portainer stack `3` redeploy through API.

This is cross-cutting across frontend packaging, CI credentials, and deployment orchestration, with security-sensitive secret handling and environment-side effects.

## Goals / Non-Goals

**Goals:**
- Add a dedicated GitHub Actions deploy workflow that runs only on `push` to `main`.
- Build the frontend image using root context + `frontend/Dockerfile`, aligned with the existing `web` Dockerfile pattern adapted to `/frontend`.
- Publish the image to Docker Hub using repository secrets.
- Trigger authenticated Portainer stack recreation for stack ID `3` after successful image push.
- Ensure clear step ordering and fail-fast behavior (no redeploy if build/push fails).

**Non-Goals:**
- Deploying backend services or introducing multi-environment promotion.
- Deploying from PRs, tags, or non-main branches.
- Reworking app functionality, UI, or content model as part of CI/CD setup.

## Decisions

1. **Separate deploy workflow from existing CI verify workflow**
   - Rationale: verification and deployment have different triggers and risk profiles.
   - Alternative: extend current `ci.yml` with deploy job. Rejected to avoid accidental deploy coupling to PR checks.

2. **Use Docker Buildx + Docker login action with secrets**
   - Rationale: standard, auditable GH Actions pattern for Docker Hub publishing.
   - Alternative: raw shell `docker build`/`docker push`. Rejected due to weaker portability/maintainability.

3. **Portainer redeploy via API call after successful push**
   - Rationale: guarantees stack refresh consumes latest image tag after publication.
   - Alternative: webhook-only redeploy. Rejected because explicit API contract is required in this change.

4. **Pinned deploy trigger**
   - Rationale: `on.push.branches: [main]` enforces no deploy on PRs as non-negotiable.
   - Alternative: `workflow_run` from CI. Rejected as unnecessary complexity for current scope.

## Risks / Trade-offs

- [Risk] `latest` tag mutability can make rollback harder -> Mitigation: keep workflow extensible for immutable tag addition later.
- [Risk] Portainer endpoint variant differences (`/recreate` payload expectations) -> Mitigation: encode endpoint/payload explicitly and validate response status in workflow.
- [Risk] Missing/invalid secrets cause deployment failures -> Mitigation: fail-fast checks and explicit secret documentation.

## Migration Plan

1. Create frontend-adapted Dockerfile from `web` baseline and validate local build with root context.
2. Add `deploy-frontend.yml` workflow with main-only trigger and ordered steps (checkout, login, build/push, Portainer redeploy).
3. Add/revise docs for required GitHub secrets and expected deployment behavior.
4. Validate workflow syntax and dry-run logic checks before merging.
5. Merge to `main` to activate automated deployment.

## Open Questions

- Which Portainer API variant is active in the target instance (`/api/stacks/3/recreate` query/body requirements)?
- Should redeploy force image pull options be explicitly set in request parameters for stack `3`?
