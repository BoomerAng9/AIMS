/**
 * A.I.M.S. Per-Plug Analytics Engine
 *
 * Tracks request, error, deploy, and health-check events for each
 * deployed Plug. Persists all data to SQLite via the analytics_events,
 * analytics_daily, and analytics_summary tables (migration 003).
 *
 * Public interface is unchanged from the in-memory version so all
 * existing consumers continue to work without modification.
 */

import { getDb } from '../db';
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

// ---------------------------------------------------------------------------
// Analytics Engine (SQLite-backed)
// ---------------------------------------------------------------------------

export class AnalyticsEngine {
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
    const db = getDb();
    const now = new Date().toISOString();
    const day = todayKey();
    const responseMs =
      typeof data?.responseMs === 'number' ? data.responseMs : null;

    // 1. Insert raw event
    const insertEvent = db.prepare(`
      INSERT INTO analytics_events (plugId, event, responseMs, detail, createdAt)
      VALUES (?, ?, ?, ?, ?)
    `);
    insertEvent.run(plugId, event, responseMs, JSON.stringify(data ?? {}), now);

    // 2. Ensure summary row exists
    const ensureSummary = db.prepare(`
      INSERT OR IGNORE INTO analytics_summary
        (plugId, requests, errors, uptime, avgResponseMs, totalResponseMs, responseCount, lastActive)
      VALUES (?, 0, 0, 100, 0, 0, 0, ?)
    `);
    ensureSummary.run(plugId, now);

    // 3. Ensure daily row exists
    const ensureDaily = db.prepare(`
      INSERT OR IGNORE INTO analytics_daily
        (plugId, date, requests, errors, avgResponseMs, totalResponseMs, responseCount)
      VALUES (?, ?, 0, 0, 0, 0, 0)
    `);
    ensureDaily.run(plugId, day);

    // 4. Apply event-specific mutations
    switch (event) {
      case 'request': {
        // Increment request counters
        db.prepare(`
          UPDATE analytics_summary
          SET requests = requests + 1, lastActive = ?
          WHERE plugId = ?
        `).run(now, plugId);

        db.prepare(`
          UPDATE analytics_daily
          SET requests = requests + 1
          WHERE plugId = ? AND date = ?
        `).run(plugId, day);

        // Track response time if provided
        if (responseMs !== null) {
          db.prepare(`
            UPDATE analytics_summary
            SET totalResponseMs = totalResponseMs + ?,
                responseCount   = responseCount + 1,
                avgResponseMs   = CAST((totalResponseMs + ?) AS INTEGER) / (responseCount + 1)
            WHERE plugId = ?
          `).run(responseMs, responseMs, plugId);

          // Re-read to get actual computed avg for the daily row
          const summaryRow = db.prepare(`
            SELECT avgResponseMs FROM analytics_summary WHERE plugId = ?
          `).get(plugId) as { avgResponseMs: number } | undefined;

          const currentAvg = summaryRow?.avgResponseMs ?? 0;

          db.prepare(`
            UPDATE analytics_daily
            SET totalResponseMs = totalResponseMs + ?,
                responseCount   = responseCount + 1,
                avgResponseMs   = ?
            WHERE plugId = ? AND date = ?
          `).run(responseMs, currentAvg, plugId, day);
        }
        break;
      }

      case 'error': {
        db.prepare(`
          UPDATE analytics_summary
          SET errors = errors + 1,
              uptime = MAX(0, uptime - 0.1),
              lastActive = ?
          WHERE plugId = ?
        `).run(now, plugId);

        db.prepare(`
          UPDATE analytics_daily
          SET errors = errors + 1
          WHERE plugId = ? AND date = ?
        `).run(plugId, day);
        break;
      }

      case 'deploy': {
        db.prepare(`
          UPDATE analytics_summary
          SET uptime = 100, lastActive = ?
          WHERE plugId = ?
        `).run(now, plugId);

        logger.info({ plugId }, '[Analytics] Deploy event recorded');
        break;
      }

      case 'health-check': {
        const healthy = data?.healthy !== false;
        if (!healthy) {
          db.prepare(`
            UPDATE analytics_summary
            SET uptime = MAX(0, uptime - 1), lastActive = ?
            WHERE plugId = ?
          `).run(now, plugId);
        } else {
          db.prepare(`
            UPDATE analytics_summary
            SET lastActive = ?
            WHERE plugId = ?
          `).run(now, plugId);
        }
        break;
      }

      default: {
        logger.warn({ plugId, event }, '[Analytics] Unknown event type');
        // Still update lastActive
        db.prepare(`
          UPDATE analytics_summary SET lastActive = ? WHERE plugId = ?
        `).run(now, plugId);
      }
    }

