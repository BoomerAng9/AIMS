"""Async cache service implementations for both memory and Redis backends."""

import asyncio
from calendar import c
import json
import time
import logging
from abc import ABC, abstractmethod
from typing import Dict, Optional, Any, Union
from collections import OrderedDict

from redis.asyncio import Redis
from ii_agent.core.config.ii_agent_config import config

logger = logging.getLogger(__name__)


class EntityCache(ABC):
    """Abstract base class for async cache service implementations.

    Supports both in-memory and Redis-based cache implementations.
    """

    def __init__(self, namespace: str = "default"):
        """Initialize cache service.

        Args:
            namespace: Namespace for organizing cache keys
        """
        self._namespace = namespace

    @abstractmethod
    async def get(self, key: str) -> Optional[Dict]:
        """Get a value from the cache.

        Args:
            key: Cache key
            cls: Optional class to deserialize the value into

        Returns:
            Cached value or None if not found
        """
        pass

    @abstractmethod
    async def set(self, key: str, value: Dict | str, ttl: Optional[int] = None) -> bool:
        """Set a value in the cache.

        Args:
            key: Cache key
            value: Value to cache
            ttl: Time to live in seconds (None for no expiration)

        Returns:
            True if successful, False otherwise
        """
        pass

    @abstractmethod
    async def evict(self, key: str) -> bool:
        """Delete a value from the cache.

        Args:
            key: Cache key

        Returns:
            True if key was deleted, False if key didn't exist
        """
        pass

    @abstractmethod
    async def exists(self, key: str) -> bool:
        """Check if a key exists in the cache.

        Args:
            key: Cache key

        Returns:
            True if key exists, False otherwise
        """
        pass

    @abstractmethod
    async def clear(self) -> bool:
        """Clear all keys in the namespace.

        Returns:
            True if successful, False otherwise
        """
        pass

    @abstractmethod
    async def close(self):
        """Close the cache service and cleanup resources."""
        pass

    def get_namespace(self) -> str:
        """Get the namespace of the cache service.

        Returns:
            The namespace string
        """
        return self._namespace

    def _make_key(self, key: str) -> str:
        """Create namespaced cache key.

        Args:
            key: Original key

        Returns:
            Namespaced key
        """
        return f"{self._namespace}:{key}"


class MemoryEntityCache(EntityCache):
    """In-memory cache service using asyncio and dict.

    WARNING: This implementation only works within a single process/worker.
    For multi-worker deployments, use RedisCacheService instead.
    """

    def __init__(self, namespace: str = "default", max_size: int = 10000):
        """Initialize in-memory cache service.

        Args:
            namespace: Namespace for organizing cache keys
            max_size: Maximum number of items to store (LRU eviction)
        """
        super().__init__(namespace)
        self._cache: OrderedDict[str, Union[Dict[str, Union[Dict, str]]]] = (
            OrderedDict()
        )
        self._max_size = max_size
        self._lock = asyncio.Lock()

    async def get(self, key: str) -> Optional[Dict]:
        """Get a value from the cache.

        Args:
            key: Cache key
            cls: Optional class to deserialize the value into

        Returns:
            Cached value or None if not found/expired
        """
        cache_key = self._make_key(key)

        async with self._lock:
            try:
                if cache_key not in self._cache:
                    return None

                item = self._cache[cache_key]

                # Check expiration
                expires_at = item.get("expires_at")
                if expires_at is not None and isinstance(expires_at, (int, float)):
                    if time.time() > expires_at:
                        del self._cache[cache_key]
                        return None

                # Move to end (LRU)
                self._cache.move_to_end(cache_key)
                value = item.get("value")
                if isinstance(value, str):
                    return json.loads(value)
                return value
            except Exception:
                logger.error(f"Failed to get cache value for key: {key}", exc_info=True)
                return None

    async def set(self, key: str, value: Dict | str, ttl: Optional[int] = None) -> bool:
        """Set a value in the cache.

        Args:
            key: Cache key
            value: Value to cache
            ttl: Time to live in seconds (None for no expiration)

        Returns:
            True if successful, False otherwise
        """
        cache_key = self._make_key(key)
        expires_at = time.time() + ttl if ttl is not None else None

        async with self._lock:
            try:
                # Remove oldest items if at max size
                while len(self._cache) >= self._max_size:
                    self._cache.popitem(last=False)

                self._cache[cache_key] = {"value": value, "expires_at": expires_at}
            except Exception:
                logger.error(f"Failed to set cache value for key: {key}", exc_info=True)
                return False
            return True

    async def evict(self, key: str) -> bool:
        """Delete a value from the cache.

        Args:
            key: Cache key

        Returns:
            True if key was deleted, False if key didn't exist
        """
        cache_key = self._make_key(key)

        async with self._lock:
            if cache_key in self._cache:
                del self._cache[cache_key]
                return True
            return False

    async def exists(self, key: str) -> bool:
        """Check if a key exists in the cache.

        Args:
            key: Cache key

        Returns:
            True if key exists and not expired, False otherwise
        """
        cache_key = self._make_key(key)

        async with self._lock:
            if cache_key not in self._cache:
                return False

            item = self._cache[cache_key]

            # Check expiration
            expires_at = item.get("expires_at")
            if expires_at is not None and isinstance(expires_at, (int, float)):
                if time.time() > expires_at:
                    del self._cache[cache_key]
                    return False

            return True

    async def clear(self) -> bool:
        """Clear all keys in the namespace.

        Returns:
            True if successful, False otherwise
        """
        async with self._lock:
            # Remove all keys with our namespace prefix
            keys_to_remove = [
                k
                for k in self._cache.keys()
                if k.startswith(f"cache:{self._namespace}:")
            ]
            for key in keys_to_remove:
                del self._cache[key]
            return True

    async def close(self):
        """Close the cache service and cleanup resources."""
        async with self._lock:
            self._cache.clear()


