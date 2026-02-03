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
- **Node.js** (LTS recommended)
- **Yarn** (via Corepack recommended)
- **.NET SDK** (for backend; use version pinned by the repo, e.g. `global.json` if present)

### Optional (recommended)
- **Docker Desktop** (or Docker Engine + Compose plugin) — for future Docker Compose flow
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
CONTENT__ROOTPATH=../../content
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

### Flow A — Run backend + frontend on host (current)

> **Note:** Docker Compose (`infra/dev/docker-compose.yml`) is planned for a future ticket. Use Flow A until it exists.

#### Backend
From `services/` (when using the solution):

```bash
dotnet build Services.slnx
dotnet run --project CV.Api
```

Or from `services/CV.Api/` directly:

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
From `services/`:

```bash
dotnet build Services.slnx
dotnet test Services.slnx
```

Or from `services/CV.Api/` (project-only):

```bash
dotnet build
```

Smoke test (PowerShell) — `/health` is available; CV endpoints (`/api/v1/cv`, etc.) are implemented per `docs/api/api-spec.yml`:

```powershell
curl http://localhost:5080/health
```

### Frontend
From `apps/web/`:

```bash
yarn lint
yarn build
```

---

## 7) Common issues

### Port conflicts
If a service fails due to ports already in use, change the port in its config or stop the conflicting process. (Docker Compose is planned for a future ticket.)

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
