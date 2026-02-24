/**
 * Factory Controller Router
 *
 * Express router exposing the factory controller as HTTP endpoints.
 * Mounted on the UEF Gateway at /factory.
 *
 * Provides endpoints for:
 * - Factory status and control
 * - Event ingestion (from webhooks, n8n, UI)
 * - FDH run management (approve, reject, pause, resume)
 * - Chamber management
 * - Policy management (owner only)
 */

import { Router, Request, Response } from 'express';
import { getFactoryController } from './controller';
import { v4 as uuidv4 } from 'uuid';
import type { FactoryEvent, FactoryEventSource } from './types';

const router = Router();

// ── Factory Status ───────────────────────────────────────────

/**
 * GET /factory/status
 * Returns the current factory controller status.
 */
router.get('/status', (_req: Request, res: Response) => {
  const controller = getFactoryController();
  const status = controller.getStatus();
  res.json(status);
});

/**
 * GET /factory/health
 * Health check for the factory controller.
 */
router.get('/health', (_req: Request, res: Response) => {
  const controller = getFactoryController();
  const status = controller.getStatus();
  res.json({
    service: 'Factory Controller',
    status: status.factoryEnabled ? 'online' : 'paused',
    activeFdhRuns: status.activeFdhRuns,
    pendingApprovals: status.pendingApprovals,
    uptime: status.uptime,
  });
});

// ── Factory Control ──────────────────────────────────────────

/**
 * POST /factory/start
 * Start the factory controller.
 */
router.post('/start', (_req: Request, res: Response) => {
  const controller = getFactoryController();
  controller.start();
  res.json({ status: 'started', message: 'Factory controller is now active' });
});

/**
 * POST /factory/pause
 * Pause the factory controller (keeps state, stops processing).
 */
router.post('/pause', (_req: Request, res: Response) => {
  const controller = getFactoryController();
  controller.pause();
  res.json({ status: 'paused', message: 'Factory controller paused — no new events will be processed' });
});

/**
 * POST /factory/resume
 * Resume the factory controller after pause.
 */
router.post('/resume', (_req: Request, res: Response) => {
  const controller = getFactoryController();
  controller.resume();
  res.json({ status: 'resumed', message: 'Factory controller resumed — processing events' });
});

// ── Event Ingestion ──────────────────────────────────────────

/**
 * POST /factory/event
 * Ingest an event from any source (webhooks, n8n, UI).
 * This is the primary entry point for the factory loop.
 */
router.post('/event', async (req: Request, res: Response) => {
  try {
    const body = req.body;

    const event: FactoryEvent = {
      id: body.id || `evt_${uuidv4()}`,
      source: body.source as FactoryEventSource || 'user',
      type: body.type || 'manual',
      payload: body.payload || body,
      chamberId: body.chamberId,
      userId: body.userId,
      timestamp: body.timestamp || new Date().toISOString(),
      priority: body.priority || 'normal',
    };

    const controller = getFactoryController();
    const result = await controller.ingestEvent(event);

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ accepted: false, reason: err.message });
  }
});

/**
 * POST /factory/manage-it
 * "Let ACHEEVY Manage It" — user hands off a task to the factory.
 * This creates an event from a user request and enters Factory Controller mode.
 */
router.post('/manage-it', async (req: Request, res: Response) => {
  try {
    const { userId, message, scope, chamberId, context } = req.body;

    if (!message && !scope) {
      return res.status(400).json({ accepted: false, reason: 'Message or scope is required' });
    }

    const event: FactoryEvent = {
      id: `evt_manage_${uuidv4()}`,
      source: 'user',
      type: 'manage_it',
      payload: {
        message: message || scope,
        scope: scope || message,
        context: context || {},
      },
      chamberId: chamberId || `chamber_${uuidv4()}`,
      userId: userId || 'anon',
      timestamp: new Date().toISOString(),
      priority: 'normal',
    };

    const controller = getFactoryController();
    const result = await controller.ingestEvent(event);

    res.json({
      ...result,
      mode: 'factory_controller',
      message: result.awaitingApproval
        ? 'FDH manifest created — awaiting your approval before execution.'
        : 'Task accepted — ACHEEVY is managing it. You\'ll be notified at key milestones.',
    });
  } catch (err: any) {
    res.status(500).json({ accepted: false, reason: err.message });
  }
});

