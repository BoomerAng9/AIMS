---
name: memory-maintenance
version: 1.0.0
triggers:
  - "memory maintenance"
  - "clean memories"
  - "purge memories"
execution_target: n8n + in-process timer
category: automation
owner: ACHEEVY
---

# Memory Maintenance — Continuous Storage Compensation

Keeps the memory system healthy by purging expired memories, decaying old relevance
scores, and evicting low-value memories when per-user caps are exceeded.

## Three Automation Layers

### Layer 1 — In-Process Timer (Primary)
- **Where:** `MemoryEngine.startMaintenance()` in `backend/uef-gateway/src/memory/index.ts`
- **Interval:** Every 6 hours (configurable via `maintenanceIntervalMs`)
- **Startup:** Runs once 5 seconds after gateway boot
- **Shutdown:** `stopMaintenance()` called from graceful shutdown handler
- **Survives restarts:** Yes — Docker `restart: always` + healthcheck ensures the gateway comes back

### Layer 2 — Docker Health + Restart (Resilience)
- **Where:** `infra/docker-compose.prod.yml` — `uef-gateway` service
- **Policy:** `restart: always` with healthcheck on `GET /health` every 30s
- **Effect:** If the gateway dies, Docker restarts it, the `MemoryEngine` constructor fires `startMaintenance()` again

### Layer 3 — n8n Cron Workflow (Safety Net)
- **Where:** n8n workflow imported into the n8n instance
- **Schedule:** Cron trigger every 6 hours (offset by 1 hour from Layer 1)
- **Action:** `POST http://uef-gateway:3001/memory/maintenance`
- **Purpose:** Catches edge cases where Layer 1 timer drifted or gateway restarted mid-cycle

## n8n Workflow Configuration

Create a new n8n workflow with these nodes:

### Node 1 — Cron Trigger
```json
{
  "type": "n8n-nodes-base.scheduleTrigger",
  "parameters": {
    "rule": {
      "interval": [
        {
          "field": "hours",
          "hoursInterval": 6
        }
      ]
    }
  }
}
```

### Node 2 — HTTP Request
```json
{
  "type": "n8n-nodes-base.httpRequest",
  "parameters": {
    "method": "POST",
    "url": "http://uef-gateway:3001/memory/maintenance",
    "options": {
      "timeout": 30000
    }
  }
}
```

### Node 3 — Error Handler (optional)
Log failures to the audit system so they surface in ACHEEVY's monitoring.

## What Maintenance Does

| Operation | Effect | Frequency |
|-----------|--------|-----------|
| `purgeExpired()` | Deletes memories past their `expiresAt` timestamp | Every run |
| `decayRelevance()` | Multiplies `relevanceScore *= 0.95` for memories not updated in 30 days | Every run |
| `evictIfOverCap()` | Deletes lowest-relevance memories when user exceeds 1,000 memory cap | Every run |

## Storage Limits (DEFAULT_STORAGE_CONFIG)

| Limit | Value |
|-------|-------|
| Max memories per user | 1,000 |
| Max summary length | 500 chars |
| Max content length | 10,000 chars |
| Max payload size | 50,000 bytes |
| Max tags per memory | 20 |
| Eviction batch size | 50 |

## Manual Trigger

```bash
curl -X POST http://localhost:3001/memory/maintenance
```

Response:
```json
{
  "purged": 12,
  "decayed": 45,
  "evicted": 0
}
```

## Monitoring

Check per-user storage stats:
```bash
curl "http://localhost:3001/memory/stats?userId=USER_ID"
```

Response includes:
```json
{
  "storageUsage": {
    "used": 847,
    "cap": 1000,
    "percentFull": 85
  },
  "estimatedSizeBytes": 1234567
}
```
