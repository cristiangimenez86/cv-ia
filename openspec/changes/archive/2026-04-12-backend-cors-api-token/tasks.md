## 1. Backend configuration and CORS

- [x] 1.1 Add configuration sections for **`Cors:AllowedOrigins`** (array) and **`ApiAccess:RequireToken`** plus **`ApiAccess:Token`** (or equivalent names), with safe local defaults documented in `appsettings.Development.json`.
- [x] 1.2 Register CORS in `Program.cs` / startup: named policy, origins from config, allow `Authorization` and `Content-Type`, methods needed for `/api/v1/chat/completions` and `/api/v1/cv`.
- [x] 1.3 **Verification:** `dotnet build` backend; manual or integration check that `OPTIONS` preflight returns expected headers for an allowed origin (document curl in task or `docs/local-integration.md` snippet).

## 2. Backend bearer validation

- [x] 2.1 Implement middleware or endpoint filter that applies to **all** `/api/v1/*` when `RequireToken` is true; skip **`GET /health`** only (and CORS `OPTIONS` as needed). Do **not** strip or bypass existing **`/internal/*`** auth.
- [x] 2.2 Parse `Authorization: Bearer`, validate with constant-time compare; return **401** JSON body on failure; add unit tests for success, wrong token, missing header.
- [x] 2.3 **Verification:** `dotnet test` affected test project; `curl` against `/api/v1/chat/completions` and **`GET /api/v1/cv`** with and without header when flag on/off.

## 3. Frontend integration

- [x] 3.1 Introduce server-preferred config for API base URL + access token (env vars documented); centralize **`fetch`** for chat to attach `Authorization` when token is configured.
- [x] 3.2 Replace **`Header`** and **`ProfileCard`** plain `<a href={downloadPdfHref}>` with a **button or link** that triggers **`fetch` + blob/Object URL** (or a **Next.js Route Handler** that proxies to the backend with the server-only token), preserving accessibility (e.g. `aria-label`).
- [x] 3.3 Ensure health check client code does **not** require the bearer token on `GET /health`.
- [x] 3.4 **Verification:** `npm run lint` / `npm run build` in `frontend` (use repo scripts); smoke chat and PDF download against local API with protection enabled.

## 4. Contract and ops documentation

- [x] 4.1 Update `docs/api/api-spec.yml` with `bearerAuth` security scheme and apply to `/api/v1/chat/completions` and `/api/v1/cv` as appropriate.
- [x] 4.2 Update `docs/local-integration.md` and Docker/Portainer notes with `Cors__AllowedOrigins__0`, `ApiAccess__Token`, and `ApiAccess__RequireToken` (or chosen binding keys).
- [x] 4.3 **Verification:** `openspec validate backend-cors-api-token` from repo root.
