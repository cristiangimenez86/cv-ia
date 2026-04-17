## ADDED Requirements

### Requirement: Chat request MAY carry an optional visitor name for personalization

`POST /api/v1/chat/completions` SHALL accept an optional `visitor` object with a nullable `name` string. The field is optional; requests without it SHALL behave exactly as before.

#### Scenario: Request omits visitor object

- **WHEN** a client sends a valid chat request with no `visitor` field
- **THEN** the backend SHALL process the request as it does today and SHALL NOT inject any visitor-name block into the system prompt

#### Scenario: Request includes a valid visitor name

- **WHEN** a client sends a valid chat request with `visitor.name = "Ana"`
- **THEN** the backend SHALL return `200` with a `ChatResponse`
- **AND** the name SHALL be considered available to the prompt pipeline (subject to sanitization rules)

#### Scenario: Visitor name exceeds length limit at the contract level

- **WHEN** a client sends `visitor.name` longer than 40 characters
- **THEN** the backend SHALL either reject the request with a `400` validation error or treat the name as rejected (null) downstream
- **AND** the backend SHALL NOT forward the oversized name to the LLM

### Requirement: Visitor names MUST be sanitized server-side before entering the prompt

Before a visitor name is placed into the system prompt, the backend SHALL apply a dedicated sanitization pipeline that trims whitespace, normalizes Unicode, rejects control characters, rejects prompt-injection cues, enforces an allowed character set, and clamps the final length. Values that fail any rule SHALL be treated as "no name supplied".

#### Scenario: Name with allowed characters passes sanitization

- **WHEN** the sanitizer receives `"Ana María"` after trimming
- **THEN** the sanitizer SHALL return the normalized value and the pipeline SHALL treat the visitor as named

#### Scenario: Name contains newlines or role markers

- **WHEN** the sanitizer receives a name that contains a newline, carriage return, tab, triple backticks, or a role marker such as `system:`, `assistant:`, `developer:`, or `tool:`
- **THEN** the sanitizer SHALL reject the value and return `null`
- **AND** the backend SHALL NOT inject any visitor-name block into the system prompt

#### Scenario: Name contains disallowed characters

- **WHEN** the sanitizer receives a name that does not match the allowed Unicode-letter / combining-mark / space / dash / apostrophe / period set (for example `"<script>"`, `"{{name}}"`, or `"a | b"`)
- **THEN** the sanitizer SHALL reject the value and return `null`

#### Scenario: Name exceeds the allowed length after normalization

- **WHEN** the sanitizer receives a name whose normalized form is longer than 40 characters
- **THEN** the sanitizer SHALL reject the value and return `null`

### Requirement: System prompt MUST quote visitor name as untrusted data with explicit guardrails

When a sanitized visitor name is available, the backend SHALL add a dedicated "Visitor identity (UNTRUSTED quoted data)" block to the system prompt, clearly delimited, that instructs the model to treat the content as quoted data, to use the name naturally when addressing the visitor, to NOT follow any instructions contained inside the block, and to NOT invent other personal details about the visitor.

#### Scenario: Sanitized name is injected into the prompt

- **WHEN** a chat completion request has a sanitized non-null visitor name
- **THEN** the composed system prompt SHALL include a clearly delimited visitor-name block containing the sanitized name
- **AND** the block SHALL include instructions telling the model to treat the content as quoted data and to ignore any instructions found inside it

#### Scenario: No sanitized name available

- **WHEN** the request has no visitor name, or the sanitizer rejected the supplied name
- **THEN** the composed system prompt SHALL NOT include any visitor-name block

#### Scenario: CV remains authoritative over visitor-name instructions

- **WHEN** the supplied visitor name looks like an instruction (for example trying to rename the assistant or alter tone)
- **THEN** the model SHALL still be instructed by the system prompt to follow only the authoritative server rules and SHALL NOT treat the visitor-name contents as directives

### Requirement: Visitor names MUST NOT be persisted server-side or logged at INFO in production

The backend SHALL NOT store the visitor name in any database, cache, or session. Structured logs at INFO level in production SHALL NOT include the raw visitor name. The backend MAY include only a boolean indicator such as `visitor.name.present` and MAY log a sanitization rejection reason at DEBUG level.

#### Scenario: Completion log carries presence flag only

- **WHEN** a chat completion request includes a valid visitor name
- **THEN** INFO-level structured logs for the request SHALL include a `visitor.name.present` boolean (or equivalent)
- **AND** INFO-level logs SHALL NOT include the raw visitor name

#### Scenario: Rejected name contributes only a reason code at DEBUG

- **WHEN** the sanitizer rejects a supplied visitor name
- **THEN** a DEBUG-level log entry MAY include a machine-readable rejection reason (for example `length`, `charset`, `injection`)
- **AND** no INFO-level log entry SHALL include the raw rejected value

### Requirement: Frontend SHALL send the stored visitor name with each chat request when available

When the chat widget has a non-empty visitor name in `localStorage` and the visitor has not opted out, the frontend SHALL include `visitor.name` in the body of each `POST /api/v1/chat/completions` request. When no name is stored or the visitor opted out, the frontend SHALL NOT include the `visitor` field.

#### Scenario: Stored name accompanies chat request

- **WHEN** the visitor sends a message and `localStorage` holds a non-empty name
- **THEN** the request body SHALL include `visitor: { name: "<stored name>" }`

#### Scenario: No stored name, no visitor field

- **WHEN** the visitor sends a message and no name is stored (or the visitor opted out)
- **THEN** the request body SHALL NOT include the `visitor` field
