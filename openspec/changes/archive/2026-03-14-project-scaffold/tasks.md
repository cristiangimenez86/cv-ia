## 1. Workspace Bootstrap

- [x] 1.1 Create/update root-level developer scripts to install, run, and stop frontend/backend consistently.
- [x] 1.2 Define environment template files and configuration loading rules for frontend and backend startup defaults.
- [x] 1.3 Add/update Docker Compose baseline in `infra` for required local dependencies and service networking.
- [x] 1.4 Write bootstrap documentation with exact first-run commands for dependency install and local startup.
- [x] 1.5 Verify workspace bootstrap with exact commands: `docker compose -f infra/docker-compose.yml up -d`, frontend run command, backend run command, and `docker compose -f infra/docker-compose.yml down`.

## 2. Service Integration Baseline

- [x] 2.1 Implement/confirm backend `GET /health` response shape remains stable and machine-readable for checks.
- [x] 2.2 Add frontend API client configuration for backend base URL via environment variables.
- [x] 2.3 Implement frontend health request flow with explicit healthy/unhealthy UI states and safe error handling.
- [x] 2.4 Enforce boundary rule that frontend calls backend endpoints only (no direct OpenAI client usage).
- [x] 2.5 Verify integration slice with exact commands: start both services, run `curl http://localhost:<backend-port>/health`, and confirm frontend renders the corresponding status state.

## 3. Developer Verification Workflow

- [x] 3.1 Define canonical verification command matrix for frontend and backend lint/build/test stages.
- [x] 3.2 Add CI workflow steps that execute the same command matrix with fail-fast non-zero exit behavior.
- [x] 3.3 Document verification commands in contributor-facing docs with copy-paste-ready syntax.
- [x] 3.4 Add integration readiness check step that validates backend health after startup in local and CI flow.
- [x] 3.5 Verify workflow end-to-end by executing documented commands for lint, build, tests, compose startup, and health check in sequence.
