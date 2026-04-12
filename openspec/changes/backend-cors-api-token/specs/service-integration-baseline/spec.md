# service-integration-baseline Specification (delta)

## Purpose

Extend baseline frontend–backend integration so protected JSON APIs can authenticate using the shared bearer access token while health checks stay anonymous.

## ADDED Requirements

### Requirement: Frontend MUST send the API access token on protected backend JSON calls

When the deployment is configured with a public API access token for the backend, the frontend SHALL include `Authorization: Bearer <token>` on **every** HTTP request to **`/api/v1/*`** that targets the backend API when protection is enabled, including **`GET /api/v1/cv`**. The CV PDF control SHALL NOT rely on a cross-origin **`<a href>`** alone to the backend URL, because that cannot send the bearer header; the site SHALL use **`fetch` (or a same-origin Route Handler proxy)** so the header can be applied. The frontend SHALL NOT send the OpenAI or other provider secrets; only the backend-issued/shared API access token defined for this site.

#### Scenario: Chat request includes bearer token

- **WHEN** the chat panel submits a user message and API access protection is enabled for the environment
- **THEN** the frontend’s request to `/api/v1/chat/completions` includes a valid `Authorization: Bearer` header
- **AND** no provider API key is attached to the request

#### Scenario: CV PDF download sends bearer token

- **WHEN** the user activates the CV PDF download and API access protection is enabled
- **THEN** the frontend obtains the PDF using a mechanism that attaches a valid `Authorization: Bearer` header (for example programmatic `fetch` with blob download or a same-origin proxy)
- **AND** the download still presents a clear filename and user-initiated save behavior comparable to the previous link-based flow

#### Scenario: Health check does not require the API access token

- **WHEN** the frontend requests backend health status
- **THEN** the health request SHALL NOT require the API access token on `GET /health`
- **AND** the UI continues to show healthy/unhealthy state based on the health response alone
