## 1. Solution and project topology

- [x] 1.1 Rename backend entry project from `CvIa.Backend` to `CvIa.Api` and move/confirm startup `Program.cs` under the API project.
- [x] 1.2 Create/normalize DDD projects under `backend/src`: `CvIa.Api`, `CvIa.Application`, `CvIa.Domain`, and `CvIa.Infrastructure`.
- [x] 1.3 Update backend solution/project references so `CvIa.Api` composes Application/Infrastructure with clear dependency direction.
- [x] 1.4 Update workspace scripts (`package.json`) and backend solution metadata to reference `CvIa.Api` as startup/build target.

## 2. API scaffold with controllers and middleware

- [x] 2.1 Configure `CvIa.Api` for controller-based routing (`AddControllers`, `MapControllers`) and keep `/health` available.
- [x] 2.2 Add controller skeletons for contract endpoints (`/api/v1/cv`, `/api/v1/chat/completions`) using full controller classes (no minimal APIs for these routes).
- [x] 2.3 Define Application service interfaces consumed by controllers and inject them via constructor DI.
- [x] 2.4 Inject and use `ILogger<T>` in controllers and global middleware without introducing telemetry packages.
- [x] 2.5 Add global exception middleware and wire it into the API pipeline with a consistent machine-readable error response.
- [x] 2.6 Keep scaffold endpoints unauthenticated (no auth middleware, no authorization attributes).

## 3. Single backend test project scaffold

- [x] 3.1 Create one backend test project (e.g., `CvIa.Tests`) and remove/retire split test-project setup.
- [x] 3.2 Organize test folders to mirror production project names: `Api/`, `Application/`, `Domain/`, `Infrastructure/`.
- [x] 3.3 Add initial scaffold tests for API startup, controller routing registration, and global exception middleware behavior.

## 4. Verification

- [x] 4.1 Run `dotnet build backend/CvIa.Api/CvIa.Api.csproj` (or updated equivalent) and confirm successful build.
- [x] 4.2 Run `dotnet test <backend-test-project>.csproj` and confirm scaffold tests pass.
- [x] 4.3 Run `npm run build:backend` and `npm run verify:health` from workspace root to confirm script-level compatibility.
- [x] 4.4 Validate that `/api/v1/*` routes are controller-backed and that security is still not enforced in this scaffold.

## 5. Contract alignment checklist

- [x] 5.1 Keep `GET /health` response aligned to `HealthResponse` (`status`, `service`, `timestampUtc`).
- [x] 5.2 Ensure `/api/v1/*` routes are implemented in controllers (not minimal API handlers).
- [x] 5.3 Keep `lang` validation aligned (`en|es`) and return `400` with `ErrorResponse` on invalid language.
- [x] 5.4 Keep chat contract aligned to OpenAPI (`lang` + `messages[]` request, `message` response, optional `citations`).
- [x] 5.5 Keep endpoint scaffold unauthenticated for this phase (no auth middleware/policies).
- [x] 5.6 Keep `ILogger<T>` usage in controllers and middleware via DI abstraction only.
