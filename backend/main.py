import logging
import logging.config
import os
import time
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from api.routes import router as api_router
from api.auth_routes import router as auth_router
from api.organization_routes import router as org_router
from api.user_routes import router as user_router
from api.integration_routes import router as integration_router
from api.scan_routes import router as scan_router
from api.audit_routes import router as audit_router
from api.asset_routes import router as asset_router
from api.reporting_routes import router as reporting_router
from api.health_routes import router as health_router
from api.webhook_routes import router as webhook_router
from api.copilot_routes import router as copilot_router
from api.graph_routes import router as graph_router
from api.workflow_routes import router as workflow_router
from api.api_key_routes import router as api_key_router
from services.scheduler import start_scheduler

# ── Structured Logging ──────────────────────────────────────────────────────
LOG_LEVEL = os.environ.get("LOG_LEVEL", "INFO").upper()

logging.basicConfig(
    level=LOG_LEVEL,
    format="%(asctime)s %(levelname)-8s %(name)s %(message)s",
)
logger = logging.getLogger("cortex.api")

# ── Lifecycle ────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Cortex API starting up...")
    start_scheduler()
    logger.info("Scheduler started.")
    yield
    logger.info("Cortex API shutting down...")

# ── App ──────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="AIXYNZ Cortex API",
    version="0.4.0",
    description="Asset-centric Security Operations Platform",
    lifespan=lifespan,
)

frontend_origin = os.environ.get("FRONTEND_ORIGIN", "http://localhost:5173")
if frontend_origin and not frontend_origin.startswith("http"):
    frontend_origin = f"https://{frontend_origin}"

app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_origin, "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Request Logging Middleware ────────────────────────────────────────────────
@app.middleware("http")
async def log_requests(request: Request, call_next):
    request_id = uuid.uuid4().hex[:8]
    start = time.time()
    response = await call_next(request)
    duration_ms = round((time.time() - start) * 1000)
    logger.info(
        f"[{request_id}] {request.method} {request.url.path} "
        f"→ {response.status_code} ({duration_ms}ms)"
    )
    return response

# ── Routers ──────────────────────────────────────────────────────────────────
app.include_router(health_router)                            # /health, /health/deep (no prefix)
app.include_router(auth_router,        prefix="/api/v1/auth")
app.include_router(org_router,         prefix="/api/v1")
app.include_router(user_router,        prefix="/api/v1")
app.include_router(integration_router, prefix="/api/v1")
app.include_router(scan_router,        prefix="/api/v1")
app.include_router(audit_router,       prefix="/api/v1")
app.include_router(asset_router,       prefix="/api/v1")
app.include_router(reporting_router,   prefix="/api/v1")
app.include_router(api_router,         prefix="/api/v1")
app.include_router(webhook_router,     prefix="/api/v1")
app.include_router(copilot_router,     prefix="/api/v1")
app.include_router(graph_router,       prefix="/api/v1")
app.include_router(workflow_router,    prefix="/api/v1")
app.include_router(api_key_router,     prefix="/api/v1", tags=["api_keys"])
