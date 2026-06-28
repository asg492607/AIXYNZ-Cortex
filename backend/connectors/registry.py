import logging
from typing import List, Dict

from connectors.base import BaseConnector
from connectors.aws_connector import AWSConnector
from connectors.github_connector import GitHubConnector
from connectors.azure_connector import AzureConnector

logger = logging.getLogger(__name__)

# Built-in connector classes by provider name
_CONNECTOR_CLASSES = {
    "aws": AWSConnector,
    "github": GitHubConnector,
    "azure": AzureConnector,
}


class ConnectorRegistry:
    """
    Per-org connector registry.
    Loads enabled connectors from integration configs and dispatches scans.
    """

    def __init__(self, org_id: str, integrations: List[Dict] = None):
        self.org_id = org_id
        self._connectors: List[BaseConnector] = []
        self._load(integrations or [])

    def _load(self, integrations: List[Dict]):
        """Load connectors from org integration configs, falling back to defaults."""
        loaded_providers = set()

        for integration in integrations:
            provider = integration.get("provider", "").lower()
            if provider in _CONNECTOR_CLASSES and provider not in loaded_providers:
                cls = _CONNECTOR_CLASSES[provider]
                connector = cls(integration_config=integration)
                self._connectors.append(connector)
                loaded_providers.add(provider)
                logger.info(f"[ConnectorRegistry] Loaded {provider} connector for org={self.org_id}")

        # If no integrations configured, load all connectors with default (env-based) creds
        if not self._connectors:
            logger.info(f"[ConnectorRegistry] No integrations found for org={self.org_id}, using default connectors")
            for provider, cls in _CONNECTOR_CLASSES.items():
                self._connectors.append(cls())

    def get_connectors(self) -> List[BaseConnector]:
        return self._connectors

    def health_check(self) -> List[Dict]:
        results = []
        for connector in self._connectors:
            meta = connector.metadata()
            health = connector.health()
            results.append({
                "name": meta["name"],
                "provider": meta["provider"],
                **health
            })
        return results

    def run_all_scans(self) -> List[Dict]:
        """
        Run every registered connector and merge all findings.
        Failures in individual connectors are isolated — others continue.
        """
        all_findings = []
        for connector in self._connectors:
            meta = connector.metadata()
            provider = meta.get("provider", "unknown")
            try:
                findings = connector.scan(self.org_id)
                logger.info(f"[ConnectorRegistry] {provider} scan complete: {len(findings)} findings for org={self.org_id}")
                all_findings.extend(findings)
            except Exception as e:
                logger.error(f"[ConnectorRegistry] {provider} scan failed for org={self.org_id}: {e}")
        return all_findings


def get_registry_for_org(org_id: str) -> ConnectorRegistry:
    """Build a ConnectorRegistry using the org's configured integrations."""
    from services.firebase_client import get_runtime_mode, _mock_db, get_db
    
    if get_runtime_mode() == "demo":
        integrations = [i for i in _mock_db.get("integrations", []) if i.get("org_id") == org_id]
    else:
        db = get_db()
        if db:
            docs = db.collection("integrations").where("org_id", "==", org_id).stream()
            integrations = [doc.to_dict() for doc in docs]
        else:
            integrations = []

    return ConnectorRegistry(org_id, integrations)
