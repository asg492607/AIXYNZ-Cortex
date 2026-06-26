from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Optional, List
from pydantic import BaseModel
from services.auth_service import get_current_user
from services.rbac import require_role
from services.firebase_client import get_workflows, upsert_workflow, delete_workflow

router = APIRouter()

class WorkflowCondition(BaseModel):
    severity: Optional[str] = None
    status: Optional[str] = None

class WorkflowAction(BaseModel):
    type: str  # "slack", "email", etc.
    target: Optional[str] = None  # channel or email address

class WorkflowCreateRequest(BaseModel):
    name: str
    trigger: str  # e.g., "new_finding"
    condition: WorkflowCondition
    action: WorkflowAction
    is_active: bool = True

@router.get("/workflows")
async def list_workflows(current_user: Dict = Depends(get_current_user)):
    org_id = current_user["org_id"]
    workflows = get_workflows(org_id)
    return {"success": True, "workflows": workflows}

@router.post("/workflows")
async def create_workflow(
    request: WorkflowCreateRequest,
    current_user: Dict = Depends(require_role("admin"))
):
    org_id = current_user["org_id"]
    
    workflow_data = {
        "name": request.name,
        "trigger": request.trigger,
        "condition": request.condition.dict(exclude_none=True),
        "action": request.action.dict(exclude_none=True),
        "is_active": request.is_active,
        "created_by": current_user["name"]
    }
    
    wid = upsert_workflow(org_id, workflow_data)
    workflow_data["id"] = wid
    return {"success": True, "workflow": workflow_data}

@router.delete("/workflows/{workflow_id}")
async def remove_workflow(
    workflow_id: str,
    current_user: Dict = Depends(require_role("admin"))
):
    success = delete_workflow(current_user["org_id"], workflow_id)
    if not success:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return {"success": True}
