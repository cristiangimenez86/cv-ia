## 1. Spec alignment and configuration surface

- [x] 1.1 Locate `POST /api/v1/chat/completions` controller/endpoint wiring in `backend/src/CvIa.Api` and identify the best place to apply endpoint-level rate limiting
- [x] 1.2 Add configuration model + `appsettings.json` keys for chat rate limiting (permit limit, window, queueing if used)
- [x] 1.3 Document default values and how to tune them (README or existing ops doc location used by this repo)

## 2. Rate limiting implementation (backend)

- [x] 2.1 Add ASP.NET Core rate limiting middleware registration (`AddRateLimiter`) and an explicit policy for chat completions
- [x] 2.2 Implement partition key selection (prefer authenticated identity if present; else derive client IP with forwarded headers support; else `RemoteIpAddress`)
- [x] 2.3 Ensure throttled responses return HTTP 429 with a JSON, machine-readable body
- [x] 2.4 Include `Retry-After` header when available from the limiter

## 3. Forwarded headers correctness (proxy-safe IP)

- [x] 3.1 Ensure forwarded headers are configured appropriately for the deployment topology (only trust known proxies)
- [x] 3.2 Add a small verification note/command to confirm observed client IP partitioning in logs during local docker/proxy runs

## 4. Telemetry and observability

- [x] 4.1 Add counters/metrics (or structured logs) for throttled requests (count, partition key type, endpoint)
- [x] 4.2 Add a correlation identifier to throttling logs consistent with existing request correlation behavior

## 5. Tests and verification

- [x] 5.1 Add an automated test that performs \(N+1\) chat requests within a window and asserts a 429 is returned
- [x] 5.2 Add an automated test asserting partitioning differs for two distinct identities (or two different IPs in test harness)
- [x] 5.3 Add a verification checklist: run backend, hit endpoint rapidly, confirm 429 + retry behavior, confirm other endpoints unaffected
