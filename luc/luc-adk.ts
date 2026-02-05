/**
 * LUC ADK — Locale Usage Calculator / Application Development Kit
 * Billing engine with quota tracking, tier enforcement, and usage metering.
 *
 * This module is imported by both ACHEEVY and the UEF Gateway.
 * In production, quota state is persisted to Firestore.
 * This implementation uses an in-memory store for local development.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface QuotaDefinition {
  api_calls: number;
  brave_searches: number;
  container_hours: number;
  storage_gb: number;
  elevenlabs_chars: number;
  n8n_executions: number;
}

export interface UserQuotas {
  userId: string;
  tier: 'free' | 'starter' | 'pro' | 'enterprise';
  billing_cycle_start: string;
  billing_cycle_end: string;
  quotas: {
    [K in keyof QuotaDefinition]: { used: number; limit: number };
  };
}

export interface QuotaCheckResult {
  can_execute: boolean;
  blocking_quotas: string[];
  usage_summary: Record<string, { used: number; limit: number; pct: number }>;
}

export interface UsageDebit {
  quotaKey: keyof QuotaDefinition;
  amount: number;
}

// ---------------------------------------------------------------------------
// Tier Definitions
// ---------------------------------------------------------------------------

const TIER_LIMITS: Record<string, QuotaDefinition> = {
  free: {
    api_calls: 50,
    brave_searches: 10,
    container_hours: 0.5,
    storage_gb: 1,
    elevenlabs_chars: 5000,
    n8n_executions: 5,
  },
  starter: {
    api_calls: 500,
    brave_searches: 100,
    container_hours: 5,
    storage_gb: 10,
    elevenlabs_chars: 50000,
    n8n_executions: 50,
  },
  pro: {
    api_calls: 5000,
    brave_searches: 1000,
    container_hours: 50,
    storage_gb: 100,
    elevenlabs_chars: 500000,
    n8n_executions: 500,
  },
  enterprise: {
    api_calls: 999999,
    brave_searches: 999999,
    container_hours: 999999,
    storage_gb: 999999,
    elevenlabs_chars: 999999,
    n8n_executions: 999999,
  },
};

// ---------------------------------------------------------------------------
// In-Memory Store (replace with Firestore adapter in production)
// ---------------------------------------------------------------------------

const store = new Map<string, UserQuotas>();

function createDefaultQuotas(userId: string, tier: string = 'free'): UserQuotas {
  const now = new Date();
  const cycleEnd = new Date(now);
  cycleEnd.setMonth(cycleEnd.getMonth() + 1);

  const limits = TIER_LIMITS[tier] || TIER_LIMITS.free;

  const quotas = {} as UserQuotas['quotas'];
  for (const [key, limit] of Object.entries(limits)) {
    (quotas as any)[key] = { used: 0, limit };
  }

  return {
    userId,
    tier: tier as UserQuotas['tier'],
    billing_cycle_start: now.toISOString(),
    billing_cycle_end: cycleEnd.toISOString(),
    quotas,
  };
}

// ---------------------------------------------------------------------------
// LUC ADK Public API
// ---------------------------------------------------------------------------

export class LucAdk {
  /**
   * Initialize or retrieve quotas for a user.
   */
  static getQuotas(userId: string): UserQuotas {
    if (!store.has(userId)) {
      store.set(userId, createDefaultQuotas(userId));
    }
    return store.get(userId)!;
  }

  /**
   * Set a user's tier (resets limits but preserves usage).
   */
  static setTier(userId: string, tier: UserQuotas['tier']): UserQuotas {
    const existing = LucAdk.getQuotas(userId);
    const limits = TIER_LIMITS[tier] || TIER_LIMITS.free;

    for (const [key, limit] of Object.entries(limits)) {
      if ((existing.quotas as any)[key]) {
        (existing.quotas as any)[key].limit = limit;
      } else {
        (existing.quotas as any)[key] = { used: 0, limit };
      }
    }
    existing.tier = tier;
    store.set(userId, existing);
    return existing;
  }

  /**
   * Check whether a user can execute a task requiring certain quotas.
   */
  static checkQuotas(userId: string, required: Partial<QuotaDefinition> = {}): QuotaCheckResult {
    const user = LucAdk.getQuotas(userId);
    const blocking: string[] = [];
    const summary: Record<string, { used: number; limit: number; pct: number }> = {};

    for (const [key, quota] of Object.entries(user.quotas)) {
      const pct = quota.limit > 0 ? Math.round((quota.used / quota.limit) * 100) : 0;
      summary[key] = { used: quota.used, limit: quota.limit, pct };

      const requiredAmount = (required as any)[key];
      if (requiredAmount && quota.used + requiredAmount > quota.limit) {
        blocking.push(key);
      }
    }

    return {
      can_execute: blocking.length === 0,
      blocking_quotas: blocking,
      usage_summary: summary,
    };
  }

  /**
   * Debit usage from a user's quotas.
   */
  static debit(userId: string, debits: UsageDebit[]): UserQuotas {
    const user = LucAdk.getQuotas(userId);

    for (const d of debits) {
      const quota = (user.quotas as any)[d.quotaKey];
      if (quota) {
        quota.used = Math.min(quota.used + d.amount, quota.limit);
      }
    }

    store.set(userId, user);
    return user;
  }

  /**
   * Reset a user's usage (e.g. on billing cycle renewal).
   */
  static resetUsage(userId: string): UserQuotas {
    const user = LucAdk.getQuotas(userId);
    for (const quota of Object.values(user.quotas)) {
      quota.used = 0;
    }

    const now = new Date();
    const cycleEnd = new Date(now);
    cycleEnd.setMonth(cycleEnd.getMonth() + 1);
    user.billing_cycle_start = now.toISOString();
    user.billing_cycle_end = cycleEnd.toISOString();

    store.set(userId, user);
    return user;
  }

  /**
   * Convert required_quotas from a BoomerAng definition into UsageDebits.
   */
  static boomerangToDebits(requiredQuotas: Record<string, number>): UsageDebit[] {
    return Object.entries(requiredQuotas).map(([key, amount]) => ({
      quotaKey: key as keyof QuotaDefinition,
      amount,
    }));
  }
}
