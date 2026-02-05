"""Redis-based message queue provider for sandbox lifecycle management."""

import json
import asyncio
import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional, Callable

from redis.asyncio import Redis
import redis.asyncio as redis

logger = logging.getLogger(__name__)


class SandboxQueueScheduler:
    """Redis-based implementation of message queue provider."""

    def __init__(
        self,
        redis_url: str = "redis://localhost:6379",
        redis_tls_ca_path: Optional[str] = None,
        queue_name: str = "sandbox_lifecycle",
        max_retries: int = 3,
    ):
        self.redis_url = redis_url
        self.client = None
        self.redis_tls_ca_path = redis_tls_ca_path
        self.queue_name = queue_name
        self.max_retries = max_retries
        self.redis_client: Optional[Redis] = None
        self.consumer_task: Optional[asyncio.Task] = None
        self.is_consuming = False
        self.message_handler: Optional[Callable[[str, str, Dict[str, Any]], None]] = (
            None
        )

    async def _execute_with_retry(self, operation, *args, **kwargs):
        """Execute a Redis operation with retry logic."""
        max_retries = 3
        retry_delay = 0.5
        
        for attempt in range(max_retries):
            try:
                return await operation(*args, **kwargs)
            except Exception as e:
                if attempt < max_retries - 1:
                    logger.warning(
                        f"Redis operation failed (attempt {attempt + 1}/{max_retries}): {e}. "
                        f"Retrying in {retry_delay} seconds..."
                    )
                    await asyncio.sleep(retry_delay)
                    retry_delay = min(retry_delay * 2, 5)
                else:
                    logger.error(
                        f"Redis operation failed after {max_retries} attempts: {e}"
                    )
                    raise

    async def _get_redis_client(self) -> Redis:
        """Get Redis client, creating it if necessary."""
        if self.redis_client is None:
            if self.redis_tls_ca_path is not None:
                self.redis_client = redis.from_url(
                    self.redis_url, ssl_ca_certs=self.redis_tls_ca_path
                )
            else:
                self.redis_client = redis.from_url(self.redis_url)
        return self.redis_client

    async def schedule_message(
        self,
        sandbox_id: str,
        action: str,
        delay_seconds: int,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> float:
        """Schedule a message using Redis sorted sets for delayed processing."""
        # Cancel message if exist
        await self.cancel_message(sandbox_id)
        client = await self._get_redis_client()

        # Calculate delivery time
        delivery_time = datetime.now(timezone.utc).timestamp() + delay_seconds

        # Prepare message payload
        message_payload = {
            "sandbox_id": sandbox_id,
            "action": action,
            "metadata": metadata or {},
            "scheduled_at": datetime.fromtimestamp(
                datetime.now(timezone.utc).timestamp() + delay_seconds, timezone.utc
            ).isoformat(),
            "attempts": 0,
        }

        # Store in sorted set with delivery time as score with retry
        await self._execute_with_retry(
            client.zadd,
            f"{self.queue_name}:delayed",
            {json.dumps(message_payload): delivery_time}
        )

        # Also store message details for easy lookup with retry
        await self._execute_with_retry(
            client.hset,
            f"{self.queue_name}:messages",
            sandbox_id,
            json.dumps(message_payload)
        )

        logger.info(f"Scheduled sandbox {sandbox_id} with delay {delay_seconds}s")
        return delivery_time

    async def cancel_message(self, sandbox_id: str):
        """Cancel a scheduled message."""
        client = await self._get_redis_client()

        # Get message payload with retry
        message_data = await self._execute_with_retry(
            client.hget,
            f"{self.queue_name}:messages",
            sandbox_id
        )
        if not message_data:
            return

        # Remove from delayed queue with retry
        removed = await self._execute_with_retry(
            client.zrem,
            f"{self.queue_name}:delayed",
            message_data
        )

        # Remove from messages hash with retry
        await self._execute_with_retry(
            client.hdel,
            f"{self.queue_name}:messages",
            sandbox_id
        )
        logger.info(f"Cancelled message {sandbox_id}")

    async def update_delay(self, sandbox_id: str, new_delay_seconds: int) -> bool:
        """Update the delay time of a scheduled message."""
        client = await self._get_redis_client()

        # Get current message payload with retry
        message_data = await self._execute_with_retry(
            client.hget,
            f"{self.queue_name}:messages",
            sandbox_id
        )
        if not message_data:
            return False

        # Remove old message from delayed queue with retry
        await self._execute_with_retry(
            client.zrem,
            f"{self.queue_name}:delayed",
            message_data
        )

        # Calculate new delivery time
        new_delivery_time = datetime.now(timezone.utc).timestamp() + new_delay_seconds

        # Add back with new delivery time with retry
        await self._execute_with_retry(
            client.zadd,
            f"{self.queue_name}:delayed",
            {message_data: new_delivery_time}
        )

        logger.info(f"Updated message {sandbox_id} delay to {new_delay_seconds}s")
        return True

    async def setup_consumer(
        self, handler: Callable[[str, str, Dict[str, Any]], None]
    ) -> None:
        """Setup message consumer."""
        self.message_handler = handler

    async def start_consuming(self) -> None:
        """Start consuming messages."""
        if self.is_consuming:
            return

        if self.message_handler is None:
            raise ValueError("Message handler must be set before starting consumer")

        self.is_consuming = True
        self.consumer_task = asyncio.create_task(self._consume_loop())
        logger.info("Started Redis message consumer")

    async def stop_consuming(self) -> None:
        """Stop consuming messages."""
        if not self.is_consuming:
            return

        self.is_consuming = False
        if self.consumer_task:
            self.consumer_task.cancel()
            try:
                await self.consumer_task
            except asyncio.CancelledError:
                pass

        if self.redis_client:
            await self.redis_client.close()
            self.redis_client = None

        logger.info("Stopped Redis message consumer")

    async def _consume_loop(self) -> None:
        """Main consumer loop."""
        client = await self._get_redis_client()

        while self.is_consuming:
            try:
                # Check for messages ready to be delivered
                now = datetime.now(timezone.utc).timestamp()

                # Get messages that are ready (score <= now) with retry
                ready_messages = await self._execute_with_retry(
                    client.zrangebyscore,
                    f"{self.queue_name}:delayed",
                    min=0,
                    max=now,
                    withscores=True,
                    start=0,
                    num=10,  # Process up to 10 messages at once
                )

                for message_data, _ in ready_messages:
                    try:
                        message = json.loads(message_data)
                        await self._process_message(client, message, message_data)
                    except Exception as e:
                        logger.info(f"ERROR: Error processing message: {e}")

                # Sleep briefly to avoid busy waiting
                await asyncio.sleep(1)

            except Exception as e:
                logger.info(f"ERROR: Error in consume loop: {e}")
                await asyncio.sleep(5)  # Wait longer on error

    async def _process_message(
        self, client: Redis, message: Dict[str, Any], message_data: str
    ) -> None:
        """Process a single message."""
        sandbox_id = message["sandbox_id"]
        action = message["action"]
        metadata = message["metadata"]
        attempts = message.get("attempts", 0)

        try:
            # Call the message handler
            if self.message_handler:
                await self.message_handler(sandbox_id, action, metadata)  # type: ignore

            # Message processed successfully, remove from queues with retry
            await self._execute_with_retry(
                client.zrem,
                f"{self.queue_name}:delayed",
                message_data
            )
            await self._execute_with_retry(
                client.hdel,
                f"{self.queue_name}:messages",
                sandbox_id
            )

            logger.info(f"Successfully processed message for sandbox {sandbox_id}")

        except Exception as e:
            logger.info(
                f"ERROR: Error processing message for sandbox {sandbox_id}: {e}"
            )

            # Increment attempt count
            attempts += 1

            if attempts <= self.max_retries:
                # Update message with new attempt count and reschedule
                message["attempts"] = attempts
                updated_message_data = json.dumps(message)

                # Remove old message and add updated one with delay with retry
                await self._execute_with_retry(
                    client.zrem,
                    f"{self.queue_name}:delayed",
                    message_data
                )

                # Exponential backoff: 2^attempts minutes
                retry_delay = 60 * (2**attempts)
                retry_time = datetime.now(timezone.utc).timestamp() + retry_delay

                await self._execute_with_retry(
                    client.zadd,
                    f"{self.queue_name}:delayed",
                    {updated_message_data: retry_time}
                )

                await self._execute_with_retry(
                    client.hset,
                    f"{self.queue_name}:messages",
                    sandbox_id,
                    updated_message_data
                )

                logger.info(
                    f"Rescheduled sandbox {sandbox_id} for retry {attempts}/{self.max_retries}"
                )
            else:
                # Max retries exceeded, move to dead letter queue with retry
                await self._execute_with_retry(
                    client.zadd,
                    f"{self.queue_name}:dead_letter",
                    {message_data: datetime.now(timezone.utc).timestamp()}
                )

                # Remove from active queues with retry
                await self._execute_with_retry(
                    client.zrem,
                    f"{self.queue_name}:delayed",
                    message_data
                )
                await self._execute_with_retry(
                    client.hdel,
                    f"{self.queue_name}:messages",
                    sandbox_id
                )

                logger.info(
                    f"ERROR: Message {sandbox_id} moved to dead letter queue after {attempts} attempts"
                )

    async def health_check(self) -> bool:
        """Check if Redis is healthy."""
        try:
            client = await self._get_redis_client()
            await self._execute_with_retry(client.ping)
            return True
        except Exception as e:
            logger.info(f"ERROR: Redis health check failed: {e}")
            return False
