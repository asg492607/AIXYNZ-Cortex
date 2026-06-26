import uuid
from typing import Optional, List, Dict
from services.firebase_client import get_db, get_runtime_mode, _mock_db, utc_now

def get_user_by_id(user_id: str) -> Optional[Dict]:
    if get_runtime_mode() == "demo":
        return next((u for u in _mock_db["users"] if u.get("id") == user_id), None)
        
    db = get_db()
    if not db:
        return next((u for u in _mock_db["users"] if u.get("id") == user_id), None)
        
    doc = db.collection("users").document(user_id).get()
    return doc.to_dict() if doc.exists else None

def create_user(user_id: str, email: str, name: str, org_id: str, role: str = "admin") -> Dict:
    user_data = {
        "id": user_id,
        "email": email,
        "name": name,
        "org_id": org_id,
        "role": role,
        "created_at": utc_now(),
        "updated_at": utc_now(),
    }
    
    if get_runtime_mode() == "demo":
        _mock_db["users"].append(user_data)
        return user_data
        
    db = get_db()
    if not db:
        _mock_db["users"].append(user_data)
        return user_data
        
    db.collection("users").document(user_id).set(user_data)
    return user_data

def update_user_role(user_id: str, role: str, org_id: str) -> bool:
    if get_runtime_mode() == "demo":
        user = next((u for u in _mock_db["users"] if u.get("id") == user_id and u.get("org_id") == org_id), None)
        if user:
            user["role"] = role
            user["updated_at"] = utc_now()
            return True
        return False

    db = get_db()
    if not db:
        return False
        
    doc_ref = db.collection("users").document(user_id)
    doc = doc_ref.get()
    if doc.exists and doc.to_dict().get("org_id") == org_id:
        doc_ref.update({"role": role, "updated_at": utc_now()})
        return True
    return False

def get_users_for_org(org_id: str) -> List[Dict]:
    if get_runtime_mode() == "demo":
        return [u for u in _mock_db["users"] if u.get("org_id") == org_id]
        
    db = get_db()
    if not db:
        return [u for u in _mock_db["users"] if u.get("org_id") == org_id]
        
    docs = db.collection("users").where("org_id", "==", org_id).stream()
    return [doc.to_dict() for doc in docs]
