from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services.firebase_client import (
    get_finding_by_id,
    get_findings,
    get_runtime_mode,
)
from services.groq_client import analyze_finding
from services.scan_service import run_full_scan
from services.remediation_service import remediate_finding

router = APIRouter()

DEFAULT_ORG_ID = "demo-org"
SEVERITY_ORDER = {"Critical": 4, "High": 3, "Medium": 2, "Low": 1}

class AnalyzeFindingRequest(BaseModel):
    finding_id: str
    org_id: Optional[str] = DEFAULT_ORG_ID

class RemediateFindingRequest(BaseModel):
    finding_id: str
    org_id: Optional[str] = DEFAULT_ORG_ID

def sort_findings(findings: list[dict]) -> list[dict]:
    return sorted(
        findings,
        key=lambda f: (
            SEVERITY_ORDER.get(f.get("severity", "Low"), 0),
            f.get("risk_score", 0),
        ),
        reverse=True,
    )

@router.post("/findings/rescan")
async def rescan_findings(org_id: str = DEFAULT_ORG_ID):
    scan_result = run_full_scan(org_id)
    return scan_result

@router.get("/dashboard/summary")
async def get_dashboard_summary(org_id: str = DEFAULT_ORG_ID):
    findings = get_findings(org_id)

    if not findings and get_runtime_mode() == "demo":
        run_full_scan(org_id)
        findings = get_findings(org_id)

    ranked = sort_findings(findings)

    return {
        "mode": get_runtime_mode(),
        "org_id": org_id,
        "posture_score": max(0, 100 - len(findings) * 5),
        "critical_risks_count": len([f for f in findings if f.get("severity") == "Critical"]),
        "high_risks_count": len([f for f in findings if f.get("severity") == "High"]),
        "top_findings": ranked[:5],
    }

@router.get("/findings")
async def list_findings(org_id: str = DEFAULT_ORG_ID):
    findings = sort_findings(get_findings(org_id))
    return {
        "mode": get_runtime_mode(),
        "org_id": org_id,
        "findings": findings,
    }

@router.post("/findings/analyze")
async def ai_analyze_finding(request: AnalyzeFindingRequest):
    finding = get_finding_by_id(request.finding_id, request.org_id)
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
        "org_id": request.org_id,
        "finding_id": request.finding_id,
        "analysis": analysis,
    }

@router.post("/findings/remediate")
async def api_remediate_finding(request: RemediateFindingRequest):
    try:
        result = remediate_finding(request.org_id, request.finding_id)
        return {
            "mode": get_runtime_mode(),
            "org_id": request.org_id,
            "finding_id": request.finding_id,
            "ticket": result.get("ticket") or result,
            "analysis": result.get("analysis")
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
