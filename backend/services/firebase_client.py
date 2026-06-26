import datetime
import os
import uuid
from typing import Dict, List, Optional

import firebase_admin
from firebase_admin import credentials, firestore

_db = None
_runtime_mode = "unknown"  # "live" | "demo"

_mock_db = {
    "findings": [],
    "assets": [],
    "remediations": [],
    "users": [],
    "organizations": [{"id": "demo-org", "name": "Demo Organization", "plan": "enterprise"}],
    "integrations": [],
    "comments": [],
    "scan_logs": [],
    "audit_logs": [],
    "chat_threads": [],
    "workflows": [],
    "api_keys": [],
}

def init_firebase():
    global _db, _runtime_mode

    if firebase_admin._apps:
        try:
            _db = firestore.client()
            _runtime_mode = "live"
            return
        except Exception:
            _db = None

    try:
        if "FIREBASE_CREDENTIALS" in os.environ:
            import json
            cred_dict = json.loads(os.environ["FIREBASE_CREDENTIALS"])
            cred = credentials.Certificate(cred_dict)
            firebase_admin.initialize_app(cred)
            _db = firestore.client()
            _runtime_mode = "live"
            print("Firebase initialized from FIREBASE_CREDENTIALS env var.")
        elif os.path.exists("serviceAccountKey.json"):
            cred = credentials.Certificate("serviceAccountKey.json")
            firebase_admin.initialize_app(cred)
            _db = firestore.client()
            _runtime_mode = "live"
            print("Firebase initialized successfully from serviceAccountKey.json.")
        else:
            _runtime_mode = "demo"
            print("serviceAccountKey.json not found. Running in DEMO mode.")
    except Exception as e:
        _db = None
        _runtime_mode = "demo"
        print(f"Firebase initialization failed: {e}. Running in DEMO mode.")

def get_db():
    global _db
    if _db is None and _runtime_mode == "unknown":
        init_firebase()
    return _db

def get_runtime_mode() -> str:
    if _runtime_mode == "unknown":
        init_firebase()
    return _runtime_mode

def utc_now() -> str:
    # Use timezone-aware UTC datetime for compatibility and correctness
    return datetime.datetime.now(datetime.timezone.utc).isoformat().replace("+00:00", "Z")

def format_finding(f: dict) -> dict:
    now = utc_now()
    
    org_id = f.get("org_id", "demo-org")
    
    ext_key = f.get("external_finding_key")
    if not ext_key:
        import hashlib
        ext_key = hashlib.sha256(f"{org_id}|{f.get('source')}|{f.get('title')}".encode()).hexdigest()

    asset = f.get("asset") or {
        "external_asset_id": f.get("asset_id", f"asset:{uuid.uuid4().hex[:6]}"),
        "asset_type": "unknown",
        "asset_name": f.get("asset_id", "unknown"),
        "provider": f.get("source", "unknown").lower(),
    }

    finding = {
        "id": f.get("id"),
        "org_id": org_id,
        "source": f.get("source", "unknown"),
        "source_type": f.get("source_type", "unknown"),
        "category": f.get("category", "vulnerability"),
        "finding_type": f.get("finding_type", "unknown"),
        "title": f.get("title", "Unknown Risk"),
        "description": f.get("description", ""),
        "severity": f.get("severity", "Medium"),
        "risk_score": f.get("risk_score", 50),
        "status": f.get("status", "open"),
        "owner": f.get("owner", "unassigned"),
        "due_date": f.get("due_date"),
        "resolved_at": f.get("resolved_at"),
        "ignored_reason": f.get("ignored_reason"),
        "expires_at": f.get("expires_at"),
        "external_finding_key": ext_key,
        "asset_id": f.get("asset_id"),
        "asset": asset,
        "compliance": f.get("compliance", {"cis": [], "soc2": [], "iso27001": []}),
        "jira_issue_key": f.get("jira_issue_key"),
        "confidence": f.get("confidence", "high"),
        "integration_id": f.get("integration_id"),
        "scanner_metadata": f.get("scanner_metadata", {}),
        "comments_count": f.get("comments_count", 0),
        "created_at": f.get("created_at", now),
        "updated_at": now,
        "raw_data": f.get("raw_data", {}),
        "remediation": f.get("remediation", {}),
        "detected_at": f.get("detected_at", now),
    }

    return finding

