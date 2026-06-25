from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services.aws_scanner import scan_s3_buckets
from services.github_scanner import scan_github_repos
from services.firebase_client import (
    get_finding_by_id,
    get_findings,
    get_runtime_mode,
    save_remediation,
    upsert_finding,
)
from services.groq_client import analyze_finding
from services.jira_client import create_remediation_ticket

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
    aws_findings = scan_s3_buckets()
    github_findings = scan_github_repos()

    all_raw = []
    for finding in aws_findings + github_findings:
        finding["org_id"] = org_id
        upsert_finding(finding)
        all_raw.append(finding)

    findings = get_findings(org_id)
    return {
        "mode": get_runtime_mode(),
        "org_id": org_id,
        "findings_count": len(findings),
        "message": "Rescan completed",
    }


@router.get("/dashboard/summary")
async def get_dashboard_summary(org_id: str = DEFAULT_ORG_ID):
    findings = get_findings(org_id)

    # demo bootstrap only
    if not findings and get_runtime_mode() == "demo":
        aws_findings = scan_s3_buckets()
        github_findings = scan_github_repos()
        for f in aws_findings + github_findings:
            f["org_id"] = org_id
            upsert_finding(f)
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
        finding_title=finding["title"],
        finding_source=finding["source"],
        raw_data={
            "category": finding.get("category"),
            "severity": finding.get("severity"),
            "asset_id": finding.get("asset_id"),
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
async def remediate_finding(request: RemediateFindingRequest):
    finding = get_finding_by_id(request.finding_id, request.org_id)
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")

    analysis = analyze_finding(
        finding_title=finding["title"],
        finding_source=finding["source"],
        raw_data={
            "category": finding.get("category"),
            "severity": finding.get("severity"),
            "asset_id": finding.get("asset_id"),
            "raw_data": finding.get("raw_data", {}),
        },
    )

    ticket = create_remediation_ticket(finding["title"], analysis)

    remediation_payload = {
        "ticket_id": ticket.get("ticket_id"),
        "ticket_url": ticket.get("ticket_url"),
        "finding_id": finding["id"],
        "status": "open",
    }
    save_remediation(remediation_payload, request.org_id)

    return {
        "mode": get_runtime_mode(),
        "org_id": request.org_id,
        "finding_id": finding["id"],
        "analysis": analysis,
        "ticket": ticket,
    }
