import logging
from typing import Dict, Any, Tuple

logger = logging.getLogger(__name__)

# Base score mapped to CVSS-like equivalents
SEVERITY_BASE = {
    "Critical": 90,
    "High": 75,
    "Medium": 50,
    "Low": 25,
    "Info": 10
}

def analyze_asset_criticality(asset_name: str, asset_type: str) -> Tuple[float, str]:
    """
    Heuristic to determine asset criticality multiplier based on naming conventions and types.
    Returns (multiplier, reason).
    """
    name_lower = (asset_name or "").lower()
    
    if "prod" in name_lower or "production" in name_lower:
        return 1.2, "Production Environment (+20%)"
    if "db" in name_lower or "database" in name_lower or "sql" in name_lower:
        return 1.15, "Data Store (+15%)"
    if asset_type in ["IAMRole", "ManagedIdentity", "k8s_cluster_role", "gcp_service_account"]:
        return 1.1, "Identity/Privileged Asset (+10%)"
    if "dev" in name_lower or "test" in name_lower or "stage" in name_lower:
        return 0.8, "Non-Production Environment (-20%)"
        
    return 1.0, "Standard Criticality"

def analyze_exposure(finding: Dict[str, Any]) -> Tuple[float, str]:
    """
    Heuristic to determine exposure/exploitability multiplier based on finding context.
    Returns (multiplier, reason).
    """
    title = (finding.get("title") or "").lower()
    desc = (finding.get("description") or "").lower()
    raw_data = finding.get("raw_data", {})
    
    # Check for public exposure indicators
    if "public" in title or "publicly" in desc or "0.0.0.0/0" in desc or raw_data.get("public_access", False):
        return 1.25, "Publicly Accessible (+25%)"
        
    # Check for unencrypted sensitive data
    if "unencrypted" in title or "plaintext" in desc or "secret" in title:
        return 1.1, "Sensitive Data Exposure (+10%)"
        
    return 1.0, "Internal/Standard Exposure"

def calculate_risk_score(finding: Dict[str, Any]) -> Dict[str, Any]:
    """
    Calculates a dynamic risk score (0-100) and appends a breakdown to the finding.
    Mutates the finding in place and returns it.
    """
    severity = finding.get("severity", "Low")
    base_score = SEVERITY_BASE.get(severity, 25)
    
    asset = finding.get("asset", {})
    asset_name = asset.get("asset_name") or asset.get("external_asset_id") or ""
    asset_type = asset.get("asset_type") or ""
    
    crit_multiplier, crit_reason = analyze_asset_criticality(asset_name, asset_type)
    exp_multiplier, exp_reason = analyze_exposure(finding)
    
    final_score = int(base_score * crit_multiplier * exp_multiplier)
    final_score = min(max(final_score, 0), 100) # Clamp between 0 and 100
    
    finding["risk_score"] = final_score
    finding["risk_factors"] = {
        "base_severity": f"{severity} ({base_score})",
        "asset_criticality": crit_reason,
        "exposure": exp_reason,
        "formula": f"min(100, {base_score} × {crit_multiplier} × {exp_multiplier})"
    }
    
    # If the score crossed a threshold, we could dynamically adjust the severity string here,
    # but for UI consistency we'll keep the original vendor severity and just use the dynamic score.
    
    return finding
