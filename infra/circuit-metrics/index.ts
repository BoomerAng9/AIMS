/**
 * Circuit Metrics - Service Health Monitor
 *
 * Collects health and performance metrics from all A.I.M.S. services.
 * Exposes Prometheus-compatible metrics endpoint and JSON status API.
 */

import express, { Request, Response } from 'express';

const app = express();
const PORT = parseInt(process.env.PORT || '9090', 10);

// Service endpoints to monitor
const SERVICES: Record<string, string> = {
  frontend: process.env.FRONTEND_URL || 'http://frontend:3000',
  uefGateway: process.env.UEF_GATEWAY_URL || 'http://uef-gateway:4000',
  houseOfAng: process.env.HOUSE_OF_ANG_URL || 'http://house-of-ang:3002',
  acheevy: process.env.ACHEEVY_URL || 'http://acheevy:3003',
  agentBridge: process.env.AGENT_BRIDGE_URL || 'http://agent-bridge:3010',
  chickenhawkCore: process.env.CHICKENHAWK_CORE_URL || 'http://chickenhawk-core:4001',
};

// UEF Gateway for plug operations data
const UEF_GATEWAY = process.env.UEF_GATEWAY_URL || 'http://uef-gateway:4000';

// Alerting webhook (Slack, Discord, or automation pipeline)
const ALERT_WEBHOOK = process.env.ALERT_WEBHOOK_URL || '';
const ALERT_COOLDOWN_MS = 300_000; // 5 min between alerts per service

interface ServiceHealth {
  name: string;
  type: string;
  status: 'up' | 'down' | 'degraded';
  responseTime: number;
  lastCheck: string;
  error?: string;
}

const healthCache: Map<string, ServiceHealth> = new Map();
const healthHistory: Array<{ timestamp: string; services: ServiceHealth[] }> = [];
const alertCooldowns: Map<string, number> = new Map();
const MAX_HISTORY = 2880; // 24 hours at 30s intervals

