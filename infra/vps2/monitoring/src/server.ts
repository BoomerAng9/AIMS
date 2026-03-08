/**
 * A.I.M.S. VPS2 Monitoring Agent
 * Reports system metrics and Docker container health to VPS1
 */

import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { readFile } from 'fs/promises';
import { execSync } from 'child_process';

const app = new Hono();
const PORT = parseInt(process.env.PORT || '4300');
const VPS1_METRICS_URL = process.env.VPS1_METRICS_URL || 'http://10.0.0.1:3001/api/v1/metrics/vps2';
const REPORT_INTERVAL = parseInt(process.env.REPORT_INTERVAL || '15000');
const HOSTNAME = process.env.HOSTNAME || 'vps2-sandbox';

interface SystemMetrics {
  timestamp: string;
  hostname: string;
  cpu: { loadAvg: number[]; cores: number };
  memory: { totalMB: number; usedMB: number; freeMB: number; percent: number };
  disk: { totalGB: number; usedGB: number; freeGB: number; percent: number };
  containers: Array<{
    name: string;
    status: string;
    image: string;
    ports: string;
  }>;
  wireguard: { up: boolean; peerConnected: boolean; latestHandshake: string | null };
  uptime: number;
}

async function getMemoryInfo(): Promise<SystemMetrics['memory']> {
  try {
    const meminfo = await readFile('/host/proc/meminfo', 'utf-8');
    const total = parseInt(meminfo.match(/MemTotal:\s+(\d+)/)?.[1] || '0') / 1024;
    const free = parseInt(meminfo.match(/MemAvailable:\s+(\d+)/)?.[1] || '0') / 1024;
    const used = total - free;
    return { totalMB: Math.round(total), usedMB: Math.round(used), freeMB: Math.round(free), percent: Math.round((used / total) * 100) };
  } catch {
    return { totalMB: 0, usedMB: 0, freeMB: 0, percent: 0 };
  }
}

function getDiskInfo(): SystemMetrics['disk'] {
  try {
    const output = execSync("df -BG / | tail -1", { encoding: 'utf-8' });
    const parts = output.trim().split(/\s+/);
    const total = parseInt(parts[1]);
    const used = parseInt(parts[2]);
    const free = parseInt(parts[3]);
    const percent = parseInt(parts[4]);
    return { totalGB: total, usedGB: used, freeGB: free, percent };
  } catch {
    return { totalGB: 0, usedGB: 0, freeGB: 0, percent: 0 };
  }
}

function getContainers(): SystemMetrics['containers'] {
  try {
    const output = execSync(
      'docker ps --format "{{.Names}}|{{.Status}}|{{.Image}}|{{.Ports}}"',
      { encoding: 'utf-8' }
    );
    return output.trim().split('\n').filter(Boolean).map(line => {
      const [name, status, image, ports] = line.split('|');
      return { name, status, image, ports: ports || '' };
    });
  } catch {
    return [];
  }
}

function getWireGuardStatus(): SystemMetrics['wireguard'] {
  try {
    const output = execSync('wg show wg0 2>/dev/null', { encoding: 'utf-8' });
    const hasHandshake = output.includes('latest handshake');
    const handshakeMatch = output.match(/latest handshake: (.+)/);
    return {
      up: true,
      peerConnected: hasHandshake,
      latestHandshake: handshakeMatch?.[1] || null,
    };
  } catch {
    return { up: false, peerConnected: false, latestHandshake: null };
  }
}

async function collectMetrics(): Promise<SystemMetrics> {
  const loadAvg = await readFile('/host/proc/loadavg', 'utf-8').catch(() => '0 0 0');
  const loads = loadAvg.trim().split(' ').slice(0, 3).map(Number);

  return {
    timestamp: new Date().toISOString(),
    hostname: HOSTNAME,
    cpu: { loadAvg: loads, cores: 2 }, // KVM2
    memory: await getMemoryInfo(),
    disk: getDiskInfo(),
    containers: getContainers(),
    wireguard: getWireGuardStatus(),
    uptime: process.uptime(),
  };
}

async function reportToVPS1(): Promise<void> {
  try {
    const metrics = await collectMetrics();
    await fetch(VPS1_METRICS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metrics),
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    // VPS1 unreachable — log but don't crash
  }
}

// ─── Routes ──────────────────────────────────────
app.get('/health', (c) =>
  c.json({ status: 'ok', service: 'vps2-monitoring', timestamp: new Date().toISOString() })
);

app.get('/api/metrics', async (c) => {
  const metrics = await collectMetrics();
  return c.json(metrics);
});

app.get('/api/metrics/wireguard', (c) => {
  return c.json(getWireGuardStatus());
});

// ─── Bootstrap ──────────────────────────────────
async function main() {
  console.log(`[monitoring] Starting VPS2 monitoring agent`);
  console.log(`[monitoring] Reporting to ${VPS1_METRICS_URL} every ${REPORT_INTERVAL}ms`);

  // Start periodic reporting
  setInterval(reportToVPS1, REPORT_INTERVAL);
  reportToVPS1(); // immediate first report

  serve({ fetch: app.fetch, port: PORT }, (info) => {
    console.log(`[monitoring] ✓ Running at http://0.0.0.0:${info.port}`);
  });
}

main().catch((err) => {
  console.error('[monitoring] Fatal:', err);
  process.exit(1);
});
