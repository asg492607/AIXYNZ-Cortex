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
        if os.path.exists("serviceAccountKey.json"):
            cred = credentials.Certificate("serviceAccountKey.json")
            firebase_admin.initialize_app(cred)
            _db = firestore.client()
            _runtime_mode = "live"
            print("Firebase initialized successfully.")
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
    return datetime.datetime.utcnow().isoformat() + "Z"

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
