"""Session store for managing Socket.IO session mappings with Redis or in-memory storage."""

import asyncio
import logging
from abc import ABC, abstractmethod
from typing import Dict, Set

from ii_agent.core.config.ii_agent_config import config
from ii_agent.server.cache import redis_client

logger = logging.getLogger(__name__)


class SessionStore(ABC):
    """Abstract base class for session storage."""

    @abstractmethod
    async def add_sid_to_session(self, session_uuid: str, sid: str) -> None:
        """Add a SID to a session's SID set."""
        pass

    @abstractmethod
    async def remove_sid_from_session(self, session_uuid: str, sid: str) -> None:
        """Remove a SID from a session's SID set."""
        pass

    @abstractmethod
    async def get_session_sids(self, session_uuid: str) -> Set[str]:
        """Get all SIDs for a session."""
        pass

    @abstractmethod
    async def get_all_session_sids(self) -> Dict[str, Set[str]]:
        """Get all session SID mappings."""
        pass

    @abstractmethod
    async def is_session_empty(self, session_uuid: str) -> bool:
        """Check if a session has no active SIDs."""
        pass


class RedisSessionStore(SessionStore):
    """Redis-based session storage."""

    def __init__(self, redis_key_prefix: str = "session_sids:"):
        self.redis_client = redis_client
        self.redis_key_prefix = redis_key_prefix

    def _get_redis_key(self, session_uuid: str) -> str:
        """Get Redis key for session SIDs."""
        return f"{self.redis_key_prefix}{session_uuid}"

    async def add_sid_to_session(self, session_uuid: str, sid: str) -> None:
        """Add a SID to a session's SID set in Redis with TTL."""
        try:
            redis_key = self._get_redis_key(session_uuid)
            await self.redis_client.sadd(redis_key, sid)
            # Set TTL to 60 minutes (3600 seconds) for the key
            await self.redis_client.expire(redis_key, 3600)
            logger.debug(
                f"Added SID {sid} to session {session_uuid} in Redis with 60min TTL"
            )
        except Exception as e:
            logger.error(
                f"Failed to add SID {sid} to session {session_uuid} in Redis: {e}"
            )

    async def remove_sid_from_session(self, session_uuid: str, sid: str) -> None:
        """Remove a SID from a session's SID set in Redis."""
        try:
            redis_key = self._get_redis_key(session_uuid)
            await self.redis_client.srem(redis_key, sid)
            logger.debug(f"Removed SID {sid} from session {session_uuid} in Redis")

            # Check if the set is empty and clean it up, otherwise refresh TTL
            remaining_sids = await self.redis_client.scard(redis_key)
            if remaining_sids == 0:
                await self.redis_client.delete(redis_key)
                logger.debug(f"Cleaned up empty session {session_uuid} from Redis")
            else:
                # Refresh TTL for remaining SIDs
                await self.redis_client.expire(redis_key, 3600)
                logger.debug(
                    f"Refreshed TTL for session {session_uuid} with {remaining_sids} remaining SIDs"
                )
        except Exception as e:
            logger.error(
                f"Failed to remove SID {sid} from session {session_uuid} in Redis: {e}"
            )

    async def get_session_sids(self, session_uuid: str) -> Set[str]:
        """Get all SIDs for a session from Redis."""
        try:
            redis_key = self._get_redis_key(session_uuid)
            sids = await self.redis_client.smembers(redis_key)
            return {sid.decode() if isinstance(sid, bytes) else sid for sid in sids}
        except Exception as e:
            logger.error(
                f"Failed to get SIDs for session {session_uuid} from Redis: {e}"
            )
            return set()

    async def get_all_session_sids(self) -> Dict[str, Set[str]]:
        """Get all session SID mappings from Redis."""
        try:
            pattern = f"{self.redis_key_prefix}*"
            keys = await self.redis_client.keys(pattern)
            result = {}

            for key in keys:
                session_uuid = key.decode().replace(self.redis_key_prefix, "")
                sids = await self.redis_client.smembers(key)
                result[session_uuid] = {
                    sid.decode() if isinstance(sid, bytes) else sid for sid in sids
                }

            return result
        except Exception as e:
            logger.error(f"Failed to get all session SIDs from Redis: {e}")
            return {}

    async def is_session_empty(self, session_uuid: str) -> bool:
        """Check if a session has no active SIDs in Redis."""
        try:
            redis_key = self._get_redis_key(session_uuid)
            # Check if key exists first
            exists = await self.redis_client.exists(redis_key)
            if not exists:
                logger.debug(f"Session {session_uuid} key does not exist in Redis")
                return True  # Key doesn't exist = empty session

            # Key exists, check count
            count = await self.redis_client.scard(redis_key)
            is_empty = count == 0
            logger.debug(f"Session {session_uuid} has {count} SIDs, empty: {is_empty}")
            return is_empty
        except Exception as e:
            logger.error(
                f"Failed to check if session {session_uuid} is empty in Redis: {e}"
            )
            return True  # Assume empty on error


