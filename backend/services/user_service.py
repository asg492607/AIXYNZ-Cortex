import uuid
from typing import Optional, List, Dict
from services.firebase_client import get_db, get_runtime_mode, _mock_db, utc_now

def get_user_by_id(user_id: str) -> Optional[Dict]:
    """Get user. In live mode, if not found in Firestore, auto-create from Firebase Auth token."""
    if get_runtime_mode() == "demo":
        return next((u for u in _mock_db["users"] if u.get("id") == user_id), None)
        
    db = get_db()
    if not db:
        return next((u for u in _mock_db["users"] if u.get("id") == user_id), None)
        
    doc = db.collection("users").document(user_id).get()
    if doc.exists:
        return doc.to_dict()
    
    # User authenticated via Firebase Auth but not yet in Firestore
    # (can happen if Firestore write failed on registration)
    # Return a minimal auto-provisioned record so they are not locked out
    try:
        from firebase_admin import auth as firebase_auth
        firebase_user = firebase_auth.get_user(user_id)
        email = firebase_user.email or f"{user_id}@unknown.com"
        name = firebase_user.display_name or email.split('@')[0]
        
        # Check if there's already an org for this user by email
        org_id = f"org_{user_id[:8]}"
        
        # Auto-create the org if not exists
        org_doc = db.collection("organizations").document(org_id).get()
        if not org_doc.exists:
            db.collection("organizations").document(org_id).set({
                "id": org_id,
                "name": f"{name}'s Organization",
                "plan": "free",
                "created_at": utc_now(),
                "updated_at": utc_now(),
            })
        
        user_data = {
            "id": user_id,
            "email": email,
            "name": name,
            "org_id": org_id,
            "role": "admin",
            "created_at": utc_now(),
            "updated_at": utc_now(),
        }
        db.collection("users").document(user_id).set(user_data)
        return user_data
    except Exception as e:
        import logging
        logging.getLogger(__name__).warning(f"Auto-provision user failed for {user_id}: {e}")
        return None

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
