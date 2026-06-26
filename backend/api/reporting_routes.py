import csv
import io
import json
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse, Response
from typing import Dict
from services.auth_service import get_current_user
from services.rbac import require_role
from services.firebase_client import get_findings, get_runtime_mode, _mock_db

router = APIRouter()

@router.get("/reports/findings/csv")
async def export_findings_csv(current_user: Dict = Depends(require_role("analyst"))):
    org_id = current_user["org_id"]
    findings = get_findings(org_id)
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Finding ID", "Title", "Severity", "Status", "Asset Name", 
        "Provider", "CIS", "SOC2", "ISO27001", "Detected At"
    ])
    
    for f in findings:
        asset = f.get("asset", {})
        comp = f.get("compliance", {})
        writer.writerow([
            f.get("id"),
            f.get("title"),
            f.get("severity"),
            f.get("status"),
            asset.get("asset_name", ""),
            asset.get("provider", ""),
            ", ".join(comp.get("cis", [])),
            ", ".join(comp.get("soc2", [])),
            ", ".join(comp.get("iso27001", [])),
            f.get("detected_at", "")
        ])
        
    output.seek(0)
    return StreamingResponse(
        output,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=findings_report.csv"}
    )

@router.get("/reports/findings/json")
async def export_findings_json(current_user: Dict = Depends(require_role("analyst"))):
    org_id = current_user["org_id"]
    findings = get_findings(org_id)
    return Response(
        content=json.dumps({"findings": findings}),
        media_type="application/json",
        headers={"Content-Disposition": "attachment; filename=findings_report.json"}
    )

@router.get("/reports/compliance/summary")
async def get_compliance_summary(current_user: Dict = Depends(get_current_user)):
    org_id = current_user["org_id"]
    findings = get_findings(org_id)
    
    summary = {
        "cis": {"total_findings": 0, "open_findings": 0},
        "soc2": {"total_findings": 0, "open_findings": 0},
        "iso27001": {"total_findings": 0, "open_findings": 0}
    }
    
    for f in findings:
        comp = f.get("compliance", {})
        status = f.get("status", "open")
        
        if comp.get("cis"):
            summary["cis"]["total_findings"] += 1
            if status in ["open", "in_progress"]: summary["cis"]["open_findings"] += 1
            
        if comp.get("soc2"):
            summary["soc2"]["total_findings"] += 1
            if status in ["open", "in_progress"]: summary["soc2"]["open_findings"] += 1
            
        if comp.get("iso27001"):
            summary["iso27001"]["total_findings"] += 1
            if status in ["open", "in_progress"]: summary["iso27001"]["open_findings"] += 1
            
    return {"success": True, "data": summary}
