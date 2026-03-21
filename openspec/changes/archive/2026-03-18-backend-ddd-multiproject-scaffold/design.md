## Context

The current backend uses `CvIa.Backend` as a single entry project with minimal API style and no stable DDD boundaries. The target API contract defines `/api/v1/cv` and `/api/v1/chat/completions`, but implementation needs a scalable structure before endpoint logic is added.

This change provides a structural foundation only: project graph, controller skeletons, middleware baseline, and test layout. It intentionally avoids business behavior so future tasks can be added incrementally without architectural rework.

## Goals / Non-Goals

**Goals:**
- Rename the entry project to `CvIa.Api` and keep API bootstrapping there.
- Establish DDD-aligned separation with `CvIa.Api`, `CvIa.Application`, `CvIa.Domain`, and `CvIa.Infrastructure`.
- Use full MVC controllers for API routes with constructor DI from Application services.
- Add global exception handling middleware for uniform error responses.
- Consolidate tests into one project with folder structure mirroring production projects.
- Ensure API components can consume `ILogger<T>` via DI.

**Non-Goals:**
- Implementing endpoint business logic.
- Adding auth/authz, telemetry, tracing, or metrics.
- Defining concrete logging providers/sinks.

## Decisions

1. **Project topology: four production projects + one tests project**
   - `CvIa.Api`: HTTP composition root, controllers, middleware.
   - `CvIa.Application`: use-case service contracts and orchestration interfaces.
   - `CvIa.Domain`: domain primitives and core business abstractions.
   - `CvIa.Infrastructure`: external adapters and implementation placeholders.
   - `CvIa.Tests`: single test assembly with folders `Api/`, `Application/`, `Domain/`, `Infrastructure/`.
   - **Alternative considered:** per-project test assemblies. Rejected to satisfy requested single test project.

2. **Controllers as thin adapters**
   - Controllers only map HTTP to service calls and hold injected Application services (`ICvQueryService`, `IChatCompletionService` placeholders) plus `ILogger<TController>`.
   - No domain/application logic in controller methods.
   - **Alternative considered:** minimal APIs. Rejected per explicit requirement.

3. **Global exception middleware in API pipeline**
   - Custom middleware catches unhandled exceptions and returns a standard error payload.
   - Middleware logs through injected `ILogger<GlobalExceptionMiddleware>`.
   - **Alternative considered:** exception filter. Rejected because middleware covers all pipeline failures consistently.

4. **No security middleware in this scaffold stage**
   - Endpoints remain unauthenticated until a dedicated security change is proposed.
   - **Alternative considered:** pre-wiring `AddAuthentication`. Rejected to avoid scope creep.

## Risks / Trade-offs

- **[Risk] Empty controller actions can drift from contract expectations** -> **Mitigation:** keep route names and DTO stubs aligned with `docs/api/api-spec.yml`, then fill behavior in later change.
- **[Risk] Single test project may grow large over time** -> **Mitigation:** enforce mirrored folder conventions and naming standards from start.
- **[Risk] Placeholder service interfaces may be over-designed too early** -> **Mitigation:** keep interfaces minimal and focused on current endpoint skeletons.

## Migration Plan

1. Create `CvIa.Api` project and move entry point from `CvIa.Backend`.
2. Create `CvIa.Application`, `CvIa.Domain`, and `CvIa.Infrastructure` projects with project references.
3. Update solution file to include new projects and remove/retire old naming.
4. Add controller skeletons and middleware wiring in `CvIa.Api`.
5. Create single `CvIa.Tests` project and organize test folders by project name.
6. Verify `dotnet build` and `dotnet test` pass with scaffold-only behavior.

Rollback: restore previous solution/project naming and entry point if build or startup fails.

## Open Questions

- Should scaffold controller actions return `501 Not Implemented` or contract-shaped placeholder `200` payloads until application services are implemented?
- Should global error payload format be custom for now or directly aligned to `ErrorResponse` in `docs/api/api-spec.yml` from day one?
