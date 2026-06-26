import pytest
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
    
    _mock_db["users"].append({
        "uid": "test_uid",
        "email": "analyst@demo.com",
        "name": "Test Analyst",
        "org_id": "demo-org",
        "role": "analyst"
    })
    yield

def test_compliance_detailed_report():
    # 1. Trigger scan to populate mock findings
    client.post("/api/v1/scan/rescan", json={}, headers={"Authorization": "Bearer test_token"})
    
    # 2. Call the new detailed compliance endpoint
    res = client.get("/api/v1/reports/compliance/cis", headers={"Authorization": "Bearer test_token"})
    assert res.status_code == 200
    
    data = res.json()
    assert data["success"] is True
    assert data["framework"] == "cis"
    
    controls = data["data"]
    assert isinstance(controls, list)
    assert len(controls) > 0
    
    # 3. Check shape of returned controls
    for control in controls:
        assert "id" in control
        assert "status" in control
        assert control["status"] in ["pass", "fail"]
        assert "findings" in control
        
        # In the demo data, we expect at least some open findings causing 'fail'
        if control["status"] == "fail":
            assert len(control["findings"]) > 0
            # Ensure the finding shape is correct
            finding = control["findings"][0]
            assert "id" in finding
            assert "title" in finding
            assert "severity" in finding
            assert "status" in finding
            assert "asset_name" in finding

def test_compliance_detailed_report_empty():
    # Test a framework with no findings
    res = client.get("/api/v1/reports/compliance/nonexistent_framework", headers={"Authorization": "Bearer test_token"})
    assert res.status_code == 200
    assert res.json()["data"] == []
