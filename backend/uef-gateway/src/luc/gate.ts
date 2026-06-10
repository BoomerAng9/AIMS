/**
 * LUC allocator — model-access gate.
 *
 * The reframed access model (Lite/Medium/Heavy/Superior DROPPED): free demo/chat
 * models are always allowed; a PAID model requires an active plan AND (available
 * platform budget OR bring-your-own-key). Fails closed on an unknown model and on
 * a paid model reached without plan identity.
 *
 * Pure function — the route layer supplies the AccessContext from the customer's
 * plan + wallet state. Call this BEFORE routing a request to a provider.
 *
 * PROPRIETARY — A.I.M.S.
 */

import { resolveModel } from './model-catalog';

export interface AccessContext {
  /** The caller holds an active (paid or starter-token) plan. */
  hasActivePlan: boolean;
  /** Remaining platform budget in USD for the caller's wallet. */
  walletAvailableUsd: number;
  /** Bring-your-own-key: plan still required, but no platform-$ is debited. */
  byok?: boolean;
}

export interface AccessDecision {
  allowed: boolean;
  reason?: string;
}

export function evaluateModelAccess(modelKeyOrId: string, ctx: AccessContext): AccessDecision {
  const entry = resolveModel(modelKeyOrId);
  if (!entry) return { allowed: false, reason: 'unknown model' }; // fail closed

  if (entry.isFree) return { allowed: true }; // free demo/chat — no plan required

  // Paid model from here on.
  if (!ctx.hasActivePlan) {
    return { allowed: false, reason: 'paid model requires an active plan' };
  }
  if (ctx.byok) return { allowed: true }; // same plan limits, no platform-$ debit
  if (ctx.walletAvailableUsd <= 0) {
    return { allowed: false, reason: 'budget exhausted' };
  }
  return { allowed: true };
}
