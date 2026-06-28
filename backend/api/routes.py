from typing import Optional, Dict, Literal, List
from datetime import datetime

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from services.firebase_client import (
    get_finding_by_id,
    get_findings,
    get_runtime_mode,
    utc_now
)
from services.groq_client import analyze_finding
from services.scan_service import run_full_scan
from services.remediation_service import remediate_finding
from services.auth_service import get_current_user
from services.rbac import require_role
from services.finding_service import update_finding_status, assign_owner, set_due_date, add_comment, get_comments
from services.audit_service import log_audit_event

router = APIRouter()

DEFAULT_ORG_ID = "demo-org"
SEVERITY_ORDER = {"Critical": 4, "High": 3, "Medium": 2, "Low": 1}

class AnalyzeFindingRequest(BaseModel):
    finding_id: str

class RemediateFindingRequest(BaseModel):
    finding_id: str

class RescanRequest(BaseModel):
    pass

def sort_findings(findings: list[dict]) -> list[dict]:
    return sorted(
        findings,
        key=lambda f: (
            SEVERITY_ORDER.get(f.get("severity", "Low"), 0),
            f.get("risk_score", 0),
        ),
        reverse=True,
    )

@router.post("/scan/rescan")
async def rescan_environment(
    payload: RescanRequest,
    current_user: Dict = Depends(require_role("analyst"))
):
    """
    Explicit rescan endpoint for frontend 'Rescan' button / future scheduled scans.
    """
    scan_result = run_full_scan(current_user["org_id"])
    return scan_result

@router.get("/dashboard/summary")
async def get_dashboard_summary(current_user: Dict = Depends(get_current_user)):
    org_id = current_user["org_id"]
    findings = get_findings(org_id)

    # No auto-scan in live mode. Users connect integrations to populate data.

    # Compute MTTR and trends
    resolved_findings = [f for f in findings if f.get("status") == "resolved" and f.get("resolved_at") and f.get("detected_at")]
    mttr_days = 0
    if resolved_findings:
        total_seconds = sum((datetime.fromisoformat(f["resolved_at"].replace("Z", "+00:00")) - datetime.fromisoformat(f["detected_at"].replace("Z", "+00:00"))).total_seconds() for f in resolved_findings)
        mttr_days = round((total_seconds / len(resolved_findings)) / 86400, 1)

    assets_count = {}
    for f in findings:
        asset_name = f.get("asset", {}).get("asset_name") or f.get("asset", {}).get("external_asset_id") or "Unknown"
        assets_count[asset_name] = assets_count.get(asset_name, 0) + 1
    
    top_assets = [{"name": k, "count": v} for k, v in sorted(assets_count.items(), key=lambda item: item[1], reverse=True)[:5]]

    return {
        "mode": get_runtime_mode(),
        "org_id": org_id,
        "findings_count": len(findings),
        "critical_risks_count": len([f for f in findings if f.get("severity") == "Critical" and f.get("status") != "resolved"]),
        "high_risks_count": len([f for f in findings if f.get("severity") == "High" and f.get("status") != "resolved"]),
        "posture_score": max(0, 100 - (len([f for f in findings if f.get("severity") == "Critical" and f.get("status") != "resolved"]) * 10) - (len([f for f in findings if f.get("severity") == "High" and f.get("status") != "resolved"]) * 5)),
        "top_findings": sort_findings([f for f in findings if f.get("status") != "resolved"])[:5],
        "mttr_days": mttr_days,
        "top_assets": top_assets,
    }

@router.get("/findings")
async def list_findings(
    current_user: Dict = Depends(get_current_user),
    page: int = 1,
    limit: int = 50,
    severity: Optional[str] = None,
    status: Optional[str] = None,
    source: Optional[str] = None,
    asset_id: Optional[str] = None,
):
    org_id = current_user["org_id"]
    findings = sort_findings(get_findings(org_id))

    # Server-side filtering
    if severity:
        findings = [f for f in findings if f.get("severity", "").lower() == severity.lower()]
    if status:
        findings = [f for f in findings if f.get("status", "").lower() == status.lower()]
    if source:
        findings = [f for f in findings if f.get("source", "").lower() == source.lower()]
    if asset_id:
        findings = [f for f in findings if f.get("asset_id") == asset_id or f.get("asset", {}).get("external_asset_id") == asset_id]

    total = len(findings)
    start = (page - 1) * limit
    paginated = findings[start: start + limit]

    return {
        "mode": get_runtime_mode(),
        "org_id": org_id,
        "total": total,
        "page": page,
        "limit": limit,
        "findings_count": len(paginated),
        "findings": paginated,
    }

