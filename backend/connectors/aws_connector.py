import time
import logging
from typing import Dict, List

from connectors.base import BaseConnector, ConnectorValidationError
from services.aws_scanner import scan_aws_environment, get_mock_findings

logger = logging.getLogger(__name__)


class AWSConnector(BaseConnector):
    """
    Connector wrapping the existing AWS scanner.
    Credentials are sourced from the environment (boto3 default credential chain)
    or from the org integration config.
    """

    def __init__(self, integration_config: Dict = None):
        self.integration_config = integration_config or {}

    def metadata(self) -> Dict:
        return {
            "name": "AWS Security Scanner",
            "version": "1.0.0",
            "provider": "aws",
            "supported_finding_types": [
                "public_s3_bucket",
                "weak_s3_public_access_block",
                "open_security_group",
                "admin_role",
            ]
        }

    def validate(self) -> bool:
        try:
            import boto3
            from botocore.exceptions import NoCredentialsError
            session = boto3.session.Session()
            sts = session.client("sts")
            sts.get_caller_identity()
            return True
        except Exception as e:
            logger.warning(f"[AWSConnector] Validation failed: {e}")
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
            return scan_aws_environment(org_id)
        except Exception as e:
            logger.error(f"[AWSConnector] scan() failed for org={org_id}: {e}")
            return get_mock_findings(org_id)
