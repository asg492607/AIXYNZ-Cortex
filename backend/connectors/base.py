from abc import ABC, abstractmethod
from typing import List, Dict


class BaseConnector(ABC):
    """
    Abstract base class for all Cortex security connectors.
    Every connector must implement these four methods to be registered.
    """

    @abstractmethod
    def validate(self) -> bool:
        """
        Validate that credentials and configuration are correct.
        Returns True if the connector can successfully authenticate.
        Raises ConnectorValidationError on hard failure.
        """
        ...

    @abstractmethod
    def health(self) -> Dict:
        """
        Returns a health snapshot for this connector.
        Schema: {status: "ok"|"error", latency_ms: int, error: str|None}
        Should not raise — always return a dict.
        """
        ...

    @abstractmethod
    def metadata(self) -> Dict:
        """
        Returns static metadata about this connector.
        Schema: {name: str, version: str, provider: str, supported_finding_types: list[str]}
        """
        ...

    @abstractmethod
    def scan(self, org_id: str) -> List[Dict]:
        """
        Execute a full scan and return a list of raw finding dicts.
        Each finding must be compatible with build_finding() / finding_factory.
        Should not raise — return an empty list on failure and log the error.
        """
        ...


class ConnectorValidationError(Exception):
    """Raised when a connector's credentials or config are invalid."""
    pass