    logger.debug({ plugId, event }, '[Analytics] Event recorded');
  }

  // -----------------------------------------------------------------------
  // Query
  // -----------------------------------------------------------------------

  /** Get current metrics for a single plug. */
  getMetrics(plugId: string): PlugMetrics {
    const db = getDb();

    const summaryRow = db.prepare(`
      SELECT * FROM analytics_summary WHERE plugId = ?
    `).get(plugId) as {
      plugId: string;
      requests: number;
      errors: number;
      uptime: number;
      avgResponseMs: number;
      lastActive: string;
    } | undefined;

    const dailyRows = db.prepare(`
      SELECT date, requests, errors, avgResponseMs
      FROM analytics_daily
      WHERE plugId = ?
      ORDER BY date DESC
      LIMIT 30
    `).all(plugId) as DailyStat[];

    if (!summaryRow) {
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

    return {
      plugId: summaryRow.plugId,
      requests: summaryRow.requests,
      errors: summaryRow.errors,
      uptime: summaryRow.uptime,
      avgResponseMs: summaryRow.avgResponseMs,
      lastActive: summaryRow.lastActive,
      dailyStats: dailyRows,
    };
  }

  /** Aggregate overview across all plugs belonging to a user. */
  getOverview(userId: string): PlugOverview {
    const db = getDb();

    // Join analytics_summary with plugs table to scope by userId
    const row = db.prepare(`
      SELECT
        COUNT(p.id) AS totalPlugs,
        COALESCE(SUM(s.requests), 0) AS totalRequests,
        COALESCE(SUM(s.errors), 0) AS totalErrors,
        CASE
          WHEN COUNT(s.plugId) > 0
            THEN ROUND(COALESCE(SUM(s.uptime), 0) / COUNT(s.plugId) * 100) / 100
          ELSE 100
        END AS avgUptime
      FROM plugs p
      LEFT JOIN analytics_summary s ON s.plugId = p.id
      WHERE p.userId = ?
    `).get(userId) as {
      totalPlugs: number;
      totalRequests: number;
      totalErrors: number;
      avgUptime: number;
    };

    logger.info(
      {
        userId,
        totalPlugs: row.totalPlugs,
        totalRequests: row.totalRequests,
        totalErrors: row.totalErrors,
        avgUptime: row.avgUptime,
      },
      '[Analytics] Overview generated',
    );

    return {
      totalPlugs: row.totalPlugs,
      totalRequests: row.totalRequests,
      totalErrors: row.totalErrors,
      avgUptime: row.avgUptime,
    };
  }

  /** Return the most recent N days of daily stats for a plug. */
  getDailyStats(plugId: string, days: number = 30): DailyStat[] {
    const db = getDb();

    const rows = db.prepare(`
      SELECT date, requests, errors, avgResponseMs
      FROM analytics_daily
      WHERE plugId = ?
      ORDER BY date DESC
      LIMIT ?
    `).all(plugId, days) as DailyStat[];

    return rows;
  }
}

// ---------------------------------------------------------------------------
// Singleton export
// ---------------------------------------------------------------------------

export const analytics = new AnalyticsEngine();