async function checkServiceHealth(name: string, url: string, type: string): Promise<ServiceHealth> {
  const startTime = Date.now();

  // Redis doesn't have an HTTP /health endpoint
  if (name === 'redis') {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      clearTimeout(timeout);
      return {
        name,
        type,
        status: 'up',
        responseTime: Date.now() - startTime,
        lastCheck: new Date().toISOString(),
      };
    } catch {
      return {
        name,
        type,
        status: 'down',
        responseTime: Date.now() - startTime,
        lastCheck: new Date().toISOString(),
        error: 'Cannot reach Redis',
      };
    }
  }

  // n8n uses /healthz not /health
  const healthPath = name === 'n8n' ? '/healthz' : '/health';

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${url}${healthPath}`, {
      signal: controller.signal,
    });

    clearTimeout(timeout);
    const responseTime = Date.now() - startTime;

    return {
      name,
      type,
      status: response.ok ? 'up' : 'degraded',
      responseTime,
      lastCheck: new Date().toISOString(),
    };
  } catch (error) {
    return {
      name,
      type,
      status: 'down',
      responseTime: Date.now() - startTime,
      lastCheck: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function checkAllServices(): Promise<ServiceHealth[]> {
  const results = await Promise.all(
    Object.entries(SERVICES).map(([name, { url, type }]) =>
      checkServiceHealth(name, url, type)
    )
  );

  results.forEach(health => {
    const previous = healthCache.get(health.name);
    healthCache.set(health.name, health);

    // Detect status transitions and alert
    if (previous && previous.status === 'up' && health.status === 'down') {
      sendAlert(`Service **${health.name}** went DOWN`, health).catch(() => {});
    } else if (previous && previous.status === 'down' && health.status === 'up') {
      sendAlert(`Service **${health.name}** recovered (was down)`, health).catch(() => {});
    }
  });

  // Store history
  healthHistory.push({ timestamp: new Date().toISOString(), services: results });
  if (healthHistory.length > MAX_HISTORY) {
    healthHistory.splice(0, healthHistory.length - MAX_HISTORY);
  }

  return results;
}

// ---------------------------------------------------------------------------
// Alerting
// ---------------------------------------------------------------------------

async function sendAlert(message: string, health: ServiceHealth): Promise<void> {
  if (!ALERT_WEBHOOK) return;

  // Cooldown check
  const now = Date.now();
  const lastAlert = alertCooldowns.get(health.name) || 0;
  if (now - lastAlert < ALERT_COOLDOWN_MS) return;
  alertCooldowns.set(health.name, now);

  try {
    await fetch(ALERT_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `[Circuit Metrics] ${message}`,
        service: health.name,
        status: health.status,
        responseTime: health.responseTime,
        error: health.error,
        timestamp: health.lastCheck,
      }),
    });
  } catch {
    console.error(`[Circuit Metrics] Failed to send alert for ${health.name}`);
  }
}

// ---------------------------------------------------------------------------
// Plug Operations Data (from UEF Gateway)
// ---------------------------------------------------------------------------

async function fetchPlugOpsStats(): Promise<Record<string, unknown> | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`${UEF_GATEWAY}/api/plug-operations/stats`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    return await res.json() as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function fetchPlugHealthStats(): Promise<Record<string, unknown> | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`${UEF_GATEWAY}/api/plug-operations/health`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    return await res.json() as Record<string, unknown>;
  } catch {
    return null;
  }
}

// Health check endpoint (for this service itself)
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'circuit-metrics' });
});

// All services status — the main endpoint Circuit Box consumes
app.get('/status', async (_req: Request, res: Response) => {
  const results = await checkAllServices();
  const upCount = results.filter(s => s.status === 'up').length;

  res.json({
    overall: upCount === results.length ? 'healthy' : upCount > 0 ? 'degraded' : 'down',
    timestamp: new Date().toISOString(),
    services: results,
    summary: {
      total: results.length,
      up: upCount,
      degraded: results.filter(s => s.status === 'degraded').length,
      down: results.filter(s => s.status === 'down').length,
    },
  });
});

// Prometheus metrics
app.get('/metrics', async (_req: Request, res: Response) => {
  const results = await checkAllServices();

  let metrics = '# HELP aims_service_up Service availability (1=up, 0=down)\n';
  metrics += '# TYPE aims_service_up gauge\n';

  results.forEach(service => {
    const value = service.status === 'up' ? 1 : 0;
    metrics += `aims_service_up{service="${service.name}",type="${service.type}"} ${value}\n`;
  });

  metrics += '\n# HELP aims_service_response_time_ms Service response time in milliseconds\n';
  metrics += '# TYPE aims_service_response_time_ms gauge\n';

  results.forEach(service => {
    metrics += `aims_service_response_time_ms{service="${service.name}",type="${service.type}"} ${service.responseTime}\n`;
  });

  res.set('Content-Type', 'text/plain');
  res.send(metrics);
});

// Full dashboard — services + plugs + history summary
app.get('/dashboard', async (_req: Request, res: Response) => {
  const [services, plugOps, plugHealth] = await Promise.all([
    checkAllServices(),
    fetchPlugOpsStats(),
    fetchPlugHealthStats(),
  ]);

  const allUp = services.every(s => s.status === 'up');
  const uptimePercent = healthHistory.length > 0
    ? Math.round(
        (healthHistory.filter(h => h.services.every(s => s.status === 'up')).length / healthHistory.length) * 100
      )
    : 100;

  res.json({
    overall: allUp ? 'healthy' : 'degraded',
    uptimePercent,
    timestamp: new Date().toISOString(),
    services,
    plugInstances: plugOps,
    plugHealth,
    historyPoints: healthHistory.length,
    alertWebhookConfigured: ALERT_WEBHOOK.length > 0,
  });
});

// Health history (for uptime charts)
app.get('/history', (_req: Request, res: Response) => {
  const limit = parseInt((_req.query as { limit?: string }).limit || '100');
  const recent = healthHistory.slice(-limit);
  res.json({ history: recent, total: healthHistory.length });
});

// Plug instance metrics (proxied from UEF Gateway)
app.get('/plugs', async (_req: Request, res: Response) => {
  const [stats, health] = await Promise.all([
    fetchPlugOpsStats(),
    fetchPlugHealthStats(),
  ]);

  res.json({
    stats: stats || { error: 'UEF Gateway unreachable' },
    health: health || { error: 'UEF Gateway unreachable' },
  });
});

// Prometheus metrics for plug instances
app.get('/metrics/plugs', async (_req: Request, res: Response) => {
  const stats = await fetchPlugOpsStats() as {
    totalInstances?: number;
    runningInstances?: number;
    stoppedInstances?: number;
    portCapacity?: { used: number; total: number; percentage: number };
    healthStats?: { healthy: number; unhealthy: number; unknown: number };
  } | null;

  let metrics = '';

  if (stats) {
    metrics += '# HELP aims_plug_instances_total Total plug instances\n';
    metrics += '# TYPE aims_plug_instances_total gauge\n';
    metrics += `aims_plug_instances_total ${stats.totalInstances || 0}\n\n`;

    metrics += '# HELP aims_plug_instances_running Running plug instances\n';
    metrics += '# TYPE aims_plug_instances_running gauge\n';
    metrics += `aims_plug_instances_running ${stats.runningInstances || 0}\n\n`;

    metrics += '# HELP aims_plug_ports_used Allocated ports\n';
    metrics += '# TYPE aims_plug_ports_used gauge\n';
    metrics += `aims_plug_ports_used ${stats.portCapacity?.used || 0}\n\n`;

    metrics += '# HELP aims_plug_ports_capacity_percent Port capacity percentage\n';
    metrics += '# TYPE aims_plug_ports_capacity_percent gauge\n';
    metrics += `aims_plug_ports_capacity_percent ${stats.portCapacity?.percentage || 0}\n\n`;

    metrics += '# HELP aims_plug_health_status Plug health by status\n';
    metrics += '# TYPE aims_plug_health_status gauge\n';
    metrics += `aims_plug_health_status{status="healthy"} ${stats.healthStats?.healthy || 0}\n`;
    metrics += `aims_plug_health_status{status="unhealthy"} ${stats.healthStats?.unhealthy || 0}\n`;
    metrics += `aims_plug_health_status{status="unknown"} ${stats.healthStats?.unknown || 0}\n`;
  }

  res.set('Content-Type', 'text/plain');
  res.send(metrics);
});

// ---------------------------------------------------------------------------
// Per-Container Resource Stats via Docker Socket
// ---------------------------------------------------------------------------

import http from 'http';

function dockerGet(path: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const options: http.RequestOptions = {
      socketPath: '/var/run/docker.sock',
      path,
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch { resolve(null); }
      });
    });
    req.on('error', reject);
    req.setTimeout(5000, () => { req.destroy(); reject(new Error('Docker socket timeout')); });
    req.end();
  });
}

interface ContainerStats {
  id: string;
  name: string;
  status: string;
  state: string;
  image: string;
  cpuPercent: number;
  memoryUsageMb: number;
  memoryLimitMb: number;
  memoryPercent: number;
  networkRxMb: number;
  networkTxMb: number;
  pids: number;
  uptime: string;
}

function parseDockerStats(stats: any, containerName: string, containerInfo: any): ContainerStats {
  // CPU percentage calculation
  const cpuDelta = (stats.cpu_stats?.cpu_usage?.total_usage || 0) - (stats.precpu_stats?.cpu_usage?.total_usage || 0);
  const systemDelta = (stats.cpu_stats?.system_cpu_usage || 0) - (stats.precpu_stats?.system_cpu_usage || 0);
  const numCpus = stats.cpu_stats?.online_cpus || stats.cpu_stats?.cpu_usage?.percpu_usage?.length || 1;
  const cpuPercent = systemDelta > 0 ? (cpuDelta / systemDelta) * numCpus * 100 : 0;

  // Memory
  const memUsage = stats.memory_stats?.usage || 0;
  const memLimit = stats.memory_stats?.limit || 0;
  const memCache = stats.memory_stats?.stats?.cache || 0;
  const actualMem = memUsage - memCache;

  // Network
  let rxBytes = 0, txBytes = 0;
  if (stats.networks) {
    for (const iface of Object.values(stats.networks) as any[]) {
      rxBytes += iface.rx_bytes || 0;
      txBytes += iface.tx_bytes || 0;
    }
  }

  return {
    id: containerInfo.Id?.substring(0, 12) || '',
    name: containerName.replace(/^\//, ''),
    status: containerInfo.Status || '',
    state: containerInfo.State || '',
    image: containerInfo.Image || '',
    cpuPercent: Math.round(cpuPercent * 100) / 100,
    memoryUsageMb: Math.round((actualMem / 1024 / 1024) * 10) / 10,
    memoryLimitMb: Math.round((memLimit / 1024 / 1024) * 10) / 10,
    memoryPercent: memLimit > 0 ? Math.round((actualMem / memLimit) * 10000) / 100 : 0,
    networkRxMb: Math.round((rxBytes / 1024 / 1024) * 100) / 100,
    networkTxMb: Math.round((txBytes / 1024 / 1024) * 100) / 100,
    pids: stats.pids_stats?.current || 0,
    uptime: containerInfo.Status || '',
  };
}

// Cache for container stats (refreshed on request)
let containerStatsCache: ContainerStats[] = [];
let containerStatsCacheTime = 0;
const STATS_CACHE_TTL = 10_000; // 10 seconds

async function collectContainerStats(): Promise<ContainerStats[]> {
  const now = Date.now();
  if (now - containerStatsCacheTime < STATS_CACHE_TTL && containerStatsCache.length > 0) {
    return containerStatsCache;
  }

  try {
    const containers = await dockerGet('/containers/json?all=true');
    if (!Array.isArray(containers)) return [];

    const results: ContainerStats[] = [];
    // Collect stats in parallel (limit concurrency to 5)
    const batches = [];
    for (let i = 0; i < containers.length; i += 5) {
      batches.push(containers.slice(i, i + 5));
    }

    for (const batch of batches) {
      const batchResults = await Promise.allSettled(
        batch.map(async (c: any) => {
          if (c.State !== 'running') {
            return {
              id: c.Id?.substring(0, 12) || '',
              name: (c.Names?.[0] || '').replace(/^\//, ''),
              status: c.Status || '',
              state: c.State || '',
              image: c.Image || '',
              cpuPercent: 0,
              memoryUsageMb: 0,
              memoryLimitMb: 0,
              memoryPercent: 0,
              networkRxMb: 0,
              networkTxMb: 0,
              pids: 0,
              uptime: c.Status || '',
            } as ContainerStats;
          }
          const stats = await dockerGet(`/containers/${c.Id}/stats?stream=false`);
          return parseDockerStats(stats, c.Names?.[0] || '', c);
        })
      );
      for (const r of batchResults) {
        if (r.status === 'fulfilled' && r.value) results.push(r.value);
      }
    }

    containerStatsCache = results;
    containerStatsCacheTime = now;
    return results;
  } catch (err) {
    console.error('[Circuit Metrics] Docker stats collection failed:', err);
    return containerStatsCache; // Return stale cache on error
  }
}

// All container resource stats
app.get('/containers/stats', async (_req: Request, res: Response) => {
  try {
    const stats = await collectContainerStats();
    const totalCpu = stats.reduce((s, c) => s + c.cpuPercent, 0);
    const totalMem = stats.reduce((s, c) => s + c.memoryUsageMb, 0);
    const running = stats.filter(c => c.state === 'running').length;

    res.json({
      containers: stats,
      summary: {
        total: stats.length,
        running,
        stopped: stats.length - running,
        totalCpuPercent: Math.round(totalCpu * 100) / 100,
        totalMemoryMb: Math.round(totalMem * 10) / 10,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to collect container stats' });
  }
});

// Single container stats
app.get('/containers/:id/stats', async (req: Request, res: Response) => {
  try {
    const stats = await collectContainerStats();
    const container = stats.find(c => c.id === req.params.id || c.name === req.params.id);
    if (!container) {
      return res.status(404).json({ error: 'Container not found' });
    }
    res.json(container);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get container stats' });
  }
});

// Prometheus metrics for container resources
app.get('/metrics/containers', async (_req: Request, res: Response) => {
  const stats = await collectContainerStats();
  let metrics = '';

  metrics += '# HELP aims_container_cpu_percent Container CPU usage percentage\n';
  metrics += '# TYPE aims_container_cpu_percent gauge\n';
  for (const c of stats) {
    metrics += `aims_container_cpu_percent{container="${c.name}"} ${c.cpuPercent}\n`;
  }

  metrics += '\n# HELP aims_container_memory_mb Container memory usage in MB\n';
  metrics += '# TYPE aims_container_memory_mb gauge\n';
  for (const c of stats) {
    metrics += `aims_container_memory_mb{container="${c.name}"} ${c.memoryUsageMb}\n`;
  }

  metrics += '\n# HELP aims_container_memory_percent Container memory usage percentage\n';
  metrics += '# TYPE aims_container_memory_percent gauge\n';
  for (const c of stats) {
    metrics += `aims_container_memory_percent{container="${c.name}"} ${c.memoryPercent}\n`;
  }

  metrics += '\n# HELP aims_container_pids Container process count\n';
  metrics += '# TYPE aims_container_pids gauge\n';
  for (const c of stats) {
    metrics += `aims_container_pids{container="${c.name}"} ${c.pids}\n`;
  }

  res.set('Content-Type', 'text/plain');
  res.send(metrics);
});

// Individual service status
app.get('/status/:service', async (req: Request, res: Response) => {
  const { service } = req.params;
  const svc = SERVICES[service];

  if (!svc) {
    return res.status(404).json({ error: 'Service not found', available: Object.keys(SERVICES) });
  }

  const health = await checkServiceHealth(service, svc.url, svc.type);
  res.json(health);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Circuit Metrics] Running on port ${PORT}`);
  console.log(`[Circuit Metrics] Monitoring ${Object.keys(SERVICES).length} services`);

  // Initial health check
  checkAllServices().then(results => {
    console.log('[Circuit Metrics] Initial health check:');
    results.forEach(s => console.log(`  ${s.name} (${s.type}): ${s.status}`));
  });

  // Periodic health checks every 30 seconds
  setInterval(checkAllServices, 30000);
});
