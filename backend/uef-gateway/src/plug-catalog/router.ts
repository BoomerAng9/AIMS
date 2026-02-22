/**
 * Plug Catalog API Router — PaaS Operations
 *
 * Mounts all plug catalog, deploy engine, and instance management routes.
 * This is the real API layer that the frontend Deploy Dock connects to.
 *
 * Routes:
 *   GET  /api/plug-catalog                — Browse/search catalog
 *   GET  /api/plug-catalog/featured       — Featured plugs
 *   GET  /api/plug-catalog/categories     — List categories
 *   GET  /api/plug-catalog/:plugId        — Get plug details
 *   POST /api/plug-catalog/needs-analysis — Business needs questionnaire
 *
 *   POST /api/plug-instances/spin-up      — One-click deploy
 *   POST /api/plug-instances/export       — Export bundle
 *   GET  /api/plug-instances              — List user's instances
 *   GET  /api/plug-instances/:id          — Instance details
 *   GET  /api/plug-instances/:id/health   — Refresh health status
 *   POST /api/plug-instances/:id/stop     — Stop instance
 *   POST /api/plug-instances/:id/restart  — Restart instance
 *   DELETE /api/plug-instances/:id        — Decommission instance
 *
 *   GET  /api/plug-instances/containers   — List all AIMS-managed containers
 */

import { Router } from 'express';
import { plugCatalog } from './catalog';
import { plugDeployEngine } from './deploy-engine';
import { needsAnalysis } from './needs-analysis';
import { dockerRuntime } from './docker-runtime';
import { instanceLifecycle } from './instance-lifecycle';
import { healthMonitor } from './health-monitor';
import { portAllocator } from './port-allocator';
import logger from '../logger';

export const plugRouter = Router();

// ---------------------------------------------------------------------------
// Catalog — Browse & Search
// ---------------------------------------------------------------------------

plugRouter.get('/plug-catalog', (req, res) => {
  try {
    const { q, category, tier, delivery, featured, tags } = req.query;

    const result = plugCatalog.search({
      q: q as string,
      category: category as any,
      tier: tier as any,
      delivery: delivery as any,
      featured: featured === 'true' ? true : featured === 'false' ? false : undefined,
      tags: tags ? (tags as string).split(',') : undefined,
    });

    res.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Catalog search failed';
    logger.error({ err }, '[PlugRouter] Catalog search error');
    res.status(500).json({ error: msg });
  }
});

plugRouter.get('/plug-catalog/featured', (_req, res) => {
  const featured = plugCatalog.getFeatured();
  res.json({ plugs: featured, count: featured.length });
});

plugRouter.get('/plug-catalog/categories', (_req, res) => {
  const categories = plugCatalog.getCategories();
  res.json({ categories });
});

plugRouter.get('/plug-catalog/:plugId', (req, res) => {
  const plug = plugCatalog.get(req.params.plugId);
  if (!plug) {
    res.status(404).json({ error: `Plug "${req.params.plugId}" not found` });
    return;
  }
  res.json({ plug });
});

// ---------------------------------------------------------------------------
// Needs Analysis — Business Intake
// ---------------------------------------------------------------------------

plugRouter.get('/plug-catalog/needs/questions', (_req, res) => {
  const questions = needsAnalysis.getQuestions();
  res.json({ questions });
});

