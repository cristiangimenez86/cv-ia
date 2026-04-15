## Context

`POST /api/v1/chat/completions` invokes an external paid provider (OpenAI) and is therefore cost- and abuse-sensitive. Today, the backend has no explicit throttling policy for this endpoint, which makes it vulnerable to burst traffic (legitimate or automated) and to accidental client loops.

The backend is a .NET 10 Web API hosted behind container/proxy infrastructure where client IP may arrive via forwarded headers.

## Goals / Non-Goals

**Goals:**
- Enforce a **server-side** rate limit for `POST /api/v1/chat/completions`.
- Use a stable request identity strategy based on **client IP** (with forwarded headers support).
- Return a deterministic, machine-readable **HTTP 429** response when the limit is exceeded.
- Keep the first iteration simple and in-process (no Redis).

**Non-Goals:**
- Distributed throttling across multiple backend replicas.
- User billing/quotas, captcha, or bot detection.
- Frontend changes (the client can remain unchanged and simply handle 429).

## Decisions

### Use ASP.NET Core built-in rate limiting middleware

- **Decision**: Use `Microsoft.AspNetCore.RateLimiting` (`AddRateLimiter` + `UseRateLimiter`) rather than a custom middleware.
- **Rationale**: Well-supported primitives (fixed/sliding window, concurrency) and consistent HTTP 429 handling with low maintenance.
- **Alternatives considered**:
  - Custom middleware with in-memory counters: more bug surface, harder to tune, less standardized.
  - Redis-backed limiter: better for multi-replica but out of scope for this iteration.

### Partition key strategy

- **Decision**: Partition requests by:
  1) client IP derived from forwarded headers configuration,
  2) else by `RemoteIpAddress`.
- **Rationale**: Keeps the first iteration simple and predictable without requiring authentication or introducing additional identity surface area. Trade-off: users behind shared NAT may impact each other.

### Policy scope

- **Decision**: Apply rate limiting only to `POST /api/v1/chat/completions` (endpoint-level policy), not globally.
- **Rationale**: Protects the expensive path without risking `GET /health` and PDF downloads being throttled unintentionally.

### Response contract for throttling

- **Decision**: On limit exceeded, return HTTP `429` with a small JSON body (problem-details style) and include `Retry-After` when available.
- **Rationale**: Clients can implement backoff and display a friendly message while keeping the API behavior predictable.

## Risks / Trade-offs

- **[Single-node limiter]** In-process counters do not coordinate across replicas → **Mitigation**: keep conservative limits; if scaling out, add a Redis/distributed limiter as a follow-up change.
- **[Proxy IP correctness]** Wrong forwarded header settings may cause all traffic to appear as one IP → **Mitigation**: configure forwarded headers properly and add a verification checklist in tasks/tests.
- **[Too strict defaults]** May degrade UX under legitimate bursts → **Mitigation**: make limits configuration-driven and add telemetry to tune.

## Migration Plan

- Add configuration for limits (requests/window, queueing) with sane defaults.
  - **Default recommendation (initial)**: **20 requests per 60s per client IP** for `POST /api/v1/chat/completions`.
  - **How to tune**:
    - If legitimate traffic gets throttled (429s during normal usage), increase `PermitLimit` (e.g., 30–60) or shorten the window (e.g., 20 per 30s).
    - If provider spend / abuse risk is high, decrease `PermitLimit` (e.g., 10 per 60s) or increase the window.
    - If many users share a NAT and impact each other, consider a follow-up change to partition by authenticated identity (out of scope for this iteration).
- Verification (local / behind proxy):
  - Send a request with a known `X-Forwarded-For` value and then exceed the limit; confirm the backend logs a rate-limit warning that includes `keyType=ip` and the forwarded IP (or its hash outside Development).
  - Example: send \(N+1\) requests quickly to `POST /api/v1/chat/completions` and confirm the \(N+1\)th returns 429 and (when available) `Retry-After`.
- Roll out to staging; generate a small load/burst test and confirm 429 behavior.
- Deploy to production.
- Rollback is safe: disable the policy via configuration or remove middleware registration (code rollback).

## Open Questions

- Confirm the default (recommended: 20 requests per 60s per IP) fits expected traffic; adjust after observing staged telemetry.
