from fastapi import APIRouter, HTTPException

from services.graph_service import get_graph, get_blast_radius, get_attack_paths

router = APIRouter()


@router.get("/graph")
def graph_overview(org_id: str = "demo-org"):
    """Returns the full attack graph: all nodes and edges."""
    return get_graph(org_id)


@router.get("/graph/blast-radius/{asset_id}")
def blast_radius(asset_id: str, org_id: str = "demo-org"):
    """
    Returns all nodes reachable from the given asset and the cumulative risk impact.
    Useful for understanding the blast radius of an exposed or compromised asset.
    """
    result = get_blast_radius(org_id, asset_id)
    if not result.get("origin"):
        raise HTTPException(status_code=404, detail="Asset not found in graph")
    return result


@router.get("/graph/attack-paths")
def attack_paths(org_id: str = "demo-org"):
    """
    Returns the top ranked attack paths across the organization.
    Each path represents a chain of reachable nodes from an exposed entry point
    to a high-value target (IAM Role, Secret, critical S3).
    """
    paths = get_attack_paths(org_id)
    return {"attack_paths": paths, "count": len(paths)}
