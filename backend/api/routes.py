from fastapi import APIRouter
from services.aws_scanner import scan_s3_buckets
from services.github_scanner import scan_github_repos
from services.groq_client import analyze_finding
from services.jira_client import create_remediation_ticket

router = APIRouter()

@router.get("/dashboard/summary")
async def get_dashboard_summary():
    aws_findings = scan_s3_buckets()
    github_findings = scan_github_repos()
    all_findings = aws_findings + github_findings
    
    return {
        "posture_score": max(0, 100 - len(all_findings) * 5),
        "critical_risks_count": len([f for f in all_findings if f["severity"] == "Critical"]),
        "high_risks_count": len([f for f in all_findings if f["severity"] == "High"]),
        "top_findings": all_findings[:5] # Mocking Top 5
    }

@router.get("/findings")
async def list_findings():
    aws_findings = scan_s3_buckets()
    github_findings = scan_github_repos()
    return aws_findings + github_findings

@router.post("/findings/analyze")
async def ai_analyze_finding(title: str, source: str):
    # Mocking passing raw data
    raw_data = {"note": "Raw data fetched from DB normally"}
    analysis = analyze_finding(title, source, raw_data)
    return analysis

@router.post("/findings/remediate")
async def remediate_finding(title: str, source: str):
    analysis = analyze_finding(title, source, {})
    ticket = create_remediation_ticket(title, analysis)
    return ticket
