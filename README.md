# CV-IA Scaffold

This repository contains the baseline scaffold for:

- `frontend` (Next.js App Router, TypeScript strict)
- `backend` (.NET Web API with `GET /health`, `GET /api/v1/cv`, and `POST /api/v1/chat/completions`)
- `infra` (Docker Compose dependencies)

## Environment Configuration

Copy the template environment files before first run:

```powershell
copy frontend\.env.example frontend\.env.local
```

Configuration rules:

- Frontend reads `NEXT_PUBLIC_API_BASE_URL`. For local dev, leave it **empty** so the browser uses same-origin `/api/*` and `/health`, proxied server-side to the .NET API (`frontend/src/app/api/[...path]/route.ts`, default `BACKEND_INTERNAL_URL=http://127.0.0.1:8080`); or set `http://127.0.0.1:8080` for direct calls.
- Backend reads `ASPNETCORE_URLS`, `SERVICE_NAME`, and `CvApi:PdfAssetPath` (from `appsettings.json`).
- Backend chat (OpenAI-backed): configure the **`OpenAiChat`** section in `backend/src/CvIa.Api/appsettings.json` (and `appsettings.{Environment}.json`). Default model **`gpt-4o-mini`**; **`HttpTimeoutSeconds`** only in appsettings per project rules. Set **`UseStubChatService`** to `false` and provide **`ApiKey`** for live OpenAI; otherwise the API keeps the **stub** chat implementation. **Project-scoped keys (`sk-proj-...`) also require `OpenAiProjectId`** (`proj_...` from the OpenAI dashboard) or OpenAI returns **401**. Optional env overrides: `OpenAiChat__ApiKey`, `OpenAiChat__OpenAiProjectId`, `OpenAiChat__UseStubChatService`, `OpenAiChat__Model` (see `backend/src/CvIa.Api/.env.example` and `docs/local-integration.md`). Chat replies follow the **language of the user’s messages**; the request `lang` field matches the CV page locale for the API contract only.
- For local backend runs, set backend env vars via your shell/IDE run profile (the `.env.example` file is a reference template).
- Secrets must remain backend-only. Do not put OpenAI keys in frontend env files.
- CV content is authored under `/content/{en|es}/sections/*.md` (static site build reads files at build time).
- **Chat API:** CV markdown used in the OpenAI system prompt is loaded **once when the API process starts** (in-memory store). If you edit section `.md` files or change section order in code (`CvMarkdownSectionIds`), **restart the backend** (or redeploy) so chat picks up changes. See `docs/architecture/openai-chat-backend.md`.
- ATS compliance is mandatory: core CV content must be SSR/SSG in initial HTML (no client-only rendering path).

## Local Integration Source of Truth

See `docs/local-integration.md` for the current integration matrix:

- run modes (`dev` without Docker, Docker with proxy)
- effective URLs and ports (`3000`, `8080`, `8055`, `8056`)
- frontend/backend env vars and verification scripts
- runtime request flow (`frontend -> proxy -> api`)

**Cursor / VS Code + C#:** use **`backend/CvIa.sln`** (classic solution) for IDE navigation; `.vscode/settings.json` points `dotnet.defaultSolution` at it. Optional: open `cv-ia.code-workspace` or only the `backend/` folder. See `docs/cursor-vscode-csharp.md` if F12 / Ctrl+F12 misbehave.

## First-Run Commands

Install dependencies:

```powershell
npm run install:all
```

Start local infrastructure dependencies:

```powershell
docker compose -f infra/docker-compose.yml up -d
```

Run backend:

```powershell
npm run dev:backend
```

Run frontend (new terminal):

```powershell
npm run dev:frontend
```

Run frontend + backend together (single terminal):

```powershell
npm run dev
```

Stop infrastructure:

```powershell
docker compose -f infra/docker-compose.yml down
```

## Verification Command Matrix

Frontend:

- `npm run lint:frontend`
- `npm run build:frontend`
- `npm run test:frontend`

Backend:

- `npm run lint:backend`
- `npm run build:backend`
- `npm run test:backend`

Cross-service:

- `npm run verify:boundary`
- `npm run verify:health`
- `npm run verify:cv:ats`
- `npm run verify:section-ids`
- `npm run verify:cv-pages`
- `npm run verify`

## Static CV Verification (EN/ES)

Run static-content and ATS checks:

```powershell
npm run lint:frontend
npm --prefix frontend run build
npm run verify:section-ids
npm run verify:cv:ats
npm run verify:cv-pages
```

## Deployment Automation

Frontend deploy is automated via `.github/workflows/deploy-frontend.yml`.
Backend deploy is automated via `.github/workflows/deploy-backend.yml`.

Trigger rules:

- Runs only on `push` to `main`
- Does not run on pull request events

Frontend pipeline steps:

1. Build Docker image with repository-root context and `frontend/Dockerfile`
2. Push `cristiangimenez86/cv-web:latest` to Docker Hub
3. Call Portainer API to recreate stack `3`

Backend pipeline steps:

1. Build Docker image with repository-root context and `backend/Dockerfile`
2. Push `cristiangimenez86/cv-api:latest` to Docker Hub
3. Call Portainer API to recreate the configured stack

Required GitHub repository secrets (both workflows):

- `DOCKERHUB_USERNAME`
- `DOCKERHUB_TOKEN`
- `PORTAINER_URL`
- `PORTAINER_TOKEN`
- `PORTAINER_STACK_ID`

## Portainer Stack Example (Frontend + Backend)

```yaml
services:
  cv:
    image: cristiangimenez86/cv-web:latest
    container_name: cv
    ports:
      - "8055:80"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://127.0.0.1:80/en"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s
    networks:
      cv:
        ipv4_address: 172.26.0.10

  api:
    image: cristiangimenez86/cv-api:latest
    container_name: cv-api
    ports:
      - "8056:8080"
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "wget -q -O /dev/null http://127.0.0.1:8080/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s
    networks:
      cv:
        ipv4_address: 172.26.0.11

networks:
  cv:
    ipam:
      config:
        - subnet: 172.26.0.0/24
```
