# Live Look In — Deployment Reference

## Deployment Targets

| Phase      | Target                      | Stack                                           |
|------------|-----------------------------|-------------------------------------------------|
| POC        | Claude artifact / local dev | Single React file, no backend                   |
| MVP        | Hostinger VPS               | Docker Compose: Redis + FastAPI + Nginx + React  |
| Production | Cloud SaaS                  | Kubernetes or Docker Swarm, managed Redis, CDN   |

## MVP: Hostinger VPS Deployment

### Prerequisites

- Hostinger VPS with Ubuntu 22.04+
- Docker + Docker Compose installed
- Domain pointed to VPS IP (e.g., livelookin.achievemor.com)
- SSL certificate (Let's Encrypt via Certbot)

### Docker Compose Stack

```yaml
version: '3.8'

services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
    restart: always

  state-engine:
    build: ./state-engine
    ports:
      - "8000:8000"
    environment:
      - REDIS_URL=redis://redis:6379
      - DATABASE_URL=postgresql://livelookin:${DB_PASS}@postgres:5432/livelookin
      - JWT_SECRET=${JWT_SECRET}
      - CORS_ORIGINS=https://livelookin.achievemor.com
    depends_on:
      - redis
      - postgres
    restart: always

  postgres:
    image: postgres:16-alpine
    environment:
      - POSTGRES_DB=livelookin
      - POSTGRES_USER=livelookin
      - POSTGRES_PASSWORD=${DB_PASS}
    volumes:
      - pg_data:/var/lib/postgresql/data
    restart: always

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    restart: always

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/certs:/etc/nginx/certs
    depends_on:
      - frontend
      - state-engine
    restart: always

volumes:
  redis_data:
  pg_data:
```

### Nginx Config

```nginx
upstream frontend {
    server frontend:3000;
}

upstream api {
    server state-engine:8000;
}

server {
    listen 443 ssl;
    server_name livelookin.achievemor.com;

    ssl_certificate /etc/nginx/certs/fullchain.pem;
    ssl_certificate_key /etc/nginx/certs/privkey.pem;

    # Frontend
    location / {
        proxy_pass http://frontend;
    }

    # API + WebSocket
    location /api/ {
        proxy_pass http://api/;
    }

    location /ws {
        proxy_pass http://api/ws;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 86400;
    }

    # Static assets
    location /assets/ {
        alias /var/www/assets/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}

server {
    listen 80;
    server_name livelookin.achievemor.com;
    return 301 https://$host$request_uri;
}
```

## Production: Cloud SaaS Deployment

### Architecture (Multi-Tenant)

```
                    ┌──────────────────┐
                    │   Cloudflare CDN  │
                    │  (static + assets)│
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │  Load Balancer    │
                    │  (Nginx/Traefik)  │
                    └──┬─────────┬─────┘
                       │         │
              ┌────────▼──┐  ┌──▼────────┐
              │ Frontend   │  │ API/WS    │
              │ (Static)   │  │ (Replicas)│
              └────────────┘  └──┬────────┘
                                 │
                    ┌────────────▼────────┐
                    │  Redis Cluster       │
                    │  (Managed: Upstash   │
                    │   or ElastiCache)    │
                    └────────────┬────────┘
                                 │
                    ┌────────────▼────────┐
                    │  PostgreSQL          │
                    │  (Managed: Supabase  │
                    │   or RDS)            │
                    └─────────────────────┘
```

### Multi-Tenancy Model

Each organization gets:
- Isolated Redis channels: `livelookin:{org_id}:events`
- Database row-level security filtered by `org_id`
- Separate WebSocket rooms
- Custom floor plan configuration stored in DB
- Custom agent roster

### Environment Variables

```env
# Required
REDIS_URL=redis://...
DATABASE_URL=postgresql://...
JWT_SECRET=...
CORS_ORIGINS=https://livelookin.achievemor.com,https://app.achievemor.com

# Optional
SENTRY_DSN=...
ASSET_CDN_URL=https://assets.achievemor.com
LOG_LEVEL=info
MAX_WS_CONNECTIONS_PER_ORG=50
STATE_BROADCAST_INTERVAL_MS=100
```

## Database Schema (Phase 4+)

```sql
-- Agents registry
CREATE TABLE agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,       -- 'boomerang' | 'lilhawk'
  dept TEXT NOT NULL,
  specialty TEXT,
  glow_color TEXT,
  glyph TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Completed jobs with full PCP
CREATE TABLE jobs (
  id TEXT PRIMARY KEY,      -- PCP-XXXXX
  agent_id TEXT REFERENCES agents(id),
  task_title TEXT NOT NULL,
  complexity TEXT NOT NULL,
  vision TEXT,
  mission TEXT,
  objectives JSONB,
  score INTEGER,
  grade TEXT,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  duration_seconds INTEGER,
  metadata JSONB
);

-- KPI snapshots (hourly rollups)
CREATE TABLE kpi_snapshots (
  id SERIAL PRIMARY KEY,
  agent_id TEXT REFERENCES agents(id),
  snapshot_at TIMESTAMP DEFAULT NOW(),
  tasks_completed INTEGER,
  avg_score NUMERIC(5,2),
  avg_time_seconds NUMERIC(10,2),
  efficiency NUMERIC(5,2)
);

-- Org-level OKR tracking
CREATE TABLE org_metrics (
  id SERIAL PRIMARY KEY,
  recorded_at TIMESTAMP DEFAULT NOW(),
  total_agents INTEGER,
  active_agents INTEGER,
  jobs_completed_today INTEGER,
  avg_grade TEXT,
  utilization_pct NUMERIC(5,2)
);
```

## Resource Sizing

| Tier            | Specs                                          | Capacity                        |
|-----------------|------------------------------------------------|---------------------------------|
| VPS (MVP)       | 4 vCPU, 4 GB RAM, 40 GB SSD                   | ~10 viewers, ~20 agents         |
| Cloud (Prod)    | 2x t3.small auto-scale, managed Redis 1GB, PG  | ~500 viewers, ~200 agents/org   |

## Monitoring

### Health Endpoints

- `GET /api/health` — Server alive check
- `GET /api/health/redis` — Redis connectivity
- `GET /api/health/db` — Database connectivity
- `GET /api/metrics` — Prometheus-compatible metrics

### Key Metrics to Track

- WebSocket connection count (per org)
- Event throughput (events/sec on Redis)
- State broadcast latency (ms from event to client)
- Agent count (online vs total)
- Job completion rate (per hour)
- Canvas frame time (client-side, reported via beacon)

## Backup Strategy

| Data           | Method                     | Frequency           |
|----------------|----------------------------|---------------------|
| PostgreSQL     | pg_dump to S3              | Daily               |
| Redis          | AOF persistence + snapshot | Continuous + hourly |
| Asset files    | CDN is source of truth     | On deploy           |
| Docker configs | Git repository             | On change           |
