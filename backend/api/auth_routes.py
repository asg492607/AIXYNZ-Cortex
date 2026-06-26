from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from services.user_service import create_user, get_user_by_id
from services.organization_service import create_organization
import firebase_admin
from firebase_admin import auth

router = APIRouter()

class RegisterRequest(BaseModel):
    token: str # Firebase token after client-side registration
    org_name: str

@router.post("/register")
async def register_user(request: RegisterRequest):
    """
    Called after successful client-side Firebase registration.
    Creates the organization and user profile in the backend.
    """
    try:
        decoded_token = auth.verify_id_token(request.token)
        uid = decoded_token.get("uid")
        email = decoded_token.get("email")
        name = decoded_token.get("name", email.split("@")[0] if email else "User")
        
        # Check if user already exists
        existing_user = get_user_by_id(uid)
        if existing_user:
            return {"success": True, "message": "User already registered", "data": existing_user}
            
        # Create organization
        org = create_organization(name=request.org_name)
        
        # Create user as admin of the new org
        user = create_user(user_id=uid, email=email, name=name, org_id=org["id"], role="admin")
        
        return {
            "success": True,
            "data": {
                "user": user,
                "organization": org
            }
        }
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
