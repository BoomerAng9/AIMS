/**
 * A.I.M.S. 3-6-9 Billing Engine
 *
 * Server-side billing definitions + task multiplier application for LUC.
 * The 3-6-9 model: Test (3mo) → Lock In (6mo) → V.I.B.E. (9mo pays for 12).
 * P2P (Proud to Pay): No commitment, 100 tokens per $1.
 *
 * Three Pillars: Confidence · Convenience · Security
 * Each pillar level adds a % modifier to the base bill.
 *
 * "Activity breeds Activity."
 */

import logger from '../logger';

// ---------------------------------------------------------------------------
// Task-Based Multipliers — applied to token consumption per action
// ---------------------------------------------------------------------------

export type TaskType =
  | 'CODE_GEN' | 'CODE_REVIEW' | 'ARCHITECTURE'
  | 'AGENT_SWARM' | 'SECURITY_AUDIT' | 'DEPLOYMENT'
  | 'WORKFLOW_AUTO' | 'BIZ_INTEL' | 'FULL_AUTONOMOUS';

export const TASK_MULTIPLIERS: Record<TaskType, { multiplier: number; label: string }> = {
  CODE_GEN:        { multiplier: 1.0,  label: 'Code Generation' },
  CODE_REVIEW:     { multiplier: 1.2,  label: 'Code Review' },
  WORKFLOW_AUTO:   { multiplier: 1.3,  label: 'Workflow Automation' },
  SECURITY_AUDIT:  { multiplier: 1.45, label: 'Security Audit' },
  ARCHITECTURE:    { multiplier: 1.5,  label: 'Architecture Planning' },
  BIZ_INTEL:       { multiplier: 1.6,  label: 'Business Intelligence' },
  DEPLOYMENT:      { multiplier: 1.1,  label: 'Deployment Jobs' },
  AGENT_SWARM:     { multiplier: 2.0,  label: 'Multi-Agent Orchestration' },
  FULL_AUTONOMOUS: { multiplier: 3.0,  label: 'Full Autonomous Swarm' },
};

// ---------------------------------------------------------------------------
// Tier Definitions (mirrors frontend lib/stripe.ts)
// ---------------------------------------------------------------------------

export interface TierConfig {
  id: string;
  name: string;
  commitmentMonths: number;
  deliveredMonths: number;
  monthlyPrice: number;
  tokensIncluded: number;
  overdraftBuffer: number;
  agents: number;       // active agent limit (0 = metered pay-per-use for P2P)
  concurrent: number;   // max concurrent agent executions
}

/**
 * Tier configs aligned to the canonical 3-6-9 model (frontend/lib/stripe.ts).
 * monthlyPrice is 0 here — actual prices live in Stripe env vars only.
 * No tier is "unlimited". agents: 0 for P2P means metered, not infinite.
 */
export const TIER_CONFIGS: TierConfig[] = [
  { id: '3mo',  name: '3 Months',          commitmentMonths: 3,  deliveredMonths: 3,  monthlyPrice: 0, tokensIncluded: 100_000, overdraftBuffer: 50_000,  agents: 5,  concurrent: 2 },
  { id: '6mo',  name: '6 Months',          commitmentMonths: 6,  deliveredMonths: 6,  monthlyPrice: 0, tokensIncluded: 250_000, overdraftBuffer: 150_000, agents: 15, concurrent: 5 },
  { id: '9mo',  name: '9 Months V.I.B.E.', commitmentMonths: 9,  deliveredMonths: 12, monthlyPrice: 0, tokensIncluded: 500_000, overdraftBuffer: 500_000, agents: 50, concurrent: 25 },
  { id: 'p2p',  name: 'Pay-per-Use',       commitmentMonths: 0,  deliveredMonths: 0,  monthlyPrice: 0, tokensIncluded: 0,       overdraftBuffer: 0,       agents: 0,  concurrent: 1 },
];

// ---------------------------------------------------------------------------
// Three Pillars — Confidence · Convenience · Security
// ---------------------------------------------------------------------------

export type PillarLevel = 'standard' | 'enhanced' | 'maximum';

export interface PillarConfig {
  id: string;
  name: string;
  levels: Record<PillarLevel, { addon: number; label: string }>;
}

export const PILLAR_CONFIGS: PillarConfig[] = [
  {
    id: 'confidence',
    name: 'Confidence Shield',
    levels: {
      standard: { addon: 0,    label: 'Standard' },
      enhanced: { addon: 0.15, label: 'Verified' },
      maximum:  { addon: 0.35, label: 'Guaranteed' },
    },
  },
  {
    id: 'convenience',
    name: 'Convenience Boost',
    levels: {
      standard: { addon: 0,    label: 'Standard' },
      enhanced: { addon: 0.20, label: 'Priority' },
      maximum:  { addon: 0.45, label: 'Instant' },
    },
  },
  {
    id: 'security',
    name: 'Security Vault',
    levels: {
      standard: { addon: 0,    label: 'Essential' },
      enhanced: { addon: 0.25, label: 'Professional' },
      maximum:  { addon: 0.50, label: 'Fortress' },
    },
  },
];

