# backend-api-access-control Specification (delta)

## Purpose

Define cross-origin access and lightweight access control for **browser-facing** public API routes so only intended origins can invoke JSON APIs from scripts, and so requests carry a **deployment-configured bearer token** validated by the backend. Health and integration probes remain usable without that token.

## ADDED Requirements

### Requirement: Backend MUST expose an explicit CORS policy for browser clients

The backend SHALL register a named CORS policy whose **allowed origins**, **allowed methods**, and **allowed headers** (including `Authorization` and `Content-Type`) are driven by configuration. Browser `OPTIONS` preflight for permitted origins SHALL succeed. Production configuration SHALL NOT use a wildcard origin when `Authorization` is used on protected routes.

#### Scenario: Allowed origin can call the API from a script

- **WHEN** a browser page served from a configured allowed origin sends a credentialed or custom-header request to a CORS-covered API route
- **THEN** the response includes CORS headers that allow that origin for the configured methods and headers

#### Scenario: Disallowed origin is not accepted

- **WHEN** a browser page served from an origin not present in the configured allow list calls a CORS-covered API route
- **THEN** the browser SHALL NOT receive permissive CORS headers for that origin (request fails at the browser CORS layer)

### Requirement: Protected public API routes MUST validate a bearer access token when enabled

When API access protection is enabled in configuration, **every** request whose path is under **`/api/v1/`** SHALL require an `Authorization` header whose scheme is `Bearer` and whose token matches the configured access token using a **constant-time** comparison. This SHALL include **`GET /api/v1/cv`**. Missing, malformed, or incorrect tokens SHALL result in **401** with a machine-readable error body. When protection is disabled (for example local development), the same routes SHALL remain reachable without the token. Endpoints outside `/api/v1/` (for example **`/internal/`**) SHALL continue to use the authentication mechanism defined in their existing capability specs; this requirement does not remove or replace those mechanisms.

#### Scenario: Valid bearer succeeds for chat

- **WHEN** protection is enabled and a client sends a valid `Authorization: Bearer <token>` header to `POST /api/v1/chat/completions`
- **THEN** the backend processes the request after CORS and token validation

#### Scenario: Valid bearer succeeds for CV PDF

- **WHEN** protection is enabled and a client sends a valid `Authorization: Bearer <token>` header to `GET /api/v1/cv`
- **THEN** the backend returns the CV document response as defined by the API contract

#### Scenario: Missing bearer is rejected

- **WHEN** protection is enabled and a client omits the `Authorization` header on any `/api/v1/` route (including `GET /api/v1/cv`)
- **THEN** the backend returns **401** and does not execute the route’s business logic

### Requirement: Health endpoint MUST remain callable without the API access token

`GET /health` SHALL NOT require the public API access token described in this capability, so orchestrators and smoke checks can verify liveness without supplying bearer credentials.

#### Scenario: Health check without Authorization

- **WHEN** a client sends `GET /health` with no `Authorization` header
- **THEN** the backend responds with the normal health payload and success semantics regardless of whether `/api/v1/` protection is enabled

### Requirement: Configuration MUST bind access token and CORS from environment

The access token value and allowed CORS origins SHALL be supplied via configuration (for example `appsettings` and environment-variable overrides suitable for Docker/Portainer). The token SHALL NOT be hardcoded in source control.

#### Scenario: Deployment supplies secrets via env

- **WHEN** operators set the configured environment variables for CORS origins and API access token in a deployment environment
- **THEN** the running API enforces those values without rebuild
