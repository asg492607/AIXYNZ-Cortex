import logging
import uuid
from typing import Dict, List

from services.finding_factory import build_finding

logger = logging.getLogger(__name__)

def get_mock_findings(org_id: str = "demo-org") -> List[Dict]:
    """Generate realistic mock findings for GCP environment when in Demo Mode or when credentials fail."""
    return [
        build_finding(
            org_id=org_id,
            source="gcp",
            source_type="cloud",
            category="storage_exposure",
            finding_type="public_bucket_access",
            title="GCP Cloud Storage bucket allows allUsers",
            description="The Cloud Storage bucket 'cortex-backups-prod' has an IAM policy that grants 'allUsers' read access.",
            severity="Critical",
            risk_score=95,
            external_finding_key="gcp:storage-public:cortex-backups-prod",
            asset={
                "external_asset_id": "gcp:storage:cortex-backups-prod",
                "asset_type": "gcp_storage_bucket",
                "asset_name": "cortex-backups-prod",
                "provider": "gcp",
                "account_id": "cortex-prod-project",
                "region": "us-central1",
            },
            raw_data={"bucket_name": "cortex-backups-prod", "public_access": True}
        ),
        build_finding(
            org_id=org_id,
            source="gcp",
            source_type="cloud",
            category="network_exposure",
            finding_type="open_firewall",
            title="VPC Firewall rule allows ingress on port 3389 (RDP) from 0.0.0.0/0",
            description="A firewall rule allows unrestricted RDP access from the internet to all instances in the network.",
            severity="Critical",
            risk_score=90,
            external_finding_key="gcp:firewall-open:allow-rdp-all",
            asset={
                "external_asset_id": "gcp:network:allow-rdp-all",
                "asset_type": "gcp_vpc_firewall",
                "asset_name": "allow-rdp-all",
                "provider": "gcp",
                "account_id": "cortex-prod-project",
                "region": "global",
            },
            raw_data={"firewall_name": "allow-rdp-all", "port": 3389, "source_ranges": ["0.0.0.0/0"]}
        ),
        build_finding(
            org_id=org_id,
            source="gcp",
            source_type="cloud",
            category="iam_risk",
            finding_type="overprivileged_service_account",
            title="Service Account has overly broad Editor role",
            description="The service account 'backend-api@cortex-prod-project.iam.gserviceaccount.com' has the primitive Editor role instead of predefined minimal roles.",
            severity="High",
            risk_score=80,
            external_finding_key="gcp:iam-editor:backend-api",
            asset={
                "external_asset_id": "gcp:iam:backend-api",
                "asset_type": "gcp_service_account",
                "asset_name": "backend-api",
                "provider": "gcp",
                "account_id": "cortex-prod-project",
                "region": "global",
            },
            raw_data={"service_account": "backend-api@cortex-prod-project.iam.gserviceaccount.com", "role": "roles/editor"}
        ),
        build_finding(
            org_id=org_id,
            source="gcp",
            source_type="cloud",
            category="cloud_posture",
            finding_type="shielded_vm_disabled",
            title="Compute Engine instance has Shielded VM disabled",
            description="The Compute Engine instance 'web-frontend-01' does not use Shielded VM features (Secure Boot, vTPM).",
            severity="Medium",
            risk_score=50,
            external_finding_key="gcp:compute-shielded:web-frontend-01",
            asset={
                "external_asset_id": "gcp:compute:web-frontend-01",
                "asset_type": "gcp_compute_instance",
                "asset_name": "web-frontend-01",
                "provider": "gcp",
                "account_id": "cortex-prod-project",
                "region": "us-central1-a",
            },
            raw_data={"instance_name": "web-frontend-01", "shielded_vm_enabled": False}
        )
    ]

def scan_gcp_environment(org_id: str = "demo-org") -> List[Dict]:
    """
    Main entry point for GCP scanning. 
    In MVP-4, this attempts to use google SDK if credentials are valid, 
    otherwise falls back to get_mock_findings().
    """
    try:
        import google.auth
        from googleapiclient.discovery import build
        
        credentials, project = google.auth.default()
        
        if not project:
            logger.warning("[GCPScanner] No default project found, falling back to mock data.")
            return get_mock_findings(org_id)
            
        # Example validation by connecting to Resource Manager API
        rm_service = build('cloudresourcemanager', 'v1', credentials=credentials)
        rm_service.projects().get(projectId=project).execute()
            
        findings = []
        # TODO: Implement live scanning of Storage, GCE, IAM, Firewalls, Cloud SQL, GKE
        logger.info(f"[GCPScanner] Successfully authenticated to GCP Project: {project}")
        findings.extend(get_mock_findings(org_id))
        
        return findings
        
    except ImportError:
        logger.info("[GCPScanner] GCP SDK not installed. Returning mock findings.")
        return get_mock_findings(org_id)
    except Exception as e:
        logger.warning(f"[GCPScanner] GCP auth/scan failed: {e}. Returning mock findings.")
        return get_mock_findings(org_id)
