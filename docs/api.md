# API Reference

The Cortex backend uses FastAPI to serve a RESTful JSON API.

## Authentication
All protected endpoints require an `Authorization` header containing a Firebase JWT.
```http
Authorization: Bearer <your-jwt-token>
```
*Note: In demo mode, the mock token `test_token` can be used to impersonate the Demo Admin.*

## Core Endpoints

### Health & Metrics
- `GET /health` : Lightweight liveness probe.
- `GET /health/deep` : Checks DB, Redis, and individual connectors.
- `GET /api/v1/metrics` : Aggregated finding counts, MTTR, and recent scan logs.

### Findings
- `GET /api/v1/findings` : Returns a paginated list of findings.
  - Query Params: `page`, `limit`, `severity`, `status`, `source`.
- `PATCH /api/v1/findings/{id}/status` : Update status (`open`, `in_progress`, `resolved`, `suppressed`).
  - Body: `{"status": "suppressed", "ignored_reason": "Risk accepted", "expires_at": "2024-12-01T00:00:00Z"}`

### Assets
- `GET /api/v1/assets` : Paginated list of discovered assets and risk scores.
- `GET /api/v1/assets/{id}` : Details and associated findings for a specific asset.

### Remediation (AI)
- `POST /api/v1/findings/analyze` : Triggers Groq AI to generate a remediation plan for a specific finding.
- `POST /api/v1/findings/{id}/remediation` : Push an AI-generated plan to Jira (creates a ticket).

### Exports
- `GET /api/v1/reports/findings/csv` : Export all findings as CSV.
- `GET /api/v1/reports/compliance/summary` : Export a rollup of findings mapped to CIS, SOC2, and ISO controls.