// ---------------------------------------------------------------------------
// Overage & P2P Rates
// ---------------------------------------------------------------------------

export const OVERAGE_RATE_PER_1K = 0.06;   // $0.06 per 1K tokens
export const P2P_RATE_PER_100   = 1.00;    // 100 tokens per $1
export const REALTIME_TOPUP_FEE = 0.10;    // +10% convenience

// Mandatory fees
export const MAINTENANCE_FEE = 5.00;       // $5.00 per invoice
export const P2P_TRANSACTION_FEE = 0.99;   // $0.99 per P2P transaction

// Savings plan split — fees fund user savings 70/30
export const SAVINGS_SPLIT_USER = 0.70;    // 70% to user savings account
export const SAVINGS_SPLIT_PLATFORM = 0.30; // 30% retained by platform

// Internal-only markup rates — NEVER expose to users
const _MARKUP_RATES: Record<string, number> = {
  p2p: 0.25,
  '3mo': 0.20,
  '6mo': 0.15,
  '9mo': 0.10,
};

// ---------------------------------------------------------------------------
// Metered Token Calculator
// ---------------------------------------------------------------------------

export interface MeteredUsage {
  rawTokens: number;
  taskType: TaskType;
  multiplier: number;
  effectiveTokens: number;
  costUsd: number;
}

/**
 * Calculate metered token cost for a given task execution.
 * Applies the task-type multiplier to raw token count,
 * then calculates cost based on tier overage or P2P rate.
 */
export function meterTokens(
  rawTokens: number,
  taskType: TaskType,
  tierId: string,
): MeteredUsage {
  const mult = TASK_MULTIPLIERS[taskType]?.multiplier ?? 1.0;
  const effectiveTokens = Math.round(rawTokens * mult);

  // P2P uses flat rate; subscription tiers use overage rate
  const rate = tierId === 'p2p'
    ? P2P_RATE_PER_100 / 100  // $0.01 per token
    : OVERAGE_RATE_PER_1K / 1000;  // $0.00006 per token

  const costUsd = Math.round(effectiveTokens * rate * 10000) / 10000;

  logger.info({
    rawTokens,
    taskType,
    multiplier: mult,
    effectiveTokens,
    costUsd,
    tierId,
  }, '[Billing] Token metering');

  return { rawTokens, taskType, multiplier: mult, effectiveTokens, costUsd };
}

/**
 * Check if user is within their included allocation + buffer.
 */
export function checkAllowance(
  tierId: string,
  monthlyUsedTokens: number,
): { within: boolean; remaining: number; overage: number } {
  const tier = TIER_CONFIGS.find(t => t.id === tierId);
  if (!tier || tierId === 'p2p') {
    return { within: true, remaining: 0, overage: 0 };
  }

  const ceiling = tier.tokensIncluded + tier.overdraftBuffer;
  const remaining = Math.max(ceiling - monthlyUsedTokens, 0);
  const overage = Math.max(monthlyUsedTokens - ceiling, 0);

  return { within: monthlyUsedTokens <= ceiling, remaining, overage };
}

/**
 * Calculate total pillar addon percentage.
 */
export function calculatePillarAddon(
  confidence: PillarLevel,
  convenience: PillarLevel,
  security: PillarLevel,
): { confidence: number; convenience: number; security: number; total: number } {
  const conf = PILLAR_CONFIGS[0].levels[confidence].addon;
  const conv = PILLAR_CONFIGS[1].levels[convenience].addon;
  const sec  = PILLAR_CONFIGS[2].levels[security].addon;
  return { confidence: conf, convenience: conv, security: sec, total: conf + conv + sec };
}

/**
 * Check if agent count is within tier limit.
 */
export function checkAgentLimit(
  tierId: string,
  activeAgents: number,
): { within: boolean; limit: number; active: number } {
  const tier = TIER_CONFIGS.find(t => t.id === tierId);
  if (!tier || tier.agents === 0) {
    // P2P = metered agents (pay per execution, no included allocation)
    return { within: true, limit: 0, active: activeAgents };
  }
  return { within: activeAgents <= tier.agents, limit: tier.agents, active: activeAgents };
}

// ---------------------------------------------------------------------------
// Fee Calculation + Savings Plan
// ---------------------------------------------------------------------------

export interface FeeBreakdown {
  maintenanceFee: number;
  transactionFee: number;
  totalFees: number;
  savingsUserPortion: number;
  savingsPlatformPortion: number;
}

