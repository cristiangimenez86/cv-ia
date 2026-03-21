# Service Integration Baseline Specification

## Purpose
Define baseline integration behavior between frontend and backend services so health checks and service availability are validated through stable, contract-aligned endpoints.

## Requirements
### Requirement: Frontend consumes backend health endpoint
The frontend MUST call the backend health endpoint through a configured API base URL and MUST handle success and failure states without directly contacting third-party AI providers, while keeping CV rendering independent from backend availability.

#### Scenario: Backend is reachable
- **WHEN** the frontend requests backend health status
- **THEN** the UI receives and renders a healthy service state using backend response data
- **AND** CV content pages remain server-rendered from `/content` sources

#### Scenario: Backend is unavailable
- **WHEN** the frontend requests backend health status and the backend is unreachable or returns an error
- **THEN** the UI renders a non-healthy state with a user-safe fallback message and no unhandled exception
- **AND** core CV page rendering remains available without backend-dependent content fetches

### Requirement: Backend exposes contract-aligned health response
The backend MUST expose `GET /health` in the scaffold and return a stable response suitable for integration checks used by rebuilt frontend workflows.

#### Scenario: Health endpoint request
- **WHEN** a client sends `GET /health`
- **THEN** the backend responds with a success status and a machine-readable payload indicating service health

#### Scenario: Integration smoke check
- **WHEN** automated checks call the health endpoint during validation
- **THEN** the result can be used to determine whether backend startup is complete
- **AND** frontend verification workflows can consume this result as a gating signal

### Requirement: Frontend chat uses backend as the single AI gateway
The frontend MUST send chat requests only to `POST /api/v1/chat/completions`, and the backend MUST be the only component that communicates with AI providers for runtime completions.

#### Scenario: User sends a chat message from UI
- **WHEN** the chat panel submits a user message
- **THEN** the frontend calls backend `/api/v1/chat/completions` using configured API base URL
- **AND** no provider key or direct provider call is performed from frontend runtime

#### Scenario: Backend provider error during chat request
- **WHEN** backend cannot complete provider call due to timeout, auth, or provider-side error
- **THEN** backend returns a machine-readable error payload suitable for frontend fallback handling
- **AND** frontend remains functional for non-chat CV rendering flows

### Requirement: Future streaming chat MUST be additive to the single-gateway model
When streaming chat is introduced in a future change, it MUST remain backend-only (no direct provider calls from the frontend) and MUST be **additive**: existing non-streaming `POST /api/v1/chat/completions` clients MUST keep working without breaking changes.

#### Scenario: Non-streaming client coexists with streaming
- **WHEN** a future streaming chat transport exists alongside the non-streaming endpoint
- **THEN** clients using non-streaming JSON completions to `/api/v1/chat/completions` continue to function
- **AND** the frontend MUST still route AI traffic through the backend gateway only
