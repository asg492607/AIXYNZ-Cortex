# AIXYNZ Cortex

Cortex is an **Asset-centric Security Operations Platform** designed to ingest, deduplicate, and manage security findings across your entire infrastructure (AWS, GitHub, etc.) with AI-driven remediation analysis.

## Features (v0.2.0)

- **Asset-First Inventory**: Findings are automatically tied to cloud and code assets. Cortex computes aggregate risk scores per asset.
- **Compliance Mapping**: Automatically maps findings to CIS, SOC 2, and ISO 27001 controls.
- **Background Scanning**: Uses RQ (Redis Queue) to dispatch long-running scans asynchronously.
- **RBAC & Multi-tenancy**: Fully separated data boundaries between organizations. Roles for `admin`, `analyst`, and `viewer`.
- **Automated Workflows**: Finding suppression with expiration, AI-generated remediation steps, and Jira/Slack integrations.

---

## Quickstart (Demo Mode)

The easiest way to run Cortex locally is in **Demo Mode**. This runs completely in-memory without requiring AWS credentials, Firebase, or external databases.

### Using Docker Compose (Recommended)
Make sure you have Docker Desktop installed.

```bash
git clone https://github.com/asg492607/AIXYNZ-Cortex.git
cd AIXYNZ-Cortex
docker compose up --build
```
- Frontend UI: http://localhost:80
- API Backend: http://localhost:8000
- Open the UI and click **Login with Demo Admin** to explore.

### Manual Setup (Python & Node)

1. **Start the API:**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # Or .\venv\Scripts\activate on Windows
   pip install -r requirements.txt
   uvicorn main:app --reload
   ```

2. **Start the Frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Open http://localhost:5173.

---

## Documentation

- [Architecture Overview](docs/architecture.md)
- [Deployment Guide](docs/deployment.md)
- [API Reference](docs/api.md)
- [Demo Script](docs/demo-script.md)
