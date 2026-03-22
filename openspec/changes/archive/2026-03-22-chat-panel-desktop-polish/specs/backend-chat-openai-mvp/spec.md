## ADDED Requirements

### Requirement: System prompt SHALL instruct Markdown-formatted answers

The backend chat system prompt SHALL require that assistant replies use Markdown (including bold, italic, lists, and inline code where appropriate) so clients can render rich text.

#### Scenario: Spanish answer uses Markdown

- **WHEN** a user sends a CV-scoped question in Spanish
- **THEN** the model instructions SHALL encourage Markdown formatting in the assistant reply
- **AND** factual content SHALL still be constrained to the CV markdown supplied in the system prompt

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
- **AND** the assistant MUST NOT invent employers, dates, or technologies not in the CV markdown