@router.post("/findings/analyze")
async def ai_analyze_finding(
    request: AnalyzeFindingRequest,
    current_user: Dict = Depends(require_role("analyst"))
):
    org_id = current_user["org_id"]
    finding = get_finding_by_id(request.finding_id, org_id)
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")

    analysis = analyze_finding(
        finding_title=finding.get("title", ""),
        finding_source=finding.get("source", ""),
        raw_data={
            "category": finding.get("category"),
            "severity": finding.get("severity"),
            "asset": finding.get("asset"),
            "raw_data": finding.get("raw_data", {}),
        },
    )

    return {
        "mode": get_runtime_mode(),
        "org_id": org_id,
        "finding_id": request.finding_id,
        "analysis": analysis,
    }

@router.post("/findings/remediate")
async def api_remediate_finding(
    request: RemediateFindingRequest,
    current_user: Dict = Depends(require_role("analyst"))
):
    org_id = current_user["org_id"]
    try:
        result = remediate_finding(org_id, request.finding_id)
        
        # Flat response structure
        return {
            "mode": get_runtime_mode(),
            "org_id": org_id,
            "finding_id": request.finding_id,
            "status": result.get("status") or "success",
            "ticket_id": result.get("ticket_id") or (result.get("ticket", {}).get("ticket_id") if isinstance(result.get("ticket"), dict) else None) or result.get("id"),
            "ticket_url": result.get("ticket_url") or (result.get("ticket", {}).get("ticket_url") if isinstance(result.get("ticket"), dict) else None),
            "analysis": result.get("analysis"),
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class UpdateStatusRequest(BaseModel):
    status: Literal["open", "in_progress", "resolved", "ignored", "suppressed"]
    ignored_reason: Optional[str] = None
    expires_at: Optional[str] = None

class AssignOwnerRequest(BaseModel):
    owner: str

class AddCommentRequest(BaseModel):
    content: str

@router.patch("/findings/{finding_id}/status")
async def api_update_finding_status(
    finding_id: str,
    request: UpdateStatusRequest,
    current_user: Dict = Depends(require_role("analyst"))
):
    if request.status not in ["open", "in_progress", "resolved", "ignored", "suppressed"]:
        raise HTTPException(status_code=400, detail="Invalid status")
        
    success = update_finding_status(current_user["org_id"], finding_id, request.status, request.ignored_reason, request.expires_at, current_user.get("name", "Unknown"))
    if not success:
        raise HTTPException(status_code=404, detail="Finding not found")
        
    log_audit_event(current_user["org_id"], current_user["user_id"], "update_finding_status", finding_id, {"status": request.status})
    return {"success": True}

@router.patch("/findings/{finding_id}/assign")
async def api_assign_owner(
    finding_id: str,
    request: AssignOwnerRequest,
    current_user: Dict = Depends(require_role("analyst"))
):
    success = assign_owner(current_user["org_id"], finding_id, request.owner, current_user.get("name", "Unknown"))
    if not success:
        raise HTTPException(status_code=404, detail="Finding not found")
        
    log_audit_event(current_user["org_id"], current_user["user_id"], "assign_finding", finding_id, {"owner": request.owner})
    return {"success": True}

@router.get("/findings/{finding_id}/comments")
async def api_get_comments(
    finding_id: str,
    current_user: Dict = Depends(get_current_user)
):
    comments = get_comments(current_user["org_id"], finding_id)
    return {"success": True, "data": comments}

@router.post("/findings/{finding_id}/comments")
async def api_add_comment(
    finding_id: str,
    request: AddCommentRequest,
    current_user: Dict = Depends(require_role("analyst"))
):
    comment = add_comment(current_user["org_id"], finding_id, current_user["user_id"], current_user.get("name", "Unknown"), request.content)
    log_audit_event(current_user["org_id"], current_user["user_id"], "add_comment", finding_id)
    return {"success": True, "data": comment}


@router.get("/metrics")
async def get_metrics(current_user: Dict = Depends(get_current_user)):
    """
    Aggregated platform metrics: finding counts, scan history, MTTR, severity breakdown.
    Sourced from scan_logs and findings without re-running a scan.
    """
    from services.firebase_client import _mock_db, get_db
    org_id = current_user["org_id"]
    findings = get_findings(org_id)

    # Severity breakdown
    severity_breakdown = {}
    status_breakdown = {}
    for f in findings:
        sev = f.get("severity", "Unknown")
        sta = f.get("status", "open")
        severity_breakdown[sev] = severity_breakdown.get(sev, 0) + 1
        status_breakdown[sta] = status_breakdown.get(sta, 0) + 1

    # MTTR
    resolved = [f for f in findings if f.get("status") == "resolved" and f.get("resolved_at") and f.get("detected_at")]
    mttr_days = 0.0
    if resolved:
        total_secs = sum(
            (datetime.fromisoformat(f["resolved_at"].replace("Z", "+00:00")) -
             datetime.fromisoformat(f["detected_at"].replace("Z", "+00:00"))).total_seconds()
            for f in resolved
        )
        mttr_days = round((total_secs / len(resolved)) / 86400, 1)

    # Scan history (last 10)
    if get_runtime_mode() == "demo":
        scan_logs = sorted(
            [s for s in _mock_db.get("scan_logs", []) if s.get("org_id") == org_id],
            key=lambda x: x.get("timestamp", ""), reverse=True
        )[:10]
    else:
        db = get_db()
        scan_logs = []
        if db:
            docs = db.collection("scan_logs").where("org_id", "==", org_id).order_by("timestamp", direction="DESCENDING").limit(10).stream()
            scan_logs = [doc.to_dict() for doc in docs]

    return {
        "org_id": org_id,
        "total_findings": len(findings),
        "severity_breakdown": severity_breakdown,
        "status_breakdown": status_breakdown,
        "mttr_days": mttr_days,
        "recent_scans": scan_logs,
    }

class SIEMExportRequest(BaseModel):
    finding_ids: List[str]
    provider: str

@router.post("/siem/export")
async def api_export_to_siem(
    request: SIEMExportRequest,
    current_user: Dict = Depends(require_role("analyst"))
):
    from services.siem_service import export_to_siem
    org_id = current_user["org_id"]
    findings = get_findings(org_id)
    
    # Filter findings to just those requested
    to_export = [f for f in findings if f.get("id") in request.finding_ids]
    
    if not to_export:
        raise HTTPException(status_code=400, detail="No valid findings found for export.")
        
    result = export_to_siem(org_id, request.provider, to_export)
    if not result.get("success"):
        raise HTTPException(status_code=500, detail=result.get("error", "Export failed"))
        
    return result

@router.get("/siem/config")
async def api_get_siem_config(current_user: Dict = Depends(get_current_user)):
    """Mock endpoint returning SIEM configuration status."""
    return {
        "success": True,
        "data": {
            "splunk": {"configured": True, "auto_sync": False, "endpoint": "https://splunk-hec.example.com"},
            "datadog": {"configured": False, "auto_sync": False, "endpoint": ""},
            "jira": {"configured": True, "auto_sync": True, "project_key": "CORTEX"},
        }
    }

@router.get("/reports/executive")
async def api_get_executive_report(current_user: Dict = Depends(get_current_user)):
    org_id = current_user["org_id"]
    findings = get_findings(org_id)
    
    # Posture Score
    critical_count = len([f for f in findings if f.get("severity") == "Critical" and f.get("status") != "resolved"])
    high_count = len([f for f in findings if f.get("severity") == "High" and f.get("status") != "resolved"])
    posture_score = max(0, 100 - (critical_count * 10) - (high_count * 5))
    
    # Severity Breakdown
    severity_breakdown = {"Critical": 0, "High": 0, "Medium": 0, "Low": 0}
    for f in findings:
        sev = f.get("severity", "Low")
        if sev in severity_breakdown:
            severity_breakdown[sev] += 1
            
    # Top Risks (Open, sorted by risk score)
    open_findings = [f for f in findings if f.get("status") != "resolved"]
    top_risks = sorted(open_findings, key=lambda x: x.get("risk_score", 0), reverse=True)[:5]
    
    # MTTR
    resolved = [f for f in findings if f.get("status") == "resolved" and f.get("resolved_at") and f.get("detected_at")]
    mttr_days = 0.0
    if resolved:
        total_secs = sum(
            (datetime.fromisoformat(f["resolved_at"].replace("Z", "+00:00")) -
             datetime.fromisoformat(f["detected_at"].replace("Z", "+00:00"))).total_seconds()
            for f in resolved
        )
        mttr_days = round((total_secs / len(resolved)) / 86400, 1)

    return {
        "success": True,
        "data": {
            "org_id": org_id,
            "generated_at": utc_now(),
            "posture_score": posture_score,
            "total_findings": len(findings),
            "severity_breakdown": severity_breakdown,
            "top_risks": top_risks,
            "mttr_days": mttr_days
        }
    }

class PolicyTestRequest(BaseModel):
    policy_code: str
    asset_data: Dict

@router.post("/policies/test")
async def api_test_policy(
    request: PolicyTestRequest,
    current_user: Dict = Depends(require_role("analyst"))
):
    from services.policy_engine import evaluate_policy
    result = evaluate_policy(request.policy_code, request.asset_data)
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error"))
    return result

class CollaborationShareRequest(BaseModel):
    finding_id: str
    platform: str
    channel: Optional[str] = None

@router.post("/collaboration/share")
async def api_share_finding(
    request: CollaborationShareRequest,
    current_user: Dict = Depends(require_role("analyst"))
):
    from services.collaboration_service import share_finding
    org_id = current_user["org_id"]
    finding = get_finding_by_id(request.finding_id, org_id)
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")
        
    result = share_finding(org_id, request.platform, finding, request.channel)
    if not result.get("success"):
        raise HTTPException(status_code=500, detail=result.get("error", "Share failed"))
        
    return result

class ScheduleRequest(BaseModel):
    frequency: str
    time: str
    target: str

@router.get("/schedules")
async def api_get_schedules(current_user: Dict = Depends(get_current_user)):
    org_id = current_user["org_id"]
    if get_runtime_mode() == "demo":
        from services.firebase_client import _mock_db
        schedules = [s for s in _mock_db.get("schedules", []) if s.get("org_id") == org_id]
        return {"success": True, "data": schedules}
        
    db = get_db()
    if not db:
        return {"success": True, "data": []}
        
    docs = db.collection("schedules").where("org_id", "==", org_id).stream()
    return {"success": True, "data": [doc.to_dict() for doc in docs]}

@router.post("/schedules")
async def api_create_schedule(
    request: ScheduleRequest,
    current_user: Dict = Depends(require_role("admin"))
):
    from services.firebase_client import upsert_schedule
    org_id = current_user["org_id"]
    schedule_data = {
        "frequency": request.frequency,
        "time": request.time,
        "target": request.target,
        "status": "active"
    }
    
    sid = upsert_schedule(org_id, schedule_data)
    schedule_data["id"] = sid
    
    return {"success": True, "data": schedule_data}

class UpdateRoleRequest(BaseModel):
    role: Literal["admin", "analyst", "viewer"]

@router.patch("/team/{user_id}/role")
async def api_update_user_role(
    user_id: str,
    request: UpdateRoleRequest,
    current_user: Dict = Depends(require_role("admin"))
):
    from services.user_service import update_user_role
    org_id = current_user["org_id"]
    
    if current_user["id"] == user_id:
        raise HTTPException(status_code=400, detail="Cannot change your own role")
        
    success = update_user_role(user_id, request.role, org_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found in this organization")
        
    return {"success": True, "message": "Role updated successfully"}

@router.get("/org/billing")
async def api_get_billing(current_user: Dict = Depends(require_role("admin"))):
    """Returns mock billing and subscription data for the organization."""
    import datetime
    
    # Mock data for MVP
    current_plan = "Pro"
    assets_scanned = 342
    assets_limit = 500
    
    next_billing_date = (datetime.datetime.utcnow() + datetime.timedelta(days=14)).isoformat() + "Z"
    
    return {
        "success": True,
        "data": {
            "plan": current_plan,
            "status": "active",
            "next_billing_date": next_billing_date,
            "usage": {
                "assets_scanned": assets_scanned,
                "assets_limit": assets_limit
            }
        }
    }
