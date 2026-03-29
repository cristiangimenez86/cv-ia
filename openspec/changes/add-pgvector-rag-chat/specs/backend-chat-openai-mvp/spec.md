# backend-chat-openai-mvp Specification (delta)

## Purpose

Amend MVP chat behavior so factual grounding uses **retrieved CV chunks** when RAG is enabled, with explicit fallback to full Markdown context when RAG is off or unavailable.

## ADDED Requirements

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

## MODIFIED Requirements

### Requirement: System prompt SHALL instruct Markdown-formatted answers

The backend chat system prompt SHALL require that assistant replies use Markdown (including bold, italic, lists, and inline code where appropriate) so clients can render rich text.

#### Scenario: Spanish answer uses Markdown

- **WHEN** a user sends a CV-scoped question in Spanish
- **THEN** the model instructions SHALL encourage Markdown formatting in the assistant reply
- **AND** factual content SHALL still be constrained to the CV source text supplied to the model for that request (retrieved chunks when RAG is active, or full Markdown context when fallback mode is used)

### Requirement: System prompt SHALL define a conversational, human tone

The system prompt SHALL instruct the assistant to respond in a natural, conversational tone appropriate for recruiters and hiring managers, avoiding robotic disclaimers, while remaining accurate and grounded in the CV text.

#### Scenario: Warm tone without losing facts

- **WHEN** the user asks about experience or skills
- **THEN** the assistant SHOULD sound personable and direct (e.g. first person when describing the profile where appropriate)
- **AND** the assistant MUST NOT invent employers, dates, or technologies not present in the CV source text supplied for that request
