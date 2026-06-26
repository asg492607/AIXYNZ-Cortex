from typing import Optional, Dict

def parse_github_webhook(payload: Dict, org_id: str) -> Optional[Dict]:
    """
    Parses a GitHub webhook payload (e.g., secret_scanning_alert, dependabot_alert)
    and converts it into a standardized Cortex Finding dictionary.
    Returns None if the payload is not a security event.
    """
    # Secret Scanning Alert
    if "alert" in payload and "secret_type" in payload.get("alert", {}):
        alert = payload["alert"]
        repo = payload.get("repository", {})
        action = payload.get("action")
        
        status = "open"
        if action in ["resolved", "fixed"]:
            status = "resolved"

        return {
            "org_id": org_id,
            "source": "github",
            "source_type": "webhook",
            "finding_type": "hardcoded_secret",
            "title": f"Secret exposed: {alert.get('secret_type')} in {repo.get('name')}",
            "description": f"A secret of type '{alert.get('secret_type')}' was committed. URL: {alert.get('html_url')}",
            "severity": "Critical",
            "risk_score": 95,
            "status": status,
            "external_finding_key": f"gh-secret-{alert.get('number')}-{repo.get('id')}",
            "asset": {
                "external_asset_id": str(repo.get('id', '')),
                "asset_type": "repository",
                "asset_name": repo.get('full_name', 'unknown_repo'),
                "provider": "github"
            },
            "raw_data": payload
        }
        
    # Dependabot Alert
    if "alert" in payload and "security_advisory" in payload.get("alert", {}):
        alert = payload["alert"]
        repo = payload.get("repository", {})
        action = payload.get("action")
        
        status = "open"
        if action in ["resolved", "fixed"]:
            status = "resolved"

        adv = alert.get("security_advisory", {})
        severity = adv.get("severity", "Medium").capitalize()
        if severity == "Moderate":
            severity = "Medium"

        return {
            "org_id": org_id,
            "source": "github",
            "source_type": "webhook",
            "finding_type": "vulnerable_dependency",
            "title": f"Vulnerability in {alert.get('dependency', {}).get('package', {}).get('name')}",
            "description": adv.get("summary", ""),
            "severity": severity,
            "risk_score": 80 if severity == "High" else 50,
            "status": status,
            "external_finding_key": f"gh-dependabot-{alert.get('number')}-{repo.get('id')}",
            "asset": {
                "external_asset_id": str(repo.get('id', '')),
                "asset_type": "repository",
                "asset_name": repo.get('full_name', 'unknown_repo'),
                "provider": "github"
            },
            "raw_data": payload
        }

    return None
