## Context

CV-IA has clear product and API targets, but the implementation baseline is incomplete and fragmented across frontend, backend, and infra. This change needs a minimal but production-aligned scaffold that can run end-to-end in local environments and CI, while preserving ATS-first rendering constraints and backend-owned AI boundaries.

Current state highlights:
- Frontend and backend exist, but integration conventions are not yet fully standardized.
- `/health` is the only implemented endpoint in the target API contract.
- Docker is required for parity and future pgvector-backed features.

## Goals / Non-Goals

**Goals:**
- Provide a consistent bootstrap for frontend, backend, and infra with deterministic run commands.
- Define a minimal integration slice (frontend -> backend health) without violating API boundaries.
- Establish baseline validation flow (lint, build, tests, compose up) for local and CI use.
- Keep content as source of truth and avoid hardcoded CV data.

**Non-Goals:**
- Full implementation of `/api/v1/cv`, `/api/v1/cv/sections`, or `/api/v1/chat/completions`.
- RAG ingestion pipelines, embeddings lifecycle, or citation generation behavior.
- Production deployment topology, autoscaling, or advanced observability stack.

## Decisions

1. **Single workspace bootstrap contract across both services**
   - Decision: Define shared developer entrypoints and per-service scripts so contributors can build/run/test with a predictable command set.
   - Rationale: Reduces onboarding friction and prevents drift between frontend/backend workflows.
   - Alternative considered: Keep independent service conventions. Rejected due to higher coordination cost.

2. **Backend as sole API and AI boundary**
   - Decision: Frontend only calls backend endpoints (starting with health/status), never OpenAI directly.
   - Rationale: Enforces security and architecture constraints already defined in project context.
   - Alternative considered: Temporary frontend direct calls for speed. Rejected due to policy and secret exposure risk.

3. **Docker-first local orchestration**
   - Decision: Use compose-based baseline for dependencies and service startup checks.
   - Rationale: Matches target runtime assumptions and enables future pgvector integration without rework.
   - Alternative considered: Native-only local setup. Rejected because environment drift risk is higher.

4. **Incremental delivery via vertical slice**
   - Decision: Ship scaffold with health integration only, then layer CV/chat features in later changes.
   - Rationale: Keeps scope controlled and verifiable while unblocking downstream work.
   - Alternative considered: Scaffold + full API implementation in one change. Rejected as too broad.

## Risks / Trade-offs

- [Risk] Script and tooling divergence between services over time -> Mitigation: define and enforce canonical command matrix in CI checks.
- [Risk] Docker setup complexity slows first run on contributor machines -> Mitigation: document minimal quickstart and provide health-based readiness checks.
- [Risk] Over-scaffolding before feature work adds ceremony -> Mitigation: keep artifacts intentionally minimal and focused on unblockers.
- [Risk] Ambiguous ownership of shared configs -> Mitigation: clearly separate frontend/backend ownership with explicit interfaces.
