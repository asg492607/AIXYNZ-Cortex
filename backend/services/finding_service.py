import uuid
from typing import Dict, List, Optional
from services.firebase_client import get_db, get_runtime_mode, _mock_db, utc_now
from services.notification_service import notify_finding_resolved

def update_finding_status(org_id: str, finding_id: str, status: str, ignored_reason: Optional[str] = None, updated_by: str = "System") -> bool:
    now = utc_now()
    updates = {"status": status, "updated_at": now, "updated_by": updated_by}
    
    if status == "resolved":
        updates["resolved_at"] = now
    if status == "ignored":
        updates["ignored_reason"] = ignored_reason

    if get_runtime_mode() == "demo":
        finding = next((f for f in _mock_db["findings"] if f.get("id") == finding_id and f.get("org_id") == org_id), None)
        if finding:
            finding.update(updates)
            return True
        return False

    db = get_db()
    if not db:
        return False

    doc_ref = db.collection("findings").document(finding_id)
    doc = doc_ref.get()
    if doc.exists and doc.to_dict().get("org_id") == org_id:
        doc_ref.update(updates)
        return True
    return False

def assign_owner(org_id: str, finding_id: str, owner: str, updated_by: str = "System") -> bool:
    updates = {"owner": owner, "updated_at": utc_now(), "updated_by": updated_by}
    
    if get_runtime_mode() == "demo":
        finding = next((f for f in _mock_db["findings"] if f.get("id") == finding_id and f.get("org_id") == org_id), None)
        if finding:
            finding.update(updates)
            return True
        return False

    db = get_db()
    if not db:
        return False

    doc_ref = db.collection("findings").document(finding_id)
    doc = doc_ref.get()
    if doc.exists and doc.to_dict().get("org_id") == org_id:
        doc_ref.update(updates)
        return True
    return False

def set_due_date(org_id: str, finding_id: str, due_date: str, updated_by: str = "System") -> bool:
    updates = {"due_date": due_date, "updated_at": utc_now(), "updated_by": updated_by}
    
    if get_runtime_mode() == "demo":
        finding = next((f for f in _mock_db["findings"] if f.get("id") == finding_id and f.get("org_id") == org_id), None)
        if finding:
            finding.update(updates)
            return True
        return False

    db = get_db()
    if not db:
        return False

    doc_ref = db.collection("findings").document(finding_id)
    doc = doc_ref.get()
    if doc.exists and doc.to_dict().get("org_id") == org_id:
        doc_ref.update(updates)
        return True
    return False

def add_comment(org_id: str, finding_id: str, author_id: str, author_name: str, content: str) -> Dict:
    comment = {
        "id": f"com_{uuid.uuid4().hex[:8]}",
        "org_id": org_id,
        "finding_id": finding_id,
        "author_id": author_id,
        "author_name": author_name,
        "content": content,
        "created_at": utc_now(),
    }
    
    if get_runtime_mode() == "demo":
        _mock_db["comments"].append(comment)
        # Update finding comments_count
        finding = next((f for f in _mock_db["findings"] if f.get("id") == finding_id and f.get("org_id") == org_id), None)
        if finding:
            finding["comments_count"] = finding.get("comments_count", 0) + 1
        return comment
        
    db = get_db()
    if not db:
        return comment
        
    db.collection("comments").document(comment["id"]).set(comment)
    # Increment count
    doc_ref = db.collection("findings").document(finding_id)
    doc = doc_ref.get()
    if doc.exists:
        count = doc.to_dict().get("comments_count", 0) + 1
        doc_ref.update({"comments_count": count})
    return comment

def get_comments(org_id: str, finding_id: str) -> List[Dict]:
    if get_runtime_mode() == "demo":
        return sorted(
            [c for c in _mock_db["comments"] if c.get("finding_id") == finding_id and c.get("org_id") == org_id],
            key=lambda x: x["created_at"]
        )
        
    db = get_db()
    if not db:
        return []
        
    docs = db.collection("comments").where("org_id", "==", org_id).where("finding_id", "==", finding_id).stream()
    return sorted([doc.to_dict() for doc in docs], key=lambda x: x["created_at"])
