import time
import logging
from fastapi import APIRouter, Depends
from typing import Dict

from services.firebase_client import get_runtime_mode, get_db
from services.auth_service import get_current_user

router = APIRouter()
logger = logging.getLogger(__name__)

_start_time = time.time()


@router.get("/health")
async def health():
    """Lightweight liveness check — no auth required."""
    return {
        "status": "ok",
        "mode": get_runtime_mode(),
        "uptime_seconds": round(time.time() - _start_time),
    }


@router.get("/health/deep")
async def deep_health():
    """
    Deep readiness check covering all subsystems.
    Returns degraded status if any subsystem is unhealthy.
    """
    results = {}

    # Database
    try:
        mode = get_runtime_mode()
        if mode == "demo":
            results["database"] = {"status": "ok", "mode": "demo (in-memory)"}
        else:
            db = get_db()
            if db:
                db.collection("organizations").limit(1).stream()
                results["database"] = {"status": "ok", "mode": "firestore"}
            else:
                results["database"] = {"status": "error", "error": "Firestore client unavailable"}
    except Exception as e:
        results["database"] = {"status": "error", "error": str(e)}

    # Redis / RQ
    try:
        import os
        import redis
        redis_url = os.environ.get("REDIS_URL", "redis://localhost:6379")
        conn = redis.from_url(redis_url, socket_connect_timeout=1)
        conn.ping()
        results["redis"] = {"status": "ok", "url": redis_url}
    except ImportError:
        results["redis"] = {"status": "not_configured", "note": "rq/redis not installed"}
    except Exception as e:
        results["redis"] = {"status": "error", "error": str(e)}

    # Connectors
    try:
        from connectors.registry import ConnectorRegistry
        registry = ConnectorRegistry("health-check")
        results["connectors"] = registry.health_check()
    except Exception as e:
        results["connectors"] = [{"status": "error", "error": str(e)}]

    # Overall status
    has_error = (
        results.get("database", {}).get("status") == "error"
    )
    overall = "degraded" if has_error else "ok"

    return {
        "status": overall,
        "mode": get_runtime_mode(),
        "uptime_seconds": round(time.time() - _start_time),
        "subsystems": results,
    }
