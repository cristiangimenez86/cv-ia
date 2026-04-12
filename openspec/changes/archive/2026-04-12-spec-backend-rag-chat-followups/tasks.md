## 1. Spec quality and validation

- [ ] 1.1 Cross-check deltas against `openspec/changes/add-pgvector-rag-chat/specs/backend-pgvector-rag/spec.md` for consistency (no contradictory SHALL statements).
- [ ] 1.2 Run `openspec validate spec-backend-rag-chat-followups` and fix any schema or formatting issues.
- [ ] 1.3 Optional: run `openspec show spec-backend-rag-chat-followups` (or `openspec status --change spec-backend-rag-chat-followups`) and confirm all artifacts are complete.

## 2. Hand-off (no code in this change)

- [ ] 2.1 Decide archive order: merge into `openspec/specs/` together with or after `add-pgvector-rag-chat` archive so `backend-pgvector-rag` exists in the main tree before folding these ADDED requirements.
- [ ] 2.2 Open a **separate** implementation change (or extend backlog) for backend work: constant-time key compare, bounded embedding parallelism, DI refactor for chat+RAG, log correlation—tracked against the ADDED requirements in this proposal.
