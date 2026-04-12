## Why

The backend exposes public HTTP APIs (`/api/v1/*`) to the browser. Without an explicit CORS policy, behavior is inconsistent across environments and cross-origin abuse is harder to reason about. Without a lightweight credential on those calls, the chat and CV JSON endpoints are easy targets for casual scraping and unauthenticated abuse. This change defines configuration-driven CORS and a shared bearer-style token checked on the server, with the frontend responsible for attaching it on API calls.

## What Changes

- Add a **strict, configuration-driven CORS policy** on the .NET API (allowed origins, methods, headers; no wildcard origin in production when credentials or custom headers are used).
- Add **validation of an API access token** on **all** `/api/v1/*` routes when protection is enabled (including **`GET /api/v1/cv`**): clients send `Authorization: Bearer <token>`; the backend compares it to a secret configured only in backend environment / Portainer (constant-time compare). **`GET /health`** remains the **only** endpoint that does not use this public bearer (orchestration probes). **`/internal/*`** keeps its **existing** contract auth (e.g. ingestion key), unchanged by this proposal.
- Update the **Next.js** app so every browser call to `/api/v1/*` can send the token (see design: today’s PDF control uses a plain `<a href>` and must be replaced with **`fetch` + blob** or a **Route Handler proxy**).
- Keep **`GET /health`** suitable for orchestration probes: **no token required** unless we explicitly extend health auth later (**not** in this change).
- Document env vars and OpenAPI/security scheme for the public API contract.

## Capabilities

### New Capabilities

- `backend-api-access-control`: CORS policy for the API; bearer validation for **all** `/api/v1/*` when enabled; clear 401 semantics; **`GET /health`** explicitly excluded from bearer requirement; internal routes unchanged.

### Modified Capabilities

- `service-integration-baseline`: Frontend integration SHALL send the configured access token on backend API calls that require it (e.g. chat, CV API), while preserving existing health-check behavior for routes that remain anonymous.

## Impact

- **Backend:** ASP.NET Core CORS middleware, authentication/authorization filter or middleware for `/api/v1/*`, configuration binding, tests.
- **Frontend:** Env/config for token (or server-only proxy pattern per design), fetch wrappers for chat and CV endpoints.
- **Infra / docs:** New secrets in Docker/Portainer docs, `docs/api/api-spec.yml` security scheme, `docs/local-integration.md`.
- **Non-goals:** End-user login, OAuth/OIDC, JWT issuance, per-user RBAC, mTLS, WAF/rate limiting as a product feature (may be mentioned as future work only).
