import pytest
from fastapi.testclient import TestClient
from main import app
from services.firebase_client import _mock_db
import hashlib
import secrets

client = TestClient(app)

@pytest.fixture(autouse=True)
def reset_mock_db():
    _mock_db["users"].clear()
    _mock_db["api_keys"].clear()
    
    _mock_db["users"].append({
        "uid": "test_uid",
        "email": "analyst@demo.com",
        "name": "Test Analyst",
        "org_id": "demo-org",
        "role": "admin"
    })
    yield

def test_api_keys_crud():
    # 1. Empty list
    res = client.get("/api/v1/api-keys", headers={"Authorization": "Bearer test_token"})
    assert res.status_code == 200
    assert res.json()["api_keys"] == []
    
    # 2. Create key
    res = client.post("/api/v1/api-keys", json={"name": "Integration Key"}, headers={"Authorization": "Bearer test_token"})
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    
    raw_key = data["api_key"]["raw_key"]
    kid = data["api_key"]["id"]
    
    assert raw_key.startswith("aix_")
    
    # 3. List keys again (should not expose raw key)
    res = client.get("/api/v1/api-keys", headers={"Authorization": "Bearer test_token"})
    assert res.status_code == 200
    keys = res.json()["api_keys"]
    assert len(keys) == 1
    assert "raw_key" not in keys[0]
    assert "key_hash" not in keys[0]
    assert keys[0]["prefix"] == raw_key[:8] + "..."
    
    # 4. Use the API Key to access a protected route (e.g. findings or metrics)
    # The /api/v1/findings endpoint uses get_current_user
    res = client.get("/api/v1/findings", headers={"X-API-Key": raw_key})
    assert res.status_code == 200
    assert "findings" in res.json()
    
    # 5. Revoke key
    res = client.delete(f"/api/v1/api-keys/{kid}", headers={"Authorization": "Bearer test_token"})
    assert res.status_code == 200
    
    # 6. Try to use revoked key
    res = client.get("/api/v1/findings", headers={"X-API-Key": raw_key})
    assert res.status_code == 401

def test_invalid_api_key():
    res = client.get("/api/v1/findings", headers={"X-API-Key": "aix_invalidkey123"})
    assert res.status_code == 401
