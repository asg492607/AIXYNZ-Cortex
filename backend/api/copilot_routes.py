from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import uuid

from services.copilot_service import copilot_chat
from services.firebase_client import get_chat_history

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    thread_id: str = None
    finding_id: str = None

class ChatResponse(BaseModel):
    thread_id: str
    response: str

@router.post("/copilot/chat", response_model=ChatResponse)
def send_chat_message(req: ChatRequest):
    # In a real app, org_id comes from the JWT token
    org_id = "demo-org"
    
    thread_id = req.thread_id
    if not thread_id:
        thread_id = f"thread_{uuid.uuid4().hex[:8]}"
        
    response_text = copilot_chat(
        org_id=org_id, 
        thread_id=thread_id, 
        user_message=req.message, 
        finding_id=req.finding_id
    )
    
    return ChatResponse(
        thread_id=thread_id,
        response=response_text
    )

@router.get("/copilot/chat/{thread_id}")
def get_chat_thread(thread_id: str):
    org_id = "demo-org"
    history = get_chat_history(org_id, thread_id)
    return {"thread_id": thread_id, "messages": history}
