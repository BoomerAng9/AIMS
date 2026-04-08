/**
 * LUC Engine - Standalone Calculation Tool
 *
 * A.I.M.S. core execution service that provides:
 * - Real-time cost estimation and usage accounting (token/$ + unit-based tools)
 * - Pre-flight gating (block/allow execution based on quota/budget)
 * - Post-run accounting (debit/credit + overage tracking)
 *
 * LUC powers retention UI hooks like quota warnings and upgrade prompts.
 */

// ─────────────────────────────────────────────────────────────
// Service Buckets & Overage Rates
// ─────────────────────────────────────────────────────────────

export type LUCServiceKey =
  | 'brave_searches'
  | 'elevenlabs_chars'
  | 'container_hours'
  | 'n8n_executions'
  | 'storage_gb'
  | 'api_calls'
  | 'openrouter_tokens'
  | 'vision_analyses'
  | 'code_generations'
  | 'embeddings';

export interface ServiceBucket {
  key: LUCServiceKey;
  name: string;
  unit: string;
  overageRate: number; // $ per unit over quota
  description: string;
}

export const SERVICE_BUCKETS: Record<LUCServiceKey, ServiceBucket> = {
  brave_searches: {
    key: 'brave_searches',
    name: 'Brave Search API',
    unit: 'search',
    overageRate: 0.005,
    description: 'Web, news, and video searches',
  },
  elevenlabs_chars: {
    key: 'elevenlabs_chars',
    name: 'ElevenLabs TTS',
    unit: 'character',
    overageRate: 0.00003,
    description: 'Text-to-speech character count',
  },
  container_hours: {
    key: 'container_hours',
    name: 'Container Runtime',
    unit: 'hour',
    overageRate: 0.05,
    description: 'Docker container execution time',
  },
  n8n_executions: {
    key: 'n8n_executions',
    name: 'Workflow Executions',
    unit: 'execution',
    overageRate: 0.01,
    description: 'n8n workflow runs',
  },
  storage_gb: {
    key: 'storage_gb',
    name: 'Cloud Storage',
    unit: 'GB',
    overageRate: 0.025,
    description: 'File and data storage',
  },
  api_calls: {
    key: 'api_calls',
    name: 'API Calls',
    unit: 'call',
    overageRate: 0.0001,
    description: 'General API endpoint calls',
  },
  openrouter_tokens: {
    key: 'openrouter_tokens',
    name: 'OpenRouter Tokens',
    unit: 'K tokens',
    overageRate: 0.002,
    description: 'AI model token usage (per 1K)',
  },
  vision_analyses: {
    key: 'vision_analyses',
    name: 'Vision Analysis',
    unit: 'image',
    overageRate: 0.01,
    description: 'SAM and vision API analyses',
  },
  code_generations: {
    key: 'code_generations',
    name: 'Code Generation',
    unit: 'generation',
    overageRate: 0.05,
    description: 'Full code generation requests',
  },
  embeddings: {
    key: 'embeddings',
    name: 'Embeddings',
    unit: 'K tokens',
    overageRate: 0.0001,
    description: 'Text embedding computations',
  },
};

// ─────────────────────────────────────────────────────────────
// Quota & Usage Types
// ─────────────────────────────────────────────────────────────

export interface QuotaRecord {
  limit: number;
  used: number;
  overage: number;
  lastUpdated: Date;
}

