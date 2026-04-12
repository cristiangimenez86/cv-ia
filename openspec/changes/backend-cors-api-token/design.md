## Context

The CV-IA stack uses a Next.js frontend and a .NET 10 API. Browsers call `/api/v1/chat/completions` via **`fetch`** from the chat widget, but **CV PDF** is exposed today as a **plain `<a href>`** pointing at `${NEXT_PUBLIC_API_BASE_URL}/api/v1/cv?lang=…` (see `frontend/src/app/[locale]/page.tsx` → `Header` and `ProfileCard`). That navigation **cannot** attach an `Authorization` header, so requiring a bearer on `GET /api/v1/cv` **requires a UX/implementation change** (programmatic download or same-origin proxy). Internal routes (e.g. RAG reindex) already use separate keys; this design adds the public bearer for **`/api/v1/*`** only, with **`GET /health`** excluded.

## Goals / Non-Goals

**Goals:**

- Enforce a **explicit CORS policy**: allowed origins from configuration (production site, preview URLs if needed, localhost for dev); reflect preflight correctly; avoid `*` for production when using `Authorization`.
- Require a **static API access token** on **all** `/api/v1/*` routes when protection is enabled, sent as **`Authorization: Bearer <token>`**, validated in ASP.NET Core with **constant-time** comparison against a configured secret.
- Keep **`GET /health`** **anonymous** so Docker/orchestrator probes keep working without secrets.
- Align frontend fetch helpers so chat and CV API calls include the token when the deployment enables protection.

**Non-Goals:**

- User accounts, OAuth/OIDC, JWT issuance/validation, refresh tokens, or per-identity RBAC.
- Encrypting traffic at the app layer (TLS termination remains at reverse proxy).
- Rate limiting, WAF, or bot management as part of this change.
- Authenticating internal-only routes beyond what already exists (e.g. RAG ingestion key stays separate).

## Decisions

1. **Bearer header vs custom header**  
   **Choice:** `Authorization: Bearer <token>` for `/api/v1/*` protected endpoints.  
   **Rationale:** Standard, well-supported by browsers and middleware, easy to document in OpenAPI (`bearerAuth`).  
   **Alternative:** `X-Api-Key` only — rejected to avoid duplicating patterns; can still allow both later if needed.

2. **Where the token lives on the frontend**  
   **Choice (default for this repo):** Prefer **server-side** injection for Next.js: token in **server-only** env (no `NEXT_PUBLIC_`) and attach headers in **Route Handlers** or **server actions** that proxy to the backend, **or** a small shared server module used by RSC fetches. If some calls must run **purely in the browser**, document that the value is **visible to users** (defense-in-depth / abuse reduction only, not a secret).  
   **Rationale:** Aligns with the project rule that provider secrets stay backend-only; the API access token is still a **deployment secret** and should not be committed.  
   **Alternative:** Public build-time `NEXT_PUBLIC_*` — acceptable only with explicit team acceptance of extractability.

3. **CORS configuration**  
   **Choice:** ASP.NET Core `AddCors` + policy name bound in middleware; origins from `appsettings` / env (e.g. `Cors:AllowedOrigins` array). Methods: `GET`, `POST`, `OPTIONS` as needed; headers include `Authorization`, `Content-Type`.  
   **Rationale:** Single place of truth on the API; matches Docker/Portainer env binding style used elsewhere.

4. **Route coverage**  
   **Choice:** When protection is enabled, **every** `/api/v1/*` endpoint (including **`GET /api/v1/cv`**) requires the bearer token. **Only** **`GET /health`** is exempt from this bearer. **`/internal/*`** keeps existing ingestion auth (no requirement to add the public bearer on top unless a future change says so). CORS preflight (`OPTIONS`) is handled by the framework and is not a “business” endpoint.  
   **Rationale:** Single clear rule; health stays probe-friendly.

5. **Toggle for rollout**  
   **Choice:** Configuration flag e.g. `ApiAccess:RequireToken` defaulting to `false` in local dev and `true` in production examples, **or** “missing token config means disabled” — pick one implementation path in tasks (document in appsettings).  
   **Rationale:** Safer incremental rollout and local DX.

6. **CV PDF download after bearer is required**  
   **Choice:** Replace the cross-origin **`<a href>`** download with either (a) a **client `fetch`** to `/api/v1/cv` with `Authorization`, then **`blob` + object URL / `download` attribute**, or (b) a **Next.js Route Handler** on the site origin that adds the server-only token and streams the PDF.  
   **Rationale:** Browsers do not send custom headers on top-level link navigation.  
   **Alternative:** Cookie session — rejected for this change (non-goals).

## Risks / Trade-offs

- **[Risk] Any token shipped to the browser can be copied.** → Mitigation: treat as site gate + combine with infra rate limits later; prefer server-mediated calls when possible.
- **[Risk] Misconfigured CORS blocks legitimate users.** → Mitigation: clear docs and compose examples; log CORS failures at debug level.
- **[Risk] Breaking existing clients** → Mitigation: staged enablement flag; update frontend and docs in the same change.

## Migration Plan

1. Deploy backend with CORS + auth middleware **disabled** or token optional; verify existing traffic.
2. Configure allowed origins and token in staging; deploy frontend with header wiring.
3. Enable `RequireToken` in production; monitor 401 rates.
4. Rollback: disable `RequireToken` and redeploy backend without frontend changes if needed.
