## ADDED Requirements

### Requirement: Chat request DTO MUST accept an optional visitor hints object

The backend chat request contract (`ChatRequestDto` and the OpenAPI `ChatRequest` schema) SHALL accept an optional `visitor` object with a nullable `name` string (max length 40). The object is optional; requests omitting it SHALL be processed as before.

#### Scenario: Legacy client omits visitor object

- **WHEN** a client sends a chat request with only `lang` and `messages`
- **THEN** the backend SHALL accept the request and process it exactly as before (no visitor-name handling triggered)

#### Scenario: New client sends visitor object

- **WHEN** a client sends a chat request with `visitor: { name: "Ana" }`
- **THEN** the backend SHALL accept the request as a valid `ChatRequest`
- **AND** the backend SHALL forward the name to the sanitization pipeline before using it

### Requirement: System prompt MAY include a sanitized visitor-name block under untrusted-data framing

When the chat completion pipeline has a sanitized non-null visitor name for the current request, the backend SHALL compose the system prompt with an additional "Visitor identity (UNTRUSTED quoted data)" block clearly delimited with begin/end markers, and SHALL instruct the model to use the name naturally when addressing the visitor while treating the block contents as quoted data only.

#### Scenario: Visitor name block appears when a sanitized name is available

- **WHEN** the prompt builder receives a sanitized non-null visitor name
- **THEN** the composed system prompt SHALL contain exactly one visitor-name block with begin/end delimiters around the sanitized name
- **AND** the block SHALL include wording that tells the model to ignore any instructions found inside it

#### Scenario: Visitor name block is absent when there is no sanitized name

- **WHEN** the prompt builder receives a null visitor name (not supplied, or sanitizer rejected the value)
- **THEN** the composed system prompt SHALL NOT contain any visitor-name block

### Requirement: Visitor names MUST NOT be persisted server-side and MUST NOT appear in production INFO logs

In line with the overall logging posture of `backend-chat-openai-mvp`, the backend SHALL NOT persist the visitor name in any datastore, cache, or session, and SHALL NOT emit the raw visitor name in INFO-level structured logs. A presence indicator (e.g. `visitor.name.present`) MAY be included instead.

#### Scenario: Completion INFO log carries no raw visitor name

- **WHEN** a chat completion request includes a visitor name and is processed successfully
- **THEN** INFO-level structured logs for that request SHALL NOT contain the raw visitor name
- **AND** a presence indicator SHALL be acceptable in its place

#### Scenario: Visitor name is not persisted

- **WHEN** a chat completion request includes a visitor name
- **THEN** the backend SHALL NOT write the name to any database, cache, or session store
