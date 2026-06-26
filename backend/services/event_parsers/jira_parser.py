from typing import Optional, Dict

def parse_jira_webhook(payload: Dict, org_id: str) -> Optional[Dict]:
    """
    Parses a Jira webhook payload (e.g., issue_updated).
    We use this to transition Cortex findings back to 'resolved' when the Jira ticket is closed.
    Returns a dict with the jira_issue_key and the new status, or None.
    """
    if payload.get("webhookEvent") == "jira:issue_updated":
        issue = payload.get("issue", {})
        key = issue.get("key")
        
        status_name = issue.get("fields", {}).get("status", {}).get("name", "").lower()
        
        cortex_status = "in_progress"
        if status_name in ["done", "closed", "resolved"]:
            cortex_status = "resolved"
            
        return {
            "jira_issue_key": key,
            "status": cortex_status
        }
        
    return None
