"""
Attack Graph Engine
-------------------
Builds a directed graph from the organization's assets and findings.
Nodes represent infrastructure entities; edges represent relationships.

Node types: S3Bucket, EC2Instance, IAMRole, IAMUser, Repository, SecurityGroup, Secret
Edge types:  Owns, CanAccess, Contains, Uses, DependsOn, ExposedBy
"""

from typing import Dict, List, Optional
from collections import deque

from services.firebase_client import get_findings, get_runtime_mode
from services.asset_service import get_assets


# ── Node & Edge Builders ────────────────────────────────────────────────────

def _make_node(asset: Dict, findings: List[Dict]) -> Dict:
    asset_id = asset.get("external_asset_id") or asset.get("id") or "unknown"
    linked_findings = [
        f for f in findings
        if f.get("asset_id") == asset_id
        or f.get("asset", {}).get("external_asset_id") == asset_id
    ]
    critical_count = sum(1 for f in linked_findings if f.get("severity") == "Critical")
    high_count = sum(1 for f in linked_findings if f.get("severity") == "High")

    risk_score = asset.get("risk_score", 0)
    risk_level = "low"
    if risk_score >= 80 or critical_count > 0:
        risk_level = "critical"
    elif risk_score >= 50 or high_count > 0:
        risk_level = "high"
    elif risk_score >= 25:
        risk_level = "medium"

    return {
        "id": asset_id,
        "label": asset.get("asset_name", asset_id),
        "type": asset.get("asset_type", "unknown"),
        "provider": asset.get("provider", "unknown"),
        "risk_score": risk_score,
        "risk_level": risk_level,
        "finding_count": len(linked_findings),
        "critical_findings": critical_count,
        "tags": asset.get("tags", {}),
    }


def _infer_edges(nodes: List[Dict], findings: List[Dict]) -> List[Dict]:
    """
    Infer relationships between nodes based on asset types and findings.
    This is a heuristic approach – in a real system edges would come from
    cloud provider IAM policies and network topology data.
    """
    edges = []
    edge_ids = set()

    node_map = {n["id"]: n for n in nodes}

    s3_nodes = [n for n in nodes if n["type"] == "S3Bucket"]
    ec2_nodes = [n for n in nodes if n["type"] == "EC2Instance"]
    iam_nodes = [n for n in nodes if n["type"] in ("IAMRole", "IAMUser")]
    repo_nodes = [n for n in nodes if n["type"] == "repository"]

    # EC2 → S3: EC2 instances commonly access S3 buckets
    for ec2 in ec2_nodes:
        for s3 in s3_nodes:
            eid = f"{ec2['id']}->{s3['id']}"
            if eid not in edge_ids:
                edges.append({
                    "id": eid,
                    "source": ec2["id"],
                    "target": s3["id"],
                    "type": "CanAccess",
                    "label": "can access",
                })
                edge_ids.add(eid)

    # IAM → EC2/S3: IAM roles/users own or can access instances and buckets
    for iam in iam_nodes:
        for target in ec2_nodes + s3_nodes:
            eid = f"{iam['id']}->{target['id']}"
            if eid not in edge_ids:
                edges.append({
                    "id": eid,
                    "source": iam["id"],
                    "target": target["id"],
                    "type": "Owns",
                    "label": "owns",
                })
                edge_ids.add(eid)

    # Repos → Secrets: findings of type hardcoded_secret connect repo to a secret node
    for f in findings:
        if f.get("finding_type") == "hardcoded_secret":
            # Try multiple fields to locate the parent asset node
            repo_asset_id = (
                f.get("asset", {}).get("external_asset_id")
                or f.get("asset_id")
            )
            if not repo_asset_id or repo_asset_id not in node_map:
                continue
            secret_node_id = f"secret-{f.get('id', 'unknown')}"
            # Create an ephemeral secret node
            if not any(n["id"] == secret_node_id for n in nodes):
                nodes.append({
                    "id": secret_node_id,
                    "label": f"Secret: {f.get('title', 'Exposed Secret')[:30]}",
                    "type": "Secret",
                    "provider": "github",
                    "risk_score": f.get("risk_score", 95),
                    "risk_level": "critical",
                    "finding_count": 1,
                    "critical_findings": 1,
                    "tags": {},
                })
            eid = f"{repo_asset_id}->{secret_node_id}"
            if eid not in edge_ids:
                edges.append({
                    "id": eid,
                    "source": repo_asset_id,
                    "target": secret_node_id,
                    "type": "ExposedBy",
                    "label": "exposes",
                })
                edge_ids.add(eid)

    return edges


