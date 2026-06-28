from fastapi import APIRouter, Depends, HTTPException
from typing import Dict
from pydantic import BaseModel
from services.auth_service import get_current_user
from services.rbac import require_role
from services.user_service import get_users_for_org, update_user_role

router = APIRouter()

from pydantic import BaseModel, Field

class UpdateRoleRequest(BaseModel):
    # OWASP Mitigation: Mass Assignment & BOLA Protection
    # Strictly define accepted fields and values
    role: str = Field(..., pattern="^(admin|analyst|viewer)$")

@router.get("/me")
async def get_me(current_user: Dict = Depends(get_current_user)):
    return {
        "success": True,
        "data": current_user
    }

@router.get("/users")
async def list_users(current_user: Dict = Depends(get_current_user)):
    users = get_users_for_org(current_user["org_id"])
    return {
        "success": True,
        "data": users
    }

@router.patch("/users/{user_id}/role")
async def patch_user_role(
    user_id: str, 
    request: UpdateRoleRequest, 
    current_user: Dict = Depends(require_role("admin"))
):
        
    success = update_user_role(user_id, request.role, current_user["org_id"])
    if not success:
        raise HTTPException(status_code=404, detail="User not found or update failed")
        
    return {"success": True, "message": "Role updated successfully"}
