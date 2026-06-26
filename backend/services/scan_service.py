import time
import uuid
import logging

from services.firebase_client import get_runtime_mode, upsert_finding, get_findings, get_db, _mock_db, utc_now
from services.notification_service import notify_new_finding
from services.asset_service import upsert_asset, calculate_asset_risk_scores

logger = logging.getLogger(__name__)


def log_scan_run(org_id: str, status: str, new_or_updated: int,
                 duration_ms: int = 0, error_message: str = None) -> dict:
    scan_log = {
        "id": f"scan_{uuid.uuid4().hex[:8]}",
        "org_id": org_id,
        "status": status,
        "timestamp": utc_now(),
        "new_or_updated_count": new_or_updated,
        "duration_ms": duration_ms,
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
    """
    Main scan entrypoint. Uses ConnectorRegistry to dispatch scans
    across all configured providers. Compatible as an RQ job function.
    """
    start_ms = time.time()
    try:
        from connectors.registry import get_registry_for_org
        registry = get_registry_for_org(org_id)
        all_findings = registry.run_all_scans()

        saved_ids = []
        notified_keys = set()

        for finding in all_findings:
            if not finding.get("org_id"):
                finding["org_id"] = org_id

            # Upsert asset and link it to this finding
            asset_data = finding.get("asset")
            if asset_data:
                asset_id = upsert_asset(org_id, asset_data)
                finding["asset_id"] = asset_id

            fid = upsert_finding(finding)
            saved_ids.append(fid)

            # Only notify high/critical findings, once per key per scan run
            ext_key = finding.get("external_finding_key", fid)
            if finding.get("severity") in ["Critical", "High"] and ext_key not in notified_keys:
                notify_new_finding(org_id, finding)
                notified_keys.add(ext_key)

        calculate_asset_risk_scores(org_id)
        findings = get_findings(org_id)
        duration_ms = round((time.time() - start_ms) * 1000)

        log_scan_run(org_id, "success", len(saved_ids), duration_ms=duration_ms)
        logger.info(f"[scan_service] Scan complete for org={org_id}: {len(saved_ids)} findings in {duration_ms}ms")

        return {
            "mode": get_runtime_mode(),
            "org_id": org_id,
            "findings_count": len(findings),
            "new_or_updated": len(saved_ids),
            "duration_ms": duration_ms,
            "findings": findings,
        }
    except Exception as e:
        duration_ms = round((time.time() - start_ms) * 1000)
        log_scan_run(org_id, "failed", 0, duration_ms=duration_ms, error_message=str(e))
        logger.error(f"[scan_service] Scan failed for org={org_id}: {e}")
        raise e
