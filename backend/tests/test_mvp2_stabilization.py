import sys
import os
import pytest
from unittest.mock import patch
from concurrent.futures import ThreadPoolExecutor

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ.pop("GOOGLE_APPLICATION_CREDENTIALS", None)

from services import firebase_client
from services.scan_service import run_full_scan
from services.finding_service import update_finding_status, assign_owner, set_due_date, add_comment, get_comments
from services.audit_service import log_audit_event
from fastapi.testclient import TestClient
from main import app

@pytest.fixture(autouse=True)
def reset_mock_db():
    firebase_client._mock_db.clear()
    firebase_client._mock_db.update({
        "users": [],
        "organizations": [{"id": "demo-org", "name": "Demo Org", "plan": "enterprise"}],
        "integrations": [{"id": "1", "org_id": "demo-org", "provider": "slack", "status": "connected", "configuration": {"webhook_url": "http://mock.slack.local"}}],
        "findings": [],
        "assets": [],
        "remediations": [],
        "comments": [],
        "scan_logs": [],
        "audit_logs": [],
    })
    firebase_client._db = None
    firebase_client._runtime_mode = "demo"
    yield

# 1. Scans Deduplication & Concurrency
def test_scan_deduplication_concurrent():
    with ThreadPoolExecutor(max_workers=5) as executor:
        futures = [executor.submit(run_full_scan, "demo-org") for _ in range(5)]
        for f in futures:
            f.result() # Wait for all to finish

    # Check for duplicate finding keys
    findings = firebase_client._mock_db["findings"]
    keys = [f["external_finding_key"] for f in findings]
    
    assert len(keys) == len(set(keys)), "Duplicate findings detected under concurrent scans"
    assert len(firebase_client._mock_db["scan_logs"]) == 5, "Scan logs missing"

# 2. Finding Lifecycle Transitions
def test_finding_lifecycle():
    run_full_scan("demo-org")
    findings = firebase_client._mock_db["findings"]
    f = findings[0]
    fid = f["id"]
    
    assert f["status"] == "open"
    assert f.get("resolved_at") is None
    
    # Progress
    assert update_finding_status("demo-org", fid, "in_progress")
    f_updated = next(x for x in firebase_client._mock_db["findings"] if x["id"] == fid)
    assert f_updated["status"] == "in_progress"
    
    # Assign & Due Date
    assert assign_owner("demo-org", fid, "test-user")
    assert set_due_date("demo-org", fid, "2026-12-31")
    
    f_updated = next(x for x in firebase_client._mock_db["findings"] if x["id"] == fid)
    assert f_updated["owner"] == "test-user"
    assert f_updated["due_date"] == "2026-12-31"
    
    # Resolve
    assert update_finding_status("demo-org", fid, "resolved")
    f_updated = next(x for x in firebase_client._mock_db["findings"] if x["id"] == fid)
    assert f_updated["status"] == "resolved"
    assert f_updated.get("resolved_at") is not None
    
    # Ignore
    assert update_finding_status("demo-org", fid, "ignored", ignored_reason="Acceptable risk")
    f_updated = next(x for x in firebase_client._mock_db["findings"] if x["id"] == fid)
    assert f_updated["status"] == "ignored"
    assert f_updated.get("ignored_reason") == "Acceptable risk"

# 3. Notification Deduplication
@patch("services.finding_service.notify_finding_resolved")
def test_notification_deduplication(mock_notify):
    # Set up a finding
    run_full_scan("demo-org")
    findings = firebase_client._mock_db["findings"]
    fid = findings[0]["id"]
    
    # We should only notify when a finding transitions TO resolved, not every time we update
    update_finding_status("demo-org", fid, "resolved")
    update_finding_status("demo-org", fid, "resolved") # duplicate call
    
    assert mock_notify.call_count == 1, f"Expected 1 notification call, got {mock_notify.call_count}"

# 4. Audit Log Immutability & Schema
def test_audit_logs():
    log_audit_event("demo-org", "user-1", "test_action", "target-1", {"key": "val"})
    logs = firebase_client._mock_db["audit_logs"]
    assert len(logs) == 1
    
    log = logs[0]
    assert log["org_id"] == "demo-org"
    assert log["actor_id"] == "user-1"
    assert log["action"] == "test_action"
    assert log["target_id"] == "target-1"
    assert "timestamp" in log
    
    # Assert no update or delete functions exist in audit_service.py by design
    import services.audit_service
    assert not hasattr(services.audit_service, "update_audit_event")
    assert not hasattr(services.audit_service, "delete_audit_event")

# 5. Integration Tests
client = TestClient(app)

def test_api_isolation_and_rbac():
    # In demo mode, endpoints bypassed by default with mock admin.
    # To test actual RBAC and token validation, we'd need to mock token verification.
    # For now, verify endpoints return 200 with the mock admin bypass in demo mode.
    
    run_full_scan("demo-org")
    finding_id = firebase_client._mock_db["findings"][0]["id"]
    
    res = client.patch(f"/api/v1/findings/{finding_id}/status", json={"status": "in_progress"})
    assert res.status_code == 200
    
    res = client.post(f"/api/v1/findings/{finding_id}/comments", json={"content": "test comment"})
    assert res.status_code == 200
    assert res.json()["success"] is True
    
    res = client.get(f"/api/v1/findings/{finding_id}/comments")
    assert res.status_code == 200
    assert len(res.json()["data"]) == 1
    
    res = client.get("/api/v1/audit-logs")
    assert res.status_code == 200
    
    # Test invalid finding status — Pydantic Literal validation returns 422 (not 400)
    res = client.patch(f"/api/v1/findings/{finding_id}/status", json={"status": "invalid_status"})
    assert res.status_code in (400, 422)  # 422 from Pydantic Literal, 400 from manual guard