export interface LUCAccountRecord {
  userId: string;
  planId: string;
  planName: string;
  quotas: Record<LUCServiceKey, QuotaRecord>;
  totalOverageCost: number;
  billingCycleStart: Date;
  billingCycleEnd: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface LUCPlan {
  id: string;
  name: string;
  quotas: Record<LUCServiceKey, number>;
  monthlyPrice: number;
  overageThreshold: number; // Allow this % over before hard block
}

// ─────────────────────────────────────────────────────────────
// Pre-defined Plans
// ─────────────────────────────────────────────────────────────

/**
 * Plans: 5-tier model aligned to aims-skills/luc/types.ts.
 * No tier is "unlimited". Enterprise gets the highest caps, but all usage is finite.
 * The 3-6-9 commitment model (P2P/3mo/6mo/9mo) applies as a separate dimension
 * controlling token markup rates.
 */
export const LUC_PLANS: Record<string, LUCPlan> = {
  p2p: {
    id: 'p2p',
    name: 'Pay-per-Use',
    monthlyPrice: 0,
    overageThreshold: 0, // No overage — metered per execution
    quotas: {
      brave_searches: 10,
      elevenlabs_chars: 0,
      container_hours: 0,
      n8n_executions: 0,
      storage_gb: 0.5,
      api_calls: 100,
      openrouter_tokens: 0, // metered per-use
      vision_analyses: 5,
      code_generations: 0,
      embeddings: 10,
    },
  },
  coffee: {
    id: 'coffee',
    name: 'Buy Me a Coffee',
    monthlyPrice: 7.99,
    overageThreshold: 0.05, // 5% overage allowed
    quotas: {
      brave_searches: 100,
      elevenlabs_chars: 10_000,
      container_hours: 2,
      n8n_executions: 50,
      storage_gb: 2,
      api_calls: 1_000,
      openrouter_tokens: 50,
      vision_analyses: 20,
      code_generations: 10,
      embeddings: 50,
    },
  },
  data_entry: {
    id: 'data_entry',
    name: 'Data Entry',
    monthlyPrice: 29.99,
    overageThreshold: 0.1, // 10% overage allowed
    quotas: {
      brave_searches: 1_000,
      elevenlabs_chars: 50_000,
      container_hours: 10,
      n8n_executions: 500,
      storage_gb: 10,
      api_calls: 10_000,
      openrouter_tokens: 500,
      vision_analyses: 200,
      code_generations: 100,
      embeddings: 500,
    },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    monthlyPrice: 99.99,
    overageThreshold: 0.25, // 25% overage allowed
    quotas: {
      brave_searches: 10_000,
      elevenlabs_chars: 200_000,
      container_hours: 50,
      n8n_executions: 5_000,
      storage_gb: 100,
      api_calls: 100_000,
      openrouter_tokens: 5_000,
      vision_analyses: 1_000,
      code_generations: 500,
      embeddings: 2_000,
    },
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    monthlyPrice: 299,
    overageThreshold: 0.5, // 50% overage allowed (most generous, NOT unlimited)
    quotas: {
      brave_searches: 50_000,
      elevenlabs_chars: 2_000_000,
      container_hours: 500,
      n8n_executions: 25_000,
      storage_gb: 500,
      api_calls: 500_000,
      openrouter_tokens: 50_000,
      vision_analyses: 10_000,
      code_generations: 5_000,
      embeddings: 20_000,
    },
  },
};

// ─────────────────────────────────────────────────────────────
// Execution Result Types
// ─────────────────────────────────────────────────────────────

export interface CanExecuteResult {
  allowed: boolean;
  reason?: string;
  currentUsed: number;
  limit: number;
  requested: number;
  wouldExceedBy?: number;
  overageAllowed: number;
  projectedCost?: number;
}

export interface DebitResult {
  success: boolean;
  newUsed: number;
  newOverage: number;
  overageCost: number;
  quotaPercent: number;
  warning?: string;
}

export interface CreditResult {
  success: boolean;
  newUsed: number;
  newOverage: number;
  amountCredited: number;
}

export interface LUCSummary {
  userId: string;
  planName: string;
  billingCycleStart: Date;
  billingCycleEnd: Date;
  services: Array<{
    key: LUCServiceKey;
    name: string;
    used: number;
    limit: number;
    overage: number;
    percentUsed: number;
    overageCost: number;
    status: 'ok' | 'warning' | 'critical' | 'blocked';
  }>;
  totalOverageCost: number;
  overallPercentUsed: number;
  warnings: string[];
}

export interface LUCQuote {
  service: LUCServiceKey;
  amount: number;
  currentUsed: number;
  limit: number;
  wouldExceed: boolean;
  projectedOverage: number;
  projectedCost: number;
  allowed: boolean;
}

// ─────────────────────────────────────────────────────────────
// LUC Engine Class
// ─────────────────────────────────────────────────────────────

export class LUCEngine {
  private account: LUCAccountRecord;
  private plan: LUCPlan;

