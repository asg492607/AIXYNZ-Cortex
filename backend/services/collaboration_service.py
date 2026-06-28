import logging
import httpx
from typing import Dict, Any
from services.firebase_client import get_runtime_mode

logger = logging.getLogger(__name__)

def share_finding(org_id: str, platform: str, finding: Dict[str, Any], channel: str = None) -> Dict[str, Any]:
    """
    Shares a finding to a collaboration platform (Slack/Teams).
    In Demo mode, mocks a successful response.
    """
    platform = platform.lower()
    
    if platform not in ["slack", "teams"]:
        return {"success": False, "error": f"Unsupported platform: {platform}"}
        
    finding_title = finding.get("title", "Unknown Risk")
    severity = finding.get("severity", "Info")
    
    logger.info(f"[Collaboration] Sharing finding '{finding_title}' to {platform}")
    
    if get_runtime_mode() == "demo":
        # Mock successful share
        target_channel = channel or ("#security-alerts" if platform == "slack" else "Security Channel")
        return {
            "success": True,
            "message": f"Successfully shared to {platform.capitalize()} ({target_channel})",
            "mock": True
        }
        
    # Live mode placeholder (requires actual webhook URL configuration from DB)
    # url = get_webhook_for_platform(org_id, platform)
    # ... httpx.post(url, json={...})
    
    # Fallback for live mode without config
    return {
        "success": False,
        "error": f"Live integration for {platform} not fully configured for org {org_id}."
    }
