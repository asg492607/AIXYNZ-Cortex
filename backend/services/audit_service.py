import uuid
from typing import Optional, Dict
from services.firebase_client import get_db, get_runtime_mode, _mock_db, utc_now

def log_audit_event(org_id: str, actor_id: str, action: str, target_id: Optional[str] = None, details: Optional[Dict] = None) -> None:
    event = {
        "id": f"evt_{uuid.uuid4().hex[:8]}",
        "org_id": org_id,
        "actor_id": actor_id,
        "action": action,
        "target_id": target_id,
        "details": details or {},
        "timestamp": utc_now()
    }
    
    if get_runtime_mode() == "demo":
        _mock_db["audit_logs"].append(event)
        return
        
    db = get_db()
    if not db:
        return
        
    db.collection("audit_logs").document(event["id"]).set(event)
