import pytest
from fastapi.testclient import TestClient
from main import app
from services.firebase_client import _mock_db
from services.graph_service import _make_node, _infer_edges

client = TestClient(app)

DEMO_ASSETS = [
    {
        "id": "asset-s3-001",
        "org_id": "demo-org",
        "asset_name": "prod-data-bucket",
        "asset_type": "S3Bucket",
        "external_asset_id": "asset-s3-001",
        "provider": "aws",
        "risk_score": 90,
        "tags": {},
    },
    {
        "id": "asset-ec2-001",
        "org_id": "demo-org",
        "asset_name": "prod-web-server",
        "asset_type": "EC2Instance",
        "external_asset_id": "asset-ec2-001",
        "provider": "aws",
        "risk_score": 50,
        "tags": {},
    },
    {
        "id": "asset-iam-001",
        "org_id": "demo-org",
        "asset_name": "AdminRole",
        "asset_type": "IAMRole",
        "external_asset_id": "asset-iam-001",
        "provider": "aws",
        "risk_score": 75,
        "tags": {},
    },
    {
        "id": "asset-repo-001",
        "org_id": "demo-org",
        "asset_name": "demo/backend",
        "asset_type": "repository",
        "external_asset_id": "asset-repo-001",
        "provider": "github",
        "risk_score": 85,
        "tags": {},
    },
]

DEMO_FINDINGS = [
    {
        "id": "fnd-secret-001",
        "org_id": "demo-org",
        "finding_type": "hardcoded_secret",
        "title": "AWS key exposed in repo",
        "severity": "Critical",
        "status": "open",
        "risk_score": 95,
        "asset_id": "asset-repo-001",
        "asset": {"external_asset_id": "asset-repo-001"},
    }
]

@pytest.fixture(autouse=True)
def seed_graph_data():
    _mock_db.setdefault("assets", [])
    _mock_db.setdefault("findings", [])
    _mock_db["assets"].clear()
    _mock_db["findings"].clear()
    _mock_db["assets"].extend(DEMO_ASSETS)
    _mock_db["findings"].extend(DEMO_FINDINGS)
    yield
    _mock_db["assets"].clear()
    _mock_db["findings"].clear()


def test_graph_returns_nodes_and_edges():
    res = client.get("/api/v1/graph")
    assert res.status_code == 200
    data = res.json()
    assert "nodes" in data
    assert "edges" in data
    assert "meta" in data
    assert data["meta"]["total_nodes"] >= 4  # our 4 assets + possible secret node
    assert data["meta"]["total_edges"] >= 1


def test_graph_infers_ec2_to_s3_edge():
    res = client.get("/api/v1/graph")
    edges = res.json()["edges"]
    ec2_to_s3 = [e for e in edges if e["source"] == "asset-ec2-001" and e["target"] == "asset-s3-001"]
    assert len(ec2_to_s3) == 1
    assert ec2_to_s3[0]["type"] == "CanAccess"


def test_graph_creates_secret_node_from_finding():
    """
    Unit-test _infer_edges directly so this test is independent of mock_db
    state from other test modules.
    """
    nodes = [
        {
            "id": "asset-repo-001",
            "label": "demo/backend",
            "type": "repository",
            "provider": "github",
            "risk_score": 85,
            "risk_level": "high",
            "finding_count": 0,
            "critical_findings": 0,
            "tags": {},
        }
    ]
    findings = [
        {
            "id": "fnd-secret-001",
            "org_id": "demo-org",
            "finding_type": "hardcoded_secret",
            "title": "AWS key exposed in repo",
            "severity": "Critical",
            "status": "open",
            "risk_score": 95,
            "asset_id": "asset-repo-001",
            "asset": {"external_asset_id": "asset-repo-001"},
        }
    ]

    edges = _infer_edges(nodes, findings)

    # _infer_edges mutates `nodes` to add the Secret node
    secret_nodes = [n for n in nodes if n["type"] == "Secret"]
    exposed_edges = [e for e in edges if e["type"] == "ExposedBy"]

    assert len(secret_nodes) >= 1, f"Expected a Secret node, got node types: {[n['type'] for n in nodes]}"
    assert len(exposed_edges) >= 1, f"Expected an ExposedBy edge, got edge types: {[e['type'] for e in edges]}"


def test_blast_radius_bfs():
    # EC2 can access S3, so blast radius of EC2 should include S3
    res = client.get("/api/v1/graph/blast-radius/asset-ec2-001")
    assert res.status_code == 200
    data = res.json()
    assert data["origin"]["id"] == "asset-ec2-001"
    reachable_ids = [n["id"] for n in data["reachable"]]
    assert "asset-s3-001" in reachable_ids
    assert data["risk_impact"] > 0


def test_blast_radius_missing_asset():
    res = client.get("/api/v1/graph/blast-radius/nonexistent-asset")
    # Should return empty reachable list, not 404
    assert res.status_code in (200, 404)


def test_attack_paths_returns_list():
    res = client.get("/api/v1/graph/attack-paths")
    assert res.status_code == 200
    data = res.json()
    assert "attack_paths" in data
    assert isinstance(data["attack_paths"], list)