/**
 * Calculate mandatory fees for an invoice or transaction.
 * Maintenance fee ($5.00) applies to every invoice.
 * P2P transaction fee ($0.99) applies to every pay-per-use execution.
 * Only these two fees are split 70/30 into user savings / platform.
 * Subscription costs, overage charges, and pillar addons are NOT split.
 */
export function calculateFees(
  isP2pTransaction: boolean,
  transactionCount: number = 1,
): FeeBreakdown {
  const maintenanceFee = MAINTENANCE_FEE;
  const transactionFee = isP2pTransaction ? P2P_TRANSACTION_FEE * transactionCount : 0;
  const totalFees = maintenanceFee + transactionFee;

  return {
    maintenanceFee,
    transactionFee,
    totalFees,
    savingsUserPortion: Math.round(totalFees * SAVINGS_SPLIT_USER * 100) / 100,
    savingsPlatformPortion: Math.round(totalFees * SAVINGS_SPLIT_PLATFORM * 100) / 100,
  };
}

export interface SavingsLedgerEntry {
  id: string;
  userId: string;
  timestamp: string;
  source: 'maintenance_fee' | 'transaction_fee';
  totalFee: number;
  userSavings: number;       // 70% credited to user
  platformRetained: number;  // 30% retained by platform
  ledger: 'user' | 'platform' | 'web3';
}

/**
 * Generate triple-ledger savings entries from a fee event.
 * Returns 3 entries: one for each ledger (user, platform, web3).
 */
export function generateSavingsLedgerEntries(
  userId: string,
  source: 'maintenance_fee' | 'transaction_fee',
  feeAmount: number,
): SavingsLedgerEntry[] {
  const timestamp = new Date().toISOString();
  const userSavings = Math.round(feeAmount * SAVINGS_SPLIT_USER * 100) / 100;
  const platformRetained = Math.round(feeAmount * SAVINGS_SPLIT_PLATFORM * 100) / 100;

  const base = { userId, timestamp, source, totalFee: feeAmount, userSavings, platformRetained };

  return [
    { ...base, id: `sav-usr-${Date.now()}`, ledger: 'user' },
    { ...base, id: `sav-plt-${Date.now()}`, ledger: 'platform' },
    { ...base, id: `sav-w3-${Date.now()}`, ledger: 'web3' },
  ];
}

// ---------------------------------------------------------------------------
// Invoice Line Item Generation
// ---------------------------------------------------------------------------

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  category: 'subscription' | 'overage' | 'fee' | 'savings_credit';
}

/**
 * Generate invoice line items including mandatory fees and savings credits.
 */
export function generateInvoiceLineItems(
  tierId: string,
  overageTokens: number,
  p2pTransactionCount: number,
): InvoiceLineItem[] {
  const items: InvoiceLineItem[] = [];
  const tier = TIER_CONFIGS.find(t => t.id === tierId);

  // Subscription base (if applicable)
  if (tier && tier.monthlyPrice > 0) {
    items.push({
      description: `${tier.name} Subscription`,
      quantity: 1,
      unitPrice: tier.monthlyPrice,
      total: tier.monthlyPrice,
      category: 'subscription',
    });
  }

  // Overage charges
  if (overageTokens > 0) {
    const overageCost = Math.round((overageTokens / 1000) * OVERAGE_RATE_PER_1K * 100) / 100;
    items.push({
      description: `Token Overage (${overageTokens.toLocaleString()} tokens)`,
      quantity: overageTokens,
      unitPrice: OVERAGE_RATE_PER_1K / 1000,
      total: overageCost,
      category: 'overage',
    });
  }

  // Maintenance fee (every invoice)
  items.push({
    description: 'Platform Maintenance Fee',
    quantity: 1,
    unitPrice: MAINTENANCE_FEE,
    total: MAINTENANCE_FEE,
    category: 'fee',
  });

  // P2P transaction fees
  if (p2pTransactionCount > 0) {
    items.push({
      description: `Pay-per-Use Transaction Fee (${p2pTransactionCount} transactions)`,
      quantity: p2pTransactionCount,
      unitPrice: P2P_TRANSACTION_FEE,
      total: Math.round(p2pTransactionCount * P2P_TRANSACTION_FEE * 100) / 100,
      category: 'fee',
    });
  }

  // Savings plan credit — 70% of maintenance + transaction fees only
  const totalSplitFees = items
    .filter(i => i.category === 'fee')
    .reduce((sum, i) => sum + i.total, 0);
  const savingsCredit = Math.round(totalSplitFees * SAVINGS_SPLIT_USER * 100) / 100;

  if (savingsCredit > 0) {
    items.push({
      description: 'Savings Plan Credit (70% of maintenance + transaction fees)',
      quantity: 1,
      unitPrice: -savingsCredit,
      total: -savingsCredit,
      category: 'savings_credit',
    });
  }

  return items;
}
