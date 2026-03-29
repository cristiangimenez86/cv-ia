# Internal RAG ingestion (operator-only)

This document describes the **internal** ingestion endpoint used to build and refresh the RAG index (pgvector).

## Endpoint

- `POST /internal/v1/rag/reindex`
- Base URL (local Docker): `http://localhost:8056`
- Base URL (inside Docker network): `http://api:8080`

This endpoint is **not** routed through the public reverse-proxy (`8055`) and is not exposed via the Next.js `/api/*` proxy.

## Authentication

- Header: `X-Rag-Ingestion-Key: <secret>`
- Secret is read from config key `Rag:IngestionApiKey` (environment variable `Rag__IngestionApiKey` in Portainer).

If `Rag:IngestionApiKey` is empty, the endpoint returns **503**.

## Request body

```json
{
  "mode": "incremental",
  "sourceIds": ["cv"]
}
```

- **mode**
  - `incremental`: reindex only the selected sources (or **all** configured sources if `sourceIds` omitted)
  - `full`: clear and rebuild all configured sources
- **sourceIds**
  - optional array of `Rag:Sources[].Id`

## Responses

- `200 OK`: returns per-source counts and duration
- `401 Unauthorized`: missing/invalid `X-Rag-Ingestion-Key`
- `409 Conflict`: ingestion already in progress (single-flight)
- `503 Service Unavailable`: ingestion not configured or RAG DB unavailable

