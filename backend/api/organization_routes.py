from fastapi import APIRouter, Depends, HTTPException
from typing import Dict
from services.auth_service import get_current_user
from services.organization_service import get_organization_by_id

router = APIRouter()

@router.get("/organizations/current")
async def get_current_organization(current_user: Dict = Depends(get_current_user)):
    org = get_organization_by_id(current_user["org_id"])
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
        
    return {
        "success": True,
        "data": org
    }
