## Why

Frontend deployment is currently manual after code is merged, which slows delivery and increases drift risk between `main` and production. We need an automated, deterministic deployment path that runs only for `push` to `main`.

## What Changes

- Add a **GitHub Actions deployment workflow** (service affected: frontend) triggered only on `push` to `main` (no deploy on PRs).
- Build Docker image from `frontend/Dockerfile` using repository root as build context so `/content` is available during build.
- Push image to Docker Hub as `cristiangimenez86/cv-web:latest` using `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN`.
- Trigger Portainer redeploy for stack ID `3` via API (`/api/stacks/3/recreate` or equivalent) using `PORTAINER_URL` and `PORTAINER_TOKEN`.
- Add failure-safe workflow behavior for auth/build/push/redeploy stages with clear step-level logs.

## Capabilities

### New Capabilities
- `frontend-mainline-auto-deploy`: Automate frontend container build, publish, and Portainer stack recreation on `push` to `main` only.
- `frontend-container-build-context`: Define frontend image build contract that uses `frontend/Dockerfile` with repository-root context to include `/content`.
- `portainer-stack-redeploy-trigger`: Define authenticated Portainer API redeploy invocation for stack ID `3` after successful image push.

### Modified Capabilities
- None.

## Impact

- **Frontend**: deployment pipeline and container build path become automated and standardized.
- **Infrastructure/CI**: new deploy workflow in GitHub Actions and required repository secrets.
- **Operations**: Portainer stack refresh becomes API-driven and tied to successful image publication.

## Non-goals

- Deploying backend services or adding multi-environment release promotion.
- Triggering deployments from pull requests, tags, or non-`main` branches.
- Changing CV rendering/content architecture beyond what is required for frontend container build and deploy.
