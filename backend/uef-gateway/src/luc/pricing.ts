/**
 * LUC allocator — v6 Tesla Matrix pricing (the source of truth).
 *
 * Canonical commercial config for A.I.M.S., script-verified against
 * AIMS-PRICING-V6-TESLA-MATRIX.md + AIMS-LUC-001. Supersedes the stale 3-6-9 /
 * $19.99 numbers in frontend/lib/stripe.ts (those are to be reconciled to read
 * this). Proprietary — kept OUT of the MIT luc-sdk.
 *
 * The money model:
 *   - 1 LUC Unit = $0.01. LUC is the currency; tokens are the fuel.
 *   - Platform burn rate = 2.0x wholesale -> uniform 50% gross margin on burn.
 *   - A wallet's budget IS its LUC allotment, valued in platform-$ (luc x $0.01).
 *     The ledger (sqlite-ledger.ts) holds that platform-$ and reserves/settles in
 *     it; wholesale COGS (= platform / 2) is the margin measure, not the cap.
 *   - Tesla Matrix: advance commitment only. 3mo, 6mo (10% off), 9mo (pay 9,
 *     get 12 months of LUC). Floor GM 50% / 44.4% / 33.3% by construction.
 *   - BMC: $6.54 once -> 654 LUC, all lanes; then pay-per-use at the same table.
 *
 * PROPRIETARY — A.I.M.S. Not for redistribution.
 */

import { resolveModel } from './model-catalog';

export const LUC_USD = 0.01; // 1 LUC Unit = one cent
export const PLATFORM_RATE_FACTOR = 2.0; // platform burn = 2x wholesale

export type LaneId = 'economy' | 'standard' | 'frontier' | 'super';

export interface Lane {
  id: LaneId;
  /** Inclusive ceiling on a model's WHOLESALE output $/M to fall in this lane. */
  maxOutputUsdPerM: number;
  inWholesalePer1k: number;
  outWholesalePer1k: number;
  inPlatformPer1k: number;
  outPlatformPer1k: number;
}

// Platform LUC per 1K tokens (v6 §2 burn table). Wholesale = platform / 2.
export const LANES: Record<LaneId, Lane> = {
  economy: { id: 'economy', maxOutputUsdPerM: 5, inWholesalePer1k: 0.1, outWholesalePer1k: 0.5, inPlatformPer1k: 0.2, outPlatformPer1k: 1.0 },
  standard: { id: 'standard', maxOutputUsdPerM: 25, inWholesalePer1k: 0.3, outWholesalePer1k: 1.5, inPlatformPer1k: 0.6, outPlatformPer1k: 3.0 },
  frontier: { id: 'frontier', maxOutputUsdPerM: 50, inWholesalePer1k: 0.5, outWholesalePer1k: 3.0, inPlatformPer1k: 1.0, outPlatformPer1k: 6.0 },
  super: { id: 'super', maxOutputUsdPerM: Number.POSITIVE_INFINITY, inWholesalePer1k: 1.0, outWholesalePer1k: 5.0, inPlatformPer1k: 2.0, outPlatformPer1k: 10.0 },
};

export interface Tier {
  id: string;
  name: string;
  monthlyPriceUsd: number;
  lucPerMonth: number;
  /** The tier's ceiling lane (it may use any model up to this band). */
  lane: LaneId;
  maxOutputUsdPerM: number;
}

export const TIERS: Record<string, Tier> = {
  light: { id: 'light', name: 'Light', monthlyPriceUsd: 9.99, lucPerMonth: 1000, lane: 'economy', maxOutputUsdPerM: 5 },
  medium: { id: 'medium', name: 'Medium', monthlyPriceUsd: 19.99, lucPerMonth: 2000, lane: 'standard', maxOutputUsdPerM: 25 },
  heavy: { id: 'heavy', name: 'Heavy', monthlyPriceUsd: 39.99, lucPerMonth: 4000, lane: 'frontier', maxOutputUsdPerM: 50 },
  superior: { id: 'superior', name: 'Superior', monthlyPriceUsd: 79.99, lucPerMonth: 8000, lane: 'super', maxOutputUsdPerM: Number.POSITIVE_INFINITY },
};