def _upsert_mock_finding(finding: dict) -> str:
    existing = next(
        (x for x in _mock_db["findings"] if x.get("external_finding_key") == finding["external_finding_key"] and x.get("org_id") == finding["org_id"]),
        None,
    )

    if existing:
        existing.update({
            **finding,
            "id": existing["id"],
            "created_at": existing.get("created_at", finding["created_at"]),
            "updated_at": utc_now(),
        })
        return existing["id"]

    finding["id"] = finding.get("id") or f"fnd_{uuid.uuid4().hex[:8]}"
    _mock_db["findings"].append(finding)
    return finding["id"]

def upsert_finding(raw_finding: dict) -> str:
    finding = format_finding(raw_finding)

    if get_runtime_mode() == "demo":
        return _upsert_mock_finding(finding)

    db = get_db()
    if not db:
        return _upsert_mock_finding(finding)

    query = (
        db.collection("findings")
        .where("org_id", "==", finding["org_id"])
        .where("external_finding_key", "==", finding["external_finding_key"])
        .limit(1)
        .stream()
    )
    existing_docs = list(query)

    if existing_docs:
        doc = existing_docs[0]
        existing = doc.to_dict()
        finding["id"] = existing.get("id", doc.id)
        finding["created_at"] = existing.get("created_at", finding["created_at"])
        db.collection("findings").document(doc.id).set(finding)
        return finding["id"]

    doc_ref = db.collection("findings").document()
    finding["id"] = doc_ref.id
    doc_ref.set(finding)
    return finding["id"]

def get_findings(org_id: str = "demo-org") -> List[dict]:
    if get_runtime_mode() == "demo":
        return [f for f in _mock_db["findings"] if f.get("org_id") == org_id]

    db = get_db()
    if not db:
        return []

    docs = db.collection("findings").where("org_id", "==", org_id).stream()
    return [doc.to_dict() for doc in docs]

# --- Workflows ---
def get_workflows(org_id: str) -> List[Dict]:
    if get_runtime_mode() == "demo":
        return [w for w in _mock_db.get("workflows", []) if w.get("org_id") == org_id]
        
    db = get_db()
    if db:
        docs = db.collection("workflows").where("org_id", "==", org_id).stream()
        return [doc.to_dict() for doc in docs]
    return []

def upsert_workflow(org_id: str, workflow_data: Dict) -> str:
    wid = workflow_data.get("id")
    if not wid:
        wid = f"wf_{uuid.uuid4().hex[:8]}"
        workflow_data["id"] = wid
        
    workflow_data["org_id"] = org_id
    workflow_data["updated_at"] = utc_now()
    if "created_at" not in workflow_data:
        workflow_data["created_at"] = workflow_data["updated_at"]
        
    if get_runtime_mode() == "demo":
        for i, w in enumerate(_mock_db.setdefault("workflows", [])):
            if w.get("id") == wid and w.get("org_id") == org_id:
                _mock_db["workflows"][i] = workflow_data
                return wid
        _mock_db["workflows"].append(workflow_data)
        return wid
        
    db = get_db()
    if db:
        db.collection("workflows").document(wid).set(workflow_data)
    return wid

def delete_workflow(org_id: str, workflow_id: str) -> bool:
    if get_runtime_mode() == "demo":
        workflows = _mock_db.get("workflows", [])
        for i, w in enumerate(workflows):
            if w.get("id") == workflow_id and w.get("org_id") == org_id:
                workflows.pop(i)
                return True
        return False
        
    db = get_db()
    if db:
        doc_ref = db.collection("workflows").document(workflow_id)
        doc = doc_ref.get()
        if doc.exists and doc.to_dict().get("org_id") == org_id:
            doc_ref.delete()
            return True
    return False

# --- API Keys ---
def get_api_keys(org_id: str) -> List[Dict]:
    if get_runtime_mode() == "demo":
        return [k for k in _mock_db.get("api_keys", []) if k.get("org_id") == org_id]
        
    db = get_db()
    if db:
        docs = db.collection("api_keys").where("org_id", "==", org_id).stream()
        return [doc.to_dict() for doc in docs]
    return []

def get_api_key_by_hash(key_hash: str) -> Optional[Dict]:
    if get_runtime_mode() == "demo":
        for k in _mock_db.get("api_keys", []):
            if k.get("key_hash") == key_hash:
                return k
        return None
        
    db = get_db()
    if db:
        docs = db.collection("api_keys").where("key_hash", "==", key_hash).limit(1).stream()
        for doc in docs:
            return doc.to_dict()
    return None

def upsert_api_key(org_id: str, key_data: Dict) -> str:
    kid = key_data.get("id")
    if not kid:
        kid = f"key_{uuid.uuid4().hex[:8]}"
        key_data["id"] = kid
        
    key_data["org_id"] = org_id
    key_data["created_at"] = utc_now()
        
    if get_runtime_mode() == "demo":
        _mock_db.setdefault("api_keys", []).append(key_data)
        return kid
        
    db = get_db()
    if db:
        db.collection("api_keys").document(kid).set(key_data)
    return kid

