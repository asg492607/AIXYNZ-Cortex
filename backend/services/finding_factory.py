from datetime import datetime, timezone

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
    raw_data: dict | None = None,
    remediation: dict | None = None,
    integration_id: str | None = None,
    confidence: str | None = None,
    scanner_metadata: dict | None = None,
) -> dict:
    now = datetime.now(timezone.utc).isoformat()

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
        "external_finding_key": external_finding_key,
        "asset": asset,
        "raw_data": raw_data or {},
        "remediation": remediation or {},
        "integration_id": integration_id,
        "confidence": confidence,
        "scanner_metadata": scanner_metadata or {},
        "detected_at": now,
        "updated_at": now,
    }
