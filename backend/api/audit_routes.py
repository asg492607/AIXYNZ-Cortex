from fastapi import APIRouter, Depends
from typing import Dict
from services.auth_service import get_current_user
from services.rbac import require_role
from services.firebase_client import get_db, get_runtime_mode, _mock_db

router = APIRouter()

@router.get("/audit-logs")
async def get_audit_logs(current_user: Dict = Depends(require_role("admin"))):
    org_id = current_user["org_id"]
    
    if get_runtime_mode() == "demo":
        logs = [log for log in _mock_db.get("audit_logs", []) if log.get("org_id") == org_id]
        logs.sort(key=lambda x: x["timestamp"], reverse=True)
        return {"success": True, "data": logs[:100]}
        
    db = get_db()
    if not db:
        return {"success": True, "data": []}
        
    docs = db.collection("audit_logs").where("org_id", "==", org_id).order_by("timestamp", direction="DESCENDING").limit(100).stream()
    return {"success": True, "data": [doc.to_dict() for doc in docs]}