  constructor(account: LUCAccountRecord) {
    this.account = account;
    this.plan = LUC_PLANS[account.planId] || LUC_PLANS.p2p;
  }

  // ─────────────────────────────────────────────────────────
  // Pre-flight Gating
  // ─────────────────────────────────────────────────────────

  canExecute(service: LUCServiceKey, amount: number): CanExecuteResult {
    const quota = this.account.quotas[service];
    const bucket = SERVICE_BUCKETS[service];

    if (!quota || !bucket) {
      return {
        allowed: false,
        reason: `Unknown service: ${service}`,
        currentUsed: 0,
        limit: 0,
        requested: amount,
        overageAllowed: 0,
      };
    }

    const { limit, used } = quota;
    const maxAllowed = limit * (1 + this.plan.overageThreshold);
    const projectedUsed = used + amount;

    // Check if within quota
    if (projectedUsed <= limit) {
      return {
        allowed: true,
        currentUsed: used,
        limit,
        requested: amount,
        overageAllowed: maxAllowed - limit,
      };
    }

    // Check if within overage threshold
    if (projectedUsed <= maxAllowed) {
      const overageAmount = projectedUsed - limit;
      const projectedCost = overageAmount * bucket.overageRate;

      return {
        allowed: true,
        reason: 'Within overage threshold',
        currentUsed: used,
        limit,
        requested: amount,
        wouldExceedBy: projectedUsed - limit,
        overageAllowed: maxAllowed - limit,
        projectedCost,
      };
    }

    // Hard block
    return {
      allowed: false,
      reason: `Would exceed quota by ${(projectedUsed - maxAllowed).toFixed(2)} ${bucket.unit}s (max overage: ${(this.plan.overageThreshold * 100).toFixed(0)}%)`,
      currentUsed: used,
      limit,
      requested: amount,
      wouldExceedBy: projectedUsed - limit,
      overageAllowed: maxAllowed - limit,
    };
  }

  // ─────────────────────────────────────────────────────────
  // Post-run Accounting: Debit
  // ─────────────────────────────────────────────────────────

  debit(service: LUCServiceKey, amount: number): DebitResult {
    const canExec = this.canExecute(service, amount);

    if (!canExec.allowed) {
      return {
        success: false,
        newUsed: this.account.quotas[service]?.used || 0,
        newOverage: this.account.quotas[service]?.overage || 0,
        overageCost: 0,
        quotaPercent: 100,
        warning: canExec.reason,
      };
    }

    const quota = this.account.quotas[service];
    const bucket = SERVICE_BUCKETS[service];

    // Update usage
    quota.used += amount;
    quota.lastUpdated = new Date();

    // Calculate overage
    let overageCost = 0;
    if (quota.used > quota.limit) {
      const newOverageAmount = Math.max(0, quota.used - quota.limit);
      const previousOverageAmount = quota.overage;
      const additionalOverage = newOverageAmount - previousOverageAmount;

      if (additionalOverage > 0) {
        overageCost = additionalOverage * bucket.overageRate;
        quota.overage = newOverageAmount;
        this.account.totalOverageCost += overageCost;
      }
    }

    this.account.updatedAt = new Date();

    const quotaPercent = (quota.used / quota.limit) * 100;

    // Generate warning if approaching limit
    let warning: string | undefined;
    if (quotaPercent >= 90) {
      warning = `Critical: ${bucket.name} at ${quotaPercent.toFixed(1)}% of quota`;
    } else if (quotaPercent >= 80) {
      warning = `Warning: ${bucket.name} at ${quotaPercent.toFixed(1)}% of quota`;
    }

    return {
      success: true,
      newUsed: quota.used,
      newOverage: quota.overage,
      overageCost,
      quotaPercent,
      warning,
    };
  }

