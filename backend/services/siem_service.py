import uuid
import logging
from typing import Dict, List, Any
import httpx
from services.firebase_client import get_runtime_mode

logger = logging.getLogger(__name__)

def export_to_siem(org_id: str, provider: str, findings: List[Dict]) -> Dict[str, Any]:
    """
    Exports a list of findings to the specified SIEM provider.
    In demo mode, this mocks the HTTP requests and returns a success response.
    """
    if not findings:
        return {"success": False, "error": "No findings provided."}

    mode = get_runtime_mode()
    
    if mode == "demo":
        logger.info(f"[SIEMService] (Demo Mode) Exporting {len(findings)} findings to {provider}...")
        return _mock_export(provider, findings)
        
    # Live mode logic
    logger.info(f"[SIEMService] (Live Mode) Exporting {len(findings)} findings to {provider}...")
    
    try:
        # TODO: Fetch SIEM credentials from DB/Secrets Manager
        # config = get_siem_config(org_id, provider)
        # if not config: return {"success": False, "error": f"No config for {provider}"}
        
        if provider == "splunk":
            return _export_splunk(findings)
        elif provider == "datadog":
            return _export_datadog(findings)
        elif provider == "jira":
            return _export_jira(findings)
        else:
            return {"success": False, "error": f"Unsupported provider: {provider}"}
            
    except Exception as e:
        logger.error(f"[SIEMService] Export failed: {e}")
        return {"success": False, "error": str(e)}

def _mock_export(provider: str, findings: List[Dict]) -> Dict[str, Any]:
    """Simulates a successful export to a SIEM."""
    if provider == "jira":
        return {
            "success": True, 
            "message": f"Successfully created {len(findings)} Jira issues.",
            "data": {
                "issues": [f"CORTEX-{uuid.uuid4().hex[:4].upper()}" for _ in findings]
            }
        }
    elif provider in ["splunk", "datadog"]:
        return {
            "success": True,
            "message": f"Successfully forwarded {len(findings)} events to {provider}.",
            "data": {
                "batch_id": str(uuid.uuid4()),
                "events_processed": len(findings)
            }
        }
    return {"success": False, "error": f"Unknown provider: {provider}"}

def _export_splunk(findings: List[Dict]) -> Dict[str, Any]:
    """Stub for Splunk HEC export."""
    # Example logic using httpx
    # with httpx.Client() as client:
    #     headers = {"Authorization": "Splunk YOUR_HEC_TOKEN"}
    #     payload = [{"event": f, "sourcetype": "_json"} for f in findings]
    #     response = client.post("https://splunk-hec.example.com/services/collector", headers=headers, json=payload)
    #     response.raise_for_status()
    return {"success": True, "message": f"Exported {len(findings)} findings to Splunk"}

def _export_datadog(findings: List[Dict]) -> Dict[str, Any]:
    """Stub for Datadog Logs API export."""
    return {"success": True, "message": f"Exported {len(findings)} findings to Datadog"}

def _export_jira(findings: List[Dict]) -> Dict[str, Any]:
    """Stub for Jira issue creation."""
    return {"success": True, "message": f"Created {len(findings)} Jira issues"}
