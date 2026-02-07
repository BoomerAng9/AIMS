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
  agents: number;       // active agent limit (0 = unlimited for P2P)
  concurrent: number;   // max concurrent agent executions
}

export const TIER_CONFIGS: TierConfig[] = [
  { id: 'garage',     name: 'Garage',     commitmentMonths: 3,  deliveredMonths: 3,  monthlyPrice: 99, tokensIncluded: 100_000, overdraftBuffer: 50_000,  agents: 3,  concurrent: 1 },
  { id: 'community',  name: 'Community',  commitmentMonths: 6,  deliveredMonths: 6,  monthlyPrice: 89, tokensIncluded: 250_000, overdraftBuffer: 150_000, agents: 10, concurrent: 5 },
  { id: 'enterprise', name: 'Enterprise', commitmentMonths: 9,  deliveredMonths: 12, monthlyPrice: 67, tokensIncluded: 500_000, overdraftBuffer: 500_000, agents: 50, concurrent: 25 },
  { id: 'p2p',        name: 'P2P',        commitmentMonths: 0,  deliveredMonths: 0,  monthlyPrice: 0,  tokensIncluded: 0,       overdraftBuffer: 0,       agents: 0,  concurrent: 1 },
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
    // P2P = unlimited agents (pay per execution)
    return { within: true, limit: 0, active: activeAgents };
  }
  return { within: activeAgents <= tier.agents, limit: tier.agents, active: activeAgents };
}
