from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, List
from pydantic import BaseModel
import secrets
import bcrypt
from services.auth_service import get_current_user
from services.rbac import require_role
from services.firebase_client import get_api_keys, upsert_api_key, delete_api_key

router = APIRouter()

class CreateApiKeyRequest(BaseModel):
    name: str

@router.get("/api-keys")
async def list_api_keys(current_user: Dict = Depends(require_role("admin"))):
    org_id = current_user["org_id"]
    keys = get_api_keys(org_id)
    # Never return the hash, just the metadata
    safe_keys = []
    for k in keys:
        safe_keys.append({
            "id": k.get("id"),
            "name": k.get("name"),
            "prefix": k.get("prefix"),
            "created_at": k.get("created_at")
        })
    return {"success": True, "api_keys": safe_keys}

@router.post("/api-keys")
async def generate_api_key(
    request: CreateApiKeyRequest,
    current_user: Dict = Depends(require_role("admin"))
):
    org_id = current_user["org_id"]
    
    # Generate raw key
    raw_key = f"aix_{secrets.token_urlsafe(32)}"
    
    # Generate bcrypt hash for storage (OWASP Mitigation: Cryptographic Failures)
    # Using a strong salt/work factor.
    salt = bcrypt.gensalt(rounds=12)
    key_hash = bcrypt.hashpw(raw_key.encode('utf-8'), salt).decode('utf-8')
    
    key_data = {
        "name": request.name,
        "key_hash": key_hash,
        "prefix": raw_key[:8] + "...",
        "created_by": current_user["name"]
    }
    
    kid = upsert_api_key(org_id, key_data)
    
    # Return raw key ONCE
    return {
        "success": True, 
        "api_key": {
            "id": kid,
            "name": request.name,
            "raw_key": raw_key
        }
    }

@router.delete("/api-keys/{key_id}")
async def revoke_api_key(
    key_id: str,
    current_user: Dict = Depends(require_role("admin"))
):
    success = delete_api_key(current_user["org_id"], key_id)
    if not success:
        raise HTTPException(status_code=404, detail="API Key not found")
    return {"success": True}
