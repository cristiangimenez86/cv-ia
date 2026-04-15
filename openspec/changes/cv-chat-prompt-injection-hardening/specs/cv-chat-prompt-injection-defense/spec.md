## ADDED Requirements

### Requirement: Backend chat MUST ignore client-supplied system instructions

The backend chat completion pipeline MUST ignore any client-supplied message with `role = system`. The server system prompt is authoritative.

#### Scenario: Client sends a system role message
- **WHEN** the request `messages[]` includes at least one item with `role = "system"`
- **THEN** the backend MUST NOT forward that message to the provider
- **AND** the backend MUST still include its server-defined system prompt

### Requirement: Retrieved RAG context MUST be treated as untrusted data

When RAG is enabled and retrieved chunks are included, the system prompt MUST explicitly state that retrieved content is untrusted and may contain malicious instructions. The model MUST be instructed to treat retrieved text as quoted data, not instructions, and MUST prioritize the server rules and the full CV markdown.

#### Scenario: Retrieved chunk contains prompt injection text
- **WHEN** retrieval returns a chunk containing instruction-like content (e.g., “ignore previous instructions”)
- **THEN** the system prompt MUST frame retrieved content as untrusted data
- **AND** the request MUST preserve the server guardrails as the highest-priority instructions

### Requirement: Chat completion MUST enforce an allowlist for links in assistant replies

Before returning the assistant reply, the backend MUST validate that any Markdown link targets in the assistant message are restricted to:

- In-page section anchors only: `/{lang}#{section-id}` where `{lang}` is exactly `en` or `es` and `{section-id}` is in the server allowlist of section ids
- PDF download endpoints only: `/api/v1/cv?lang=es` and `/api/v1/cv?lang=en`

The backend MUST NOT return external URLs, `mailto:` links, or arbitrary paths.

#### Scenario: Assistant reply contains an external URL
- **WHEN** the provider returns an assistant message that contains a Markdown link to `http://...` or `https://...`
- **THEN** the backend MUST NOT return that link to the client
- **AND** the backend MUST return a safe CV-scoped assistant message instead

#### Scenario: Assistant reply contains a disallowed internal path
- **WHEN** the provider returns an assistant message that contains a Markdown link whose target is not one of the allowed targets
- **THEN** the backend MUST NOT return that link to the client
- **AND** the backend MUST return a safe CV-scoped assistant message instead

#### Scenario: Assistant reply contains allowed section anchors only
- **WHEN** the provider returns an assistant message that contains only allowed `/{lang}#{section-id}` links and/or the allowed PDF endpoints
- **THEN** the backend MUST return the assistant message unchanged (subject to other existing response processing)

### Requirement: Policy violations MUST produce deterministic safe fallback responses

If output policy validation fails (for example due to disallowed links), the backend MUST return a deterministic safe assistant message:

- In the user’s language (Spanish or English)
- Scoped to the CV/profile context
- Without any disallowed links

#### Scenario: Output violates link policy
- **WHEN** output validation detects any disallowed link target in the assistant message
- **THEN** the backend MUST replace the assistant message with a safe fallback response
- **AND** the HTTP response MUST remain `200` with a `ChatResponseDto`

### Requirement: Injection defense MUST be covered by automated tests

The backend MUST include automated tests that cover at minimum:

- User prompt injection attempts requesting disallowed links or secrets
- RAG prompt injection attempts delivered via retrieved chunks
- Output policy enforcement and safe fallback behavior

#### Scenario: Test suite includes prompt injection cases
- **WHEN** the backend test suite is executed
- **THEN** it MUST include tests that fail if disallowed links are returned in `ChatResponseDto.message`

