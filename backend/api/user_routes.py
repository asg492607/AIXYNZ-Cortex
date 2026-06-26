from fastapi import APIRouter, Depends, HTTPException
from typing import Dict
from pydantic import BaseModel
from services.auth_service import get_current_user
from services.rbac import require_role
from services.user_service import get_users_for_org, update_user_role

router = APIRouter()

class UpdateRoleRequest(BaseModel):
    role: str

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
    if request.role not in ["admin", "analyst", "viewer"]:
        raise HTTPException(status_code=400, detail="Invalid role")
        
    success = update_user_role(user_id, request.role, current_user["org_id"])
    if not success:
        raise HTTPException(status_code=404, detail="User not found or update failed")
        
    return {"success": True, "message": "Role updated successfully"}
