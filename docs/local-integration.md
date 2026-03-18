# Local Integration Matrix

This document is the operational source of truth for local frontend/backend integration.

## Runtime Modes

| Mode | Frontend URL | Backend URL | Notes |
|---|---|---|---|
| Local dev (no Docker) | `http://localhost:3000` | `http://localhost:8080` | Frontend calls backend directly using `NEXT_PUBLIC_API_BASE_URL`. |
| Docker (direct API) | `http://localhost:8055` (via proxy) | `http://localhost:8056` (direct API port) | `proxy` routes `/` to frontend and `/api/*` + `/health` to backend. |
| Docker (through proxy) | `http://localhost:8055` | `http://localhost:8055` | Preferred browser entrypoint for end-to-end smoke checks. |

## Backend Endpoints Implemented

- `GET /health`
- `GET /api/v1/cv?lang=en|es`
- `POST /api/v1/chat/completions`

OpenAPI contract: `docs/api/api-spec.yml`.

## Environment Variables

### Frontend

- `NEXT_PUBLIC_API_BASE_URL`
  - Example (local dev): `http://localhost:8080`
  - If empty, frontend calls relative paths (`/health`, `/api/...`) which is compatible with the Docker proxy on `8055`.

### Backend

- `ASPNETCORE_URLS` (example: `http://localhost:8080`)
- `SERVICE_NAME` (example: `cv-ia-backend`)
- `CvApi:PdfAssetPath` from `backend/src/CvIa.Api/appsettings.json`

`backend/src/CvIa.Api/.env.example` is a template reference. When running `dotnet run`, provide env vars through your shell/IDE profile.

## Request Flow

### Local dev (no Docker)

`frontend (3000) -> backend (8080)`

### Docker with proxy

`browser (8055) -> proxy -> cv (/)`

`browser (8055) -> proxy -> api (/health, /api/*)`

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
