import uuid
from typing import Optional, Dict
from services.firebase_client import get_db, get_runtime_mode, _mock_db, utc_now

def get_organization_by_id(org_id: str) -> Optional[Dict]:
    if get_runtime_mode() == "demo":
        return next((o for o in _mock_db["organizations"] if o.get("id") == org_id), None)
        
    db = get_db()
    if not db:
        return next((o for o in _mock_db["organizations"] if o.get("id") == org_id), None)
        
    doc = db.collection("organizations").document(org_id).get()
    return doc.to_dict() if doc.exists else None

def create_organization(name: str, plan: str = "free") -> Dict:
    org_id = f"org_{uuid.uuid4().hex[:8]}"
    org_data = {
        "id": org_id,
        "name": name,
        "plan": plan,
        "created_at": utc_now(),
        "updated_at": utc_now(),
    }
    
    if get_runtime_mode() == "demo":
        _mock_db["organizations"].append(org_data)
        return org_data
        
    db = get_db()
    if not db:
        _mock_db["organizations"].append(org_data)
        return org_data
        
    db.collection("organizations").document(org_id).set(org_data)
    return org_data
