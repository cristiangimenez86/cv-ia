## ADDED Requirements

### Requirement: Frontend consumes backend health endpoint
The frontend MUST call the backend health endpoint through a configured API base URL and MUST handle success and failure states without directly contacting third-party AI providers.

#### Scenario: Backend is reachable
- **WHEN** the frontend requests backend health status
- **THEN** the UI receives and renders a healthy service state using backend response data

#### Scenario: Backend is unavailable
- **WHEN** the frontend requests backend health status and the backend is unreachable or returns an error
- **THEN** the UI renders a non-healthy state with a user-safe fallback message and no unhandled exception

### Requirement: Backend exposes contract-aligned health response
The backend MUST expose `GET /health` in the scaffold and return a stable response suitable for integration checks.

#### Scenario: Health endpoint request
- **WHEN** a client sends `GET /health`
- **THEN** the backend responds with a success status and a machine-readable payload indicating service health

#### Scenario: Integration smoke check
- **WHEN** automated checks call the health endpoint during validation
- **THEN** the result can be used to determine whether backend startup is complete
