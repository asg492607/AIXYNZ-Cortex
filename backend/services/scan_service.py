from services.aws_scanner import scan_aws_environment
from services.github_scanner import scan_github_repos # Note: using old name for now until next pass
from services.firebase_client import get_runtime_mode, upsert_finding, get_findings

def run_full_scan(org_id: str = "demo-org") -> dict:
    aws_findings = scan_aws_environment(org_id)
    github_findings = scan_github_repos(org_id)
    
    all_findings = aws_findings + github_findings

    saved_ids = []
    for finding in all_findings:
        finding["org_id"] = org_id
        saved_ids.append(upsert_finding(finding))

    findings = get_findings(org_id)
    return {
        "mode": get_runtime_mode(),
        "org_id": org_id,
        "findings_count": len(findings),
        "new_or_updated": len(saved_ids),
        "findings": findings,
    }
