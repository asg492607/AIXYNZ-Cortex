import asyncio
import logging
from services.firebase_client import get_db, get_runtime_mode, _mock_db
from services.scan_service import run_full_scan

logger = logging.getLogger(__name__)

async def scanning_loop():
    while True:
        logger.info("Running scheduled continuous scans...")
        try:
            if get_runtime_mode() == "demo":
                # In demo mode, just run scan for demo-org
                run_full_scan("demo-org")
            else:
                db = get_db()
                if db:
                    orgs = db.collection("organizations").stream()
                    for org in orgs:
                        org_data = org.to_dict()
                        if org_data.get("plan") != "free": # Example: only scan paid
                            logger.info(f"Scanning org: {org.id}")
                            run_full_scan(org.id)
        except Exception as e:
            logger.error(f"Scheduled scan failed: {e}")
            
        # Run every 24 hours (for MVP demo purposes, maybe much shorter, but we'll stick to 24h)
        await asyncio.sleep(24 * 60 * 60)

def start_scheduler():
    loop = asyncio.get_event_loop()
    loop.create_task(scanning_loop())
