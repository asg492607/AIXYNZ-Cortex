import logging
import requests
from typing import Dict
from services.firebase_client import get_runtime_mode, get_workflows
from services.integration_service import get_integrations

logger = logging.getLogger(__name__)

def send_slack_notification(webhook_url: str, message: str):
    if get_runtime_mode() == "demo":
        logger.info(f"[DEMO] Slack Notification sent: {message}")
        return
        
    try:
        requests.post(webhook_url, json={"text": message}, timeout=5)
    except Exception as e:
        logger.error(f"Failed to send Slack notification: {e}")

def notify_new_finding(org_id: str, finding: Dict):
    workflows = get_workflows(org_id)
    active_workflows = [w for w in workflows if w.get("is_active") and w.get("trigger") == "new_finding"]
    
    # If no workflows configured, fallback to default behavior? Or just return.
    # Let's say if no workflows exist, we don't notify unless they configure it.
    # But for backward compatibility/demo, we can inject a default if none exist.
    if not active_workflows and get_runtime_mode() == "demo":
        active_workflows = [{
            "id": "default",
            "name": "Default Critical Alert",
            "condition": {"severity": "Critical"},
            "action": {"type": "slack"}
        }]

    for wf in active_workflows:
        condition = wf.get("condition", {})
        # Evaluate condition
        match = True
        if "severity" in condition and condition["severity"]:
            # Could be exact match or threshold (e.g. "High" also includes "Critical"?)
            # Let's do exact match for now or basic list
            if finding.get("severity") != condition["severity"]:
                match = False
        if "status" in condition and condition["status"]:
            if finding.get("status") != condition["status"]:
                match = False
                
        if match:
            action = wf.get("action", {})
            if action.get("type") == "slack":
                integrations = get_integrations(org_id)
                slack_int = next((i for i in integrations if i.get("provider") == "slack" and i.get("status") == "connected"), None)
                if slack_int and "webhook_url" in slack_int.get("configuration", {}):
                    webhook_url = slack_int["configuration"]["webhook_url"]
                    severity_icon = "🚨" if finding.get("severity") in ["Critical", "High"] else "⚠️"
                    msg = f"[{wf.get('name', 'Workflow')}] {severity_icon} *New {finding.get('severity')} Finding Detected*\n*Title*: {finding.get('title')}\n*Asset*: {finding.get('asset', {}).get('asset_name', 'Unknown')}"
                    send_slack_notification(webhook_url, msg)
        
def notify_finding_resolved(org_id: str, finding: Dict):
    integrations = get_integrations(org_id)
    slack_int = next((i for i in integrations if i.get("provider") == "slack" and i.get("status") == "connected"), None)
    
    if slack_int and "webhook_url" in slack_int.get("configuration", {}):
        webhook_url = slack_int["configuration"]["webhook_url"]
        msg = f"✅ *Finding Resolved*\n*Title*: {finding.get('title')}\n*Resolved By*: {finding.get('updated_by', 'System')}"
        send_slack_notification(webhook_url, msg)
