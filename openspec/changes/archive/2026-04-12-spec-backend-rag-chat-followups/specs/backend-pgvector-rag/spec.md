# backend-pgvector-rag Specification (delta)

## Purpose

Extend the **backend-pgvector-rag** capability (introduced under `openspec/changes/add-pgvector-rag-chat`) with operational and security requirements that were out of scope for the initial delivery but are required for production-grade operation.

## ADDED Requirements

### Requirement: Ingestion shared secret MUST be compared in constant time

When validating `X-Rag-Ingestion-Key` against the configured ingestion secret, the backend SHALL compare secrets using a **constant-time** algorithm over the raw key material (for example fixed-time equality over UTF-8 bytes). The implementation SHALL NOT use short-circuit string equality that leaks timing information about the expected prefix.

#### Scenario: Equal keys authorize

- **WHEN** the header value and configured secret are identical byte sequences
- **THEN** the request SHALL be authorized for ingestion

#### Scenario: Unequal keys reject without timing leaks

- **WHEN** the header value differs from the configured secret
- **THEN** the request SHALL be rejected
- **AND** comparison SHALL not branch on the first differing character position in a way that replaces constant-time guarantees (normative: use cryptographic fixed-time compare APIs provided by the runtime)

### Requirement: Internal ingestion route MUST remain off the public site front door

Production deployment documentation SHALL state that `POST /internal/v1/rag/reindex` is reachable only via **direct API** or **private network** access (for example Docker network, admin VPN, or management port), and SHALL NOT be exposed through the same public reverse-proxy path as the marketing site or Next.js `/api` proxy unless explicitly justified and secured.

#### Scenario: Operator uses non-public access

- **WHEN** an operator runs ingestion in production
- **THEN** documentation SHALL describe how to reach the backend internal route without exposing it on the public internet hostname used for the CV site

### Requirement: Ingestion MUST bound concurrent OpenAI embedding calls

During a single reindex execution, the backend SHALL NOT issue an unbounded number of concurrent OpenAI embedding requests. The implementation SHALL apply an explicit **maximum degree of parallelism** (fixed constant or configuration) so that large sources do not exhaust connection pools or hit provider rate limits unpredictably.

#### Scenario: Large source still completes

- **WHEN** ingestion produces many chunks in one source
- **THEN** embedding calls SHALL be limited by the configured or built-in parallelism cap
- **AND** ingestion SHALL still complete successfully absent provider errors
