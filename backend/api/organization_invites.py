import uuid
from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, List
from pydantic import BaseModel, EmailStr, Field

from services.auth_service import get_current_user
from services.rbac import require_role
from services.firebase_client import get_db, get_runtime_mode, _mock_db, utc_now
from services.email_service import send_invitation_email
from services.user_service import update_user_role

router = APIRouter()

class CreateInviteRequest(BaseModel):
    email: EmailStr
    role: str = Field(..., pattern="^(admin|analyst|viewer)$")

class AcceptInviteRequest(BaseModel):
    token: str

@router.post("/org/invites")
async def create_invite(request: CreateInviteRequest, current_user: Dict = Depends(require_role("admin"))):
    org_id = current_user["org_id"]
    invite_token = uuid.uuid4().hex
    
    invite_data = {
        "id": f"inv_{uuid.uuid4().hex[:8]}",
        "org_id": org_id,
        "email": request.email.lower(),
        "role": request.role,
        "token": invite_token,
        "created_by": current_user["uid"],
        "status": "pending",
        "created_at": utc_now(),
    }
    
    # Save invite
    if get_runtime_mode() == "demo":
        _mock_db["invites"].append(invite_data)
    else:
        db = get_db()
        if db:
            db.collection("invites").document(invite_data["id"]).set(invite_data)
            
    # Send email
    send_invitation_email(
        email=request.email, 
        invite_token=invite_token, 
        org_name=current_user.get("org_id"), # Real org name would be fetched in a full implementation
        inviter_name=current_user.get("name", "An Admin")
    )
    
    return {"success": True, "data": {"invite_link": f"http://localhost:5173/invite/{invite_token}"}}

@router.get("/org/invites")
async def list_invites(current_user: Dict = Depends(require_role("admin"))):
    org_id = current_user["org_id"]
    
    if get_runtime_mode() == "demo":
        invites = [i for i in _mock_db.get("invites", []) if i.get("org_id") == org_id and i.get("status") == "pending"]
        return {"success": True, "data": invites}
        
    db = get_db()
    if not db:
        return {"success": True, "data": []}
        
    docs = db.collection("invites").where("org_id", "==", org_id).where("status", "==", "pending").stream()
    return {"success": True, "data": [doc.to_dict() for doc in docs]}

@router.delete("/org/invites/{invite_id}")
async def revoke_invite(invite_id: str, current_user: Dict = Depends(require_role("admin"))):
    org_id = current_user["org_id"]
    
    if get_runtime_mode() == "demo":
        invites = _mock_db.get("invites", [])
        for invite in invites:
            if invite.get("id") == invite_id and invite.get("org_id") == org_id:
                invite["status"] = "revoked"
                return {"success": True}
        raise HTTPException(status_code=404, detail="Invite not found")
        
    db = get_db()
    if db:
        doc_ref = db.collection("invites").document(invite_id)
        doc = doc_ref.get()
        if doc.exists and doc.to_dict().get("org_id") == org_id:
            doc_ref.update({"status": "revoked"})
            return {"success": True}
            
    raise HTTPException(status_code=404, detail="Invite not found")

@router.post("/org/invites/accept")
async def accept_invite(request: AcceptInviteRequest, current_user: Dict = Depends(get_current_user)):
    user_id = current_user["uid"]
    
    if get_runtime_mode() == "demo":
        invite = next((i for i in _mock_db.get("invites", []) if i.get("token") == request.token and i.get("status") == "pending"), None)
        if not invite:
            raise HTTPException(status_code=404, detail="Invalid or expired invite token")
            
        # Update user org_id
        for u in _mock_db["users"]:
            if u.get("id") == user_id:
                u["org_id"] = invite["org_id"]
                u["role"] = invite["role"]
                break
                
        # Mark invite as accepted
        invite["status"] = "accepted"
        return {"success": True, "org_id": invite["org_id"]}
        
    db = get_db()
    if not db:
        raise HTTPException(status_code=500, detail="Database unavailable")
        
    docs = list(db.collection("invites").where("token", "==", request.token).where("status", "==", "pending").limit(1).stream())
    if not docs:
        raise HTTPException(status_code=404, detail="Invalid or expired invite token")
        
    invite_doc = docs[0]
    invite_data = invite_doc.to_dict()
    
    # Update user org_id
    user_ref = db.collection("users").document(user_id)
    user_ref.update({
        "org_id": invite_data["org_id"],
        "role": invite_data["role"]
    })
    
    # Mark invite as accepted
    db.collection("invites").document(invite_doc.id).update({"status": "accepted"})
    
    return {"success": True, "org_id": invite_data["org_id"]}
