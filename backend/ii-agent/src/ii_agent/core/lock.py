from typing import Optional

import asyncio
from typing import Union

from ii_agent.core.config.ii_agent_config import config
from redis.asyncio.lock import Lock
from ii_agent.server.cache import redis_client


class LockFactory:
    """Simple factory for creating distributed or local locks."""

    @staticmethod
    def get_lock(
        key: str,
        timeout: Optional[float] = None,
        namespace: str = "default",
    ) -> Union[asyncio.Lock, Lock]:  # object for Redis lock
        """Get a lock instance - Redis lock if enabled, asyncio.Lock otherwise.

        Args:
            key: Lock key
            timeout: Lock timeout in seconds (for Redis locks)
            redis_enabled: Whether to use Redis for distributed locking
            namespace: Namespace for Redis locks

        Returns:
            Redis lock or asyncio.Lock instance
        """
        if config.redis_session_enabled:
            # Return Redis lock for distributed locking
            lock_key = f"lock:{namespace}:{key}"
            return redis_client.lock(lock_key, timeout=timeout)
        else:
            # Return asyncio.Lock for local locking
            return asyncio.Lock()
