## ADDED Requirements

### Requirement: Chat completions endpoint MUST be rate-limited server-side
The backend MUST enforce a server-side rate limit for `POST /api/v1/chat/completions` to mitigate abuse and control provider spend.

#### Scenario: Excess requests are throttled
- **WHEN** a client exceeds the configured rate limit for `POST /api/v1/chat/completions`
- **THEN** the backend returns HTTP `429`
- **AND** the response body is JSON and machine-readable

### Requirement: Rate limit identity MUST be stable and deterministic
The backend MUST compute a deterministic rate-limit partition key per request using **client IP**.

#### Scenario: Unauthenticated requests are partitioned by client IP
- **WHEN** a chat completion request is received
- **THEN** throttling applies per client IP

### Requirement: Forwarded headers MUST be supported for client IP derivation
When deployed behind a reverse proxy, the backend MUST be able to derive the correct client IP address using forwarded headers configuration.

#### Scenario: Proxy forwards client IP correctly
- **WHEN** the service is deployed behind a reverse proxy that forwards client IP information
- **THEN** the rate-limit partition key uses the forwarded client IP (per backend configuration)

### Requirement: Throttled responses MUST provide a retry signal when available
When returning HTTP `429` due to rate limiting, the backend SHOULD include a `Retry-After` header when the underlying limiter can compute a retry delay.

#### Scenario: Retry-After is included
- **WHEN** a chat completion request is throttled and the retry delay is known
- **THEN** the response includes `Retry-After` with a positive number of seconds

### Requirement: Rate limits MUST be configuration-driven
The backend MUST allow operators to configure rate limit parameters (window size and permit limit at minimum) without code changes.

#### Scenario: Operator tunes limits via config
- **WHEN** the operator changes configured rate limit parameters and restarts/reloads the service
- **THEN** the new limits are applied to subsequent requests
