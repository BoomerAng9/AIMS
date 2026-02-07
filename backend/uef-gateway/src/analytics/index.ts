/**
 * A.I.M.S. Per-Plug Analytics Engine
 *
 * Tracks request, error, deploy, and health-check events for each
 * deployed Plug. Stores daily stat breakdowns and exposes user-level
 * overview aggregation.
 *
 * All data is held in-memory Maps for now; a time-series DB (e.g.
 * TimescaleDB, InfluxDB) can slot in later.
 */

import { plugStore } from '../db';
import logger from '../logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DailyStat {
  date: string;        // ISO date string (YYYY-MM-DD)
  requests: number;
  errors: number;
  avgResponseMs: number;
}

export interface PlugMetrics {
  plugId: string;
  requests: number;
  errors: number;
  uptime: number;          // 0-100 percentage
  avgResponseMs: number;
  lastActive: string;      // ISO datetime
  dailyStats: DailyStat[];
}

export interface PlugOverview {
  totalPlugs: number;
  totalRequests: number;
  totalErrors: number;
  avgUptime: number;
}

export type AnalyticsEventType = 'request' | 'error' | 'deploy' | 'health-check';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Return today's date as YYYY-MM-DD. */
function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Create a fresh empty metrics object for a given plug. */
function emptyMetrics(plugId: string): PlugMetrics {
  return {
    plugId,
    requests: 0,
    errors: 0,
    uptime: 100,
    avgResponseMs: 0,
    lastActive: new Date().toISOString(),
    dailyStats: [],
  };
}

// ---------------------------------------------------------------------------
// Analytics Engine
// ---------------------------------------------------------------------------

export class AnalyticsEngine {
  /** plugId -> PlugMetrics */
  private metricsMap: Map<string, PlugMetrics> = new Map();

  /**
   * Total response-time accumulator (used for running average).
   * plugId -> { totalMs, count }
   */
  private responseTimes: Map<string, { totalMs: number; count: number }> = new Map();

  // -----------------------------------------------------------------------
  // Record
  // -----------------------------------------------------------------------

  /**
   * Record an analytics event for a plug.
   *
   * @param plugId  - ID of the Plug this event relates to
   * @param event   - Event type
   * @param data    - Optional payload (e.g. `{ responseMs: 42 }`)
   */
  record(
    plugId: string,
    event: AnalyticsEventType,
    data?: Record<string, unknown>,
  ): void {
    const metrics = this.ensureMetrics(plugId);
    const day = todayKey();
    const daily = this.ensureDailyStat(metrics, day);

    switch (event) {
      case 'request': {
        metrics.requests += 1;
        daily.requests += 1;

        // Track response time if provided
        const responseMs = typeof data?.responseMs === 'number' ? data.responseMs : undefined;
        if (responseMs !== undefined) {
          const rt = this.ensureResponseTime(plugId);
          rt.totalMs += responseMs;
          rt.count += 1;
          metrics.avgResponseMs = Math.round(rt.totalMs / rt.count);
          daily.avgResponseMs = metrics.avgResponseMs;
        }
        break;
      }

      case 'error': {
        metrics.errors += 1;
        daily.errors += 1;

        // Degrade uptime slightly on every error (floor at 0)
        metrics.uptime = Math.max(0, metrics.uptime - 0.1);
        break;
      }

      case 'deploy': {
        // Reset uptime to 100 on a fresh deploy
        metrics.uptime = 100;
        logger.info({ plugId }, '[Analytics] Deploy event recorded');
        break;
      }

      case 'health-check': {
        const healthy = data?.healthy !== false; // default to healthy
        if (!healthy) {
          metrics.uptime = Math.max(0, metrics.uptime - 1);
        }
        break;
      }

      default: {
        logger.warn({ plugId, event }, '[Analytics] Unknown event type');
      }
    }

    metrics.lastActive = new Date().toISOString();

    logger.debug(
      { plugId, event, requests: metrics.requests, errors: metrics.errors },
      '[Analytics] Event recorded',
    );
  }

  // -----------------------------------------------------------------------
  // Query
  // -----------------------------------------------------------------------

  /** Get current metrics for a single plug. */
  getMetrics(plugId: string): PlugMetrics {
    return this.ensureMetrics(plugId);
  }

  /** Aggregate overview across all plugs belonging to a user. */
  getOverview(userId: string): PlugOverview {
    // Find all plugs owned by this user
    const userPlugs = plugStore.findBy(p => p.userId === userId);

    if (userPlugs.length === 0) {
      return { totalPlugs: 0, totalRequests: 0, totalErrors: 0, avgUptime: 100 };
    }

    let totalRequests = 0;
    let totalErrors = 0;
    let uptimeSum = 0;
    let plugsWithMetrics = 0;

    for (const plug of userPlugs) {
      const m = this.metricsMap.get(plug.id);
      if (m) {
        totalRequests += m.requests;
        totalErrors += m.errors;
        uptimeSum += m.uptime;
        plugsWithMetrics += 1;
      }
    }

    const avgUptime =
      plugsWithMetrics > 0
        ? Math.round((uptimeSum / plugsWithMetrics) * 100) / 100
        : 100;

    logger.info(
      { userId, totalPlugs: userPlugs.length, totalRequests, totalErrors, avgUptime },
      '[Analytics] Overview generated',
    );

    return {
      totalPlugs: userPlugs.length,
      totalRequests,
      totalErrors,
      avgUptime,
    };
  }

  /** Return the most recent N days of daily stats for a plug. */
  getDailyStats(plugId: string, days: number = 30): DailyStat[] {
    const metrics = this.ensureMetrics(plugId);

    // Sort descending by date, then take the last `days` entries
    const sorted = [...metrics.dailyStats].sort(
      (a, b) => b.date.localeCompare(a.date),
    );

    return sorted.slice(0, days);
  }

  // -----------------------------------------------------------------------
  // Internal
  // -----------------------------------------------------------------------

  /** Retrieve or lazily initialise metrics for a plug. */
  private ensureMetrics(plugId: string): PlugMetrics {
    let m = this.metricsMap.get(plugId);
    if (!m) {
      m = emptyMetrics(plugId);
      this.metricsMap.set(plugId, m);
    }
    return m;
  }

  /** Retrieve or lazily initialise today's daily stat entry. */
  private ensureDailyStat(metrics: PlugMetrics, date: string): DailyStat {
    let stat = metrics.dailyStats.find(s => s.date === date);
    if (!stat) {
      stat = { date, requests: 0, errors: 0, avgResponseMs: 0 };
      metrics.dailyStats.push(stat);
    }
    return stat;
  }

  /** Retrieve or lazily initialise response-time accumulator. */
  private ensureResponseTime(plugId: string): { totalMs: number; count: number } {
    let rt = this.responseTimes.get(plugId);
    if (!rt) {
      rt = { totalMs: 0, count: 0 };
      this.responseTimes.set(plugId, rt);
    }
    return rt;
  }
}

// ---------------------------------------------------------------------------
// Singleton export
// ---------------------------------------------------------------------------

export const analytics = new AnalyticsEngine();
