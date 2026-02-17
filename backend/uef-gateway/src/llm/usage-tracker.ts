/**
 * LLM Usage Tracker — Real-Time Token & Cost Metering
 *
 * Every LLM call through the gateway records actual usage here.
 * This feeds LUC billing with real costs instead of estimates.
 *
 * Storage: In-memory Map with periodic Redis persistence.
 * Each user+session combo gets its own accumulator.
 */

import logger from '../logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type LLMProvider = 'vertex-ai' | 'openrouter' | 'oss-hosted' | 'personaplex' | 'stub';

export interface UsageRecord {
  timestamp: string;
  model: string;
  provider: LLMProvider;
  agentId: string;
  tokens: { prompt: number; completion: number; total: number };
  cost: { usd: number };
}

export interface UsageSummary {
  userId: string;
  sessionId: string;
  totalTokens: number;
  totalCostUsd: number;
  callCount: number;
  byModel: Record<string, { tokens: number; cost: number; calls: number }>;
  byAgent: Record<string, { tokens: number; cost: number; calls: number }>;
  byProvider: Record<string, { tokens: number; cost: number; calls: number }>;
  records: UsageRecord[];
}

// ---------------------------------------------------------------------------
// Tracker
// ---------------------------------------------------------------------------

class LLMUsageTracker {
  // Key: `${userId}:${sessionId}`
  private sessions = new Map<string, { userId: string; sessionId: string; records: UsageRecord[] }>();

  /**
   * Record a completed LLM call.
   */
  record(opts: {
    userId: string;
    sessionId: string;
    model: string;
    provider: LLMProvider;
    agentId: string;
    tokens: { prompt: number; completion: number; total: number };
    cost: { usd: number };
  }): void {
    const key = `${opts.userId}:${opts.sessionId}`;
    if (!this.sessions.has(key)) {
      this.sessions.set(key, { userId: opts.userId, sessionId: opts.sessionId, records: [] });
    }

    const record: UsageRecord = {
      timestamp: new Date().toISOString(),
      model: opts.model,
      provider: opts.provider,
      agentId: opts.agentId,
      tokens: opts.tokens,
      cost: opts.cost,
    };

    this.sessions.get(key)!.records.push(record);

    logger.debug({
      userId: opts.userId,
      model: opts.model,
      provider: opts.provider,
      agent: opts.agentId,
      tokens: opts.tokens.total,
      cost: opts.cost.usd,
    }, '[UsageTracker] Recorded LLM call');
  }

  /**
   * Get usage summary for a user+session.
   */
  getSummary(userId: string, sessionId: string): UsageSummary {
    const key = `${userId}:${sessionId}`;
    const session = this.sessions.get(key);

    if (!session) {
      return {
        userId, sessionId,
        totalTokens: 0, totalCostUsd: 0, callCount: 0,
        byModel: {}, byAgent: {}, byProvider: {},
        records: [],
      };
    }

    const byModel: Record<string, { tokens: number; cost: number; calls: number }> = {};
    const byAgent: Record<string, { tokens: number; cost: number; calls: number }> = {};
    const byProvider: Record<string, { tokens: number; cost: number; calls: number }> = {};
    let totalTokens = 0;
    let totalCostUsd = 0;

    for (const r of session.records) {
      totalTokens += r.tokens.total;
      totalCostUsd += r.cost.usd;

      // By model
      if (!byModel[r.model]) byModel[r.model] = { tokens: 0, cost: 0, calls: 0 };
      byModel[r.model].tokens += r.tokens.total;
      byModel[r.model].cost += r.cost.usd;
      byModel[r.model].calls++;

      // By agent
      if (!byAgent[r.agentId]) byAgent[r.agentId] = { tokens: 0, cost: 0, calls: 0 };
      byAgent[r.agentId].tokens += r.tokens.total;
      byAgent[r.agentId].cost += r.cost.usd;
      byAgent[r.agentId].calls++;

      // By provider
      if (!byProvider[r.provider]) byProvider[r.provider] = { tokens: 0, cost: 0, calls: 0 };
      byProvider[r.provider].tokens += r.tokens.total;
      byProvider[r.provider].cost += r.cost.usd;
      byProvider[r.provider].calls++;
    }

    return {
      userId, sessionId,
      totalTokens,
      totalCostUsd: Math.round(totalCostUsd * 1_000_000) / 1_000_000,
      callCount: session.records.length,
      byModel, byAgent, byProvider,
      records: session.records,
    };
  }

  /**
   * Get aggregate usage for a user across all sessions.
   */
  getUserUsage(userId: string): { totalTokens: number; totalCostUsd: number; callCount: number; sessionCount: number } {
    let totalTokens = 0;
    let totalCostUsd = 0;
    let callCount = 0;
    let sessionCount = 0;

    for (const [key, session] of this.sessions) {
      if (!key.startsWith(`${userId}:`)) continue;
      sessionCount++;
      for (const r of session.records) {
        totalTokens += r.tokens.total;
        totalCostUsd += r.cost.usd;
        callCount++;
      }
    }

    return {
      totalTokens,
      totalCostUsd: Math.round(totalCostUsd * 1_000_000) / 1_000_000,
      callCount,
      sessionCount,
    };
  }

  /**
   * Get global usage stats (all users, all sessions).
   */
  getGlobalStats(): {
    totalTokens: number;
    totalCostUsd: number;
    callCount: number;
    sessionCount: number;
    topModels: Array<{ model: string; tokens: number; cost: number; calls: number }>;
  } {
    const byModel: Record<string, { tokens: number; cost: number; calls: number }> = {};
    let totalTokens = 0;
    let totalCostUsd = 0;
    let callCount = 0;

    for (const session of this.sessions.values()) {
      for (const r of session.records) {
        totalTokens += r.tokens.total;
        totalCostUsd += r.cost.usd;
        callCount++;

        if (!byModel[r.model]) byModel[r.model] = { tokens: 0, cost: 0, calls: 0 };
        byModel[r.model].tokens += r.tokens.total;
        byModel[r.model].cost += r.cost.usd;
        byModel[r.model].calls++;
      }
    }

    const topModels = Object.entries(byModel)
      .map(([model, stats]) => ({ model, ...stats }))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 10);

    return {
      totalTokens,
      totalCostUsd: Math.round(totalCostUsd * 1_000_000) / 1_000_000,
      callCount,
      sessionCount: this.sessions.size,
      topModels,
    };
  }

  /**
   * Evict sessions older than maxAgeMs (default: 24 hours).
   * Call periodically to prevent memory bloat.
   */
  evictStale(maxAgeMs: number = 24 * 60 * 60 * 1000): number {
    const cutoff = new Date(Date.now() - maxAgeMs).toISOString();
    let evicted = 0;

    for (const [key, session] of this.sessions) {
      const lastRecord = session.records[session.records.length - 1];
      if (!lastRecord || lastRecord.timestamp < cutoff) {
        this.sessions.delete(key);
        evicted++;
      }
    }

    if (evicted > 0) {
      logger.info({ evicted }, '[UsageTracker] Evicted stale sessions');
    }
    return evicted;
  }
}

export const usageTracker = new LLMUsageTracker();

// Evict stale sessions every hour
setInterval(() => usageTracker.evictStale(), 60 * 60 * 1000).unref();
