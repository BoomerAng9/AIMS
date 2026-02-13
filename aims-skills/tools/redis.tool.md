---
id: "redis"
name: "Redis"
type: "tool"
category: "database"
provider: "Redis"
description: "In-memory cache and session store for real-time state, circuit breaker, and conversation context."
env_vars:
  - "REDIS_URL"
  - "REDIS_PASSWORD"
docs_url: "https://redis.io/docs"
aims_files:
  - "infra/docker-compose.prod.yml"
---

# Redis — Cache & Session Tool Reference

## Overview

Redis provides in-memory caching and session state for AIMS. It stores conversation context, circuit breaker state, rate limiting counters, and real-time pub/sub events. Deployed as `redis:7-alpine` Docker container.

## Configuration

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `REDIS_URL` | Yes | `redis://redis:6379` | Connection URL (Docker internal) |
| `REDIS_PASSWORD` | Yes | — | Authentication password |

**Apply in:** `infra/.env.production`

## Docker Setup

In `infra/docker-compose.prod.yml`:
```yaml
redis:
  image: redis:7-alpine
  command: redis-server --requirepass ${REDIS_PASSWORD}
  volumes:
    - redis-data:/data
  ports:
    - "6379:6379"
```

**Internal URL:** `redis://redis:6379` (Docker network)

## Key Patterns in AIMS

| Key Pattern | Purpose | TTL |
|-------------|---------|-----|
| `session:{userId}` | Conversation state | 24h |
| `circuit:{service}` | Circuit breaker state | 5min |
| `rate:{userId}:{endpoint}` | Rate limiting | 1min |
| `cache:{hash}` | LLM response cache | 1h |
| `vertical:{userId}:{verticalId}` | Vertical progress | 7d |

## Common Commands

```bash
# Connect to Redis in Docker
docker exec -it aims-redis redis-cli -a $REDIS_PASSWORD

# Check health
PING  # → PONG

# View all keys matching pattern
KEYS session:*

# Get conversation state
GET session:user123

# Check memory usage
INFO memory
```

## Usage in Code

```typescript
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL, {
  password: process.env.REDIS_PASSWORD,
});

// Set with TTL
await redis.set('session:user123', JSON.stringify(state), 'EX', 86400);

// Get
const state = JSON.parse(await redis.get('session:user123') || '{}');
```

## Persistence
- RDB snapshots every 60s (configured in Docker volume)
- AOF disabled by default (not needed for cache layer)
- Volume mount: `redis-data:/data`

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Connection refused | Check Redis container is running: `docker ps` |
| NOAUTH | Set `REDIS_PASSWORD` env var |
| Memory full | Check `INFO memory`; increase Docker memory limit |
| Data lost on restart | Verify `redis-data` volume is mounted |
