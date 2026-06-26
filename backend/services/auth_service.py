import os
from typing import Dict, Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import firebase_admin
from firebase_admin import auth

from services.firebase_client import get_runtime_mode
from services.user_service import get_user_by_id

security = HTTPBearer(auto_error=False)

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict:
    """
    FastAPI dependency to verify Firebase token and return the authenticated user context.
    If in demo mode and no token is provided, returns a mock admin user.
    """
    mode = get_runtime_mode()

    if not credentials:
        if mode == "demo":
            return {
                "user_id": "demo-user-1",
                "email": "demo@aixynz.com",
                "name": "Demo Admin",
                "org_id": "demo-org",
                "role": "admin"
            }
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials

    if mode == "demo":
        # In demo mode, if a token is provided (e.g. from local testing login),
        # we can decode it if we want, but typically demo mode bypasses strict verification.
        # Let's try to verify if firebase is initialized, else use mock.
        if not firebase_admin._apps:
             return {
                "user_id": "demo-user-1",
                "email": "demo@aixynz.com",
                "name": "Demo Admin",
                "org_id": "demo-org",
                "role": "admin"
            }

    try:
        decoded_token = auth.verify_id_token(token)
        uid = decoded_token.get("uid")
        
        user_record = get_user_by_id(uid)
        if not user_record:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found in system",
            )
            
        return {
            "user_id": user_record.get("id"),
            "email": user_record.get("email"),
            "name": user_record.get("name"),
            "org_id": user_record.get("org_id"),
            "role": user_record.get("role", "viewer")
        }
    except auth.InvalidIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
        )
    except auth.ExpiredIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Expired authentication token",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
        )