class MemorySessionStore(SessionStore):
    """In-memory session storage with TTL."""

    def __init__(self, ttl_seconds: int = 3600):
        self._sessions: Dict[str, Set[str]] = {}
        self._ttl_tasks: Dict[str, asyncio.Task] = {}
        self._lock = asyncio.Lock()
        self.ttl_seconds = ttl_seconds

    async def add_sid_to_session(self, session_uuid: str, sid: str) -> None:
        """Add a SID to a session's SID set in memory with TTL."""
        async with self._lock:
            if session_uuid not in self._sessions:
                self._sessions[session_uuid] = set()
            self._sessions[session_uuid].add(sid)

            # Cancel existing TTL task and create new one
            if session_uuid in self._ttl_tasks:
                self._ttl_tasks[session_uuid].cancel()

            self._ttl_tasks[session_uuid] = asyncio.create_task(
                self._cleanup_after_ttl(session_uuid)
            )
            logger.debug(
                f"Added SID {sid} to session {session_uuid} in memory with {self.ttl_seconds}s TTL"
            )

    async def remove_sid_from_session(self, session_uuid: str, sid: str) -> None:
        """Remove a SID from a session's SID set in memory."""
        async with self._lock:
            if session_uuid in self._sessions:
                self._sessions[session_uuid].discard(sid)
                logger.debug(f"Removed SID {sid} from session {session_uuid} in memory")

                # Clean up empty sessions immediately
                if not self._sessions[session_uuid]:
                    del self._sessions[session_uuid]
                    # Cancel TTL task
                    if session_uuid in self._ttl_tasks:
                        self._ttl_tasks[session_uuid].cancel()
                        del self._ttl_tasks[session_uuid]
                    logger.debug(f"Cleaned up empty session {session_uuid} from memory")
                else:
                    # Refresh TTL for remaining SIDs
                    if session_uuid in self._ttl_tasks:
                        self._ttl_tasks[session_uuid].cancel()
                    self._ttl_tasks[session_uuid] = asyncio.create_task(
                        self._cleanup_after_ttl(session_uuid)
                    )
                    logger.debug(f"Refreshed TTL for session {session_uuid} in memory")

    async def get_session_sids(self, session_uuid: str) -> Set[str]:
        """Get all SIDs for a session from memory."""
        async with self._lock:
            return self._sessions.get(session_uuid, set()).copy()

    async def get_all_session_sids(self) -> Dict[str, Set[str]]:
        """Get all session SID mappings from memory."""
        async with self._lock:
            return {k: v.copy() for k, v in self._sessions.items()}

    async def is_session_empty(self, session_uuid: str) -> bool:
        """Check if a session has no active SIDs in memory."""
        if not session_uuid:
            logger.debug("Session UUID is None, considering empty")
            return True

        async with self._lock:
            if session_uuid not in self._sessions:
                logger.debug(f"Session {session_uuid} does not exist in memory")
                return True

            sids = self._sessions.get(session_uuid, set())
            is_empty = len(sids) == 0
            logger.debug(
                f"Session {session_uuid} has {len(sids)} SIDs, empty: {is_empty}"
            )
            return is_empty

    async def _cleanup_after_ttl(self, session_uuid: str) -> None:
        """Clean up session after TTL expires."""
        try:
            await asyncio.sleep(self.ttl_seconds)
            async with self._lock:
                if session_uuid in self._sessions:
                    del self._sessions[session_uuid]
                    if session_uuid in self._ttl_tasks:
                        del self._ttl_tasks[session_uuid]
                    logger.info(
                        f"TTL expired, cleaned up session {session_uuid} from memory"
                    )
        except asyncio.CancelledError:
            # Task was cancelled (TTL refreshed), this is expected
            pass


def create_session_store() -> SessionStore:
    """Create session store based on configuration."""
    if config.redis_session_enabled:
        logger.info("Using Redis session store")
        return RedisSessionStore()
    else:
        logger.info("Using in-memory session store")
        return MemorySessionStore()


# Global session store instance
session_store = create_session_store()
