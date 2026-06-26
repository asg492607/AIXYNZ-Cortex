<div align="center">

<img src="https://img.shields.io/badge/version-v0.4.0-indigo?style=for-the-badge" />
<img src="https://img.shields.io/badge/MVP--3-Complete-emerald?style=for-the-badge" />
<img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" />
<img src="https://img.shields.io/badge/Deploy-Render-purple?style=for-the-badge" />
<img src="https://img.shields.io/badge/demo-live-green?style=for-the-badge" />

# 🛡️ AIXYNZ Cortex

### AI-Powered Cloud Security Operations Platform

*Continuously discover, prioritize, and remediate security risks across GitHub, AWS, and Jira from a single unified dashboard — powered by AI.*

**[🚀 Live Demo](https://aixynz-cortex.onrender.com)** · **[📖 Docs](docs/)** · **[🐛 Issues](https://github.com/asg492607/AIXYNZ-Cortex/issues)**

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Screenshots](#screenshots)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [API Overview](#api-overview)
- [Features by Version](#features-by-version)
- [Testing](#testing)
- [Deployment](#deployment)
- [Roadmap](#roadmap)
- [Team](#team)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

AIXYNZ Cortex is an open-source, AI-native **Cloud Security Posture Management (CSPM)** and **Security Operations** platform. It aggregates security findings from across your infrastructure — AWS, GitHub, Jira — deduplicates them, maps them to compliance frameworks, and uses a built-in AI Copilot to generate step-by-step remediation guidance.

Cortex is designed for:
- **Engineering teams** who want a unified security view across their cloud and code
- **Security analysts** who need intelligent finding prioritization and compliance mapping
- **Founders and CTOs** who want to maintain a strong security posture without dedicated security staff

---

## Key Features

| Feature | Description |
|---|---|
| ☁️ **AWS Security Scanner** | Continuously scan IAM, S3, EC2, and RDS for misconfigurations and exposures |
| 🐙 **GitHub Scanner** | Detect exposed secrets, dependency vulnerabilities, and code security issues |
| 🤖 **AI Security Copilot** | LLM-powered analysis generates step-by-step remediation for every finding |
| 🕸️ **Attack Graph** | Visualize blast radius and lateral movement paths across your infrastructure |
| 🗃️ **Asset Inventory** | Unified inventory of cloud and code assets with per-asset aggregate risk scores |
| ✅ **Compliance Mapping** | Auto-mapping to SOC 2, ISO 27001, and CIS benchmarks with drill-down control views |
| ⚡ **Workflow Automation** | Define condition-based rules to trigger Slack or email alerts automatically |
| 🔑 **Public API & Keys** | Secure SHA-256-hashed API keys for CI/CD pipelines and integrations |
| 📊 **Reporting & Audit Logs** | Export findings as CSV or JSON; full immutable audit trail |
| 👥 **Multi-tenancy & RBAC** | Fully isolated org data with granular admin, analyst, and viewer roles |

---

## Screenshots

> Launch the [Live Demo](https://aixynz-cortex.onrender.com) to explore the full platform interactively.

---

## Technology Stack

**Frontend**
- React 18 + React Router v6
- Vite (build tool)
- Lucide React (icons)
- Axios (HTTP client)

**Backend**
- FastAPI (Python 3.11)
- Uvicorn (ASGI server)
- Pydantic v2 (data validation)
- Firebase Admin SDK (auth + Firestore)

**AI & Integrations**
- Groq (LLM inference for AI Copilot)
- boto3 (AWS SDK)
- PyGitHub (GitHub API)
- Atlassian Python API (Jira)

**Infrastructure**
- Docker + Docker Compose
- Render (production deployment)
- GitHub Actions (CI)

---

## Architecture

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   GitHub    │    │     AWS     │    │    Jira     │
└──────┬──────┘    └──────┬──────┘    └──────┬──────┘
       │                  │                  │
       └──────────────────┼──────────────────┘
                          ▼
              ┌───────────────────────┐
              │   Cortex Backend      │
              │   FastAPI / Python    │
              │                       │
              │  ┌─────────────────┐  │
              │  │  AI Copilot     │  │
              │  │  (Groq LLM)     │  │
              │  └─────────────────┘  │
              │                       │
              │  ┌─────────────────┐  │
              │  │  Firebase /     │  │
              │  │  Firestore      │  │
              │  └─────────────────┘  │
              └───────────────────────┘
                          │
              ┌───────────────────────┐
              │   React Frontend      │
              │   (Served by FastAPI) │
              │                       │
              │  Dashboard  Findings  │
              │  Compliance Reports   │
              │  Attack Graph Assets  │
              └───────────────────────┘
```

The production build is a **single-service deployment**: FastAPI serves both the REST API under `/api/v1/` and the compiled React SPA from the same process.

---

## Project Structure

```
AIXYNZ-Cortex/
│
├── backend/                    # FastAPI application
│   ├── api/                    # Route modules
│   │   ├── routes.py           # Core findings & scan routes
│   │   ├── auth_routes.py      # Authentication
│   │   ├── asset_routes.py     # Asset inventory
│   │   ├── reporting_routes.py # Compliance & export
│   │   ├── workflow_routes.py  # Automation workflows
│   │   ├── api_key_routes.py   # API key management
│   │   ├── graph_routes.py     # Attack graph
│   │   └── copilot_routes.py   # AI Copilot
│   ├── services/               # Business logic
│   │   ├── auth_service.py     # Token + API key validation
│   │   ├── firebase_client.py  # Database abstraction layer
│   │   ├── notification_service.py  # Dynamic workflow execution
│   │   ├── graph_service.py    # BFS blast radius calculation
│   │   ├── scan_service.py     # Scan orchestration
│   │   └── rbac.py             # Role enforcement
│   ├── connectors/             # External integrations
│   │   ├── aws_connector.py
│   │   ├── github_connector.py
│   │   └── jira_connector.py
│   ├── tests/                  # pytest test suites
│   ├── main.py                 # FastAPI app entry point
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/                   # React SPA
│   ├── src/
│   │   ├── pages/              # Page components
│   │   │   ├── Landing.jsx     # Public marketing landing page
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Findings.jsx
│   │   │   ├── AssetInventory.jsx
│   │   │   ├── AssetDetails.jsx
│   │   │   ├── AttackGraph.jsx
│   │   │   ├── Compliance.jsx
│   │   │   ├── ComplianceDetails.jsx
│   │   │   ├── Workflows.jsx
│   │   │   ├── ApiKeys.jsx
│   │   │   └── Reports.jsx
│   │   ├── context/            # React context (auth)
│   │   ├── lib/                # API client, Firebase init
│   │   └── components/         # Shared UI components
│   ├── package.json
│   └── Dockerfile
│
├── docs/                       # Documentation
├── Dockerfile                  # Unified root Dockerfile
├── docker-compose.yml          # Local multi-service dev setup
├── render.yaml                 # Render deployment blueprint
└── README.md
```

---

## Quick Start

### Option 1: One-Command Local Run (Unified Mode)

This mirrors the production deployment — FastAPI serves both the API and the React app.

```bash
# 1. Clone the repo
git clone https://github.com/asg492607/AIXYNZ-Cortex.git
cd AIXYNZ-Cortex

# 2. Build the frontend
cd frontend && npm install && npm run build && cd ..

# 3. Run the backend (which serves the frontend too)
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

Open **http://localhost:8000** and click **"Launch Platform"** on the landing page.

---

### Option 2: Split Development Mode (Hot Reload)

```bash
# Terminal 1 — Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload

# Terminal 2 — Frontend
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** for the frontend (with hot reload).

---

### Option 3: Docker Compose

```bash
git clone https://github.com/asg492607/AIXYNZ-Cortex.git
cd AIXYNZ-Cortex
cp .env.example .env
docker compose up --build
```

- Frontend UI: http://localhost:80
- API Backend: http://localhost:8000

---

### Demo Mode

No external credentials are needed to explore Cortex. In Demo Mode, all data lives in-memory and the platform auto-runs mock AWS and GitHub scans with realistic findings on startup. Simply launch the app and click **"Login with Demo Admin"**.

---

## Configuration

Copy `.env.example` to `.env` and fill in the values you need:

| Variable | Required | Description |
|---|---|---|
| `FIREBASE_CREDENTIALS` | Production | Firebase service account JSON (as a string) |
| `GROQ_API_KEY` | For AI Copilot | Groq API key for LLM inference |
| `AWS_ACCESS_KEY_ID` | For AWS scans | AWS IAM access key |
| `AWS_SECRET_ACCESS_KEY` | For AWS scans | AWS IAM secret key |
| `AWS_DEFAULT_REGION` | For AWS scans | e.g. `us-east-1` |
| `GITHUB_TOKEN` | For GitHub scans | GitHub personal access token |
| `JIRA_URL` | For Jira | e.g. `https://yourorg.atlassian.net` |
| `JIRA_API_TOKEN` | For Jira | Jira API token |
| `JIRA_EMAIL` | For Jira | Jira account email |
| `FRONTEND_ORIGIN` | CORS | Frontend URL in production |
| `USE_RQ` | Async scans | Set `true` to enable Redis Queue |
| `LOG_LEVEL` | Logging | `INFO`, `DEBUG`, `WARNING` |

---

## API Overview

All endpoints are prefixed with `/api/v1/`. Authenticate using:
- **Bearer Token**: `Authorization: Bearer <firebase_id_token>`
- **API Key**: `X-API-Key: aix_<your_key>`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/findings` | List all findings with filters |
| `POST` | `/scan/rescan` | Trigger a fresh security scan |
| `POST` | `/copilot/chat` | Chat with the AI Security Copilot |
| `GET` | `/assets` | Get asset inventory with risk scores |
| `GET` | `/graph/blast-radius/{asset_id}` | Compute attack graph blast radius |
| `GET` | `/reports/compliance/{framework}` | Compliance posture by framework |
| `GET` | `/reports/findings/csv` | Export findings as CSV |
| `GET` | `/workflows` | List automation workflows |
| `POST` | `/workflows` | Create an automation rule |
| `GET` | `/api-keys` | List active API keys |
| `POST` | `/api-keys` | Generate a new API key |
| `GET` | `/audit-logs` | Retrieve the audit trail |
| `GET` | `/health` | Service health check |

Full API reference: [`docs/api.md`](docs/api.md)

---

## Features by Version

### ✅ MVP-1 — Security Command Center
- Core AWS & GitHub security scanning
- Findings pipeline with deduplication and scoring
- Dashboard with risk metrics
- RBAC (admin, analyst, viewer)
- Slack & Jira integrations
- Audit logs
- Multi-tenancy (org-isolated data)
- Docker Compose setup

### ✅ MVP-2 — Security Operations Platform
- AI Security Copilot (Groq LLM)
- Asset Inventory with risk scores
- Jira issue creation from findings
- Webhook ingestion (GitHub Security Alerts, AWS GuardDuty)
- Finding suppression with expiration
- Scan history timeline
- Comment threads per finding

### ✅ MVP-3 — AI Security Platform
- **Attack Graph** — blast radius visualization via BFS
- **Compliance V2** — SOC 2, ISO 27001 control drill-down
- **Automation Workflows** — dynamic condition-based alerting engine
- **Public API & API Keys** — SHA-256 hashed keys with CRUD UI
- **Reporting** — CSV & JSON export
- **Single-service deployment** — FastAPI serves the React SPA
- **Render blueprint** (`render.yaml`) for 1-click deploy

---

## Testing

All backend test suites are located in `backend/tests/`. Run them with:

```bash
cd backend
pytest tests/ -v
```

| Test Suite | Coverage |
|---|---|
| `test_sprint3_graph.py` | Attack graph BFS, blast radius |
| `test_sprint5_compliance.py` | Compliance control grouping |
| `test_sprint6_workflows.py` | Workflow CRUD, notification logic |
| `test_sprint7_api_keys.py` | API key generation, hash auth, revocation |

All tests currently pass with **0 deprecation warnings**.

---

## Deployment

### Render (Recommended — Free Tier)

The repository includes a `render.yaml` blueprint. Connect the GitHub repo to Render and it will automatically deploy using the root `Dockerfile`:

1. Build: `cd frontend && npm install && npm run build && cd ../backend && pip install -r requirements.txt`
2. Start: `uvicorn main:app --host 0.0.0.0 --port $PORT`

Set `FIREBASE_CREDENTIALS` (as a JSON string) in Render's Environment Variables to switch from Demo Mode to production Firebase.

### Docker

```bash
docker build -t aixynz-cortex .
docker run -p 8000:8000 -e LOG_LEVEL=INFO aixynz-cortex
```

---

## Roadmap

| Version | Status | Description |
|---|---|---|
| MVP-1 | ✅ Complete | Security Command Center |
| MVP-2 | ✅ Complete | Security Operations Platform |
| MVP-3 | ✅ Complete | AI Security Platform |
| MVP-4 | 🔄 Planned | SSO, fine-grained permissions, SLA tracking, multi-region |
| MVP-5 | 🚀 Future | Self-healing posture, predictive risk, autonomous remediation |

---

## Team

### Atharva Sameer Gandhi — *Founder · AI & Security Engineer*

Leads the architecture and development of AIXYNZ Cortex, focusing on AI-powered cybersecurity, backend systems, cloud security, and product engineering.

**Focus:** AI & LLM Applications · Cybersecurity · Backend Engineering · Cloud & DevSecOps · System Design

---

### Nayan Solanki — *Co-Founder · Full-Stack & Platform Engineer*

Responsible for frontend development, platform integration, user experience, and transforming security workflows into intuitive interfaces.

**Focus:** Full-Stack Development · React & Frontend Engineering · Product Development · API Integration · User Experience

---

**About AIXYNZ:** Building AI-native cybersecurity products that help organizations continuously monitor, prioritize, and remediate security risks. Our mission is to simplify modern security operations using automation, intelligent analysis, and developer-friendly workflows.

---

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create your feature branch: `git checkout -b feat/your-feature`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push to the branch: `git push origin feat/your-feature`
5. Open a Pull Request

Please follow [Conventional Commits](https://www.conventionalcommits.org/) for commit messages and ensure all tests pass before submitting.

---

## License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

Built with ❤️ by **Atharva Sameer Gandhi** and **Nayan Solanki**

⭐ Star this repo if you find it useful!

[🚀 Launch App](https://aixynz-cortex.onrender.com) · [🐛 Report Bug](https://github.com/asg492607/AIXYNZ-Cortex/issues) · [💡 Request Feature](https://github.com/asg492607/AIXYNZ-Cortex/issues)

</div>
