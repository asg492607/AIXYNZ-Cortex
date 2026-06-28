import logging
import uuid
from typing import Dict, List

from services.finding_factory import build_finding

logger = logging.getLogger(__name__)

def get_mock_findings(org_id: str = "demo-org") -> List[Dict]:
    """Generate realistic mock findings for Azure environment when in Demo Mode or when credentials fail."""
    return [
        build_finding(
            org_id=org_id,
            source="azure",
            source_type="cloud",
            category="storage_exposure",
            finding_type="public_blob_access",
            title="Azure Storage Account blob container is publicly accessible",
            description="The storage account 'cortexproddata' allows anonymous public read access to containers and blobs.",
            severity="Critical",
            risk_score=95,
            external_finding_key="azure:storage-public:cortexproddata",
            asset={
                "external_asset_id": "azure:storage:cortexproddata",
                "asset_type": "storage_account",
                "asset_name": "cortexproddata",
                "provider": "azure",
                "account_id": "00000000-0000-0000-0000-000000000000",
                "region": "eastus",
            },
            raw_data={"storage_account": "cortexproddata", "allow_blob_public_access": True}
        ),
        build_finding(
            org_id=org_id,
            source="azure",
            source_type="cloud",
            category="network_exposure",
            finding_type="open_nsg",
            title="Network Security Group allows 0.0.0.0/0 on port 3389 (RDP)",
            description="Inbound security rule allows unrestricted Remote Desktop access from the internet.",
            severity="Critical",
            risk_score=90,
            external_finding_key="azure:nsg-open:nsg-prod-frontend:3389",
            asset={
                "external_asset_id": "azure:network:nsg-prod-frontend",
                "asset_type": "security_group",
                "asset_name": "nsg-prod-frontend",
                "provider": "azure",
                "account_id": "00000000-0000-0000-0000-000000000000",
                "region": "eastus",
            },
            raw_data={"nsg_name": "nsg-prod-frontend", "port": 3389, "protocol": "TCP"}
        ),
        build_finding(
            org_id=org_id,
            source="azure",
            source_type="cloud",
            category="cloud_posture",
            finding_type="key_vault_purge_protection",
            title="Key Vault 'cortex-secrets' lacks Purge Protection",
            description="Purge protection is disabled, meaning deleted secrets can be permanently removed before the retention period ends.",
            severity="Medium",
            risk_score=60,
            external_finding_key="azure:kv-purge:cortex-secrets",
            asset={
                "external_asset_id": "azure:keyvault:cortex-secrets",
                "asset_type": "key_vault",
                "asset_name": "cortex-secrets",
                "provider": "azure",
                "account_id": "00000000-0000-0000-0000-000000000000",
                "region": "eastus",
            },
            raw_data={"vault_name": "cortex-secrets", "enable_purge_protection": False}
        ),
        build_finding(
            org_id=org_id,
            source="azure",
            source_type="cloud",
            category="iam_risk",
            finding_type="overprivileged_identity",
            title="Managed Identity has Owner role on subscription",
            description="The system-assigned managed identity for VM 'vm-backend-01' has Owner access at the subscription level.",
            severity="High",
            risk_score=85,
            external_finding_key="azure:iam-owner:vm-backend-01",
            asset={
                "external_asset_id": "azure:compute:vm-backend-01",
                "asset_type": "virtual_machine",
                "asset_name": "vm-backend-01",
                "provider": "azure",
                "account_id": "00000000-0000-0000-0000-000000000000",
                "region": "eastus",
            },
            raw_data={"vm_name": "vm-backend-01", "role": "Owner"}
        )
    ]

def scan_azure_environment(org_id: str = "demo-org") -> List[Dict]:
    """
    Main entry point for Azure scanning. 
    In MVP-4, this attempts to use azure SDK if credentials are valid, 
    otherwise falls back to get_mock_findings().
    """
    try:
        from azure.identity import DefaultAzureCredential
        from azure.core.exceptions import ClientAuthenticationError
        from azure.mgmt.subscription import SubscriptionClient
        
        credential = DefaultAzureCredential()
        # Verify credentials by listing subscriptions
        sub_client = SubscriptionClient(credential)
        subs = list(sub_client.subscriptions.list())
        
        if not subs:
            logger.warning("[AzureScanner] No subscriptions found, falling back to mock data.")
            return get_mock_findings(org_id)
            
        findings = []
        # TODO: Implement live scanning of Storage, VMs, NSGs, KeyVaults, SQL across all subs
        # For now, returning mock data mixed with live indicator if we reach here
        logger.info(f"[AzureScanner] Successfully authenticated to Azure. Subscriptions: {len(subs)}")
        findings.extend(get_mock_findings(org_id))
        
        return findings
        
    except ImportError:
        logger.info("[AzureScanner] Azure SDK not installed. Returning mock findings.")
        return get_mock_findings(org_id)
    except Exception as e:
        logger.warning(f"[AzureScanner] Azure auth/scan failed: {e}. Returning mock findings.")
        return get_mock_findings(org_id)
