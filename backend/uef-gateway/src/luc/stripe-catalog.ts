/**
 * LUC allocator — v6 Stripe SKU catalog + provision-on-event bridge.
 *
 * The 13 sellable SKUs: 4 tiers x 3 Tesla cadences (subscriptions, billed every
 * 3/6/9 months in advance — "9 buys 12" is honored in LUC provisioning, not in
 * the Stripe interval) + the BMC reload (a repeatable one-time SKU). Amounts are
 * derived from pricing.ts so the Stripe charge can never diverge from canon.
 *
 * Live Stripe price IDs are NOT hardcoded — each SKU names the env var that
 * carries its price id, injected when the Stripe products are created at the
 * money gate. A paid SKU maps to a LUC ledger provision (the wallet the
 * flux-gate then governs).
 *
 * PROPRIETARY — A.I.M.S.
 */

import { LedgerAdapter } from './ledger';
import { TIERS, CADENCES, BMC, planChargeUsd } from './pricing';
import { provisionPlan, applyBmcPurchase } from './service';

export type SkuKind = 'subscription' | 'one_time';

export interface Sku {
  /** Stable internal key, e.g. 'medium-6mo' | 'bmc'. */
  key: string;
  kind: SkuKind;
  name: string;
  amountUsd: number;
  /** Env var that holds the live Stripe price id (set at the money gate). */
  stripePriceEnv: string;
  // Subscription-only:
  tier?: string;
  cadence?: string;
  /** Stripe billing interval in months (3/6/9). LUC granted may exceed this (9->12). */
  intervalMonths?: number;
}

export const BMC_SKU_KEY = 'bmc';

function buildCatalog(): Record<string, Sku> {
  const out: Record<string, Sku> = {};
  for (const tier of Object.keys(TIERS)) {
    for (const cadence of Object.keys(CADENCES)) {
      const key = `${tier}-${cadence}`;
      out[key] = {
        key,
        kind: 'subscription',
        name: `${TIERS[tier].name} ${cadence} (advance commitment)`,
        amountUsd: planChargeUsd(tier, cadence),
        stripePriceEnv: `STRIPE_PRICE_${tier.toUpperCase()}_${cadence.toUpperCase()}`,
        tier,
        cadence,
        intervalMonths: CADENCES[cadence].chargeMonths,
      };
    }
  }
  out[BMC_SKU_KEY] = {
    key: BMC_SKU_KEY,
    kind: 'one_time',
    name: BMC.name,
    amountUsd: BMC.priceUsd,
    stripePriceEnv: 'STRIPE_PRICE_BMC',
  };
  return out;
}

export const SKUS: Record<string, Sku> = buildCatalog();

export function getSku(key: string): Sku | null {
  return SKUS[key] ?? null;
}

export function skuForPlan(tier: string, cadence: string): Sku | null {
  return SKUS[`${tier}-${cadence}`] ?? null;
}

type Env = Record<string, string | undefined>;

/** Live Stripe price id for a SKU, or null if not configured (never guess). */
export function resolveStripePriceId(sku: Sku, env: Env): string | null {
  return env[sku.stripePriceEnv] ?? null;
}

/** Reverse: the SKU a Stripe price id maps to (webhook path), or null. */
export function skuByStripePriceId(priceId: string, env: Env): Sku | null {
  for (const sku of Object.values(SKUS)) {
    if (env[sku.stripePriceEnv] && env[sku.stripePriceEnv] === priceId) return sku;
  }
  return null;
}

/** Apply a paid SKU to the LUC ledger: BMC reloads/stacks; a plan provisions its wallet. */
export async function provisionFromSku(
  ledger: LedgerAdapter,
  sku: Sku,
  ctx: { walletId: string; accountId: string; byok?: boolean }
): Promise<{ walletId: string; planId: string; available: number }> {
  if (sku.kind === 'one_time') {
    const r = await applyBmcPurchase(ledger, { id: ctx.walletId, accountId: ctx.accountId, byok: ctx.byok });
    return { walletId: ctx.walletId, planId: BMC_SKU_KEY, available: r.available };
  }
  const w = await provisionPlan(ledger, {
    id: ctx.walletId,
    accountId: ctx.accountId,
    tier: sku.tier!,
    cadence: sku.cadence!,
    byok: ctx.byok,
  });
  const bal = await ledger.balance(ctx.walletId);
  return { walletId: ctx.walletId, planId: w.planId, available: bal?.available ?? 0 };
}
