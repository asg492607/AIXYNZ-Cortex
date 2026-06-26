# AIXYNZ Cortex

Cortex is an **Asset-centric Security Operations Platform** designed to ingest, deduplicate, and manage security findings across your entire infrastructure (AWS, GitHub, etc.) with AI-driven remediation analysis.

## Features (MVP-3 / v0.4.0)

- **Asset Intelligence & Attack Graph**: Findings are automatically tied to cloud and code assets. Cortex computes aggregate risk scores per asset and visualizes potential blast radiuses using interactive Attack Graphs.
- **Compliance Mapping**: Automatically maps findings to CIS, SOC 2, and ISO 27001 controls with detailed drill-down views per framework.
- **Dynamic Automation Workflows**: Configure condition-based triggers (e.g. "Severity == Critical") to automatically route alerts via Slack or Email.
- **Public API & Key Management**: Secure, hash-backed API keys allow programmatic access to your data for custom integrations, backed by robust RBAC.
- **Unified Deployment Architecture**: Streamlined single-service execution for ultra-low friction deployment on PaaS platforms like Render.

---

## Quickstart (Demo Mode)

The easiest way to run Cortex locally is in **Demo Mode**. This runs completely in-memory without requiring AWS credentials, Firebase, or external databases.

### Unified Single-Service Deployment (Recommended)
You can run the entire platform from the backend server locally, which mimics our production Render environment.

1. **Build the Frontend:**
   ```bash
   cd frontend
   npm install
   npm run build
   ```

2. **Start the Backend:**
   ```bash
   cd ../backend
   python -m venv venv
   source venv/bin/activate  # Or .\venv\Scripts\activate on Windows
   pip install -r requirements.txt
   uvicorn main:app --reload
   ```
   Open `http://localhost:8000`. Both the API and the React UI will be served seamlessly. Click **Login with Demo Admin** to explore.

### Split Development Mode

If you are developing and need hot-reloading for the frontend:

1. **Start the API:**
   ```bash
   cd backend
   uvicorn main:app --reload
   ```

2. **Start the Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```
   Open `http://localhost:5173`.

---

## Documentation

- [Architecture Overview](docs/architecture.md)
- [Deployment Guide](docs/deployment.md)
- [API Reference](docs/api.md)
- [Demo Script](docs/demo-script.md)
