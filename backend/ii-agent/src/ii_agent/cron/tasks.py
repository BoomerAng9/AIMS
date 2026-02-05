"""
Scheduled tasks for cleaning up stale agent run tasks.
"""

from datetime import datetime, timedelta, timezone
import uuid
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from sqlalchemy import select
from ii_agent.core.event import EventType, RealtimeEvent
from ii_agent.db.manager import Events, get_db
from ii_agent.db.agent import AgentRunTask, RunStatus
from ii_agent.core.logger import logger


# Initialize the scheduler
scheduler = AsyncIOScheduler()


async def cleanup_long_running_tasks():
    """
    Clean up AgentRunTasks that have been running for more than 45 minutes.
    Marks them as system_interrupted instead of deleting.
    """
    try:
        # Calculate the cutoff time (45 minutes ago)
        cutoff_time = datetime.now(timezone.utc) - timedelta(minutes=45)
        total_processed = 0
        batch_size = 20
        max_processed = 100

        logger.info(f"Starting cleanup of AgentRunTasks older than {cutoff_time}")

        async with get_db() as db:
            while total_processed < max_processed:
                # Select tasks older than 45 minutes with FOR UPDATE SKIP LOCKED
                # This ensures we don't block on locked rows and prevents concurrent updates
                # Only select tasks that are currently in RUNNING status
                stmt = (
                    select(AgentRunTask)
                    .where(
                        AgentRunTask.created_at < cutoff_time,
                        AgentRunTask.status == RunStatus.RUNNING,
                    )
                    .order_by(AgentRunTask.created_at.desc())
                    .limit(batch_size)
                    .with_for_update(skip_locked=True)
                )

                result = await db.execute(stmt)
                tasks = result.scalars().all()

                if not tasks:
                    logger.info("No more stale AgentRunTasks found")
                    break

                # Update each task - optimistic locking will be enforced on commit
                batch_count = len(tasks)

                for task in tasks:
                    # Update the task status - this will use optimistic locking via version column
                    task.status = RunStatus.SYSTEM_INTERRUPTED
                    task.updated_at = datetime.now(timezone.utc)
                    # The version column will be automatically incremented by SQLAlchemy on commit
                    event = RealtimeEvent(
                        session_id=uuid.UUID(task.session_id),
                        run_id=task.id,
                        type=EventType.AGENT_RESPONSE_INTERRUPTED,
                        content={
                            "message": "Agent run task was interrupted by system cleanup due to timeout."
                        },
                    )
                    user_event = await Events.save_event_db_session(
                        db=db, session_id=uuid.UUID(task.session_id), event=event
                    )
                    db.add(user_event)
                # Commit all updates in one transaction
                await db.commit()

                total_processed += batch_count
                logger.info(
                    f"Marked {batch_count} stale AgentRunTasks as system_interrupted. "
                    f"Total processed: {total_processed}/{max_processed}"
                )

                if batch_count < batch_size:
                    break

                if total_processed >= max_processed:
                    logger.info(
                        f"Reached max processed limit ({max_processed}). "
                        "Remaining tasks will be processed in next run."
                    )
                    break

        logger.info(
            f"Cleanup completed. Total AgentRunTasks marked as system_interrupted: {total_processed}"
        )

    except Exception as e:
        logger.error(f"Error during AgentRunTask cleanup: {e}", exc_info=True)
        # Don't re-raise - we want the scheduler to continue running


def start_scheduler():
    """
    Start the scheduler and add the cleanup job.
    The cleanup task runs every 40 minutes.
    """
    try:
        # Add the cleanup job with interval trigger (every 40 minutes)
        scheduler.add_job(
            cleanup_long_running_tasks,
            trigger=IntervalTrigger(minutes=40),
            id="cleanup_stale_agent_run_tasks",
            name="Cleanup stale AgentRunTasks (older than 45 mins)",
            replace_existing=True,
            max_instances=1,  # Ensure only one instance runs at a time
        )

        # Start the scheduler
        scheduler.start()
        logger.info(
            "Scheduler started successfully. Cleanup task will run every 40 minutes."
        )

    except Exception as e:
        logger.error(f"Error starting scheduler: {e}", exc_info=True)
        raise


def shutdown_scheduler():
    """
    Shutdown the scheduler gracefully.
    """
    try:
        if scheduler.running:
            scheduler.shutdown(wait=True)
            logger.info("Scheduler shutdown successfully")
    except Exception as e:
        logger.error(f"Error shutting down scheduler: {e}", exc_info=True)
