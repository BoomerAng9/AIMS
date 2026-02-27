/**
 * LUC-Stripe Bridge — LUC as the Policy Layer over Stripe
 *
 * LUC decides "can this happen?" and "how much does it cost?"
 * Stripe processes the actual money.
 *
 * Every billable action in A.I.M.S. flows through this bridge:
 *   1. LUC.canExecute()  → quota/permission check
 *   2. LUC.estimate()    → show cost before committing
 *   3. Execute the capability
 *   4. LUC.recordUsage() → debit the account
 *   5. Stripe charges overage / processes payment when needed
 *
 * Paperform submissions and Stepper workflow runs are metered
 * through the same pipeline as every other billable capability.
 */

import { Router, Request, Response } from 'express';
import {
  canExecute,
  estimate,
  recordUsage,
  creditUsage,
  generateSummary,
  generateLucState,
  initializeQuotas,
  isValidServiceKey,
  SERVICE_KEYS,
  SERVICE_CATALOG,
  PLAN_MULTIPLIERS,
  PLAN_IDS,
  type ServiceKey,
  type PlanId,
  type LucAccount,
} from './luc-engine';
import { v4 as uuidv4 } from 'uuid';
import { billingProvisions } from './persistence';
import logger from '../logger';

// ---------------------------------------------------------------------------
// In-memory LUC Account Store (backed by billing provisions from Stripe)
// Production would use Redis or Firestore — this keeps it simple for now.
// ---------------------------------------------------------------------------

const lucAccounts = new Map<string, LucAccount>();

/**
 * Base quota limits per service (multiplied by plan multiplier).
 * P2P gets limit=-1 (metered, no included allocation).
 */
const BASE_LIMITS: Record<ServiceKey, number> = {
  [SERVICE_KEYS.LLM_TOKENS_IN]: 50_000,
  [SERVICE_KEYS.LLM_TOKENS_OUT]: 25_000,
  [SERVICE_KEYS.N8N_EXECUTIONS]: 50,
  [SERVICE_KEYS.NODE_RUNTIME_SECONDS]: 3600,
  [SERVICE_KEYS.SWARM_CYCLES]: 10,
  [SERVICE_KEYS.BRAVE_QUERIES]: 200,
  [SERVICE_KEYS.VOICE_CHARS]: 50_000,
  [SERVICE_KEYS.STT_MINUTES]: 30,
  [SERVICE_KEYS.CONTAINER_HOURS]: 100,
  [SERVICE_KEYS.STORAGE_GB_MONTH]: 5,
  [SERVICE_KEYS.BANDWIDTH_GB]: 10,
  [SERVICE_KEYS.BOOMER_ANG_INVOCATIONS]: 100,
  [SERVICE_KEYS.AGENT_EXECUTIONS]: 200,
  [SERVICE_KEYS.DEPLOY_OPERATIONS]: 20,
  [SERVICE_KEYS.FORM_SUBMISSIONS]: 100,
  [SERVICE_KEYS.STEPPER_RUNS]: 50,
  [SERVICE_KEYS.VIDEO_GENERATIONS]: 10,
  [SERVICE_KEYS.IMAGE_GENERATIONS]: 50,
  [SERVICE_KEYS.API_CALLS]: 1000,
};

/**
 * Get or create a LUC account for a user.
 * Syncs with Stripe billing provisions to determine the active plan.
 */