# ── Public API ───────────────────────────────────────────────────────────────

def get_graph(org_id: str) -> Dict:
    """Returns the full attack graph with nodes and edges."""
    assets = get_assets(org_id)
    findings = get_findings(org_id)

    nodes = [_make_node(a, findings) for a in assets]
    edges = _infer_edges(nodes, findings)

    return {
        "nodes": nodes,
        "edges": edges,
        "meta": {
            "total_nodes": len(nodes),
            "total_edges": len(edges),
            "critical_nodes": sum(1 for n in nodes if n["risk_level"] == "critical"),
        }
    }


def get_blast_radius(org_id: str, asset_id: str) -> Dict:
    """
    BFS from the given asset node following outgoing edges.
    Returns all reachable nodes and the cumulative risk impact.
    """
    graph = get_graph(org_id)
    nodes_by_id = {n["id"]: n for n in graph["nodes"]}

    if asset_id not in nodes_by_id:
        return {"origin": asset_id, "reachable": [], "risk_impact": 0}

    # Build adjacency list
    adj: Dict[str, List[str]] = {}
    for edge in graph["edges"]:
        adj.setdefault(edge["source"], []).append(edge["target"])

    # BFS
    visited = set()
    queue = deque([asset_id])
    while queue:
        current = queue.popleft()
        if current in visited:
            continue
        visited.add(current)
        for neighbor in adj.get(current, []):
            if neighbor not in visited:
                queue.append(neighbor)

    visited.discard(asset_id)  # exclude origin itself
    reachable = [nodes_by_id[n] for n in visited if n in nodes_by_id]
    risk_impact = sum(n["risk_score"] for n in reachable)

    return {
        "origin": nodes_by_id.get(asset_id, {"id": asset_id}),
        "reachable": reachable,
        "reachable_count": len(reachable),
        "risk_impact": risk_impact,
    }


def get_attack_paths(org_id: str) -> List[Dict]:
    """
    Identifies high-risk attack paths by finding paths that originate
    from public/exposed nodes and reach high-value targets.
    Returns a ranked list of attack path summaries.
    """
    graph = get_graph(org_id)
    nodes_by_id = {n["id"]: n for n in graph["nodes"]}

    # Build adjacency list
    adj: Dict[str, List[str]] = {}
    for edge in graph["edges"]:
        adj.setdefault(edge["source"], []).append(edge["target"])

    # Entry points: exposed or critical-risk nodes
    entry_points = [n for n in graph["nodes"] if n["risk_level"] in ("critical", "high")]

    # High-value targets: IAM roles, secrets, or high-asset-count nodes
    targets = [n for n in graph["nodes"] if n["type"] in ("IAMRole", "Secret", "S3Bucket") and n["risk_level"] == "critical"]

    paths = []

    def dfs(current_id: str, path: List[str], visited: set):
        if len(path) > 5:  # max path length to prevent explosion
            return
        node = nodes_by_id.get(current_id)
        if not node:
            return
        # If we've reached a high-value target, record the path
        if node["type"] in ("IAMRole", "Secret") and len(path) > 1:
            path_nodes = [nodes_by_id[p] for p in path if p in nodes_by_id]
            total_risk = sum(n["risk_score"] for n in path_nodes)
            paths.append({
                "path": path_nodes,
                "length": len(path),
                "total_risk": total_risk,
                "entry": nodes_by_id.get(path[0], {}),
                "target": node,
            })
            return
        for neighbor in adj.get(current_id, []):
            if neighbor not in visited:
                dfs(neighbor, path + [neighbor], visited | {neighbor})

    for entry in entry_points[:10]:  # limit to top 10 entry points for perf
        dfs(entry["id"], [entry["id"]], {entry["id"]})

    # Sort by total_risk descending, deduplicate
    paths.sort(key=lambda p: p["total_risk"], reverse=True)
    return paths[:10]
