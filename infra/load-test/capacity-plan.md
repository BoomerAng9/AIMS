# A.I.M.S. VPS Capacity Plan

## Current Infrastructure (Single VPS)

| Resource       | Spec                         | Notes                              |
|----------------|------------------------------|------------------------------------|
| **Provider**   | Hostinger KVM                | srv1328075.hstgr.cloud             |
| **IP**         | 76.13.96.107                 | Static IPv4                        |
| **CPU**        | 4 vCPU                       | Shared KVM cores                   |
| **RAM**        | 8 GB                         | DDR4                               |
| **Storage**    | 100 GB NVMe SSD              | ~40 GB used (images + volumes)     |
| **Bandwidth**  | 8 TB/month                   | Sufficient for current traffic     |
| **OS**         | Ubuntu 22.04 LTS             | Docker 24.x                        |

## Container Inventory (15 core + dynamic plugs)

| Service            | Memory Limit | CPU Shares | Port     |
|--------------------|-------------|------------|----------|
| nginx              | 256 MB      | default    | 80, 443  |
| frontend           | 512 MB      | default    | 3000     |
| demo-frontend      | 512 MB      | default    | 3050     |
| uef-gateway        | 256 MB      | default    | 3001     |
| house-of-ang       | 256 MB      | default    | 3002     |
| acheevy            | 512 MB      | default    | 3003     |
| redis              | 256 MB      | default    | 6379     |
| agent-bridge       | 256 MB      | default    | 3010     |
| chickenhawk-core   | 256 MB      | default    | 3020     |
| n8n                | 512 MB      | default    | 5678     |
| circuit-metrics    | 128 MB      | default    | 3040     |
| ii-agent           | 512 MB      | default    | 8000     |
| ii-agent-postgres  | 256 MB      | default    | 5432     |
| ii-agent-tools     | 256 MB      | default    | 8001     |
| ii-agent-sandbox   | 256 MB      | default    | 8002     |
| **Plug instances** | 256-512 MB  | default    | 51000+   |

**Total base memory**: ~4.5 GB (leaving ~3.5 GB for plug instances + OS)

## Load Capacity Estimates

### Concurrent Users per VPS

| Tier          | Users | Notes                                               |
|---------------|-------|-----------------------------------------------------|
| Comfortable   | 25    | <60% CPU, <70% RAM, all APIs < 200ms                |
| Normal        | 50    | <80% CPU, <85% RAM, APIs < 500ms                    |
| Peak          | 100   | ~90% CPU, ~90% RAM, some API degradation expected    |
| Maximum       | 150   | CPU saturation, queuing on chat, degrade gracefully  |

### Bottlenecks (in order of impact)

1. **SQLite (LUC)** — Single-writer lock. Reads scale, writes don't. Migrate to Postgres at ~50 concurrent writers.
2. **SSE streams** — Each chat connection holds a long-lived HTTP connection. nginx worker_connections limits this to ~1024 per worker.
3. **Node.js event loop** — CPU-heavy LLM response processing can block. Consider worker threads at scale.
4. **Docker overlay network** — Inter-container latency adds ~0.5ms per hop.

### Scaling Thresholds

| Metric                  | Threshold        | Action                                    |
|-------------------------|------------------|-------------------------------------------|
| CPU sustained > 80%     | 5 min            | Scale horizontally (add VPS node)         |
| RAM usage > 85%         | sustained        | Evict idle plug instances or add node     |
| API p95 > 1s            | 10 min           | Add caching layer or scale API service    |
| Error rate > 2%         | 5 min            | Investigate + auto-restart unhealthy pods |
| Disk usage > 80%        | any              | Prune docker images, rotate logs          |
| Plug instance count > 8 | per VPS          | Route new instances to secondary node     |

## Monitoring Checklist

- [ ] `docker stats` — real-time container resource usage
- [ ] `circuit-metrics` service — per-request latency + error tracking
- [ ] nginx access logs — request rate, status codes, upstream response time
- [ ] Redis `INFO` — memory usage, connected clients, keyspace hits
- [ ] Host `htop` / `vmstat` — CPU/RAM/swap at OS level
- [ ] k6 load test — periodic baseline runs (weekly recommended)

## Recommendations

1. **Now**: Run `k6 run infra/load-test/k6-config.js` against staging to establish baseline
2. **At 50 concurrent users**: Add Redis connection pooling, enable SQLite WAL mode
3. **At 100 concurrent users**: Deploy second VPS node with multi-VPS support
4. **At 200+ concurrent users**: Migrate LUC database to managed Postgres, add CDN for static assets
5. **At 500+ concurrent users**: Move to Kubernetes with auto-scaling node pools
