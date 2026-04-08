/**
 * A.I.M.S. Plug Engine — HTTP Server
 * Hono-based REST API for plug lifecycle management
 */

import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';
import { loadState, getAllAllocations, getAvailableSlots } from './port-registry.js';
import {
  provisionPlug,
  stopPlug,
  startPlug,
  decommissionPlug,
  getPlug,
  listPlugs,
  checkPlugHealth,
} from './provisioner.js';
import { startHealthMonitor, runHealthChecks } from './health-monitor.js';

const app = new Hono();
const PORT = parseInt(process.env.PORT || '4200');

// Only allow requests from VPS1 WireGuard
app.use('*', cors({ origin: ['http://10.0.0.1:3001', 'http://10.0.0.1'] }));

// ─── Health ─────────────────────────────────────
app.get('/health', (c) =>
  c.json({ status: 'ok', service: 'plug-engine', timestamp: new Date().toISOString() })
);

// ─── Plug Lifecycle ─────────────────────────────
app.post('/api/plugs', async (c) => {
  try {
    const body = await c.req.json();
    const { name, image, env, healthEndpoint } = body;

    if (!name || !image) {
      return c.json({ error: 'name and image are required' }, 400);
    }

    const instance = await provisionPlug({ name, image, env, healthEndpoint });
    return c.json({ ok: true, plug: instance }, 201);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

app.get('/api/plugs', (c) => {
  return c.json({ plugs: listPlugs() });
});

app.get('/api/plugs/:id', (c) => {
  const plug = getPlug(c.req.param('id'));
  if (!plug) return c.json({ error: 'Not found' }, 404);
  return c.json({ plug });
});

app.post('/api/plugs/:id/stop', async (c) => {
  try {
    const plug = await stopPlug(c.req.param('id'));
    return c.json({ ok: true, plug });
  } catch (err: any) {
    return c.json({ error: err.message }, 400);
  }
});

app.post('/api/plugs/:id/start', async (c) => {
  try {
    const plug = await startPlug(c.req.param('id'));
    return c.json({ ok: true, plug });
  } catch (err: any) {
    return c.json({ error: err.message }, 400);
  }
});

app.delete('/api/plugs/:id', async (c) => {
  try {
    await decommissionPlug(c.req.param('id'));
    return c.json({ ok: true, message: 'Plug decommissioned' });
  } catch (err: any) {
    return c.json({ error: err.message }, 400);
  }
});

app.get('/api/plugs/:id/health', async (c) => {
  const healthy = await checkPlugHealth(c.req.param('id'));
  return c.json({ healthy });
});

// ─── Port Registry ──────────────────────────────
app.get('/api/ports', (c) => {
  return c.json({
    allocations: getAllAllocations(),
    availableSlots: getAvailableSlots(),
  });
});

// ─── System Health Report ───────────────────────
app.get('/api/health/report', async (c) => {
  const report = await runHealthChecks();
  return c.json(report);
});

// ─── Bootstrap ──────────────────────────────────
async function main() {
  console.log('[plug-engine] Loading port registry state...');
  await loadState();

  console.log('[plug-engine] Starting health monitor...');
  startHealthMonitor();

  console.log(`[plug-engine] Starting on port ${PORT}`);
  serve({ fetch: app.fetch, port: PORT }, (info) => {
    console.log(`[plug-engine] ✓ Running at http://0.0.0.0:${info.port}`);
  });
}

main().catch((err) => {
  console.error('[plug-engine] Fatal:', err);
  process.exit(1);
});
