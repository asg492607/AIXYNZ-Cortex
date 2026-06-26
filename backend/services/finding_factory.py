from datetime import datetime, timezone
from services.firebase_client import utc_now
from services.compliance_service import get_compliance_mappings

def build_finding(
    *,
    org_id: str,
    source: str,
    source_type: str,
    category: str,
    finding_type: str,
    title: str,
    description: str,
    severity: str,
    risk_score: int,
    external_finding_key: str,
    asset: dict,
    asset_id: str | None = None,
    raw_data: dict | None = None,
    remediation: dict | None = None,
    integration_id: str | None = None,
    confidence: str | None = "high",
    scanner_metadata: dict | None = None,
) -> dict:
    now = datetime.now(timezone.utc).isoformat()

    provider = asset.get("provider", source)
    compliance_mappings = get_compliance_mappings(provider, finding_type)

    return {
        "org_id": org_id,
        "source": source,
        "source_type": source_type,
        "category": category,
        "finding_type": finding_type,
        "title": title,
        "description": description,
        "severity": severity,
        "risk_score": risk_score,
        "status": "open",
        "owner": "unassigned",
        "due_date": None,
        "resolved_at": None,
        "ignored_reason": None,
        "external_finding_key": external_finding_key,
        "asset_id": asset_id,
        "asset": asset,
        "compliance": compliance_mappings,
        "raw_data": raw_data or {},
        "remediation": remediation or {},
        "integration_id": integration_id,
        "confidence": confidence,
        "scanner_metadata": scanner_metadata or {},
        "detected_at": now,
        "updated_at": now,
    }
