## Why

The chat endpoint is currently unprotected against burst traffic and automated abuse, which can drive up OpenAI costs and degrade availability. We need a simple, server-enforced rate limit to keep the service reliable and predictable.

## What Changes

- Add server-side rate limiting for `POST /api/v1/chat/completions` with a clear rejection response when limits are exceeded.
- Support client identification using **client IP**, with safe defaults behind a reverse proxy.
- Emit basic rate-limit telemetry (counters) to support tuning and incident response.

## Capabilities

### New Capabilities

- `backend-chat-rate-limiting`: Request rate limiting and throttling policy for the backend chat completions endpoint.

### Modified Capabilities

- `backend-chat-openai-mvp`: Add explicit requirement that chat completions are rate-limited and return a deterministic 429 response when exceeded.

## Impact

- Backend only: `CvIa.Api` middleware/pipeline and chat endpoint behavior.
- API: clients may receive HTTP 429 responses when exceeding limits.
- Ops: requires correct forwarded headers configuration when running behind a proxy (Docker/ingress).

## Non-goals

- Per-user billing or quotas.
- CAPTCHA / bot-detection.
- A distributed rate limiter (e.g., Redis) in this iteration.
