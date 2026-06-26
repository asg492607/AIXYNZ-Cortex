from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, List, Optional
from pydantic import BaseModel
from services.auth_service import get_current_user
from services.rbac import require_role
from services.asset_service import get_assets, get_asset_by_id, update_asset
from services.audit_service import log_audit_event

router = APIRouter()

class AssetUpdateModel(BaseModel):
    owner: str = None
    business_tags: List[str] = None

@router.get("/assets")
async def list_assets(
    current_user: Dict = Depends(get_current_user),
    page: int = 1,
    limit: int = 50,
    provider: Optional[str] = None,
):
    org_id = current_user["org_id"]
    assets = get_assets(org_id)
    if provider:
        assets = [a for a in assets if a.get("provider", "").lower() == provider.lower()]
    total = len(assets)
    start = (page - 1) * limit
    paginated = assets[start: start + limit]
    return {"success": True, "total": total, "page": page, "limit": limit, "data": paginated}

@router.get("/assets/{asset_id}")
async def get_asset(asset_id: str, current_user: Dict = Depends(get_current_user)):
    org_id = current_user["org_id"]
    asset = get_asset_by_id(org_id, asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return {"success": True, "data": asset}

@router.patch("/assets/{asset_id}")
async def patch_asset(asset_id: str, payload: AssetUpdateModel, current_user: Dict = Depends(require_role("analyst"))):
    org_id = current_user["org_id"]
    
    updates = {k: v for k, v in payload.dict().items() if v is not None}
    if not updates:
        return {"success": True, "message": "No updates provided"}
        
    if update_asset(org_id, asset_id, updates):
        log_audit_event(org_id, current_user["uid"], "update_asset", asset_id, updates)
        return {"success": True, "message": "Asset updated successfully"}
    raise HTTPException(status_code=404, detail="Asset not found")
