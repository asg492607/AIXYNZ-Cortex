from fastapi import APIRouter, Depends, HTTPException
from typing import Dict
from pydantic import BaseModel, Field, field_validator
from services.auth_service import get_current_user
from services.rbac import require_role
from services.integration_service import get_integrations, upsert_integration, disconnect_integration
import json

router = APIRouter()

# Strict Schemas for OWASP Mitigation: Insecure Design (Mass Assignment Prevention)
class GitHubConfig(BaseModel):
    token: str = Field(..., min_length=10)
    
class AWSConfig(BaseModel):
    access_key_id: str = Field(..., min_length=10)
    secret_access_key: str = Field(..., min_length=20)
    region: str = Field(default="us-east-1")

class JiraConfig(BaseModel):
    # OWASP Mitigation: SSRF Protection
    # Block localhost, 127.0.0.1, internal IP ranges to prevent the server from scanning itself.
    base_url: str = Field(..., pattern=r"^https?://(?!localhost|127\.0\.0\.1|10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1]))[a-zA-Z0-9.-]+/?.*")
    email: str = Field(..., pattern=r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")
    api_token: str = Field(..., min_length=10)
    project_key: str = Field(..., min_length=2, max_length=10)

class GroqConfig(BaseModel):
    api_key: str = Field(..., min_length=20)

class ConnectIntegrationRequest(BaseModel):
    provider: str = Field(..., pattern="^(github|aws|jira|groq)$")
    configuration: Dict
    
    @field_validator('configuration')
    def validate_configuration(cls, v, info):
        provider = info.data.get('provider')
        if provider == 'github':
            GitHubConfig(**v)
        elif provider == 'aws':
            AWSConfig(**v)
        elif provider == 'jira':
            JiraConfig(**v)
        elif provider == 'groq':
            GroqConfig(**v)
        return v

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
