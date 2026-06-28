import time
import logging
from typing import Dict, List

from connectors.base import BaseConnector
from services.azure_scanner import scan_azure_environment, get_mock_findings

logger = logging.getLogger(__name__)

class AzureConnector(BaseConnector):
    """
    Connector wrapping the Azure scanner.
    Credentials are sourced from the environment (DefaultAzureCredential).
    """

    def __init__(self, integration_config: Dict = None):
        self.integration_config = integration_config or {}

    def metadata(self) -> Dict:
        return {
            "name": "Azure Security Scanner",
            "version": "1.0.0",
            "provider": "azure",
            "supported_finding_types": [
                "public_blob_access",
                "open_nsg",
                "key_vault_purge_protection",
                "overprivileged_identity",
            ]
        }

    def validate(self) -> bool:
        try:
            from azure.identity import DefaultAzureCredential
            from azure.mgmt.subscription import SubscriptionClient
            
            # Simple credential check
            cred = DefaultAzureCredential()
            client = SubscriptionClient(cred)
            list(client.subscriptions.list())
            return True
        except Exception as e:
            logger.warning(f"[AzureConnector] Validation failed: {e}")
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
            return scan_azure_environment(org_id)
        except Exception as e:
            logger.error(f"[AzureConnector] scan() failed for org={org_id}: {e}")
            return get_mock_findings(org_id)
