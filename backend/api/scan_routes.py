from fastapi import APIRouter, Depends
from typing import Dict, List
from services.auth_service import get_current_user
from services.firebase_client import get_db, get_runtime_mode, _mock_db

router = APIRouter()

@router.get("/scans/history")
async def get_scan_history(current_user: Dict = Depends(get_current_user)):
    org_id = current_user["org_id"]
    
    if get_runtime_mode() == "demo":
        logs = [log for log in _mock_db.get("scan_logs", []) if log.get("org_id") == org_id]
        logs.sort(key=lambda x: x["timestamp"], reverse=True)
        return {"success": True, "data": logs}
        
    db = get_db()
    if not db:
        return {"success": True, "data": []}
        
    docs = db.collection("scan_logs").where("org_id", "==", org_id).order_by("timestamp", direction="DESCENDING").limit(50).stream()
    return {"success": True, "data": [doc.to_dict() for doc in docs]}
