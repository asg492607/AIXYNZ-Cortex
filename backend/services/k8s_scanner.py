import logging
import uuid
from typing import Dict, List

from services.finding_factory import build_finding

logger = logging.getLogger(__name__)

def get_mock_findings(org_id: str = "demo-org") -> List[Dict]:
    """Generate realistic mock findings for Kubernetes environment when in Demo Mode or when credentials fail."""
    return [
        build_finding(
            org_id=org_id,
            source="kubernetes",
            source_type="container",
            category="workload_security",
            finding_type="privileged_pod",
            title="Pod running with privileged security context",
            description="The pod 'redis-cache-pod' has securityContext.privileged=true, granting access to the host.",
            severity="Critical",
            risk_score=90,
            external_finding_key="k8s:pod-privileged:redis-cache-pod",
            asset={
                "external_asset_id": "k8s:pod:default:redis-cache-pod",
                "asset_type": "k8s_pod",
                "asset_name": "redis-cache-pod",
                "provider": "kubernetes",
                "account_id": "cluster-01",
                "region": "default",
            },
            raw_data={"pod_name": "redis-cache-pod", "namespace": "default", "privileged": True}
        ),
        build_finding(
            org_id=org_id,
            source="kubernetes",
            source_type="container",
            category="iam_risk",
            finding_type="excessive_rbac_permissions",
            title="ClusterRole grants excessive permissions",
            description="The ClusterRole 'developer-role' allows wildcard ('*') access to secrets and deployments.",
            severity="High",
            risk_score=85,
            external_finding_key="k8s:clusterrole-wildcard:developer-role",
            asset={
                "external_asset_id": "k8s:clusterrole:developer-role",
                "asset_type": "k8s_cluster_role",
                "asset_name": "developer-role",
                "provider": "kubernetes",
                "account_id": "cluster-01",
                "region": "global",
            },
            raw_data={"role_name": "developer-role", "rules": [{"apiGroups": ["*"], "resources": ["*"], "verbs": ["*"]}]}
        ),
        build_finding(
            org_id=org_id,
            source="kubernetes",
            source_type="container",
            category="workload_security",
            finding_type="missing_resource_limits",
            title="Deployment missing CPU/Memory limits",
            description="The deployment 'frontend-app' does not specify resource limits, risking node resource exhaustion.",
            severity="Low",
            risk_score=30,
            external_finding_key="k8s:deployment-limits:frontend-app",
            asset={
                "external_asset_id": "k8s:deployment:default:frontend-app",
                "asset_type": "k8s_deployment",
                "asset_name": "frontend-app",
                "provider": "kubernetes",
                "account_id": "cluster-01",
                "region": "default",
            },
            raw_data={"deployment_name": "frontend-app", "namespace": "default"}
        ),
        build_finding(
            org_id=org_id,
            source="kubernetes",
            source_type="container",
            category="secret_exposure",
            finding_type="secret_in_env",
            title="Secret injected as environment variable",
            description="The pod 'api-server' injects 'db-credentials' directly as environment variables instead of mounting as a volume.",
            severity="Medium",
            risk_score=60,
            external_finding_key="k8s:pod-env-secret:api-server",
            asset={
                "external_asset_id": "k8s:pod:default:api-server",
                "asset_type": "k8s_pod",
                "asset_name": "api-server",
                "provider": "kubernetes",
                "account_id": "cluster-01",
                "region": "default",
            },
            raw_data={"pod_name": "api-server", "namespace": "default", "secret_name": "db-credentials"}
        ),
        build_finding(
            org_id=org_id,
            source="kubernetes",
            source_type="container",
            category="secret_exposure",
            finding_type="unencrypted_secret",
            title="Kubernetes Secret lacks application-layer encryption",
            description="The secret 'db-credentials' is only base64 encoded and relies solely on etcd at-rest encryption.",
            severity="High",
            risk_score=75,
            external_finding_key="k8s:secret:db-credentials",
            asset={
                "external_asset_id": "k8s:secret:default:db-credentials",
                "asset_type": "k8s_secret",
                "asset_name": "db-credentials",
                "provider": "kubernetes",
                "account_id": "cluster-01",
                "region": "default",
            },
            raw_data={"secret_name": "db-credentials", "namespace": "default"}
        )
    ]

def scan_k8s_environment(org_id: str = "demo-org") -> List[Dict]:
    """
    Main entry point for Kubernetes scanning. 
    In MVP-4, this attempts to use the kubernetes SDK if in-cluster or kubeconfig is valid, 
    otherwise falls back to get_mock_findings().
    """
    try:
        from kubernetes import client, config
        from kubernetes.config.config_exception import ConfigException
        
        try:
            # Try in-cluster config first
            config.load_incluster_config()
            logger.info("[K8sScanner] Loaded in-cluster configuration.")
        except ConfigException:
            # Fall back to local kubeconfig
            try:
                config.load_kube_config()
                logger.info("[K8sScanner] Loaded local kubeconfig.")
            except ConfigException:
                logger.warning("[K8sScanner] No Kubernetes config found, falling back to mock data.")
                return get_mock_findings(org_id)
            
        v1 = client.CoreV1Api()
        # Verify connection by listing namespaces
        v1.list_namespace(limit=1)
            
        findings = []
        # TODO: Implement live scanning of Pods, Deployments, Roles, Secrets
        logger.info("[K8sScanner] Successfully connected to Kubernetes cluster.")
        findings.extend(get_mock_findings(org_id))
        
        return findings
        
    except ImportError:
        logger.info("[K8sScanner] Kubernetes SDK not installed. Returning mock findings.")
        return get_mock_findings(org_id)
    except Exception as e:
        logger.warning(f"[K8sScanner] K8s auth/scan failed: {e}. Returning mock findings.")
        return get_mock_findings(org_id)
