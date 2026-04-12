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

### Requirement: System prompt SHALL instruct Markdown-formatted answers

The backend chat system prompt SHALL require that assistant replies use Markdown (including bold, italic, lists, and inline code where appropriate) so clients can render rich text.

#### Scenario: Spanish answer uses Markdown

- **WHEN** a user sends a CV-scoped question in Spanish
- **THEN** the model instructions SHALL encourage Markdown formatting in the assistant reply
- **AND** factual content SHALL still be constrained to the CV source text supplied to the model for that request (retrieved chunks when RAG is active, or full Markdown context when fallback mode is used)

### Requirement: System prompt SHALL require section references as inline links to known anchors only

The system prompt SHALL include the authoritative list of CV section IDs and SHALL instruct the model to reference sections using Markdown links whose targets are only paths of the form `/{lang}#{section-id}` where `{lang}` matches the request `lang` (`es` or `en`) and `{section-id}` is from the allowed list.

#### Scenario: Section link uses allowed ID

- **WHEN** the assistant refers the user to a CV section (e.g. experience)
- **THEN** the reply SHOULD use a Markdown link such as `[Experience](/en#experience)` for English or the Spanish equivalent label with `/es#experience`
- **AND** the fragment SHALL match one of the allowed section IDs

### Requirement: System prompt SHALL forbid external and arbitrary URLs in assistant replies

The system prompt SHALL state that the assistant MUST NOT include links to external websites, HTTP(S) URLs, or paths other than the allowed `/{lang}#{section-id}` pattern for navigation.

#### Scenario: No external links

- **WHEN** the assistant message is generated
- **THEN** prompt instructions SHALL discourage marketing links, third-party URLs, and non-CV navigation

### Requirement: System prompt SHALL define a conversational, human tone

The system prompt SHALL instruct the assistant to respond in a natural, conversational tone appropriate for recruiters and hiring managers, avoiding robotic disclaimers, while remaining accurate and grounded in the CV text.

#### Scenario: Warm tone without losing facts

- **WHEN** the user asks about experience or skills
- **THEN** the assistant SHOULD sound personable and direct (e.g. first person when describing the profile where appropriate)
- **AND** the assistant MUST NOT invent employers, dates, or technologies not present in the CV source text supplied for that request

### Requirement: Chat completion MUST ground answers in retrieved CV chunks when RAG is enabled

When RAG configuration is enabled and the chunk index is populated, the backend SHALL assemble the OpenAI system/user context so that primary factual grounding for the assistant is the retrieved chunk text for the request `lang`.

#### Scenario: Retrieved chunks constrain facts

- **WHEN** RAG is enabled and retrieval returns at least one chunk for the user message
- **THEN** the OpenAI chat request SHALL include that retrieved text as the primary CV grounding material
- **AND** the assistant MUST treat that text as authoritative for factual claims in the reply

### Requirement: Chat completion MUST support safe fallback when RAG is disabled or retrieval is empty

When RAG is disabled by configuration, or retrieval returns no usable chunks, or the vector store is unavailable per policy, the backend SHALL use a documented fallback grounding strategy (e.g. full-section Markdown loaded from disk as in the pre-RAG implementation) so that chat remains operable for operators who rely on the previous behavior.

#### Scenario: Fallback avoids hard failure on empty retrieval

- **WHEN** RAG is enabled but retrieval yields no rows above the configured threshold
- **THEN** the backend SHALL apply the configured fallback grounding strategy
- **AND** the backend SHALL NOT return `500` solely due to empty retrieval if fallback is available

### Requirement: Chat completion orchestration MUST use explicit dependencies for RAG/embeddings

The chat completion service SHALL obtain RAG embedding and retrieval collaborators through **constructor injection** of typed abstractions registered in dependency injection (for example `IOpenAiEmbeddingsClient` with a no-op implementation when RAG is disabled). The PRIMARY wiring path SHALL NOT resolve optional RAG dependencies via `IServiceProvider.GetService` or equivalent service-locator calls inside the hot path.

#### Scenario: RAG disabled

- **WHEN** RAG is disabled or the database is not configured
- **THEN** the chat completion service SHALL still construct without requiring optional embedding services from a service locator

#### Scenario: RAG enabled

- **WHEN** RAG is enabled and embeddings are registered
- **THEN** the chat completion service SHALL receive embedding/retrieval dependencies via constructor parameters or explicit interface types resolved at startup

### Requirement: Chat and RAG logs MUST carry a request correlation identifier

For requests that invoke chat completion, structured logs along the chat and RAG retrieval path SHALL include a **correlation identifier** (for example `HttpContext.TraceIdentifier` or `Activity.Current` id) so operators can correlate OpenAI calls, retrieval, and controller logs for the same HTTP request.

#### Scenario: Single request traceable

- **WHEN** a chat completion request triggers RAG retrieval and an OpenAI completion
- **THEN** log entries for that request SHALL share the same correlation identifier value in scope or structured fields

