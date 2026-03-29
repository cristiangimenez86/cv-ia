# backend-chat-openai-mvp Specification (delta)

## Purpose

Extend the **backend-chat-openai-mvp** capability with **wiring** and **observability** requirements that keep the chat completion pipeline maintainable and diagnosable when RAG and embeddings are optional.

## ADDED Requirements

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
