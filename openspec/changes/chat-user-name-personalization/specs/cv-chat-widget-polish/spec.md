## ADDED Requirements

### Requirement: Chat panel SHALL host the visitor-name conversational flow without breaking existing UX

When the chat widget integrates visitor-name personalization, the chat panel SHALL host the first-use name question, the first-time acknowledgement, the returning-visitor greeting, and the "forget my name" control as part of its standard layout without breaking existing size, backdrop, markdown, or link-safety behavior. The name flow SHALL be conversational: every prompt, question, acknowledgement, or greeting SHALL be rendered as a normal assistant message bubble inside the existing chat layout — not as a form, modal, or browser prompt.

#### Scenario: Name question is rendered as a normal assistant message

- **WHEN** the panel seeds the first-use name question
- **THEN** the question SHALL appear as a normal assistant message bubble inside the existing chat layout
- **AND** the main message input SHALL remain enabled so the visitor can reply with plain text
- **AND** the panel size constraints, backdrop blur, Escape-to-close, and click-outside-to-close behaviors SHALL remain unchanged

#### Scenario: Returning visitor greeting and acknowledgements are normal assistant bubbles

- **WHEN** the returning-visitor greeting or a first-time / rename acknowledgement is seeded
- **THEN** each message SHALL be rendered as a normal assistant message bubble using the existing Markdown renderer and theme tokens
- **AND** any links produced by these messages SHALL obey the existing link-safety requirements (only `/{locale}#{section-id}` or allowed PDF endpoints)

#### Scenario: Forget-name control is reachable from the panel

- **WHEN** the panel is open and either a visitor name or an opt-out flag is stored
- **THEN** a visible "forget my name" / "olvidar mi nombre" control SHALL be reachable from the panel (header or a control near the input)
- **AND** activating the control SHALL NOT close the panel and SHALL NOT remove any already-sent messages
