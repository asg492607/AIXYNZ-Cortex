from services.aws_scanner import scan_aws_environment
from services.github_scanner import scan_github_repos # Note: using old name for now until next pass
from services.firebase_client import get_runtime_mode, upsert_finding, get_findings, get_db, _mock_db, utc_now
from services.notification_service import notify_new_finding
import uuid

def log_scan_run(org_id: str, status: str, new_or_updated: int, error_message: str = None) -> dict:
    scan_log = {
        "id": f"scan_{uuid.uuid4().hex[:8]}",
        "org_id": org_id,
        "status": status,
        "timestamp": utc_now(),
        "new_or_updated_count": new_or_updated,
        "error_message": error_message,
    }
    
    if get_runtime_mode() == "demo":
        _mock_db["scan_logs"].append(scan_log)
        return scan_log
        
    db = get_db()
    if db:
        db.collection("scan_logs").document(scan_log["id"]).set(scan_log)
    return scan_log

def run_full_scan(org_id: str = "demo-org") -> dict:
    try:
        aws_findings = scan_aws_environment(org_id)
        github_findings = scan_github_repos(org_id)
        
        all_findings = aws_findings + github_findings

        saved_ids = []
        for finding in all_findings:
            if not finding.get("org_id"):
                finding["org_id"] = org_id
            fid = upsert_finding(finding)
            saved_ids.append(fid)
            # Only notify if it's high severity (simplification for MVP)
            if finding.get("severity") in ["Critical", "High"]:
                notify_new_finding(org_id, finding)

        findings = get_findings(org_id)
        
        log_scan_run(org_id, "success", len(saved_ids))
        
        return {
            "mode": get_runtime_mode(),
            "org_id": org_id,
            "findings_count": len(findings),
            "new_or_updated": len(saved_ids),
            "findings": findings,
        }
    except Exception as e:
        log_scan_run(org_id, "failed", 0, str(e))
        raise e
