from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import router as api_router
from api.auth_routes import router as auth_router
from api.organization_routes import router as org_router
from api.user_routes import router as user_router
from api.integration_routes import router as integration_router
from api.scan_routes import router as scan_router
from api.audit_routes import router as audit_router
from services.scheduler import start_scheduler

app = FastAPI(title="AIXYNZ Cortex API", version="0.1.0")

# Configure CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "*"], # Explicitly allow Vite
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/v1/auth")
app.include_router(org_router, prefix="/api/v1")
app.include_router(user_router, prefix="/api/v1")
app.include_router(integration_router, prefix="/api/v1")
app.include_router(scan_router, prefix="/api/v1")
app.include_router(audit_router, prefix="/api/v1")
app.include_router(api_router, prefix="/api/v1")

@app.on_event("startup")
async def startup_event():
    start_scheduler()

@app.get("/health")
def health_check():
    return {"status": "ok"}
