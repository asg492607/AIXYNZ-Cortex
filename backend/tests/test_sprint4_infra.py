import pytest
from fastapi.testclient import TestClient
from main import app
from services.firebase_client import _mock_db

client = TestClient(app)

@pytest.fixture(autouse=True)
def reset_mock_db():
    _mock_db["users"].clear()
    _mock_db["findings"].clear()
    _mock_db["assets"].clear()
    _mock_db["scan_logs"].clear()
    _mock_db["comments"].clear()
    _mock_db["audit_logs"].clear()
    _mock_db["users"].append({
        "uid": "test_uid",
        "email": "analyst@demo.com",
        "name": "Test Analyst",
        "org_id": "demo-org",
        "role": "analyst"
    })
    yield


# ── Connector Framework ──────────────────────────────────────────────────────

def test_connector_implements_interface():
    """All built-in connectors must satisfy BaseConnector interface."""
    from connectors.base import BaseConnector
    from connectors.aws_connector import AWSConnector
    from connectors.github_connector import GitHubConnector

    for cls in [AWSConnector, GitHubConnector]:
        connector = cls()
        assert isinstance(connector, BaseConnector)
        meta = connector.metadata()
        assert "name" in meta
        assert "provider" in meta
        assert "supported_finding_types" in meta

def test_connector_registry_loads():
    """ConnectorRegistry loads default connectors when no integrations are configured."""
    from connectors.registry import ConnectorRegistry
    registry = ConnectorRegistry("demo-org", [])
    connectors = registry.get_connectors()
    assert len(connectors) >= 2  # aws + github defaults

def test_connector_registry_scans():
    """Registry.run_all_scans() returns findings (falls back to mocks in demo)."""
    from connectors.registry import ConnectorRegistry
    registry = ConnectorRegistry("demo-org", [])
    findings = registry.run_all_scans()
    assert isinstance(findings, list)
    assert len(findings) > 0
    for f in findings:
        assert "title" in f
        assert "severity" in f


# ── Health Endpoints ─────────────────────────────────────────────────────────

def test_health_endpoint():
    """/health returns 200 with status ok."""
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert "mode" in data
    assert "uptime_seconds" in data

def test_deep_health_endpoint():
    """/health/deep returns subsystem breakdown."""
    res = client.get("/health/deep")
    assert res.status_code == 200
    data = res.json()
    assert "subsystems" in data
    assert "database" in data["subsystems"]


# ── Pagination & Filtering ───────────────────────────────────────────────────

def test_findings_pagination():
    """GET /findings supports page/limit and returns total."""
    client.post("/api/v1/scan/rescan", json={}, headers={"Authorization": "Bearer test_token"})

    res = client.get("/api/v1/findings?page=1&limit=2", headers={"Authorization": "Bearer test_token"})
    assert res.status_code == 200
    data = res.json()
    assert "total" in data
    assert "page" in data
    assert "limit" in data
    assert len(data["findings"]) <= 2

def test_findings_severity_filter():
    """GET /findings?severity=Critical returns only Critical findings."""
    client.post("/api/v1/scan/rescan", json={}, headers={"Authorization": "Bearer test_token"})

    res = client.get("/api/v1/findings?severity=Critical", headers={"Authorization": "Bearer test_token"})
    assert res.status_code == 200
    for f in res.json()["findings"]:
        assert f["severity"] == "Critical"

def test_findings_status_filter():
    """GET /findings?status=open returns only open findings."""
    client.post("/api/v1/scan/rescan", json={}, headers={"Authorization": "Bearer test_token"})

    res = client.get("/api/v1/findings?status=open", headers={"Authorization": "Bearer test_token"})
    assert res.status_code == 200
    for f in res.json()["findings"]:
        assert f["status"] == "open"


# ── Metrics Endpoint ─────────────────────────────────────────────────────────

def test_metrics_endpoint():
    """GET /metrics returns structured platform metrics."""
    client.post("/api/v1/scan/rescan", json={}, headers={"Authorization": "Bearer test_token"})

    res = client.get("/api/v1/metrics", headers={"Authorization": "Bearer test_token"})
    assert res.status_code == 200
    data = res.json()
    assert "total_findings" in data
    assert "severity_breakdown" in data
    assert "status_breakdown" in data
    assert "mttr_days" in data
    assert "recent_scans" in data
    assert data["total_findings"] > 0
