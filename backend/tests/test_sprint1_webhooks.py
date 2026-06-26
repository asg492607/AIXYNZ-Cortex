import pytest
from fastapi.testclient import TestClient
from main import app
from services.firebase_client import _mock_db, utc_now

client = TestClient(app)

@pytest.fixture(autouse=True)
def reset_mock_db():
    _mock_db["findings"].clear()
    _mock_db["assets"].clear()
    yield

def test_github_webhook_secret_alert():
    payload = {
        "action": "created",
        "alert": {
            "number": 123,
            "secret_type": "aws_access_key_id",
            "html_url": "https://github.com/demo/repo/security/secret-scanning/123"
        },
        "repository": {
            "id": 999888,
            "name": "demo-repo",
            "full_name": "demo/demo-repo"
        }
    }
    
    res = client.post("/api/v1/webhooks/github", json=payload, params={"token": "cortex-webhook-secret"})
    assert res.status_code == 200
    assert res.json()["success"] is True
    assert "finding_id" in res.json()
    
    findings = client.get("/api/v1/findings", headers={"Authorization": "Bearer test_token"}).json()["findings"]
    assert len(findings) == 1
    f = findings[0]
    assert f["source"] == "github"
    assert f["finding_type"] == "hardcoded_secret"
    assert "demo-repo" in f["title"]

def test_aws_webhook_guardduty():
    payload = {
        "source": "aws.guardduty",
        "detail-type": "GuardDuty Finding",
        "detail": {
            "id": "gd-12345",
            "title": "Unauthorized Access Detected",
            "description": "API call from Tor exit node.",
            "severity": 8.5,
            "resource": {
                "resourceType": "Instance",
                "instanceDetails": {"instanceId": "i-0abcd1234efgh5678"}
            }
        }
    }
    
    res = client.post("/api/v1/webhooks/aws", json=payload, params={"token": "cortex-webhook-secret"})
    assert res.status_code == 200
    assert res.json()["success"] is True
    
    findings = client.get("/api/v1/findings", headers={"Authorization": "Bearer test_token"}).json()["findings"]
    aws_findings = [f for f in findings if f["source"] == "aws"]
    assert len(aws_findings) == 1
    f = aws_findings[0]
    assert f["source"] == "aws"
    assert f["finding_type"] == "guardduty_alert"
    assert f["severity"] == "High"
    assert f["asset"]["asset_name"] == "i-0abcd1234efgh5678"

def test_jira_webhook_issue_updated():
    # First create a mock finding linked to a Jira ticket
    finding_id = "f_test123"
    _mock_db["findings"].append({
        "id": finding_id,
        "org_id": "demo-org",
        "jira_issue_key": "SEC-42",
        "status": "in_progress",
        "updated_at": utc_now()
    })
    
    payload = {
        "webhookEvent": "jira:issue_updated",
        "issue": {
            "key": "SEC-42",
            "fields": {
                "status": {"name": "Done"}
            }
        }
    }
    
    res = client.post("/api/v1/webhooks/jira", json=payload, params={"token": "cortex-webhook-secret"})
    assert res.status_code == 200
    assert res.json()["success"] is True
    
    # Check that the finding status was updated
    f = next((f for f in _mock_db["findings"] if f["id"] == finding_id), None)
    assert f is not None
    assert f["status"] == "resolved"

def test_simulate_webhook():
    res = client.post("/api/v1/webhooks/simulate", params={"provider": "github", "event_type": "secret", "token": "cortex-webhook-secret"})
    assert res.status_code == 200
    assert res.json()["success"] is True
    assert res.json()["simulated"] is True
