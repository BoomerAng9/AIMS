from redis.asyncio import Redis
from ii_agent.core.cache import MemoryEntityCache, RedisEntityCache
from ii_agent.core.cache import EntityCache
from ii_agent.core.config.ii_agent_config import config
import ssl


def _create_redis_client(redis_url: str) -> Redis:
    kwargs = {
        "encoding": "utf-8",
        "retry_on_error": [ConnectionError, TimeoutError],
        "retry_on_timeout": True,
        "max_connections": 30,
        "socket_keepalive": True,
        "socket_connect_timeout": 5,
        "socket_timeout": 5,
        "decode_responses": True,
    }

    if config.is_redis_ssl:
        kwargs["ssl_cert_reqs"] = ssl.CERT_NONE
        kwargs["ssl_check_hostname"] = False

    return Redis.from_url(url=redis_url, **kwargs)


def create_entity_cache(namespace: str = "default", ttl: int = 3600) -> EntityCache:
    if config.redis_session_enabled:
        return RedisEntityCache(
            redis_client=redis_client, namespace=namespace, default_ttl=ttl
        )

    return MemoryEntityCache(namespace=namespace)


redis_client: Redis = _create_redis_client(config.redis_session_url)
entity_cache = create_entity_cache(namespace="entity", ttl=3600)