plugRouter.post('/plug-catalog/needs/analyze', (req, res) => {
  try {
    const { userId, companyName, responses } = req.body;
    if (!userId || !responses) {
      res.status(400).json({ error: 'userId and responses are required' });
      return;
    }
    const result = needsAnalysis.analyze(userId, responses);
    res.json({ analysis: result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Analysis failed';
    res.status(500).json({ error: msg });
  }
});

// ---------------------------------------------------------------------------
// Instances — Deploy, Manage, Decommission
// ---------------------------------------------------------------------------

plugRouter.post('/plug-instances/spin-up', async (req, res) => {
  try {
    const { plugId, userId, instanceName, deliveryMode, customizations, envOverrides, securityLevel, domain, allowExperimental } = req.body;

    if (!plugId || !userId || !instanceName) {
      res.status(400).json({ error: 'plugId, userId, and instanceName are required' });
      return;
    }

    const result = await plugDeployEngine.spinUp({
      plugId,
      userId,
      instanceName,
      deliveryMode: deliveryMode || 'hosted',
      customizations: customizations || {},
      envOverrides: envOverrides || {},
      securityLevel,
      domain,
      allowExperimental: allowExperimental || false,
    });

    res.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Spin-up failed';
    logger.error({ err }, '[PlugRouter] Spin-up error');
    res.status(500).json({ error: msg });
  }
});

plugRouter.post('/plug-instances/export', async (req, res) => {
  try {
    const { instanceId, format, includeData } = req.body;

    if (!instanceId) {
      res.status(400).json({ error: 'instanceId is required' });
      return;
    }

    const result = await plugDeployEngine.export({
      instanceId,
      format: format || 'docker-compose',
      includeData: includeData || false,
    });

    res.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Export failed';
    logger.error({ err }, '[PlugRouter] Export error');
    res.status(500).json({ error: msg });
  }
});

plugRouter.get('/plug-instances', (req, res) => {
  const userId = req.query.userId as string;
  if (!userId) {
    res.status(400).json({ error: 'userId query parameter is required' });
    return;
  }
  const instances = plugDeployEngine.listByUser(userId);
  res.json({ instances, count: instances.length });
});

plugRouter.get('/plug-instances/containers', async (_req, res) => {
  try {
    const containers = await dockerRuntime.listManagedContainers();
    res.json({ containers, count: containers.length });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to list containers';
    res.status(500).json({ error: msg });
  }
});

plugRouter.get('/plug-instances/:id', (req, res) => {
  const instance = plugDeployEngine.getInstance(req.params.id);
  if (!instance) {
    res.status(404).json({ error: 'Instance not found' });
    return;
  }
  const plug = plugCatalog.get(instance.plugId);
  res.json({ instance, plug });
});

plugRouter.get('/plug-instances/:id/health', async (req, res) => {
  try {
    const instance = await plugDeployEngine.refreshInstanceHealth(req.params.id);
    if (!instance) {
      res.status(404).json({ error: 'Instance not found' });
      return;
    }
    res.json({
      instanceId: instance.instanceId,
      healthStatus: instance.healthStatus,
      uptimeSeconds: instance.uptimeSeconds,
      lastHealthCheck: instance.lastHealthCheck,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Health check failed';
    res.status(500).json({ error: msg });
  }
});

plugRouter.post('/plug-instances/:id/stop', async (req, res) => {
  try {
    const instance = await plugDeployEngine.stopInstance(req.params.id);
    res.json({ instance });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Stop failed';
    res.status(500).json({ error: msg });
  }
});

plugRouter.post('/plug-instances/:id/restart', async (req, res) => {
  try {
    const instance = await plugDeployEngine.restartInstance(req.params.id);
    res.json({ instance });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Restart failed';
    res.status(500).json({ error: msg });
  }
});

/**
 * Full decommission — stops container, removes DNS, releases port, cleans up.
 * DELETE /api/plug-instances/:id
 */
plugRouter.delete('/plug-instances/:id', async (req, res) => {
  try {
    const result = await instanceLifecycle.decommission(req.params.id);
    if (!result.fullyDecommissioned && result.steps[0]?.detail === 'Instance not found') {
      res.status(404).json({ error: 'Instance not found' });
      return;
    }
    res.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Decommission failed';
    res.status(500).json({ error: msg });
  }
});

// ---------------------------------------------------------------------------
// PaaS Operations — Lifecycle, Health, Ports
// ---------------------------------------------------------------------------

/**
 * Platform operations dashboard.
 * GET /api/plug-operations/stats
 */
plugRouter.get('/plug-operations/stats', (_req, res) => {
  try {
    const stats = instanceLifecycle.getStats();
    res.json(stats);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Stats failed';
    res.status(500).json({ error: msg });
  }
});

/**
 * Health monitor status and recent events.
 * GET /api/plug-operations/health
 */
plugRouter.get('/plug-operations/health', (_req, res) => {
  const stats = healthMonitor.getStats();
  const events = healthMonitor.getRecentEvents(50);
  const statuses = healthMonitor.getAllStatuses();
  res.json({ stats, events, statuses, running: healthMonitor.isRunning() });
});

/**
 * Trigger a manual health sweep.
 * POST /api/plug-operations/health/sweep
 */
plugRouter.post('/plug-operations/health/sweep', async (_req, res) => {
  try {
    const events = await healthMonitor.sweep();
    res.json({ events, count: events.length });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Sweep failed';
    res.status(500).json({ error: msg });
  }
});

/**
 * Port allocation status.
 * GET /api/plug-operations/ports
 */
plugRouter.get('/plug-operations/ports', (_req, res) => {
  const capacity = portAllocator.getCapacity();
  const allocations = portAllocator.getAllocations();
  res.json({ capacity, allocations, count: allocations.length });
});

/**
 * Reconcile port allocations with Docker state.
 * POST /api/plug-operations/reconcile
 */
plugRouter.post('/plug-operations/reconcile', async (_req, res) => {
  try {
    await instanceLifecycle.reconcile();
    const stats = instanceLifecycle.getStats();
    res.json({ reconciled: true, stats });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Reconciliation failed';
    res.status(500).json({ error: msg });
  }
});

// ---------------------------------------------------------------------------
// Docker status
// ---------------------------------------------------------------------------

plugRouter.get('/docker/status', async (_req, res) => {
  const available = await dockerRuntime.isAvailable();
  res.json({ dockerAvailable: available });
});
