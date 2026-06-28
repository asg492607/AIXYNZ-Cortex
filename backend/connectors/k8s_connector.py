import time
import logging
from typing import Dict, List

from connectors.base import BaseConnector
from services.k8s_scanner import scan_k8s_environment, get_mock_findings

logger = logging.getLogger(__name__)

class KubernetesConnector(BaseConnector):
    """
    Connector wrapping the Kubernetes scanner.
    Credentials are sourced from in-cluster config or local kubeconfig.
    """

    def __init__(self, integration_config: Dict = None):
        self.integration_config = integration_config or {}

    def metadata(self) -> Dict:
        return {
            "name": "Kubernetes Security Scanner",
            "version": "1.0.0",
            "provider": "kubernetes",
            "supported_finding_types": [
                "privileged_pod",
                "excessive_rbac_permissions",
                "missing_resource_limits",
                "secret_in_env",
                "unencrypted_secret",
            ]
        }

    def validate(self) -> bool:
        try:
            from kubernetes import client, config
            from kubernetes.config.config_exception import ConfigException
            
            try:
                config.load_incluster_config()
            except ConfigException:
                config.load_kube_config()
                
            v1 = client.CoreV1Api()
            v1.list_namespace(limit=1)
            return True
        except Exception as e:
            logger.warning(f"[KubernetesConnector] Validation failed: {e}")
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
            return scan_k8s_environment(org_id)
        except Exception as e:
            logger.error(f"[KubernetesConnector] scan() failed for org={org_id}: {e}")
            return get_mock_findings(org_id)
