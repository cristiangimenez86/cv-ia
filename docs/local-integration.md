# Local Integration Matrix

This document is the operational source of truth for local frontend/backend integration.

## Runtime Modes

| Mode | Frontend URL | Backend URL | Notes |
|---|---|---|---|
| Local dev (no Docker) | `http://localhost:3000` | `http://localhost:8080` | Prefer **`NEXT_PUBLIC_API_BASE_URL` empty**: App Router route handlers (`src/app/api/[...path]/route.ts`, `src/app/health/route.ts`) proxy to `BACKEND_INTERNAL_URL` (default `http://127.0.0.1:8080`). Optionally set `NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8080` for direct browser→API calls (CORS must allow the front origin). |
| Docker (direct API) | `http://localhost:8055` (via proxy) | `http://localhost:8056` (direct API port) | `proxy` routes `/` to frontend, **`/api/*` to Next (`cv`)** so Route Handlers can add `Authorization`, and **`/health` still to `api`**. |
| Docker (through proxy) | `http://localhost:8055` | `http://localhost:8055` | Preferred browser entrypoint for end-to-end smoke checks. |

## Backend Endpoints Implemented

- `GET /health`
- `GET /api/v1/cv?lang=en|es`
- `POST /api/v1/chat/completions`

OpenAPI contract: `docs/api/api-spec.yml`.

## Internal (operator-only) endpoints

- `POST /internal/v1/rag/reindex`
  - **Not exposed through the public proxy** (`8055`) or the Next.js `/api/*` proxy.
  - Call the backend **directly** (local Docker: `http://localhost:8056`), or from another container via `http://api:8080`.

## Environment Variables

### Frontend

- `NEXT_PUBLIC_API_BASE_URL`
  - Example (local dev): `http://localhost:8080`
  - If empty, the browser calls same-origin paths (`/health`, `/api/...`). **`/api/*` is implemented by Next** (`src/app/api/[...path]/route.ts`), which proxies to `BACKEND_INTERNAL_URL` and attaches **`BACKEND_API_ACCESS_TOKEN`** when set (server-only; not bundled for the client).
- `BACKEND_INTERNAL_URL`
  - Server-only target for the catch-all API proxy (default `http://127.0.0.1:8080`; Docker **`cv`** stack: `http://api:8080`).
- `BACKEND_API_ACCESS_TOKEN`
  - Server-only bearer **without** the `Bearer ` prefix. Must match **`ApiAccess:Token`** on the .NET API when **`ApiAccess:RequireToken`** is true.
- `NEXT_PUBLIC_API_ACCESS_TOKEN` (optional)
  - Only when **`NEXT_PUBLIC_API_BASE_URL`** is non-empty (browser talks directly to the API). Same raw token value; it is **public** in the client bundle—prefer same-origin `/api/*` + `BACKEND_API_ACCESS_TOKEN` instead.

### Backend

- **Configuration layers:** Base **`appsettings.json`** is tuned for **local dev / CI** (`UseStubChatService: true`, `Rag:Enabled: false`, `ApiAccess:RequireToken: false`). **`appsettings.Production.json`** turns on **real chat**, **RAG**, and **API bearer** (`RequireToken: true`) and sets **CORS** allow list. The **API Docker image** sets **`ASPNETCORE_ENVIRONMENT=Production`** so the container loads Production overrides without relying on compose alone. **`dotnet test`** forces **Development** in test factories so **Production** is not loaded during CI.
- `ASPNETCORE_URLS` (example: `http://localhost:8080`)
- `SERVICE_NAME` (example: `cv-ia-backend`)
- `CvApi` section in `appsettings.json`: **`PdfAssetPath`**, **`MarkdownContentRoot`**, **`SectionIdsPath`** (paths to the PDF asset and to `content/` + `CvSectionIds.json`). Chat uses the markdown sections for the OpenAI prompt; those files are read **once at API startup** and kept in memory—**restart `dotnet run`** (or the container) after changing CV `.md` files or section order so chat sees updates.
- **OpenAI chat:** `OpenAiChat` section in `appsettings.json` (default model **`gpt-4o-mini`**, stub mode when `UseStubChatService` is true or `ApiKey` is empty). **Project-scoped keys (`sk-proj-...`):** set **`OpenAiProjectId`** to your project id (`proj_...` from **OpenAI → Projects**). The backend sends the `OpenAI-Project` header; without it, OpenAI returns **401**. **HTTP timeout:** `OpenAiChat:HttpTimeoutSeconds` in appsettings only. Optional env overrides: `OpenAiChat__ApiKey`, `OpenAiChat__OpenAiProjectId`, `OpenAiChat__UseStubChatService`, `OpenAiChat__Model` (never in frontend).
- **RAG / pgvector:**
  - `ConnectionStrings__Rag`: PostgreSQL connection string for pgvector (Docker: host `pgvector`, port `5432`).
  - `Rag__Enabled`: `true|false` (when true, `/health` actively checks DB connectivity and returns **503** if DB is down).
  - `Rag__IngestionApiKey`: shared secret for `POST /internal/v1/rag/reindex` (sent in header `X-Rag-Ingestion-Key`).
  - `Rag__Sources__0__Id`, `Rag__Sources__0__Type`, `Rag__Sources__0__ContentRoot` (at minimum the `cv` source).
