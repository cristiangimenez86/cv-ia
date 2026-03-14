# CV-IA Scaffold

This repository contains the baseline scaffold for:

- `frontend` (Next.js App Router, TypeScript strict)
- `backend` (.NET Web API with `GET /health`)
- `infra` (Docker Compose dependencies)

## Environment Configuration

Copy the template environment files before first run:

```powershell
copy frontend\.env.example frontend\.env.local
copy backend\.env.example backend\.env
```

Configuration rules:

- Frontend reads `NEXT_PUBLIC_API_BASE_URL` and calls backend endpoints only.
- Backend reads `ASPNETCORE_URLS` and `SERVICE_NAME`.
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