def delete_api_key(org_id: str, key_id: str) -> bool:
    if get_runtime_mode() == "demo":
        keys = _mock_db.get("api_keys", [])
        for i, k in enumerate(keys):
            if k.get("id") == key_id and k.get("org_id") == org_id:
                keys.pop(i)
                return True
        return False
        
    db = get_db()
    if db:
        doc_ref = db.collection("api_keys").document(key_id)
        doc = doc_ref.get()
        if doc.exists and doc.to_dict().get("org_id") == org_id:
            doc_ref.delete()
            return True
    return False

def get_finding_by_id(finding_id: str, org_id: str = "demo-org") -> Optional[dict]:
    findings = get_findings(org_id)
    return next((f for f in findings if f.get("id") == finding_id), None)

def update_finding_jira_key(finding_id: str, jira_issue_key: str, org_id: str = "demo-org"):
    if get_runtime_mode() == "demo":
        existing = next((x for x in _mock_db["findings"] if x.get("id") == finding_id and x.get("org_id") == org_id), None)
        if existing:
            existing["jira_issue_key"] = jira_issue_key
            existing["updated_at"] = utc_now()
        return

    db = get_db()
    if not db:
        return
        
    db.collection("findings").document(finding_id).update({
        "jira_issue_key": jira_issue_key,
        "updated_at": utc_now()
    })

def get_remediation_by_finding_id(finding_id: str, org_id: str = "demo-org") -> Optional[dict]:
    if get_runtime_mode() == "demo":
        return next((r for r in _mock_db["remediations"] if r.get("finding_id") == finding_id and r.get("org_id") == org_id), None)
        
    db = get_db()
    if not db:
        return None
        
    docs = db.collection("remediations").where("org_id", "==", org_id).where("finding_id", "==", finding_id).limit(1).stream()
    docs = list(docs)
    return docs[0].to_dict() if docs else None

def save_remediation(remediation: dict, org_id: str = "demo-org"):
    payload = {
        "ticket_id": remediation.get("ticket_id"),
        "ticket_url": remediation.get("ticket_url"),
        "finding_id": remediation.get("finding_id"),
        "org_id": org_id,
        "source": remediation.get("source"),
        "severity": remediation.get("severity"),
        "title": remediation.get("title"),
        "jira_issue_key": remediation.get("ticket_id"),
        "workflow_state": remediation.get("workflow_state", "open"),
        "creation_mode": remediation.get("creation_mode", "auto"),
        "status": remediation.get("status", "open"),
        "created_at": remediation.get("created_at", utc_now()),
        "updated_at": utc_now(),
    }

    if get_runtime_mode() == "demo":
        _mock_db["remediations"].append(payload)
        return

    db = get_db()
    if not db:
        _mock_db["remediations"].append(payload)
        return

    ticket_id = payload["ticket_id"] or f"rem_{uuid.uuid4().hex[:8]}"
    db.collection("remediations").document(ticket_id).set(payload)

def get_chat_history(org_id: str, thread_id: str) -> List[dict]:
    if get_runtime_mode() == "demo":
        threads = _mock_db.setdefault("chat_threads", [])
        thread = next((t for t in threads if t.get("org_id") == org_id and t.get("thread_id") == thread_id), None)
        return thread.get("messages", []) if thread else []
        
    db = get_db()
    if not db:
        return []
        
    doc = db.collection("chat_threads").document(thread_id).get()
    if doc.exists and doc.to_dict().get("org_id") == org_id:
        return doc.to_dict().get("messages", [])
    return []

def append_chat_message(org_id: str, thread_id: str, role: str, content: str):
    msg = {"role": role, "content": content, "timestamp": utc_now()}
    
    if get_runtime_mode() == "demo":
        threads = _mock_db.setdefault("chat_threads", [])
        thread = next((t for t in threads if t.get("org_id") == org_id and t.get("thread_id") == thread_id), None)
        if not thread:
            thread = {"org_id": org_id, "thread_id": thread_id, "messages": []}
            threads.append(thread)
        thread["messages"].append(msg)
        return
        
    db = get_db()
    if not db:
        return
        
    doc_ref = db.collection("chat_threads").document(thread_id)
    doc = doc_ref.get()
    if not doc.exists:
        doc_ref.set({"org_id": org_id, "thread_id": thread_id, "messages": [msg]})
    else:
        doc_ref.update({"messages": firestore.ArrayUnion([msg])})