- **Public API bearer (optional):**
  - `ApiAccess:RequireToken` / `ApiAccess:Token`: set in **`appsettings.json`** / **`appsettings.Production.json`** (not required as compose env). **`Token`** is often overridden at runtime with **`ApiAccess__Token`** (e.g. `BACKEND_API_ACCESS_TOKEN` in Docker) so the secret is not committed. When `RequireToken` is true, use the same value as Next **`BACKEND_API_ACCESS_TOKEN`**.
  - `Cors:AllowedOrigins`: non-empty list in **`appsettings.Production.json`** for the Docker stack (default `localhost` / `127.0.0.1` on port **8055**). Empty list in base **`appsettings.json`** keeps permissive CORS for local `dotnet run`. For a public URL, edit **`appsettings.Production.json`** (or add another environment-specific file) to include your real origin(s).

`backend/src/CvIa.Api/.env.example` is a template reference. When running `dotnet run`, provide env vars through your shell/IDE profile.

## RAG ingestion (manual)

Incremental reindex CV source only:

```bash
curl -X POST "http://localhost:8056/internal/v1/rag/reindex" ^
  -H "Content-Type: application/json" ^
  -H "X-Rag-Ingestion-Key: <your secret>" ^
  -d "{\"mode\":\"incremental\",\"sourceIds\":[\"cv\"]}"
```

Full rebuild (all configured sources):

```bash
curl -X POST "http://localhost:8056/internal/v1/rag/reindex" ^
  -H "Content-Type: application/json" ^
  -H "X-Rag-Ingestion-Key: <your secret>" ^
  -d "{\"mode\":\"full\"}"
```

## Request Flow

### Local dev (no Docker)

`frontend (3000) -> backend (8080)`

### Docker with proxy

`browser (8055) -> proxy -> cv (/)`

`browser (8055) -> proxy -> cv (/api/* -> Next proxy -> api:8080 with optional Bearer)`

`browser (8055) -> proxy -> api (/health only)`

## CORS preflight (optional check)

When `Cors:AllowedOrigins` is non-empty, an allowed origin should receive `Access-Control-Allow-*` headers on preflight:

```bash
curl -i -X OPTIONS "http://localhost:8080/api/v1/chat/completions" ^
  -H "Origin: http://localhost:3000" ^
  -H "Access-Control-Request-Method: POST" ^
  -H "Access-Control-Request-Headers: authorization,content-type"
```

## Verification Commands

- `npm run verify:health` (uses `BACKEND_HEALTH_URL`, default `http://localhost:8080/health`)
- `npm run verify:cv-pages` (uses `CV_BASE_URL`, default `http://localhost:3000`)
- `npm run verify`

## Notes

- `npm run dev` starts backend and frontend in one terminal.
- `infra/docker-compose.yml` exposes:
  - `8055:80` for `proxy`
  - `8056:8080` for `api`
  - `5432:5432` for `pgvector`

## Troubleshooting (Docker / Portainer)

- **`Health check failed: PostgreSQL unreachable`** with `Rag:Enabled=true`:
  - Ensure **`api` depends on a healthy `pgvector`** (compose `depends_on` + `condition: service_healthy`) so Postgres accepts connections before the API probes `/health`.
  - **`POSTGRES_PASSWORD` must match the cluster**: if the named volume was first created with password `cvia` and you later set a different `POSTGRES_PASSWORD` in Portainer, Postgres still uses the **old** password on disk while the API connects with the **new** one → authentication fails. Fix: set the env back to the original password, or remove the `pgvector` volume (data loss) and redeploy so init runs again.
  - Confirm `ConnectionStrings__Rag` uses host **`pgvector`** (service name) inside the stack, not `localhost`.
- **`libgssapi_krb5.so.2`**: Npgsql may log this on minimal images; the API Docker image should include `libgssapi-krb5-2`. Rebuild and redeploy `cv-api` if the message persists after a clean connect.
