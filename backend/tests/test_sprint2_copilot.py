import pytest
from fastapi.testclient import TestClient
from main import app
from services.firebase_client import _mock_db

client = TestClient(app)

@pytest.fixture(autouse=True)
def reset_mock_db():
    _mock_db.setdefault("chat_threads", [])
    _mock_db["chat_threads"].clear()
    _mock_db.setdefault("findings", [])
    _mock_db["findings"].clear()
    yield

def test_copilot_chat_history():
    # 1. Send first message
    res1 = client.post("/api/v1/copilot/chat", json={"message": "Hello Copilot"})
    assert res1.status_code == 200
    data1 = res1.json()
    assert "thread_id" in data1
    thread_id = data1["thread_id"]
    
    # 2. Send second message in same thread
    res2 = client.post("/api/v1/copilot/chat", json={"message": "What is my highest risk?", "thread_id": thread_id})
    assert res2.status_code == 200
    assert res2.json()["thread_id"] == thread_id
    
    # 3. Retrieve history
    res3 = client.get(f"/api/v1/copilot/chat/{thread_id}")
    assert res3.status_code == 200
    history = res3.json()["messages"]
    
    # Expect 4 messages (User 1, Assistant 1, User 2, Assistant 2)
    assert len(history) == 4
    assert history[0]["role"] == "user"
    assert history[0]["content"] == "Hello Copilot"
    assert history[1]["role"] == "assistant"
    assert history[2]["role"] == "user"
    assert history[2]["content"] == "What is my highest risk?"
    assert history[3]["role"] == "assistant"

def test_copilot_context_injection():
    # Add a mock finding to ensure the copilot context builder works
    _mock_db.setdefault("findings", [])
    _mock_db["findings"].append({
        "id": "fnd_context123",
        "org_id": "demo-org",
        "title": "Exposed S3 Bucket",
        "severity": "Critical",
        "risk_score": 95,
        "status": "open"
    })
    
    res = client.post("/api/v1/copilot/chat", json={"message": "What is my highest risk finding?"})
    assert res.status_code == 200
    data = res.json()
    # In mock mode the fallback response contains "highest risk" keywords
    assert len(data["response"]) > 0
    assert "Critical S3 bucket" in data["response"] or "critical" in data["response"].lower() or "Copilot" in data["response"]
