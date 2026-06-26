import pytest
import time
from fastapi.testclient import TestClient
from main import app
from services.firebase_client import _mock_db

client = TestClient(app)

@pytest.fixture(autouse=True)
def reset_mock_db():
    _mock_db["users"].clear()
    _mock_db["findings"].clear()
    _mock_db["scan_logs"].clear()
    _mock_db["comments"].clear()
    _mock_db["assets"].clear()
    
    # Pre-seed a test user
    _mock_db["users"].append({
        "uid": "test_uid",
        "email": "analyst@demo.com",
        "name": "Test Analyst",
        "org_id": "demo-org",
        "role": "analyst"
    })
    yield

def test_asset_deduplication():
    # Run scan twice
    rescan_res = client.post("/api/v1/scan/rescan", json={}, headers={"Authorization": "Bearer test_token"})
    assert rescan_res.status_code == 200, rescan_res.json()
    
    assets_first_run = client.get("/api/v1/assets", headers={"Authorization": "Bearer test_token"}).json()["data"]
    
    # wait a sec to see last_seen_at change
    time.sleep(1)
    
    client.post("/api/v1/scan/rescan", json={}, headers={"Authorization": "Bearer test_token"})
    assets_second_run = client.get("/api/v1/assets", headers={"Authorization": "Bearer test_token"}).json()["data"]
    
    # Asset count should remain the same (deduplication)
    assert len(assets_first_run) > 0
    assert len(assets_first_run) == len(assets_second_run)
    
    # last_seen_at should be updated
    assert assets_first_run[0]["last_seen_at"] != assets_second_run[0]["last_seen_at"]

def test_compliance_mappings():
    # Run a scan to ingest mock findings
    client.post("/api/v1/scan/rescan", json={}, headers={"Authorization": "Bearer test_token"})
    
    # Check findings for compliance mappings
    res = client.get("/api/v1/findings", headers={"Authorization": "Bearer test_token"})
    findings = res.json()["findings"]
    assert len(findings) > 0
    
    s3_finding = next((f for f in findings if f["finding_type"] == "public_s3_bucket"), None)
    assert s3_finding is not None
    assert "cis" in s3_finding["compliance"]
    assert "soc2" in s3_finding["compliance"]
    assert len(s3_finding["compliance"]["cis"]) > 0

def test_reporting_endpoints():
    client.post("/api/v1/scan/rescan", json={}, headers={"Authorization": "Bearer test_token"})
    
    csv_res = client.get("/api/v1/reports/findings/csv", headers={"Authorization": "Bearer test_token"})
    assert csv_res.status_code == 200
    assert b"Finding ID" in csv_res.content
    
    json_res = client.get("/api/v1/reports/findings/json", headers={"Authorization": "Bearer test_token"})
    assert json_res.status_code == 200
    assert "findings" in json_res.json()
    
    summary_res = client.get("/api/v1/reports/compliance/summary", headers={"Authorization": "Bearer test_token"})
    assert summary_res.status_code == 200
    assert "cis" in summary_res.json()["data"]
