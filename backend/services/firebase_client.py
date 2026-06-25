import firebase_admin
from firebase_admin import credentials, firestore
import os
import uuid
import datetime

_db = None
_mock_db = {"findings": [], "assets": [], "remediations": []}
_is_mock = False

def init_firebase():
    global _db, _is_mock
    if not firebase_admin._apps:
        try:
            if os.path.exists("serviceAccountKey.json"):
                cred = credentials.Certificate("serviceAccountKey.json")
                firebase_admin.initialize_app(cred)
                _db = firestore.client()
                print("Firebase initialized successfully.")
            else:
                print("Warning: serviceAccountKey.json not found. Running with MOCK DB.")
                _is_mock = True
        except Exception as e:
            print(f"Warning: Firebase initialization failed: {e}. Running with MOCK DB.")
            _is_mock = True

def get_db():
    if _db is None and not _is_mock:
        init_firebase()
    return _db

def format_finding(f: dict) -> dict:
    """Enforces strict document shape for Firestore."""
    now = datetime.datetime.utcnow().isoformat() + "Z"
    return {
        "org_id": f.get("org_id", "demo-org"),
        "source": f.get("source", "unknown"),
        "category": f.get("category", "vulnerability"),
        "title": f.get("title", "Unknown Risk"),
        "severity": f.get("severity", "Medium"),
        "risk_score": f.get("risk_score", 50),
        "asset_id": f.get("asset_id", f"asset:{uuid.uuid4().hex[:6]}"),
        "status": f.get("status", "open"),
        "jira_issue_key": f.get("jira_issue_key", None),
        "created_at": f.get("created_at", now),
        "updated_at": now,
        "raw_data": f.get("raw_data", {})
    }

def save_finding(raw_finding: dict):
    finding = format_finding(raw_finding)
    if _is_mock:
        finding["id"] = f"fnd_{uuid.uuid4().hex[:8]}"
        _mock_db["findings"].append(finding)
        return finding["id"]
        
    db = get_db()
    if not db: return None
    doc_ref = db.collection("findings").document()
    finding["id"] = doc_ref.id
    doc_ref.set(finding)
    return doc_ref.id

def get_findings():
    if _is_mock:
        return _mock_db["findings"]
    db = get_db()
    if not db: return []
    docs = db.collection("findings").stream()
    return [doc.to_dict() for doc in docs]

def save_remediation(remediation: dict):
    if _is_mock:
        _mock_db["remediations"].append(remediation)
        return
    db = get_db()
    if not db: return
    db.collection("remediations").document(remediation["ticket_id"]).set(remediation)
