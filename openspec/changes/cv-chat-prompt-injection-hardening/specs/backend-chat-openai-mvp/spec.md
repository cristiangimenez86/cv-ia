## MODIFIED Requirements

### Requirement: Backend chat behavior MUST apply MVP guardrails
The backend MUST enforce baseline prompt guardrails in this MVP so responses remain scoped to CV context, respect requested locale, and avoid fabricated claims when confidence is low. The backend MUST also enforce critical guardrails server-side (not prompt-only) for prompt-injection resilience.

#### Scenario: User asks CV-related question in Spanish
- **WHEN** `lang` is `es` and the question is in CV scope
- **THEN** the assistant response is produced in Spanish
- **AND** the response stays focused on profile-relevant information

#### Scenario: User asks out-of-scope question
- **WHEN** the user request is unrelated to CV/profile context
- **THEN** the assistant provides a safe constrained response instead of unrelated free-form knowledge
- **AND** no internal secrets or provider configuration details are exposed

#### Scenario: Assistant reply includes disallowed links
- **WHEN** the provider returns an assistant message containing any link target outside the allowed CV navigation anchors and the allowed PDF endpoints
- **THEN** the backend MUST NOT return the disallowed link to the client
- **AND** the backend MUST return a safe CV-scoped assistant message instead (still `200` with `ChatResponseDto`)

