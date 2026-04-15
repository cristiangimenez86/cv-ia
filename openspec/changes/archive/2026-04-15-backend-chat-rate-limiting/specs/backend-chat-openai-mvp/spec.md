## MODIFIED Requirements

### Requirement: Backend chat runtime MUST enforce configuration-driven provider access
The backend MUST read provider credentials and model/runtime settings from backend configuration and MUST keep provider secrets out of frontend/runtime client exposure. The backend MUST also enforce a server-side rate limit for `POST /api/v1/chat/completions` so provider calls remain protected against abuse and cost spikes.

#### Scenario: Provider configuration is present
- **WHEN** required OpenAI configuration is available at startup/runtime
- **THEN** chat completion requests are executed against the configured provider model
- **AND** operational logs include safe metadata (request id, latency, status class) without logging secrets

#### Scenario: Provider configuration is missing
- **WHEN** a chat completion request is received and required provider settings are missing or invalid
- **THEN** the backend returns a machine-readable error response
- **AND** the process remains healthy for other endpoints

#### Scenario: Rate limit exceeded returns 429
- **WHEN** a client exceeds the configured rate limit for `POST /api/v1/chat/completions`
- **THEN** the backend returns HTTP `429`
- **AND** the response remains machine-readable for clients to implement backoff
