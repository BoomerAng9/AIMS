/**
 * A.I.M.S. Plug Engine — Health Monitor
 * Periodic health checks for all running plugs, reports to VPS1
 */

import { listPlugs, checkPlugHealth } from './provisioner.js';

const VPS1_METRICS_URL = process.env.VPS1_URL
  ? `${process.env.VPS1_URL}/api/v1/metrics/vps2`
  : 'http://10.0.0.1:3001/api/v1/metrics/vps2';

const CHECK_INTERVAL = parseInt(process.env.HEALTH_CHECK_INTERVAL || '30000');
let timer: ReturnType<typeof setInterval> | null = null;

export interface HealthReport {
  timestamp: string;
  hostname: string;
  plugs: Array<{
    id: string;
    name: string;
    status: string;
    healthy: boolean;
    port: number | null;
    lastCheck: string | null;
  }>;
  system: {
    uptime: number;
    memoryUsage: NodeJS.MemoryUsage;
  };
}

async function runHealthChecks(): Promise<HealthReport> {
  const plugs = listPlugs();

  // Check health of all running plugs
  await Promise.allSettled(
    plugs.filter(p => p.status === 'running').map(p => checkPlugHealth(p.id))
  );

  const report: HealthReport = {
    timestamp: new Date().toISOString(),
    hostname: process.env.HOSTNAME || 'vps2-plug-engine',
    plugs: plugs.map(p => ({
      id: p.id,
      name: p.name,
      status: p.status,
      healthy: p.healthy,
      port: p.ports?.basePort || null,
      lastCheck: p.lastHealthCheck,
    })),
    system: {
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
    },
  };

  // Report to VPS1 (fire and forget)
  try {
    await fetch(VPS1_METRICS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report),
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    // VPS1 may not be reachable — that's okay
  }

  return report;
}

export function startHealthMonitor(): void {
  if (timer) return;
  console.log(`[health-monitor] Starting with ${CHECK_INTERVAL}ms interval`);
  timer = setInterval(() => {
    runHealthChecks().catch(err => {
      console.error('[health-monitor] Check failed:', err.message);
    });
  }, CHECK_INTERVAL);
  // Run immediately
  runHealthChecks().catch(() => {});
}

export function stopHealthMonitor(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

export { runHealthChecks };
