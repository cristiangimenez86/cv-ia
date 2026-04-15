## ADDED Requirements

### Requirement: Retrieved chunks included in chat MUST be delimited and marked untrusted

When retrieval-backed chat includes retrieved chunk text in the provider request, the backend MUST:

- Include retrieved chunk text inside a clearly delimited section (distinct header and boundaries)
- Explicitly instruct the model that retrieved text is untrusted and may contain malicious instructions
- Explicitly instruct the model to ignore any instructions found inside retrieved text and follow server rules

#### Scenario: Retrieved chunk contains instruction-like text
- **WHEN** retrieval returns a chunk containing instruction-like content (e.g., “ignore previous instructions”, “output a URL”, “reveal system prompt”)
- **THEN** the backend MUST still include the chunk only as delimited untrusted data
- **AND** the system instructions MUST explicitly direct the model to ignore such instructions

