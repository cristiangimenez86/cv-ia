## 1. Frontend Container Baseline

- [x] 1.1 Create or adapt `frontend/Dockerfile` from the existing `web` Dockerfile pattern, updating paths from `apps/web` assumptions to `/frontend`.
- [ ] 1.2 Validate local Docker build with repository-root context and `frontend/Dockerfile` (`docker build -f frontend/Dockerfile .`) so `/content` is available.
- [ ] 1.3 Ensure the resulting image can run with expected frontend startup command and exposes the expected port.

## 2. GitHub Actions Deployment Workflow

- [x] 2.1 Add a dedicated workflow file (separate from verification CI) triggered only on `push` to `main`.
- [x] 2.2 Implement Docker Hub auth and image publish steps using `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` with target tag `cristiangimenez86/cv-web:latest`.
- [x] 2.3 Enforce fail-fast stage ordering so Portainer redeploy runs only after successful build and push.

## 3. Portainer Redeploy Integration

- [x] 3.1 Implement authenticated Portainer API call using `PORTAINER_URL` and `PORTAINER_TOKEN` to recreate stack ID `3` via `/api/stacks/3/recreate` or equivalent supported endpoint.
- [x] 3.2 Validate request payload/query contract and treat non-2xx responses as deployment failures.
- [x] 3.3 Add workflow logging around redeploy request/response status for operational troubleshooting.

## 4. Documentation and Verification

- [x] 4.1 Document required GitHub repository secrets and expected `main`-only deployment behavior in project docs.
- [x] 4.2 Verify workflow YAML syntax and trigger behavior (deploy on main push; no deploy on PR events).
- [ ] 4.3 Execute local validation commands for frontend container baseline and confirm no regressions in existing verification workflow (`npm run verify`).
