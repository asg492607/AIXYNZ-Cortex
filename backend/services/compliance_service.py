from typing import Dict, List

# Basic mappings for MVP-2
# In a real environment, this would be a larger dictionary or database lookup
COMPLIANCE_MAPPINGS = {
    "aws": {
        "public_s3_bucket": {
            "cis": ["CIS 1.2.0: 2.1.5", "CIS 1.4.0: 2.1.5"],
            "soc2": ["CC6.1", "CC6.6"],
            "iso27001": ["A.8.2.3", "A.13.1.1"]
        },
        "weak_s3_public_access_block": {
            "cis": ["CIS 1.4.0: 2.1.5"],
            "soc2": ["CC6.1"],
            "iso27001": ["A.8.2.3"]
        },
        "open_ssh_security_group": {
            "cis": ["CIS 1.4.0: 5.2"],
            "soc2": ["CC6.6"],
            "iso27001": ["A.13.1.1"]
        },
        "iam_admin_role": {
            "cis": ["CIS 1.4.0: 1.16"],
            "soc2": ["CC6.1"],
            "iso27001": ["A.9.2.1"]
        }
    },
    "github": {
        "public_repository": {
            "cis": ["CIS GitHub 1.0: 1.1.2"],
            "soc2": ["CC6.1"],
            "iso27001": ["A.8.2.3"]
        },
        "github_branch_protection_unverified": {
            "cis": ["CIS GitHub 1.0: 1.3"],
            "soc2": ["CC6.1"],
            "iso27001": []
        }
    }
}

def get_compliance_mappings(provider: str, finding_type: str) -> Dict[str, List[str]]:
    """
    Returns the CIS, SOC2, and ISO 27001 control mappings for a given provider and finding type.
    """
    provider_map = COMPLIANCE_MAPPINGS.get(provider, {})
    return provider_map.get(finding_type, {"cis": [], "soc2": [], "iso27001": []})
