from fastapi import Depends, HTTPException, status
from typing import Callable, Dict

from services.auth_service import get_current_user

# Define role hierarchy
ROLE_HIERARCHY = {
    "admin": 3,
    "analyst": 2,
    "viewer": 1
}

def require_role(required_role: str) -> Callable:
    """
    Dependency generator to enforce role-based access control.
    """
    def role_checker(current_user: Dict = Depends(get_current_user)) -> Dict:
        user_role = current_user.get("role", "viewer")
        
        required_level = ROLE_HIERARCHY.get(required_role, 0)
        user_level = ROLE_HIERARCHY.get(user_role, 0)
        
        if user_level < required_level:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation requires {required_role} privileges.",
            )
        return current_user
        
    return role_checker