class RedisEntityCache(EntityCache):
    """Redis-based distributed cache service for multi-worker deployments.

    This implementation is safe for use across multiple workers and servers.
    """

    def __init__(
        self, redis_client: Redis, namespace: str = "default", default_ttl: int = 3600
    ):
        """Initialize Redis cache service.

        Args:
            namespace: Namespace for organizing cache keys
            default_ttl: Default TTL in seconds for keys without explicit TTL
        """
        super().__init__(namespace)
        self._default_ttl = default_ttl
        self._redis_client = redis_client

    async def get(self, key: str) -> Optional[Dict]:
        """Get a value from the cache.

        Args:
            key: Cache key
            cls: Optional class to deserialize the value into

            Returns:
            Cached value or None if not found
        """
        cache_key = self._make_key(key)

        try:
            value = await self._redis_client.get(cache_key)

            logger.debug(f"Cache hit for key: {cache_key}")

            return json.loads(value) if value is not None else None

        except Exception:
            logger.error(f"Failed to get cache value for key: {key}", exc_info=True)
            return None

    async def set(self, key: str, value: Dict | str, ttl: Optional[int] = None) -> bool:
        """Set a value in the cache.

        Args:
            key: Cache key
            value: Value to cache
            ttl: Time to live in seconds (None for no expiration)

        Returns:
            True if successful, False otherwise
        """
        cache_key = self._make_key(key)
        ttl = ttl if ttl is not None else self._default_ttl

        try:
            if isinstance(value, dict):
                value = json.dumps(value)

            result = await self._redis_client.setex(
                name=cache_key, time=ttl, value=value
            )

            return result is True

        except Exception as e:
            logger.exception(f"Failed to set cache value for key: {key}, {e}")
            return False

    async def evict(self, key: str) -> bool:
        """Delete a value from the cache.

        Args:
            key: Cache key

        Returns:
            True if key was deleted, False if key didn't exist
        """
        cache_key = self._make_key(key)

        try:
            result = await self._redis_client.delete(cache_key)
            return result > 0
        except Exception:
            return False

    async def exists(self, key: str) -> bool:
        """Check if a key exists in the cache.

        Args:
            key: Cache key

        Returns:
            True if key exists, False otherwise
        """
        cache_key = self._make_key(key)

        try:
            result = await self._redis_client.exists(cache_key)
            return result > 0
        except Exception:
            return False

    async def clear(self) -> bool:
        """Clear all keys in the namespace.

        Returns:
            True if successful, False otherwise
        """
        try:
            pattern = f"cache:{self._namespace}:*"
            keys = await self._redis_client.keys(pattern)

            if keys:
                await self._redis_client.delete(*keys)

            return True
        except Exception:
            return False

    async def close(self):
        """Close the Redis connection."""
        pass
