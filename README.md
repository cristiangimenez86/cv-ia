# CV-IA Scaffold

This repository contains the baseline scaffold for:

- `frontend` (Next.js App Router, TypeScript strict)
- `backend` (.NET Web API with `GET /health`, `GET /api/v1/cv`, and `POST /api/v1/chat/completions`)
- `infra` (Docker Compose dependencies)

## Environment Configuration

Copy the template environment files before first run:

```powershell
copy frontend\.env.example frontend\.env.local
copy backend\src\CvIa.Api\.env.example backend\src\CvIa.Api\.env
```

Configuration rules:

- Frontend reads `NEXT_PUBLIC_API_BASE_URL` and calls backend endpoints only.
- Backend reads `ASPNETCORE_URLS`, `SERVICE_NAME`, and `CvApi:PdfAssetPath` (from `appsettings.json`).
- Secrets must remain backend-only. Do not put OpenAI keys in frontend env files.
- CV content is loaded from `/content/{en|es}/sections/*.md`.
- ATS compliance is mandatory: core CV content must be SSR/SSG in initial HTML (no client-only rendering path).

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

## Frontend Deployment Automation

Frontend deploy is automated via `.github/workflows/deploy-frontend.yml`.

Trigger rules:

- Runs only on `push` to `main`
- Does not run on pull request events

Pipeline steps:

1. Build Docker image with repository-root context and `frontend/Dockerfile`
2. Push `cristiangimenez86/cv-web:latest` to Docker Hub
3. Call Portainer API to recreate stack `3`

Required GitHub repository secrets:

- `DOCKERHUB_USERNAME`
- `DOCKERHUB_TOKEN`
- `PORTAINER_URL`
- `PORTAINER_TOKEN`
