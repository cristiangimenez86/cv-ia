# CV — Development Guide

This guide explains how to run **CV** locally for development and how to verify changes.
The project follows **Spec-Driven Development (SDD)** and keeps AI/SDD artifacts in `ai-specs/`.

---

## 1) Repository Layout (high level)

- `apps/` — Frontend apps (Next.js).  
- `services/` — Backend services (ASP.NET / .NET).  
  - `services/CV.Api/` — Main API (includes AI gateway; OpenAI keys live here only).
- `content/` — CV content as Markdown/JSON (bilingual: `es` + `en`).
- `docs/` — Project documentation (how to run, architecture, deploy).
- `ai-specs/` — AI/SDD only (agents, commands, standards, specs for agents).

---

## 2) Prerequisites

### Required
- **Git**
- **Docker Desktop** (or Docker Engine + Compose plugin)
- **Node.js** (LTS recommended)
- **Yarn** (via Corepack recommended)

### Optional (recommended)
- **.NET SDK** (use the version pinned by the repo, e.g. `global.json` if present)
- **mkcert** (local HTTPS certificates)

---

## 3) Clone the repository

```bash
git clone <YOUR_GITHUB_REPO_URL>
cd CV
```

---

## 4) Environment configuration

> ⚠️ Do not commit secrets. Keep keys only in local env files / secret stores.

### 4.1 Backend environment (local)

Create a file:
- `services/CV.Api/.env.local` (or use user secrets / env vars; this guide shows `.env.local` for simplicity)

Example:

```env
# OpenAI (keep only in backend)
OPENAI__APIKEY=replace_me
OPENAI__MODEL=gpt-4.1-mini

# Content / RAG
CONTENT__ROOTPATH=../..//content
CONTENT__DEFAULTLANG=es

# CORS (frontend dev origin)
CORS__ALLOWEDORIGINS=http://localhost:3000

# Basic rate limiting (optional)
RATELIMIT__ENABLED=true
RATELIMIT__REQUESTSPERMINUTE=60
```

> Notes:
> - The double underscores `__` map to nested config keys in ASP.NET configuration.
> - If you prefer `appsettings.Development.json`, keep secrets out of git and use `appsettings.Development.local.json` ignored by git.

### 4.2 Frontend environment (local)

Create:
- `apps/web/.env.local`

Example:

```env
# Backend API base URL
NEXT_PUBLIC_API_BASE_URL=http://localhost:5080
NEXT_PUBLIC_DEFAULT_LANG=es
```

---

## 5) Run locally (recommended paths)

There are 2 valid dev flows. Pick one and stick to it.

### Flow A — Run everything with Docker Compose (recommended)

From repository root:

```bash
docker compose -f infra/dev/docker-compose.yml up -d --build
```

Verify containers:

```bash
docker ps
```

Expected endpoints (adjust to your compose ports):
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5080`
- OpenAPI/Swagger (if enabled): `http://localhost:5080/swagger` (or `/openapi` depending on setup)

> If `infra/dev/docker-compose.yml` does not exist yet, create it under `infra/dev/` as part of the next SDD ticket.

### Flow B — Run backend + frontend on host (no containers)

#### Backend
From `services/CV.Api/`:

```bash
dotnet restore
dotnet build
dotnet run
```

#### Frontend
From `apps/web/`:

```bash
corepack enable
yarn install
yarn dev
```

---

## 6) Verification checklist (fast)

### Backend
From repo root (or `services/CV.Api/`):

```bash
dotnet test
```

Smoke test endpoints (PowerShell):

```powershell
curl http://localhost:5080/health
curl "http://localhost:5080/api/v1/cv?lang=es"
```

### Frontend
From `apps/web/`:

```bash
yarn lint
yarn test
```

---

## 7) Common issues

### Port conflicts
If Docker fails due to ports already in use, change ports in `infra/dev/docker-compose.yml`
or stop the conflicting service.

### CORS errors
Ensure `CORS__ALLOWEDORIGINS` includes the frontend dev URL (usually `http://localhost:3000`).

### OpenAI errors
- Confirm `OPENAI__APIKEY` is set (backend only)
- Confirm the backend can reach the internet (proxy/VPN can break it)

---

## 8) Where to keep specs vs docs

- **Project docs** (how to run, architecture, deployment): `docs/`
- **AI/SDD-specific** docs and agent instructions: `ai-specs/`

See:
- `docs/api/api-spec.yml` (OpenAPI contract)
- `docs/architecture/data-model.md` (data model)
- `ai-specs/specs/*.mdc` (standards for agents)
