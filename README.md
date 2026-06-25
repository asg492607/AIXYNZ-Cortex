<div align="center">

<img src="https://img.shields.io/badge/AIXYNZ-Cortex-blue?style=for-the-badge&logo=shield&logoColor=white" alt="AIXYNZ Cortex" />

# AIXYNZ-Cortex

### AI-Powered Security Operating System

[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18+-61DAFB?style=flat&logo=react)](https://react.dev)
[![Python](https://img.shields.io/badge/Python-3.13-3776AB?style=flat&logo=python)](https://python.org)
[![Groq](https://img.shields.io/badge/AI-Groq-F55036?style=flat)](https://groq.com)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat)](LICENSE)
[![MVP](https://img.shields.io/badge/Status-MVP--1%20Complete-brightgreen?style=flat)](https://github.com/asg492607/AIXYNZ-Cortex)

</div>

---

Cortex is a **unified security operations platform** that connects your cloud infrastructure, code repositories, and ticketing system into a single AI-powered risk surface. It continuously scans AWS and GitHub for security misconfigurations, normalizes findings into a consistent schema, uses Groq-powered AI to analyze and contextualize risks, and automatically creates Jira remediation tickets — all from one dashboard.

> Built as MVP-1 for startup security teams who need enterprise-grade risk visibility without an enterprise-sized ops team.

---

## Screenshots

| Dashboard | Risk Queue | Integrations |
|---|---|---|
| Real-time posture score, top risks, rescan | Full finding list with AI analysis panel | Connector status and environment control |

---

## Features

### 🔍 Multi-Source Security Scanning
- **AWS** — S3 public exposure (ACL + policy), weak Public Access Block posture, Security Groups open on sensitive ports across **all enabled regions** (IPv4 + IPv6), IAM roles with `AdministratorAccess`
- **GitHub** — Repository public exposure, missing branch protection, Dependabot availability posture, Secret Scanning coverage gap detection — all normalized via `GITHUB_OWNER` org targeting
- Honest **coverage-gap findings** when alerts are unavailable, instead of fabricating CVEs

### 🤖 AI-Powered Risk Analysis
- Powered by **Groq** (Llama 3) for sub-second structured responses
- Every finding gets: `summary`, `severity_reasoning`, `business_impact`, `remediation_steps`, `jira_title`
- Structured JSON output with strict fallback schema — never crashes on malformed AI responses

### 🎫 Automated Jira Remediation
- One-click ticket creation from any finding's detail panel
- **Idempotent** — repeated clicks or rescans never create duplicate Jira issues
- Ticket key written back to finding record for UI linkage
- Supports live Jira REST API or demo mode

### 🔄 Scan Orchestration
- Full rescan via `POST /scan/rescan` from Dashboard, Risk Queue, or Integrations page
- **Upsert persistence** — rescans update existing findings by `external_finding_key`, never duplicate
- Demo mode auto-seeds realistic findings without any real credentials

### 💾 Firebase Persistence
- Firestore as source of truth in live mode
- In-memory mock store in demo mode — same API surface, zero config
- All findings carry: `org_id`, `source`, `category`, `severity`, `asset`, `raw_data`, `jira_issue_key`, `confidence`, `scanner_metadata`

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        AIXYNZ Cortex                            │
│                                                                 │
│  ┌──────────────┐   REST / JSON   ┌──────────────────────────┐  │
│  │   Frontend   │ ◄────────────► │       Backend API         │  │
│  │  React + Vite│                │    FastAPI / Python 3.13  │  │
│  │              │                │                           │  │
│  │  Dashboard   │                │  ┌────────────────────┐   │  │
│  │  Risk Queue  │                │  │   Service Layer    │   │  │
│  │  Integrations│                │  │                    │   │  │
│  └──────────────┘                │  │  scan_service.py   │   │  │
│                                  │  │  remediation_      │   │  │
│                                  │  │    service.py      │   │  │
│                                  │  └────────────────────┘   │  │
│                                  │                           │  │
│                                  │  ┌────────────────────┐   │  │
│                                  │  │    Connectors      │   │  │
│                                  │  │                    │   │  │
│                                  │  │  aws_scanner.py    │   │  │
│                                  │  │  github_scanner.py │   │  │
│                                  │  │  groq_client.py    │   │  │
│                                  │  │  jira_client.py    │   │  │
│                                  │  └────────────────────┘   │  │
│                                  │                           │  │
│                                  │  ┌────────────────────┐   │  │
│                                  │  │   Persistence      │   │  │
│                                  │  │                    │   │  │
│                                  │  │  firebase_client   │   │  │
│                                  │  │  finding_factory   │   │  │
│                                  │  └────────────────────┘   │  │
│                                  └──────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
         │                │              │              │
         ▼                ▼              ▼              ▼
      AWS APIs       GitHub API      Groq API      Jira REST
   (S3/EC2/IAM)    (Repos/Posture) (Llama 3)     (Issue CRUD)
```

### Finding Normalization

Every finding across all sources follows the same contract, enforced by [`finding_factory.py`](backend/services/finding_factory.py):

```python
{
  "id": "fnd_abc123",
  "org_id": "acme-corp",
  "source": "aws",               # aws | github
  "source_type": "cloud",        # cloud | code
  "category": "storage_exposure",
  "finding_type": "public_s3_bucket",
  "title": "S3 bucket prod-data is publicly accessible",
  "severity": "Critical",        # Critical | High | Medium | Low
  "risk_score": 95,
  "status": "open",
  "external_finding_key": "aws:s3-public:prod-data",   # stable dedupe key
  "asset": {
    "external_asset_id": "aws:s3:::prod-data",
    "asset_type": "s3_bucket",
    "asset_name": "prod-data",
    "provider": "aws",
    "account_id": "123456789012",
    "region": "us-east-1"
  },
  "jira_issue_key": "SEC-42",    # populated after remediation
  "confidence": "high",
  "scanner_metadata": { "scanner": "aws_s3_exposure" },
  "raw_data": { ... },
  "detected_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, TailwindCSS, Axios, Lucide Icons |
| Backend | FastAPI, Python 3.13, Pydantic v2, Uvicorn |
| AI | Groq (Llama 3 70B) |
| Cloud Scanner | boto3 (AWS SDK) |
| Code Scanner | PyGithub |
| Persistence | Firebase Firestore (live) / in-memory mock (demo) |
| Ticketing | Jira REST API v3 |

---

## Project Structure

```
cyberpro/
├── backend/
│   ├── main.py                    # FastAPI app + CORS
│   ├── requirements.txt
│   ├── run_backend.ps1            # Windows startup script (fixes env issues)
│   ├── api/
│   │   └── routes.py              # All API endpoints
│   ├── services/
│   │   ├── finding_factory.py     # Normalized finding builder (shared schema)
│   │   ├── scan_service.py        # Scan orchestration layer
│   │   ├── remediation_service.py # Remediation orchestration + idempotency
│   │   ├── firebase_client.py     # Persistence (Firestore + mock)
│   │   ├── groq_client.py         # Groq AI analysis
│   │   ├── aws_scanner.py         # S3 / Security Groups / IAM scanner
│   │   ├── github_scanner.py      # Repo posture / coverage scanner
│   │   └── jira_client.py         # Jira ticket creation
│   └── tests/
│       ├── test_smoke.py          # pytest smoke suite (Sprint C)
│       └── smoke_verify.py        # Standalone static verifier
└── frontend/
    ├── src/
    │   ├── App.jsx                # Layout + routing
    │   ├── lib/
    │   │   └── config.js          # Centralised API_BASE + ORG_ID
    │   └── pages/
    │       ├── Dashboard.jsx      # Command center + rescan
    │       ├── Findings.jsx       # Risk queue + AI analyze + remediate
    │       └── Integrations.jsx   # Connector status + rescan
    └── index.html
```

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/dashboard/summary` | Posture score, risk counts, top 5 findings |
| `GET` | `/api/v1/findings` | All findings for org, sorted by severity |
| `POST` | `/api/v1/scan/rescan` | Trigger full AWS + GitHub scan |
| `POST` | `/api/v1/findings/analyze` | AI analysis for a finding |
| `POST` | `/api/v1/findings/remediate` | Create Jira ticket (idempotent) |

**Request bodies (POST):**
```json
// /scan/rescan
{ "org_id": "demo-org" }

// /findings/analyze
{ "finding_id": "fnd_abc123", "org_id": "demo-org" }

// /findings/remediate
{ "finding_id": "fnd_abc123", "org_id": "demo-org" }
```

**Remediation response (flat shape):**
```json
{
  "mode": "demo",
  "org_id": "demo-org",
  "finding_id": "fnd_abc123",
  "status": "success",
  "ticket_id": "SEC-42",
  "ticket_url": "https://yourorg.atlassian.net/browse/SEC-42",
  "analysis": { ... }
}
```

---

## Setup

### Prerequisites
- Python 3.13+
- Node.js 18+
- (Optional) AWS credentials, GitHub token, Jira API token, Groq API key, Firebase service account

### 1 — Backend

```bash
cd backend

# Create and activate virtual environment
python -m venv .venv

# Windows
.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

Create a `.env` file in `backend/`:

```env
# AI
GROQ_API_KEY=gsk_...

# AWS (optional — falls back to demo mode)
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_DEFAULT_REGION=us-east-1

# GitHub (optional)
GITHUB_TOKEN=ghp_...
GITHUB_OWNER=your-org-or-username

# Jira (optional)
JIRA_URL=https://yourorg.atlassian.net
JIRA_TOKEN=...
JIRA_EMAIL=you@yourorg.com
JIRA_PROJECT=SEC

# Firebase (optional — omit to run in demo mode)
# Place serviceAccountKey.json in backend/ directory
```

**Start the backend:**

```bash
# Standard (macOS/Linux)
uvicorn main:app --reload

# Windows (fixes MySQL Shell PATH conflict if present)
.\run_backend.ps1
```

API available at: `http://localhost:8000`  
Interactive docs: `http://localhost:8000/docs`

### 2 — Frontend

```bash
cd frontend
npm install
npm run dev
```

App available at: `http://localhost:5173`

### 3 — Demo Mode

No credentials required. Run the backend without any `.env` file and Cortex automatically enters **DEMO MODE** — all scans return realistic synthetic findings, AI analysis uses the Groq fallback schema, and all data is stored in-memory.

The DEMO / LIVE badge in the top-right of every page reflects the actual runtime mode from the backend.

---

## Running Smoke Tests

```bash
cd backend
pip install pytest
pytest tests/test_smoke.py -v
```

Tests cover:
- Demo mode boot — scan auto-populates findings
- Rescan idempotency — repeated rescans never duplicate findings
- AI analysis response schema
- Remediation idempotency — second call returns `already_exists`
- `external_finding_key` uniqueness per org
- GitHub scanner normalized finding shape
- AWS scanner S3 finding split (`public_s3_bucket` vs `weak_s3_public_access_block`)
- Firebase upsert preserves `created_at` on re-upsert
- `finding_factory` full schema completeness

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `GROQ_API_KEY` | Recommended | Groq API key for AI analysis |
| `AWS_ACCESS_KEY_ID` | Optional | AWS scanner — falls back to demo |
| `AWS_SECRET_ACCESS_KEY` | Optional | AWS scanner |
| `AWS_DEFAULT_REGION` | Optional | Default `us-east-1` |
| `GITHUB_TOKEN` | Optional | GitHub scanner — falls back to demo |
| `GITHUB_OWNER` | Optional | GitHub org or user to target |
| `JIRA_URL` | Optional | Jira base URL |
| `JIRA_TOKEN` | Optional | Jira API token |
| `JIRA_EMAIL` | Optional | Jira account email |
| `JIRA_PROJECT` | Optional | Jira project key, e.g. `SEC` |

> **Demo mode** activates automatically when `serviceAccountKey.json` is absent. All connectors fall back to mock data when their credentials are missing. The runtime mode is always surfaced in the UI.

---

## MVP-1 Completion Status

| Area | Status |
|---|---|
| Normalized finding model | ✅ Complete |
| AWS scanner (S3 / SG / IAM, all regions) | ✅ Complete |
| GitHub posture / coverage connector | ✅ Complete |
| AI analysis (Groq / Llama 3) | ✅ Complete |
| Jira remediation (idempotent) | ✅ Complete |
| Firebase persistence + upsert | ✅ Complete |
| Demo / live runtime separation | ✅ Complete |
| Scan orchestration service layer | ✅ Complete |
| Frontend dashboard + rescan | ✅ Complete |
| Findings queue + AI panel + remediation UX | ✅ Complete |
| Integrations page (real runtime awareness) | ✅ Complete |
| Sprint C smoke test coverage | ✅ Complete |

---

## Roadmap — MVP-2

- [ ] Scheduled rescans (cron / background worker)
- [ ] Slack / Teams notifications for Critical findings
- [ ] GitHub Dependabot + Secret Scanning alerts (when Advanced Security enabled)
- [ ] Multi-tenant org isolation + auth layer
- [ ] Risk scoring engine (weighted by asset criticality)
- [ ] Remediation workflow states (open → in-progress → resolved)
- [ ] Findings export (CSV / PDF report)
- [ ] Deployment to cloud (Railway / Render / GCP Cloud Run)

---

## License

MIT — see [LICENSE](LICENSE)

---

<div align="center">
  <sub>Built with ❤️ by the AIXYNZ team · Cortex MVP-1</sub>
</div>
