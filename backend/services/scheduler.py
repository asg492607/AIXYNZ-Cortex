import asyncio
import logging
import os

logger = logging.getLogger(__name__)

SCAN_INTERVAL_SECONDS = int(os.environ.get("SCAN_INTERVAL_SECONDS", str(24 * 60 * 60)))


def _enqueue_scan_rq(org_id: str):
    """
    Enqueue a scan job on the RQ/Redis queue.
    Falls back to in-process if Redis is unavailable.
    """
    try:
        import redis
        from rq import Queue
        redis_url = os.environ.get("REDIS_URL", "redis://localhost:6379")
        conn = redis.from_url(redis_url)
        q = Queue(connection=conn)
        from services.scan_service import run_full_scan
        q.enqueue(run_full_scan, org_id, job_timeout=600)
        logger.info(f"[scheduler] Enqueued scan job for org={org_id} via RQ")
    except Exception as e:
        logger.warning(f"[scheduler] RQ unavailable ({e}), falling back to in-process scan")
        from services.scan_service import run_full_scan
        run_full_scan(org_id)


async def scanning_loop():
    from services.firebase_client import get_db, get_runtime_mode, _mock_db
    use_rq = os.environ.get("USE_RQ", "false").lower() == "true"

    while True:
        logger.info(f"[scheduler] Running scheduled scans (interval={SCAN_INTERVAL_SECONDS}s, rq={use_rq})")
        try:
            from services.firebase_client import get_runtime_mode, _mock_db, get_db
            mode = get_runtime_mode()

            if mode == "demo":
                if use_rq:
                    _enqueue_scan_rq("demo-org")
                else:
                    from services.scan_service import run_full_scan
                    run_full_scan("demo-org")
            else:
                db = get_db()
                if db:
                    orgs = db.collection("organizations").stream()
                    for org in orgs:
                        org_data = org.to_dict()
                        if org_data.get("plan") != "free":
                            if use_rq:
                                _enqueue_scan_rq(org.id)
                            else:
                                from services.scan_service import run_full_scan
                                run_full_scan(org.id)

        except Exception as e:
            logger.error(f"[scheduler] Scheduled scan cycle failed: {e}")

        await asyncio.sleep(SCAN_INTERVAL_SECONDS)


def start_scheduler():
    loop = asyncio.get_event_loop()
    loop.create_task(scanning_loop())