  // ─────────────────────────────────────────────────────────
  // Post-run Accounting: Credit (for rollbacks)
  // ─────────────────────────────────────────────────────────

  credit(service: LUCServiceKey, amount: number): CreditResult {
    const quota = this.account.quotas[service];

    if (!quota) {
      return {
        success: false,
        newUsed: 0,
        newOverage: 0,
        amountCredited: 0,
      };
    }

    const previousUsed = quota.used;
    quota.used = Math.max(0, quota.used - amount);
    quota.lastUpdated = new Date();

    // Recalculate overage
    if (quota.used <= quota.limit) {
      quota.overage = 0;
    } else {
      quota.overage = quota.used - quota.limit;
    }

    this.account.updatedAt = new Date();

    return {
      success: true,
      newUsed: quota.used,
      newOverage: quota.overage,
      amountCredited: previousUsed - quota.used,
    };
  }

  // ─────────────────────────────────────────────────────────
  // Quote (estimate without debiting)
  // ─────────────────────────────────────────────────────────

  quote(service: LUCServiceKey, amount: number): LUCQuote {
    const quota = this.account.quotas[service];
    const bucket = SERVICE_BUCKETS[service];
    const canExec = this.canExecute(service, amount);

    const projectedUsed = (quota?.used || 0) + amount;
    const wouldExceed = projectedUsed > (quota?.limit || 0);
    const projectedOverage = wouldExceed ? projectedUsed - (quota?.limit || 0) : 0;
    const projectedCost = projectedOverage * (bucket?.overageRate || 0);

    return {
      service,
      amount,
      currentUsed: quota?.used || 0,
      limit: quota?.limit || 0,
      wouldExceed,
      projectedOverage,
      projectedCost,
      allowed: canExec.allowed,
    };
  }

  // ─────────────────────────────────────────────────────────
  // Summary
  // ─────────────────────────────────────────────────────────

  getSummary(): LUCSummary {
    const warnings: string[] = [];
    const services: LUCSummary['services'] = [];

    let totalUsedPercent = 0;
    let serviceCount = 0;

    for (const [key, quota] of Object.entries(this.account.quotas)) {
      const serviceKey = key as LUCServiceKey;
      const bucket = SERVICE_BUCKETS[serviceKey];
      if (!bucket) continue;

      const percentUsed = quota.limit > 0 ? (quota.used / quota.limit) * 100 : 0;
      const overageCost = quota.overage * bucket.overageRate;

      let status: 'ok' | 'warning' | 'critical' | 'blocked' = 'ok';
      if (percentUsed >= 100 + this.plan.overageThreshold * 100) {
        status = 'blocked';
        warnings.push(`${bucket.name} is blocked - quota exceeded`);
      } else if (percentUsed >= 90) {
        status = 'critical';
        warnings.push(`${bucket.name} is at ${percentUsed.toFixed(1)}% - approaching limit`);
      } else if (percentUsed >= 80) {
        status = 'warning';
        warnings.push(`${bucket.name} is at ${percentUsed.toFixed(1)}%`);
      }

      services.push({
        key: serviceKey,
        name: bucket.name,
        used: quota.used,
        limit: quota.limit,
        overage: quota.overage,
        percentUsed,
        overageCost,
        status,
      });

      totalUsedPercent += percentUsed;
      serviceCount++;
    }

    return {
      userId: this.account.userId,
      planName: this.plan.name,
      billingCycleStart: this.account.billingCycleStart,
      billingCycleEnd: this.account.billingCycleEnd,
      services,
      totalOverageCost: this.account.totalOverageCost,
      overallPercentUsed: serviceCount > 0 ? totalUsedPercent / serviceCount : 0,
      warnings,
    };
  }