function getOrCreateAccount(userId: string): LucAccount {
  const existing = lucAccounts.get(userId);
  if (existing) return existing;

  // Look up Stripe provision to determine plan
  const provision = billingProvisions.get(userId);
  const planId = (provision?.tierId || 'p2p') as PlanId;
  const multiplier = PLAN_MULTIPLIERS[planId] ?? 1;

  // Build quota limits: P2P gets -1 (metered), others get base * multiplier
  const limits: Record<string, number> = {};
  for (const [key, base] of Object.entries(BASE_LIMITS)) {
    limits[key] = planId === 'p2p' ? -1 : Math.round(base * multiplier);
  }

  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setDate(periodEnd.getDate() + 30);

  const account: LucAccount = {
    id: uuidv4(),
    workspaceId: userId,
    planId,
    status: 'active',
    quotas: initializeQuotas(limits as Record<ServiceKey, number>),
    overagePolicy: planId === 'enterprise' ? 'soft_limit' : planId === 'p2p' ? 'allow_overage' : 'block',
    periodStart: now.toISOString(),
    periodEnd: periodEnd.toISOString(),
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  lucAccounts.set(userId, account);
  return account;
}

/**
 * Apply a quota update to the cached account after recording usage.
 */
function applyQuotaUpdate(userId: string, serviceKey: ServiceKey, updatedQuota: any): void {
  const account = lucAccounts.get(userId);
  if (account) {
    account.quotas[serviceKey] = updatedQuota;
  }
}

// ---------------------------------------------------------------------------
// LUC-Stripe Bridge Router
// ---------------------------------------------------------------------------

export const lucStripeBridgeRouter = Router();

/**
 * POST /api/billing/gate
 *
 * The universal billing gate. Every billable action calls this BEFORE executing.
 * Returns whether the action is allowed and what it will cost.
 *
 * Body: { userId, serviceKey, units, dryRun? }
 */
lucStripeBridgeRouter.post('/api/billing/gate', (req: Request, res: Response) => {
  const { userId, serviceKey, units = 1, dryRun = false } = req.body;

  if (!userId || !serviceKey) {
    res.status(400).json({ error: 'userId and serviceKey are required' });
    return;
  }

  if (!isValidServiceKey(serviceKey)) {
    res.status(400).json({ error: `Unknown service key: ${serviceKey}` });
    return;
  }

  const account = getOrCreateAccount(userId);
  const check = canExecute(account, serviceKey as ServiceKey, units);

  if (dryRun) {
    // Estimate mode — show cost without committing
    const est = estimate(account, {
      services: [{ serviceKey: serviceKey as ServiceKey, units }],
    });

    res.json({
      allowed: check.canExecute,
      estimate: est,
      quota: {
        remaining: check.quotaRemaining,
        limit: check.quotaLimit,
        percentUsed: check.percentUsed,
        warningLevel: check.warningLevel,
      },
      warning: check.warning,
    });
    return;
  }

  if (!check.canExecute) {
    res.status(402).json({
      error: 'Quota exceeded',
      reason: check.reason,
      quota: {
        remaining: check.quotaRemaining,
        limit: check.quotaLimit,
        percentUsed: check.percentUsed,
      },
      warning: check.warning,
      upgradeUrl: '/pricing',
    });
    return;
  }

  res.json({
    allowed: true,
    quota: {
      remaining: check.quotaRemaining,
      limit: check.quotaLimit,
      percentUsed: check.percentUsed,
      warningLevel: check.warningLevel,
    },
    warning: check.warning,
  });
});

/**
 * POST /api/billing/record
 *
 * Record actual usage after a capability has been executed.
 * This is the "debit" side — called AFTER the action succeeds.
 *
 * Body: { userId, serviceKey, units, requestId?, metadata? }
 */
lucStripeBridgeRouter.post('/api/billing/record', (req: Request, res: Response) => {
  const { userId, serviceKey, units, requestId, metadata } = req.body;

  if (!userId || !serviceKey || !units) {
    res.status(400).json({ error: 'userId, serviceKey, and units are required' });
    return;
  }

  if (!isValidServiceKey(serviceKey)) {
    res.status(400).json({ error: `Unknown service key: ${serviceKey}` });
    return;
  }

  const account = getOrCreateAccount(userId);

  try {
    const { updatedQuota, event, response } = recordUsage(account, {
      workspaceId: userId,
      userId,
      serviceKey: serviceKey as ServiceKey,
      units,
      requestId,
      metadata,
    });

    // Update cached account
    applyQuotaUpdate(userId, serviceKey as ServiceKey, updatedQuota);

    logger.info({
      userId,
      serviceKey,
      units,
      eventId: event.id,
      cost: event.cost,
      percentUsed: response.percentUsed,
    }, '[LUC-Stripe Bridge] Usage recorded');

    res.json(response);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/billing/credit
 *
 * Refund/rollback usage (e.g., failed execution, customer dispute).
 *
 * Body: { userId, serviceKey, units, reason, originalEventId? }
 */
lucStripeBridgeRouter.post('/api/billing/credit', (req: Request, res: Response) => {
  const { userId, serviceKey, units, reason, originalEventId } = req.body;

  if (!userId || !serviceKey || !units || !reason) {
    res.status(400).json({ error: 'userId, serviceKey, units, and reason are required' });
    return;
  }

  const account = getOrCreateAccount(userId);

  try {
    const { updatedQuota, response } = creditUsage(account, {
      workspaceId: userId,
      userId,
      serviceKey: serviceKey as ServiceKey,
      units,
      reason,
      originalEventId,
    });

    applyQuotaUpdate(userId, serviceKey as ServiceKey, updatedQuota);

    logger.info({ userId, serviceKey, units, reason }, '[LUC-Stripe Bridge] Usage credited');

    res.json(response);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/billing/summary/:userId
 *
 * Full billing summary for the current period.
 */
lucStripeBridgeRouter.get('/api/billing/summary/:userId', (req: Request, res: Response) => {
  const account = getOrCreateAccount(req.params.userId);
  const summary = generateSummary(account);
  res.json(summary);
});

/**
 * GET /api/billing/state/:userId
 *
 * LUC state for the UI status strip — compact, real-time quota overview.
 */
lucStripeBridgeRouter.get('/api/billing/state/:userId', (req: Request, res: Response) => {
  const account = getOrCreateAccount(req.params.userId);
  const state = generateLucState(account);
  res.json(state);
});

// ---------------------------------------------------------------------------
// Paperform + Stepper LUC Gating
// ---------------------------------------------------------------------------

/**
 * POST /api/billing/gate/form-submission
 *
 * Gate a Paperform form submission through LUC before processing.
 * Called when a form submission is received from Pipedream/Stepper.
 *
 * Body: { userId, formId, formSlug }
 */
lucStripeBridgeRouter.post('/api/billing/gate/form-submission', (req: Request, res: Response) => {
  const { userId, formId, formSlug } = req.body;

  if (!userId) {
    res.status(400).json({ error: 'userId is required' });
    return;
  }

  const account = getOrCreateAccount(userId);
  const check = canExecute(account, SERVICE_KEYS.FORM_SUBMISSIONS, 1);

  if (!check.canExecute) {
    logger.warn({ userId, formId, formSlug }, '[LUC-Stripe Bridge] Form submission blocked by quota');
    res.status(402).json({
      error: 'Form submission quota exceeded',
      reason: check.reason,
      quota: {
        remaining: check.quotaRemaining,
        percentUsed: check.percentUsed,
      },
      upgradeUrl: '/pricing',
    });
    return;
  }

  // Record the submission
  const { updatedQuota, event, response } = recordUsage(account, {
    workspaceId: userId,
    userId,
    serviceKey: SERVICE_KEYS.FORM_SUBMISSIONS,
    units: 1,
    metadata: { formId, formSlug },
  });

  applyQuotaUpdate(userId, SERVICE_KEYS.FORM_SUBMISSIONS, updatedQuota);

  logger.info({ userId, formId, eventId: event.id }, '[LUC-Stripe Bridge] Form submission metered');

  res.json({
    allowed: true,
    eventId: event.id,
    quota: {
      remaining: response.quotaRemaining,
      percentUsed: response.percentUsed,
    },
  });
});

/**
 * POST /api/billing/gate/stepper-run
 *
 * Gate a Stepper workflow execution through LUC before running.
 * Each step in the workflow may have its own cost; this gates the run start.
 *
 * Body: { userId, workflowId, stepCount, estimatedCredits? }
 */
lucStripeBridgeRouter.post('/api/billing/gate/stepper-run', (req: Request, res: Response) => {
  const { userId, workflowId, stepCount = 1, estimatedCredits } = req.body;

  if (!userId || !workflowId) {
    res.status(400).json({ error: 'userId and workflowId are required' });
    return;
  }

  const account = getOrCreateAccount(userId);

  // Estimate total cost: stepper run + any AI steps (LLM tokens) + API calls
  const services = [
    { serviceKey: SERVICE_KEYS.STEPPER_RUNS as ServiceKey, units: 1 },
  ];

  // If the workflow has AI steps, estimate token usage too
  if (estimatedCredits && estimatedCredits > 0) {
    // Rough estimate: 1 credit ≈ 1000 tokens
    services.push({
      serviceKey: SERVICE_KEYS.LLM_TOKENS_OUT as ServiceKey,
      units: Math.round(estimatedCredits * 1000),
    });
  }

  const est = estimate(account, { services });
  const check = canExecute(account, SERVICE_KEYS.STEPPER_RUNS, 1);

  if (!check.canExecute) {
    logger.warn({ userId, workflowId }, '[LUC-Stripe Bridge] Stepper run blocked by quota');
    res.status(402).json({
      error: 'Stepper workflow quota exceeded',
      reason: check.reason,
      estimate: est,
      upgradeUrl: '/pricing',
    });
    return;
  }

  // Record the workflow run
  const { updatedQuota, event, response } = recordUsage(account, {
    workspaceId: userId,
    userId,
    serviceKey: SERVICE_KEYS.STEPPER_RUNS,
    units: 1,
    metadata: { workflowId, stepCount: String(stepCount) },
  });

  applyQuotaUpdate(userId, SERVICE_KEYS.STEPPER_RUNS, updatedQuota);

  logger.info({
    userId, workflowId, eventId: event.id, stepCount,
  }, '[LUC-Stripe Bridge] Stepper run metered');

  res.json({
    allowed: true,
    eventId: event.id,
    estimate: est,
    quota: {
      remaining: response.quotaRemaining,
      percentUsed: response.percentUsed,
    },
  });
});

/**
 * POST /api/billing/gate/media
 *
 * Gate a video or image generation through LUC.
 *
 * Body: { userId, type: 'video' | 'image', count?, provider?, model? }
 */
lucStripeBridgeRouter.post('/api/billing/gate/media', (req: Request, res: Response) => {
  const { userId, type, count = 1, provider, model } = req.body;

  if (!userId || !type) {
    res.status(400).json({ error: 'userId and type are required' });
    return;
  }

  const serviceKey = type === 'video'
    ? SERVICE_KEYS.VIDEO_GENERATIONS
    : SERVICE_KEYS.IMAGE_GENERATIONS;

  const account = getOrCreateAccount(userId);
  const check = canExecute(account, serviceKey, count);

  if (!check.canExecute) {
    res.status(402).json({
      error: `${type} generation quota exceeded`,
      reason: check.reason,
      quota: {
        remaining: check.quotaRemaining,
        percentUsed: check.percentUsed,
      },
      upgradeUrl: '/pricing',
    });
    return;
  }

  // Record the generation
  const { updatedQuota, event, response } = recordUsage(account, {
    workspaceId: userId,
    userId,
    serviceKey,
    units: count,
    metadata: { type, provider, model },
  });

  applyQuotaUpdate(userId, serviceKey, updatedQuota);

  logger.info({
    userId, type, count, provider, eventId: event.id,
  }, '[LUC-Stripe Bridge] Media generation metered');

  res.json({
    allowed: true,
    eventId: event.id,
    quota: {
      remaining: response.quotaRemaining,
      percentUsed: response.percentUsed,
    },
  });
});

// ---------------------------------------------------------------------------
// Stripe Sync — Keep LUC accounts in sync with Stripe provisions
// ---------------------------------------------------------------------------

/**
 * POST /api/billing/sync
 *
 * Force-sync a user's LUC account with their current Stripe provision.
 * Called after Stripe webhook events (subscription change, payment, etc.)
 *
 * Body: { userId }
 */
lucStripeBridgeRouter.post('/api/billing/sync', (req: Request, res: Response) => {
  const { userId } = req.body;

  if (!userId) {
    res.status(400).json({ error: 'userId is required' });
    return;
  }

  // Delete cached account so next access rebuilds from Stripe provision
  lucAccounts.delete(userId);
  const account = getOrCreateAccount(userId);

  logger.info({
    userId, planId: account.planId, status: account.status,
  }, '[LUC-Stripe Bridge] Account synced with Stripe');

  res.json({
    synced: true,
    planId: account.planId,
    status: account.status,
  });
});

/**
 * GET /api/billing/services
 *
 * List all available services with their rates and categories.
 * Public endpoint for the pricing page and LUC dashboard.
 */
lucStripeBridgeRouter.get('/api/billing/services', (_req: Request, res: Response) => {
  const services = Object.values(SERVICE_CATALOG).map(svc => ({
    key: svc.key,
    name: svc.name,
    description: svc.description,
    unit: svc.unit,
    unitPlural: svc.unitPlural,
    category: svc.category,
    rate: svc.defaultRate,
    meterType: svc.meterType,
  }));

  res.json({ services });
});
