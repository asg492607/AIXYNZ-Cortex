import logging
import requests
from typing import Dict
from services.firebase_client import get_runtime_mode
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
    integrations = get_integrations(org_id)
    slack_int = next((i for i in integrations if i.get("provider") == "slack" and i.get("status") == "connected"), None)
    
    if slack_int and "webhook_url" in slack_int.get("configuration", {}):
        webhook_url = slack_int["configuration"]["webhook_url"]
        severity_icon = "🚨" if finding.get("severity") in ["Critical", "High"] else "⚠️"
        msg = f"{severity_icon} *New {finding.get('severity')} Finding Detected*\n*Title*: {finding.get('title')}\n*Asset*: {finding.get('asset', {}).get('asset_name', 'Unknown')}"
        send_slack_notification(webhook_url, msg)
        
def notify_finding_resolved(org_id: str, finding: Dict):
    integrations = get_integrations(org_id)
    slack_int = next((i for i in integrations if i.get("provider") == "slack" and i.get("status") == "connected"), None)
    
    if slack_int and "webhook_url" in slack_int.get("configuration", {}):
        webhook_url = slack_int["configuration"]["webhook_url"]
        msg = f"✅ *Finding Resolved*\n*Title*: {finding.get('title')}\n*Resolved By*: {finding.get('updated_by', 'System')}"
        send_slack_notification(webhook_url, msg)
