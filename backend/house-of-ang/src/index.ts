/**
 * House of Ang — Service Entry Point
 * REST API for BoomerAng discovery, routing, and invocation.
 */

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import {
  getRegistry,
  listBoomerAngs,
  getBoomerAng,
  findByCapability,
  watchRegistry,
  reloadRegistry,
} from './registry';
import { routeByCapabilities, routeByIntent, invokeBoomerAng, checkHealth } from './router';

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(bodyParser.json());

// --------------------------------------------------------------------------
// Health
// --------------------------------------------------------------------------
app.get('/health', (_req, res) => {
  const registry = getRegistry();
  res.json({
    status: 'House of Ang Online',
    registryVersion: registry.version,
    boomerangCount: registry.boomerangs.length,
  });
});

// --------------------------------------------------------------------------
// Discovery — List all BoomerAngs
// --------------------------------------------------------------------------
app.get('/boomerangs', (_req, res) => {
  res.json({ boomerangs: listBoomerAngs() });
});

// --------------------------------------------------------------------------
// Discovery — Get single BoomerAng
// --------------------------------------------------------------------------
app.get('/boomerangs/:id', (req, res) => {
  const ang = getBoomerAng(req.params.id);
  if (!ang) {
    return res.status(404).json({ error: `Boomer_Ang "${req.params.id}" not found` });
  }
  res.json(ang);
});

// --------------------------------------------------------------------------
// Discovery — Search by capability
// --------------------------------------------------------------------------
app.get('/capabilities/:capability', (req, res) => {
  const agents = findByCapability(req.params.capability);
  res.json({ capability: req.params.capability, agents });
});

// --------------------------------------------------------------------------
// Discovery — List all capabilities
// --------------------------------------------------------------------------
app.get('/capabilities', (_req, res) => {
  const registry = getRegistry();
  res.json({ capabilities: Object.keys(registry.capability_index) });
});

// --------------------------------------------------------------------------
// Routing — Resolve capabilities to BoomerAngs
// --------------------------------------------------------------------------
app.post('/route', (req, res) => {
  const { capabilities, intent } = req.body;

  if (intent) {
    const result = routeByIntent(intent);
    return res.json(result);
  }

  if (capabilities && Array.isArray(capabilities)) {
    const result = routeByCapabilities(capabilities);
    return res.json(result);
  }

  res.status(400).json({ error: 'Provide "capabilities" array or "intent" string' });
});

// --------------------------------------------------------------------------
// Invocation — Execute a BoomerAng
// --------------------------------------------------------------------------
app.post('/invoke/:id', async (req, res) => {
  const { user_id, intent, payload } = req.body;
  const result = await invokeBoomerAng(req.params.id, user_id, intent, payload || {});
  res.json(result);
});

// --------------------------------------------------------------------------
// Health Check — Single BoomerAng
// --------------------------------------------------------------------------
app.get('/boomerangs/:id/health', async (req, res) => {
  const result = await checkHealth(req.params.id);
  res.json(result);
});

// --------------------------------------------------------------------------
// Health Check — All BoomerAngs
// --------------------------------------------------------------------------
app.get('/health/all', async (_req, res) => {
  const all = listBoomerAngs();
  const results = await Promise.allSettled(
    all.map(b => checkHealth(b.id))
  );
  const statuses = results.map((r, i) =>
    r.status === 'fulfilled'
      ? r.value
      : { id: all[i].id, healthy: false, latencyMs: null }
  );
  res.json({ statuses });
});

// --------------------------------------------------------------------------
// Admin — Force reload registry
// --------------------------------------------------------------------------
app.post('/admin/reload', (_req, res) => {
  const registry = reloadRegistry();
  res.json({
    message: 'Registry reloaded',
    version: registry.version,
    count: registry.boomerangs.length,
  });
});

// --------------------------------------------------------------------------
// Start Server
// --------------------------------------------------------------------------
app.listen(PORT, () => {
  // Pre-load registry
  getRegistry();
  // Watch for changes in development
  watchRegistry();
  console.log(`\n>>> House of Ang running on port ${PORT}`);
  console.log(`>>> Registry API: http://localhost:${PORT}/boomerangs`);
  console.log(`>>> Routing API:  http://localhost:${PORT}/route\n`);
});
