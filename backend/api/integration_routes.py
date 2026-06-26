from fastapi import APIRouter, Depends, HTTPException
from typing import Dict
from pydantic import BaseModel
from services.auth_service import get_current_user
from services.rbac import require_role
from services.integration_service import get_integrations, upsert_integration, disconnect_integration

router = APIRouter()

class ConnectIntegrationRequest(BaseModel):
    provider: str
    configuration: Dict

class DisconnectIntegrationRequest(BaseModel):
    provider: str

@router.get("/integrations")
async def list_integrations(current_user: Dict = Depends(get_current_user)):
    integrations = get_integrations(current_user["org_id"])
    return {
        "success": True,
        "data": integrations
    }

@router.post("/integrations/connect")
async def connect_integration(
    request: ConnectIntegrationRequest, 
    current_user: Dict = Depends(require_role("admin"))
):
    integration = upsert_integration(current_user["org_id"], request.provider, request.configuration)
    return {
        "success": True,
        "data": integration
    }

@router.post("/integrations/disconnect")
async def disconnect_integration_endpoint(
    request: DisconnectIntegrationRequest, 
    current_user: Dict = Depends(require_role("admin"))
):
    success = disconnect_integration(current_user["org_id"], request.provider)
    if not success:
        raise HTTPException(status_code=404, detail="Integration not found")
        
    return {"success": True, "message": "Integration disconnected"}
