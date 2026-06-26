import logging
from typing import Dict, Any
from fastapi import APIRouter, Request, HTTPException, Depends

from services.event_parsers.github_parser import parse_github_webhook
from services.event_parsers.aws_parser import parse_aws_eventbridge
from services.event_parsers.jira_parser import parse_jira_webhook
from services.firebase_client import upsert_finding, get_db, _mock_db, utc_now, get_runtime_mode
from services.asset_service import upsert_asset, calculate_asset_risk_scores
from services.notification_service import notify_new_finding

router = APIRouter()
logger = logging.getLogger(__name__)

# Basic token auth for webhooks (since we don't have per-org webhook secrets yet)
async def verify_webhook_token(token: str):
    # In a real system, we'd look up the org_id associated with this token.
    # For MVP-3 Sprint 1, we use a static token or assume demo-org if not provided.
    if not token or token != "cortex-webhook-secret":
        # Allow pass-through for demo mode testing, but warn
        if get_runtime_mode() != "demo":
            raise HTTPException(status_code=401, detail="Invalid webhook token")
    return "demo-org" # Default to demo-org for now


def _process_new_finding(finding: Dict, org_id: str):
    """Common pipeline for a newly ingested webhook finding."""
    # Ensure asset is linked
    asset_data = finding.get("asset")
    if asset_data:
        asset_id = upsert_asset(org_id, asset_data)
        finding["asset_id"] = asset_id

    # Save
    fid = upsert_finding(finding)
    finding["id"] = fid

    # Notification
    if finding.get("severity") in ["Critical", "High"]:
        notify_new_finding(org_id, finding)

    calculate_asset_risk_scores(org_id)
    return fid


@router.post("/webhooks/github")
async def github_webhook(request: Request, token: str = "cortex-webhook-secret"):
    org_id = await verify_webhook_token(token)
    payload = await request.json()
    
    finding = parse_github_webhook(payload, org_id)
    if finding:
        fid = _process_new_finding(finding, org_id)
        logger.info(f"[Webhook] GitHub finding ingested: {fid}")
        return {"success": True, "finding_id": fid}
        
    return {"success": True, "message": "Ignored event"}


@router.post("/webhooks/aws")
async def aws_webhook(request: Request, token: str = "cortex-webhook-secret"):
    org_id = await verify_webhook_token(token)
    payload = await request.json()
    
    finding = parse_aws_eventbridge(payload, org_id)
    if finding:
        fid = _process_new_finding(finding, org_id)
        logger.info(f"[Webhook] AWS finding ingested: {fid}")
        return {"success": True, "finding_id": fid}
        
    return {"success": True, "message": "Ignored event"}


@router.post("/webhooks/jira")
async def jira_webhook(request: Request, token: str = "cortex-webhook-secret"):
    org_id = await verify_webhook_token(token)
    payload = await request.json()
    
    update = parse_jira_webhook(payload, org_id)
    if update:
        jira_key = update["jira_issue_key"]
        new_status = update["status"]
        
        # Find the Cortex finding with this Jira key and update its status
        if get_runtime_mode() == "demo":
            for f in _mock_db["findings"]:
                if f.get("jira_issue_key") == jira_key and f.get("org_id") == org_id:
                    f["status"] = new_status
                    f["updated_at"] = utc_now()
                    logger.info(f"[Webhook] Jira linked finding {f['id']} marked as {new_status}")
        else:
            db = get_db()
            if db:
                docs = db.collection("findings").where("org_id", "==", org_id).where("jira_issue_key", "==", jira_key).stream()
                for doc in docs:
                    db.collection("findings").document(doc.id).update({
                        "status": new_status,
                        "updated_at": utc_now()
                    })
                    logger.info(f"[Webhook] Jira linked finding {doc.id} marked as {new_status}")

        return {"success": True, "jira_key": jira_key, "new_status": new_status}
        
    return {"success": True, "message": "Ignored event"}


# ── Simulation Endpoint ──────────────────────────────────────────────────────

@router.post("/webhooks/simulate")
async def simulate_webhook(provider: str, event_type: str, token: str = "cortex-webhook-secret"):
    """
    Test endpoint to inject a mock webhook payload for the given provider.
    Used for local testing in demo mode.
    """
    org_id = await verify_webhook_token(token)
    
    # Simple simulation: just call the parsers directly
    payload = {}
    finding = None
    if provider == "github":
        payload = {
            "action": "created",
            "alert": {
                "number": 123,
                "secret_type": "aws_access_key_id",
                "html_url": "https://github.com/demo/repo/security/secret-scanning/123"
            },
            "repository": {
                "id": 999888,
                "name": "demo-repo",
                "full_name": "demo/demo-repo"
            }
        }
        finding = parse_github_webhook(payload, org_id)
    elif provider == "aws":
        payload = {
            "source": "aws.guardduty",
            "detail-type": "GuardDuty Finding",
            "detail": {
                "id": "gd-12345",
                "title": "Unauthorized Access Detected",
                "description": "API call from Tor exit node.",
                "severity": 8.5,
                "resource": {
                    "resourceType": "Instance",
                    "instanceDetails": {"instanceId": "i-0abcd1234efgh5678"}
                }
            }
        }
        finding = parse_aws_eventbridge(payload, org_id)
        
    if finding:
        fid = _process_new_finding(finding, org_id)
        return {"success": True, "finding_id": fid, "simulated": True}
        
    raise HTTPException(status_code=400, detail="Invalid provider or event_type")
