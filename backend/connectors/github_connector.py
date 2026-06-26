import time
import logging
from typing import Dict, List

from connectors.base import BaseConnector
from services.github_scanner import scan_github_repos

logger = logging.getLogger(__name__)


class GitHubConnector(BaseConnector):
    """
    Connector wrapping the existing GitHub scanner.
    Token is sourced from the org integration config or GITHUB_TOKEN env var.
    """

    def __init__(self, integration_config: Dict = None):
        self.integration_config = integration_config or {}

    def metadata(self) -> Dict:
        return {
            "name": "GitHub Security Scanner",
            "version": "1.0.0",
            "provider": "github",
            "supported_finding_types": [
                "public_repository",
                "github_branch_protection_unverified",
                "unverified_commit_signatures",
            ]
        }

    def validate(self) -> bool:
        try:
            import os
            from github import Github
            token = (
                self.integration_config.get("github_token")
                or os.environ.get("GITHUB_TOKEN", "")
            )
            if not token:
                return False
            g = Github(token)
            g.get_user().login
            return True
        except Exception as e:
            logger.warning(f"[GitHubConnector] Validation failed: {e}")
            return False

    def health(self) -> Dict:
        start = time.time()
        try:
            ok = self.validate()
            return {
                "status": "ok" if ok else "error",
                "latency_ms": round((time.time() - start) * 1000),
                "error": None if ok else "Token invalid or missing"
            }
        except Exception as e:
            return {
                "status": "error",
                "latency_ms": round((time.time() - start) * 1000),
                "error": str(e)
            }

    def scan(self, org_id: str) -> List[Dict]:
        try:
            return scan_github_repos(org_id)
        except Exception as e:
            logger.error(f"[GitHubConnector] scan() failed for org={org_id}: {e}")
            return []