// ── FDH Run Management ──────────────────────────────────────

/**
 * GET /factory/runs
 * List active FDH runs.
 */
router.get('/runs', (_req: Request, res: Response) => {
  const controller = getFactoryController();
  const runs = controller.getActiveRuns();
  res.json({
    active: runs.length,
    runs: runs.map(r => ({
      id: r.id,
      status: r.status,
      phase: r.currentPhase,
      scope: r.manifest.scope,
      lucEstimate: r.manifest.lucEstimate,
      lucActual: r.lucActual,
      startedAt: r.startedAt,
      updatedAt: r.updatedAt,
    })),
  });
});

/**
 * GET /factory/runs/:runId
 * Get a specific FDH run.
 */
router.get('/runs/:runId', (req: Request, res: Response) => {
  try {
    const controller = getFactoryController();
    const run = controller.getRun(req.params.runId);
    res.json(run);
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

/**
 * POST /factory/runs/:runId/approve
 * Approve a pending FDH run (HITL gate).
 */
router.post('/runs/:runId/approve', async (req: Request, res: Response) => {
  try {
    const controller = getFactoryController();
    const run = await controller.approveRun(req.params.runId);
    res.json({
      approved: true,
      runId: run.id,
      status: run.status,
      message: 'FDH run approved — execution proceeding.',
    });
  } catch (err: any) {
    res.status(400).json({ approved: false, error: err.message });
  }
});

/**
 * POST /factory/runs/:runId/reject
 * Reject a pending FDH run.
 */
router.post('/runs/:runId/reject', (req: Request, res: Response) => {
  try {
    const reason = req.body.reason || 'No reason provided';
    const controller = getFactoryController();
    const run = controller.rejectRun(req.params.runId, reason);
    res.json({
      rejected: true,
      runId: run.id,
      reason,
    });
  } catch (err: any) {
    res.status(400).json({ rejected: false, error: err.message });
  }
});

/**
 * POST /factory/runs/:runId/pause
 * Pause an active FDH run.
 */
router.post('/runs/:runId/pause', (req: Request, res: Response) => {
  try {
    const controller = getFactoryController();
    const run = controller.getRun(req.params.runId);
    // Use pipeline directly for run-level pause
    run.status = 'paused';
    res.json({ paused: true, runId: run.id });
  } catch (err: any) {
    res.status(400).json({ paused: false, error: err.message });
  }
});

// ── Chamber Management ──────────────────────────────────────

/**
 * GET /factory/chambers
 * List all chambers.
 */
router.get('/chambers', (_req: Request, res: Response) => {
  const controller = getFactoryController();
  const chambers = controller.listChambers();
  res.json({ count: chambers.length, chambers });
});

/**
 * POST /factory/chambers/:chamberId/status
 * Update chamber status.
 */
router.post('/chambers/:chamberId/status', (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const controller = getFactoryController();
    const chamber = controller.setChamberStatus(req.params.chamberId, status);
    res.json(chamber);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ── Policy Management ────────────────────────────────────────

/**
 * GET /factory/policy
 * Get current factory policy.
 */
router.get('/policy', (_req: Request, res: Response) => {
  const controller = getFactoryController();
  res.json(controller.getPolicy());
});

/**
 * PATCH /factory/policy
 * Update factory policy (owner only).
 */
router.patch('/policy', (req: Request, res: Response) => {
  const controller = getFactoryController();
  const updated = controller.updatePolicy(req.body);
  res.json({ updated: true, policy: updated });
});

export { router as factoryRouter };
