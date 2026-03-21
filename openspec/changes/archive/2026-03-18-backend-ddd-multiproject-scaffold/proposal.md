## Why

The backend scaffold is still centered on a single `CvIa.Backend` entry project and does not yet provide a clear DDD-ready structure for scaling API features safely. We need a stable multi-project baseline now so future CV, chat, and integration work can be implemented with clean boundaries and consistent test organization.

## What Changes

- Rename the backend entry project from `CvIa.Backend` to `CvIa.Api` and keep the HTTP entry point there.
- Define a DDD-oriented multi-project layout in `backend/src` with explicit responsibilities (Api, Application, Domain, Infrastructure).
- Establish one consolidated test project with folder structure mirroring production project names, instead of separate test projects per assembly.
- Standardize API style on full ASP.NET Core Controllers (attribute-routed controller classes), avoiding minimal API endpoints for business routes.
- Add a global exception middleware in `CvIa.Api` for consistent error handling.
- Define controller skeletons that inject Application services only, with no domain logic or endpoint business implementation yet.
- Keep the scaffold intentionally minimal: no telemetry stack, no auth/security on controllers for now.
- Use `ILogger<T>` through DI in API-facing components while deferring logging provider decisions.
- Keep scaffold route contracts aligned with `docs/api/api-spec.yml`, including:
  - `GET /health` payload fields (`status`, `service`, `timestampUtc`)
  - chat endpoint with OpenAI-style message list (`lang` + `messages[]`) and assistant message response
  - locale defaults and local server configuration consistent with workspace docs/scripts

## Non-goals

- Implementing real CV/chat business logic.
- Introducing OpenAI integration, RAG retrieval, or persistence behavior.
- Adding observability platforms (OpenTelemetry, tracing exporters, metrics backends).
- Adding authentication/authorization middleware or endpoint protection.

## Capabilities

### New Capabilities
- `backend-ddd-multiproject-scaffold`: Defines the backend architecture baseline with multi-project separation, controller skeletons, global error middleware, and unified test project conventions.

### Modified Capabilities
- None.

## Impact

- **Backend**: project graph, solution structure, API composition model, middleware pipeline, and test organization.
- **API Contract Surface**: controller endpoints become explicit scaffold placeholders for contract-aligned routes.
- **Developer Workflow**: simpler onboarding through clear project boundaries and one test project with predictable mirrored folders.
