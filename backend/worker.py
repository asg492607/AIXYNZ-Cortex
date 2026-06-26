"""
RQ Worker entrypoint.
Run with:  rq worker --url redis://localhost:6379 cortex-scans

In demo mode or without Redis, scans run in-process via the scheduler.
"""
import os
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
logger = logging.getLogger(__name__)

if __name__ == "__main__":
    try:
        import redis
        from rq import Worker, Queue, Connection

        redis_url = os.environ.get("REDIS_URL", "redis://localhost:6379")
        conn = redis.from_url(redis_url)
        queues = [Queue("default", connection=conn)]

        logger.info(f"Starting RQ worker, connected to {redis_url}")
        with Connection(conn):
            worker = Worker(queues)
            worker.work()
    except ImportError:
        logger.error("rq or redis not installed. Install with: pip install rq redis")
        raise
    except Exception as e:
        logger.error(f"Worker failed to start: {e}")
        raise
