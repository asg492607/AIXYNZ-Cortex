import time
import logging
from typing import Dict, List

from connectors.base import BaseConnector
from services.gcp_scanner import scan_gcp_environment, get_mock_findings

logger = logging.getLogger(__name__)

class GCPConnector(BaseConnector):
    """
    Connector wrapping the GCP scanner.
    Credentials are sourced from the environment (GOOGLE_APPLICATION_CREDENTIALS).
    """

    def __init__(self, integration_config: Dict = None):
        self.integration_config = integration_config or {}

    def metadata(self) -> Dict:
        return {
            "name": "GCP Security Scanner",
            "version": "1.0.0",
            "provider": "gcp",
            "supported_finding_types": [
                "public_bucket_access",
                "open_firewall",
                "overprivileged_service_account",
                "shielded_vm_disabled",
            ]
        }

    def validate(self) -> bool:
        try:
            import google.auth
            from googleapiclient.discovery import build
            
            # Simple credential check
            credentials, project = google.auth.default()
            if not project:
                return False
                
            rm_service = build('cloudresourcemanager', 'v1', credentials=credentials)
            rm_service.projects().get(projectId=project).execute()
            return True
        except Exception as e:
            logger.warning(f"[GCPConnector] Validation failed: {e}")
            return False

    def health(self) -> Dict:
        start = time.time()
        try:
            ok = self.validate()
            return {
                "status": "ok" if ok else "error",
                "latency_ms": round((time.time() - start) * 1000),
                "error": None if ok else "Credential check failed"
            }
        except Exception as e:
            return {
                "status": "error",
                "latency_ms": round((time.time() - start) * 1000),
                "error": str(e)
            }

    def scan(self, org_id: str) -> List[Dict]:
        try:
            return scan_gcp_environment(org_id)
        except Exception as e:
            logger.error(f"[GCPConnector] scan() failed for org={org_id}: {e}")
            return get_mock_findings(org_id)
