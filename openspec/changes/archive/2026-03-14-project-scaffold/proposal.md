## Why

The repository has architecture and API contracts defined, but no production-ready baseline that ties frontend, backend, content, and local infrastructure into one runnable system. Creating a scaffold now reduces integration risk and gives a stable foundation for iterative feature delivery.

## What Changes

- Define a runnable **both services** scaffold with consistent local developer workflow (frontend + backend + infra).
- Add project conventions for content loading, API wiring, and environment variable handling aligned with existing docs.
- Establish baseline CI checks and local verification commands to validate build, lint, tests, and container startup.
- Provide minimal vertical slice wiring for `GET /health` and frontend-to-backend connectivity without introducing full CV/chat behavior.

## Capabilities

### New Capabilities
- `workspace-bootstrap`: Standardized project structure, scripts, and configuration for frontend, backend, and Docker-based local services.
- `service-integration-baseline`: Initial contract-safe integration between frontend and backend with health/status visibility.
- `developer-verification-workflow`: Repeatable commands and checks for build/test/lint/run in local and CI contexts.

### Modified Capabilities
- None.

## Impact

- **Frontend**: app bootstrap configuration, API client baseline, environment management.
- **Backend**: startup configuration, health endpoint alignment, local config defaults.
- **Both services**: shared run/build/test scripts and validation expectations.
- **Infrastructure**: docker-compose baseline for app dependencies and local run orchestration.
- **Dependencies**: potential addition of lightweight tooling for lint/test orchestration.

## Non-goals

- Implementing full CV aggregation endpoints (`/api/v1/cv*`).
- Implementing RAG ingestion, embeddings, or chat completion logic.
- Final production hardening, observability, and deployment automation.