export interface Cadence {
  id: string;
  /** Months of price charged up front. */
  chargeMonths: number;
  /** Months of LUC delivered (9mo delivers 12 — "pay 9, get 12"). */
  lucMonths: number;
  /** Fractional discount on the charged months (6mo = 10% off). */
  discount: number;
}

export const CADENCES: Record<string, Cadence> = {
  '3mo': { id: '3mo', chargeMonths: 3, lucMonths: 3, discount: 0 },
  '6mo': { id: '6mo', chargeMonths: 6, lucMonths: 6, discount: 0.1 },
  '9mo': { id: '9mo', chargeMonths: 9, lucMonths: 12, discount: 0 },
};

export const BMC = {
  id: 'bmc',
  name: 'Buy Me a Coffee',
  priceUsd: 6.54,
  luc: 654,
} as const;

const round2 = (n: number): number => Math.round(n * 100) / 100;
const round1 = (n: number): number => Math.round(n * 10) / 10;

export const lucToUsd = (luc: number): number => round2(luc * LUC_USD);
export const usdToLuc = (usd: number): number => Math.round(usd / LUC_USD);

/** Platform-rate LUC burned by a job on a lane. */
export function missionBurnLuc(lane: LaneId | string, tokensIn: number, tokensOut: number): number {
  const l = LANES[lane as LaneId];
  if (!l) throw new Error(`unknown lane: ${lane}`);
  return (tokensIn / 1000) * l.inPlatformPer1k + (tokensOut / 1000) * l.outPlatformPer1k;
}

/** Classify a wholesale output $/M into its lane band. */
export function laneForOutputUsdPerM(usdPerM: number): LaneId {
  if (usdPerM <= LANES.economy.maxOutputUsdPerM) return 'economy';
  if (usdPerM <= LANES.standard.maxOutputUsdPerM) return 'standard';
  if (usdPerM <= LANES.frontier.maxOutputUsdPerM) return 'frontier';
  return 'super';
}

/** Lane of a catalog model by its output price; null if the model is unknown. */
export function laneForModel(modelKeyOrId: string): LaneId | null {
  const entry = resolveModel(modelKeyOrId);
  if (!entry) return null;
  return laneForOutputUsdPerM(entry.outputPer1M);
}

// --- Plan math (BMC + Tesla Matrix) ---

function resolvePlan(tierId: string, cadenceId: string): { monthly: number; lucPerMonth: number; cadence: Cadence } {
  if (tierId === 'bmc') {
    // BMC is a one-time grant, not a commitment cadence.
    return { monthly: BMC.priceUsd, lucPerMonth: BMC.luc, cadence: { id: 'once', chargeMonths: 1, lucMonths: 1, discount: 0 } };
  }
  const tier = TIERS[tierId];
  const cadence = CADENCES[cadenceId];
  if (!tier) throw new Error(`unknown tier: ${tierId}`);
  if (!cadence) throw new Error(`unknown cadence: ${cadenceId}`);
  return { monthly: tier.monthlyPriceUsd, lucPerMonth: tier.lucPerMonth, cadence };
}

/** Total LUC delivered for a plan + cadence. */
export function planLuc(tierId: string, cadenceId: string): number {
  const { lucPerMonth, cadence } = resolvePlan(tierId, cadenceId);
  return lucPerMonth * cadence.lucMonths;
}

/** Up-front charge for a plan + cadence (USD). */
export function planChargeUsd(tierId: string, cadenceId: string): number {
  const { monthly, cadence } = resolvePlan(tierId, cadenceId);
  return round2(monthly * cadence.chargeMonths * (1 - cadence.discount));
}

/** Floor gross-margin % at 100% burn on the priciest allowed lane (wholesale COGS). */
export function planFloorGmPct(tierId: string, cadenceId: string): number {
  const charge = planChargeUsd(tierId, cadenceId);
  if (charge <= 0) return 0;
  const cogsUsd = (planLuc(tierId, cadenceId) * LUC_USD) / PLATFORM_RATE_FACTOR;
  return round1(100 * (1 - cogsUsd / charge));
}

/** Wallet budget the ledger holds = the LUC allotment valued in platform-$. */
export function planWalletUsdBudget(tierId: string, cadenceId: string): number {
  return round2(planLuc(tierId, cadenceId) * LUC_USD);
}
