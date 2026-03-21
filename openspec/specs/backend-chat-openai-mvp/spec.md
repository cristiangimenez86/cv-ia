# backend-chat-openai-mvp Specification

## Purpose
Define the MVP behavior for OpenAI-backed chat completions through the backend gateway, including configuration, guardrails, and forward compatibility with a future streaming transport.

## Requirements
### Requirement: Backend chat completions MUST be provider-backed
The backend MUST implement `POST /api/v1/chat/completions` using a real OpenAI provider integration and MUST NOT rely on scaffold stub responses in this capability.

#### Scenario: Valid chat completion request
- **WHEN** a client sends a valid chat request with `lang` in `en|es` and at least one user message
- **THEN** the backend returns `200` with a `ChatResponse` containing `id`, `createdAt`, and an assistant `message`
- **AND** the response remains aligned with the existing API DTO contract

### Requirement: Backend chat runtime MUST enforce configuration-driven provider access
The backend MUST read provider credentials and model/runtime settings from backend configuration and MUST keep provider secrets out of frontend/runtime client exposure.

#### Scenario: Provider configuration is present
- **WHEN** required OpenAI configuration is available at startup/runtime
- **THEN** chat completion requests are executed against the configured provider model
- **AND** operational logs include safe metadata (request id, latency, status class) without logging secrets

#### Scenario: Provider configuration is missing
- **WHEN** a chat completion request is received and required provider settings are missing or invalid
- **THEN** the backend returns a machine-readable error response
- **AND** the process remains healthy for other endpoints

### Requirement: Default OpenAI model MUST be gpt-4o-mini unless overridden
The backend MUST use **`gpt-4o-mini`** as the default OpenAI model for chat completions when configuration does not specify another model, balancing cost and quality for short bilingual CV Q&A.

#### Scenario: Default model applied
- **WHEN** chat completion runs with default model settings
- **THEN** the OpenAI API request targets the `gpt-4o-mini` model unless explicitly overridden by deployment configuration

### Requirement: Backend chat behavior MUST apply MVP guardrails
The backend MUST enforce baseline prompt guardrails in this MVP so responses remain scoped to CV context, respect requested locale, and avoid fabricated claims when confidence is low.

#### Scenario: User asks CV-related question in Spanish
- **WHEN** `lang` is `es` and the question is in CV scope
- **THEN** the assistant response is produced in Spanish
- **AND** the response stays focused on profile-relevant information

#### Scenario: User asks out-of-scope question
- **WHEN** the user request is unrelated to CV/profile context
- **THEN** the assistant provides a safe constrained response instead of unrelated free-form knowledge
- **AND** no internal secrets or provider configuration details are exposed

### Requirement: Backend chat implementation MUST allow a future streaming transport with minimal migration
The backend MUST implement non-streaming completions so that prompt assembly, guardrails, and provider integration are isolated from HTTP transport concerns, enabling a future streaming endpoint (e.g. SSE) to be added with minimal churn to the core completion pipeline.

#### Scenario: Implementation structure supports a later streaming endpoint
- **WHEN** the chat completion path is implemented for this MVP
- **THEN** provider-specific orchestration is not embedded in controller action bodies as one-off logic
- **AND** the existing non-streaming `POST /api/v1/chat/completions` contract remains the stable JSON response while streaming may be added later as a separate route or opt-in