  // ─────────────────────────────────────────────────────────
  // Account Management
  // ─────────────────────────────────────────────────────────

  getAccount(): LUCAccountRecord {
    return { ...this.account };
  }

  updatePlan(planId: string): void {
    const newPlan = LUC_PLANS[planId];
    if (!newPlan) return;

    this.plan = newPlan;
    this.account.planId = planId;
    this.account.planName = newPlan.name;

    // Update quota limits (keep usage)
    for (const [key, limit] of Object.entries(newPlan.quotas)) {
      const serviceKey = key as LUCServiceKey;
      if (this.account.quotas[serviceKey]) {
        this.account.quotas[serviceKey].limit = limit;
      }
    }

    this.account.updatedAt = new Date();
  }

  resetBillingCycle(): void {
    const now = new Date();
    const nextMonth = new Date(now);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    this.account.billingCycleStart = now;
    this.account.billingCycleEnd = nextMonth;
    this.account.totalOverageCost = 0;

    // Reset all quotas
    for (const quota of Object.values(this.account.quotas)) {
      quota.used = 0;
      quota.overage = 0;
      quota.lastUpdated = now;
    }

    this.account.updatedAt = now;
  }
}

// ─────────────────────────────────────────────────────────────
// Factory Functions
// ─────────────────────────────────────────────────────────────

export function createLUCAccount(
  userId: string,
  planId: string = 'p2p'
): LUCAccountRecord {
  const plan = LUC_PLANS[planId] || LUC_PLANS.p2p;
  const now = new Date();
  const nextMonth = new Date(now);
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  const quotas: Record<LUCServiceKey, QuotaRecord> = {} as Record<LUCServiceKey, QuotaRecord>;

  for (const [key, limit] of Object.entries(plan.quotas)) {
    quotas[key as LUCServiceKey] = {
      limit,
      used: 0,
      overage: 0,
      lastUpdated: now,
    };
  }

  return {
    userId,
    planId,
    planName: plan.name,
    quotas,
    totalOverageCost: 0,
    billingCycleStart: now,
    billingCycleEnd: nextMonth,
    createdAt: now,
    updatedAt: now,
  };
}

export function createLUCEngine(account: LUCAccountRecord): LUCEngine {
  return new LUCEngine(account);
}

// ─────────────────────────────────────────────────────────────
// Serialization (for Firestore)
// ─────────────────────────────────────────────────────────────

export function serializeLUCAccount(account: LUCAccountRecord): object {
  return {
    ...account,
    billingCycleStart: account.billingCycleStart.toISOString(),
    billingCycleEnd: account.billingCycleEnd.toISOString(),
    createdAt: account.createdAt.toISOString(),
    updatedAt: account.updatedAt.toISOString(),
    quotas: Object.fromEntries(
      Object.entries(account.quotas).map(([key, quota]) => [
        key,
        {
          ...quota,
          lastUpdated: quota.lastUpdated.toISOString(),
        },
      ])
    ),
  };
}

export function deserializeLUCAccount(data: any): LUCAccountRecord {
  return {
    ...data,
    billingCycleStart: new Date(data.billingCycleStart),
    billingCycleEnd: new Date(data.billingCycleEnd),
    createdAt: new Date(data.createdAt),
    updatedAt: new Date(data.updatedAt),
    quotas: Object.fromEntries(
      Object.entries(data.quotas).map(([key, quota]: [string, any]) => [
        key,
        {
          ...quota,
          lastUpdated: new Date(quota.lastUpdated),
        },
      ])
    ),
  };
}

export default LUCEngine;
