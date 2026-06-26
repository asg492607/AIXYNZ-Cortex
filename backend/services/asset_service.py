import uuid
from typing import Dict, List, Optional
from services.firebase_client import get_db, get_runtime_mode, _mock_db, utc_now

def get_assets(org_id: str) -> List[Dict]:
    if get_runtime_mode() == "demo":
        return [a for a in _mock_db["assets"] if a.get("org_id") == org_id]
        
    db = get_db()
    if not db:
        return []
    docs = db.collection("assets").where("org_id", "==", org_id).stream()
    return [doc.to_dict() for doc in docs]

def get_asset_by_id(org_id: str, asset_id: str) -> Optional[Dict]:
    if get_runtime_mode() == "demo":
        return next((a for a in _mock_db["assets"] if a.get("id") == asset_id and a.get("org_id") == org_id), None)
        
    db = get_db()
    if not db:
        return None
    doc = db.collection("assets").document(asset_id).get()
    if doc.exists and doc.to_dict().get("org_id") == org_id:
        return doc.to_dict()
    return None

def upsert_asset(org_id: str, asset_data: Dict) -> str:
    """
    Upserts an asset using its external_asset_id. 
    Updates last_seen_at and merges arrays like tags.
    """
    ext_id = asset_data.get("external_asset_id")
    if not ext_id:
        raise ValueError("Asset must have an external_asset_id")

    now = utc_now()
    
    if get_runtime_mode() == "demo":
        existing = next((a for a in _mock_db["assets"] if a.get("external_asset_id") == ext_id and a.get("org_id") == org_id), None)
        if existing:
            existing["last_seen_at"] = now
            existing["risk_score"] = asset_data.get("risk_score", existing.get("risk_score", 0))
            return existing["id"]
        
        asset_id = f"ast_{uuid.uuid4().hex[:8]}"
        new_asset = {
            "id": asset_id,
            "org_id": org_id,
            "external_asset_id": ext_id,
            "asset_type": asset_data.get("asset_type"),
            "provider": asset_data.get("provider"),
            "name": asset_data.get("asset_name", ext_id),
            "owner": "unassigned",
            "business_tags": [],
            "risk_score": asset_data.get("risk_score", 0),
            "first_seen_at": now,
            "last_seen_at": now
        }
        _mock_db["assets"].append(new_asset)
        return asset_id

    db = get_db()
    if not db:
        return ""

    docs = db.collection("assets").where("org_id", "==", org_id).where("external_asset_id", "==", ext_id).limit(1).stream()
    existing_doc = next(docs, None)
    
    if existing_doc:
        asset_id = existing_doc.id
        db.collection("assets").document(asset_id).update({
            "last_seen_at": now,
            "risk_score": asset_data.get("risk_score", existing_doc.to_dict().get("risk_score", 0))
        })
        return asset_id
    else:
        asset_id = f"ast_{uuid.uuid4().hex[:8]}"
        new_asset = {
            "id": asset_id,
            "org_id": org_id,
            "external_asset_id": ext_id,
            "asset_type": asset_data.get("asset_type"),
            "provider": asset_data.get("provider"),
            "name": asset_data.get("asset_name", ext_id),
            "owner": "unassigned",
            "business_tags": [],
            "risk_score": asset_data.get("risk_score", 0),
            "first_seen_at": now,
            "last_seen_at": now
        }
        db.collection("assets").document(asset_id).set(new_asset)
        return asset_id

def update_asset(org_id: str, asset_id: str, updates: Dict) -> bool:
    if get_runtime_mode() == "demo":
        asset = next((a for a in _mock_db["assets"] if a.get("id") == asset_id and a.get("org_id") == org_id), None)
        if asset:
            asset.update(updates)
            return True
        return False
        
    db = get_db()
    if not db:
        return False
        
    doc_ref = db.collection("assets").document(asset_id)
    doc = doc_ref.get()
    if doc.exists and doc.to_dict().get("org_id") == org_id:
        doc_ref.update(updates)
        return True
    return False

def calculate_asset_risk_scores(org_id: str):
    """
    Recalculates the total risk score for all assets in the organization based on their open/in_progress findings.
    """
    from services.firebase_client import get_findings
    findings = get_findings(org_id)
    
    # Map finding risk scores to assets
    asset_scores = {}
    for f in findings:
        if f.get("status") in ["open", "in_progress"]:
            aid = f.get("asset_id")
            if aid:
                asset_scores[aid] = asset_scores.get(aid, 0) + f.get("risk_score", 0)
                
    # Cap risk score at 100 for normalization, or leave cumulative. Let's do capped at 100 or raw.
    # We'll do a simple scaled sum: min(100, sum)
    
    if get_runtime_mode() == "demo":
        for asset in _mock_db["assets"]:
            if asset.get("org_id") == org_id:
                asset["risk_score"] = min(100, asset_scores.get(asset["id"], 0))
        return
        
    db = get_db()
    if not db:
        return
        
    batch = db.batch()
    assets_ref = db.collection("assets").where("org_id", "==", org_id).stream()
    for doc in assets_ref:
        score = min(100, asset_scores.get(doc.id, 0))
        if doc.to_dict().get("risk_score") != score:
            batch.update(doc.reference, {"risk_score": score})
    batch.commit()
