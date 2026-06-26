import uuid
from typing import List, Dict, Optional
from services.firebase_client import get_db, get_runtime_mode, _mock_db, utc_now

def get_integrations(org_id: str) -> List[Dict]:
    if get_runtime_mode() == "demo":
        return [i for i in _mock_db["integrations"] if i.get("org_id") == org_id]
        
    db = get_db()
    if not db:
        return [i for i in _mock_db["integrations"] if i.get("org_id") == org_id]
        
    docs = db.collection("integrations").where("org_id", "==", org_id).stream()
    return [doc.to_dict() for doc in docs]

def upsert_integration(org_id: str, provider: str, configuration: Dict) -> Dict:
    now = utc_now()
    
    if get_runtime_mode() == "demo":
        existing = next((i for i in _mock_db["integrations"] if i.get("org_id") == org_id and i.get("provider") == provider), None)
        if existing:
            existing.update({"configuration": configuration, "status": "connected", "updated_at": now})
            return existing
        
        new_int = {
            "id": f"int_{uuid.uuid4().hex[:8]}",
            "org_id": org_id,
            "provider": provider,
            "status": "connected",
            "configuration": configuration,
            "created_at": now,
            "updated_at": now,
        }
        _mock_db["integrations"].append(new_int)
        return new_int
        
    db = get_db()
    if not db:
        return {} # Fallback shouldn't hit if live mode failed
        
    query = db.collection("integrations").where("org_id", "==", org_id).where("provider", "==", provider).limit(1).stream()
    docs = list(query)
    
    if docs:
        doc = docs[0]
        data = doc.to_dict()
        data.update({"configuration": configuration, "status": "connected", "updated_at": now})
        db.collection("integrations").document(doc.id).set(data)
        return data
        
    new_id = f"int_{uuid.uuid4().hex[:8]}"
    new_int = {
        "id": new_id,
        "org_id": org_id,
        "provider": provider,
        "status": "connected",
        "configuration": configuration,
        "created_at": now,
        "updated_at": now,
    }
    db.collection("integrations").document(new_id).set(new_int)
    return new_int

def disconnect_integration(org_id: str, provider: str) -> bool:
    if get_runtime_mode() == "demo":
        existing = next((i for i in _mock_db["integrations"] if i.get("org_id") == org_id and i.get("provider") == provider), None)
        if existing:
            existing["status"] = "disconnected"
            existing["updated_at"] = utc_now()
            return True
        return False
        
    db = get_db()
    if not db:
        return False
        
    query = db.collection("integrations").where("org_id", "==", org_id).where("provider", "==", provider).limit(1).stream()
    docs = list(query)
    
    if docs:
        db.collection("integrations").document(docs[0].id).update({
            "status": "disconnected",
            "updated_at": utc_now()
        })
        return True
    return False
