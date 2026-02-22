/**
 * A.I.M.S. Observability Stack (Pillar 10)
 *
 * Three pillars of observability for the UEF Gateway:
 *   1. AlertEngine       — threshold-based alerting with configurable channels
 *   2. CorrelationManager — distributed trace IDs via Express middleware
 *   3. MetricsExporter    — Prometheus + JSON metrics exposition
 *
 * Data is held in-memory for hot-path performance and periodically flushed
 * to SQLite for persistence across restarts. On startup, recent metrics and
 * alert history are restored from the database.
 */

import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import logger from '../logger';
import { getDb } from '../db';

// ---------------------------------------------------------------------------
// Alert Types
// ---------------------------------------------------------------------------

export type AlertCondition = 'gt' | 'lt' | 'eq';
export type AlertSeverity = 'critical' | 'warning' | 'info';
export type AlertChannel = 'log' | 'webhook' | 'email';

// Environment-based dispatch config
const ALERT_WEBHOOK_URL = process.env.ALERT_WEBHOOK_URL || '';
const ALERT_EMAIL_ENDPOINT = process.env.ALERT_EMAIL_ENDPOINT || ''; // HTTP endpoint for email relay (e.g., SendGrid, SES)

export interface AlertConfig {
  id: string;
  name: string;
  metric: string;
  condition: AlertCondition;
  threshold: number;
  window: number; // seconds
  severity: AlertSeverity;
  channel: AlertChannel;
}

export interface AlertEvent {
  alertId: string;
  name: string;
  metric: string;
  value: number;
  threshold: number;
  condition: AlertCondition;
  severity: AlertSeverity;
  triggeredAt: string;
  acknowledged: boolean;
}

// ---------------------------------------------------------------------------
// Metrics Types
// ---------------------------------------------------------------------------

export interface MetricDataPoint {
  value: number;
  timestamp: string;
  labels?: Record<string, string>;
}

export interface MetricSeries {
  name: string;
  values: MetricDataPoint[];
  count: number;
  sum: number;
  avg: number;
  min: number;
  max: number;
}

export interface MetricsSnapshot {
  timestamp: string;
  metrics: Record<string, MetricSeries>;
}

// ---------------------------------------------------------------------------
// AlertEngine
// ---------------------------------------------------------------------------

export class AlertEngine {
  private alerts: Map<string, AlertConfig> = new Map();
  private activeAlerts: Map<string, AlertEvent> = new Map();
  private alertHistory: AlertEvent[] = [];

  constructor() {
    this.registerDefaultAlerts();
  }

  /**
   * Define or update an alert configuration.
   */
  defineAlert(config: AlertConfig): void {
    this.alerts.set(config.id, config);
    logger.info(
      { alertId: config.id, metric: config.metric, condition: config.condition, threshold: config.threshold },
      '[Observability] Alert defined',
    );
  }

  /**
   * Evaluate a metric value against all alerts watching that metric.
   * Returns any newly triggered AlertEvents.
   */
  evaluate(metric: string, value: number): AlertEvent[] {
    const triggered: AlertEvent[] = [];

    for (const config of this.alerts.values()) {
      if (config.metric !== metric) continue;

      let conditionMet = false;
      switch (config.condition) {
        case 'gt':
          conditionMet = value > config.threshold;
          break;
        case 'lt':
          conditionMet = value < config.threshold;
          break;
        case 'eq':
          conditionMet = value === config.threshold;
          break;
      }

      if (conditionMet) {
        // Only fire if not already active (prevent alert storms)
        if (!this.activeAlerts.has(config.id)) {
          const event: AlertEvent = {
            alertId: config.id,
            name: config.name,
            metric: config.metric,
            value,
            threshold: config.threshold,
            condition: config.condition,
            severity: config.severity,
            triggeredAt: new Date().toISOString(),
            acknowledged: false,
          };

          this.activeAlerts.set(config.id, event);
          this.alertHistory.push(event);
          triggered.push(event);

          // Persist to SQLite for restart survival
          this.persistAlert(event);

          // Dispatch via configured channel
          this.dispatch(config, event);
        }
      } else {
        // Auto-resolve if condition is no longer met
        if (this.activeAlerts.has(config.id)) {
          logger.info(
            { alertId: config.id, metric, value },
            '[Observability] Alert auto-resolved',
          );
          this.activeAlerts.delete(config.id);
        }
      }
    }

    return triggered;
  }

  /**
   * Acknowledge an active alert by its alertId.
   */
  acknowledge(alertId: string): void {
    const event = this.activeAlerts.get(alertId);
    if (event) {
      event.acknowledged = true;
      logger.info({ alertId }, '[Observability] Alert acknowledged');
    } else {
      logger.warn({ alertId }, '[Observability] Cannot acknowledge — alert not active');
    }
  }

  /**
   * Get all currently active (unresolved) alerts.
   */
  getActiveAlerts(): AlertEvent[] {
    return Array.from(this.activeAlerts.values());
  }

  /**
   * Get alert history, optionally limited to the most recent N events.
   */
  getAlertHistory(limit?: number): AlertEvent[] {
    if (limit !== undefined && limit > 0) {
      return this.alertHistory.slice(-limit);
    }
    return [...this.alertHistory];
  }

  // -----------------------------------------------------------------------
  // Private
  // -----------------------------------------------------------------------

  /**
   * Dispatch an alert event through the configured channel.
   * Supports log (always), webhook (POST to ALERT_WEBHOOK_URL), and
   * email (POST to ALERT_EMAIL_ENDPOINT relay service).
   */
  private dispatch(config: AlertConfig, event: AlertEvent): void {
    // Always log regardless of channel
    logger.warn(
      {
        alertId: event.alertId,
        metric: event.metric,
        value: event.value,
        threshold: event.threshold,
        severity: event.severity,
        channel: config.channel,
      },
      `[Observability] ALERT FIRED: ${event.name}`,
    );

    if (config.channel === 'webhook') {
      this.dispatchWebhook(event);
    } else if (config.channel === 'email') {
      this.dispatchEmail(event);
    }
  }

  private dispatchWebhook(event: AlertEvent): void {
    if (!ALERT_WEBHOOK_URL) {
      logger.warn({ alertId: event.alertId }, '[Observability] Webhook URL not configured (set ALERT_WEBHOOK_URL)');
      return;
    }
    fetch(ALERT_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: 'aims-observability',
        alert: event,
        timestamp: new Date().toISOString(),
      }),
    })
      .then(res => {
        if (!res.ok) logger.error({ alertId: event.alertId, status: res.status }, '[Observability] Webhook dispatch failed');
        else logger.info({ alertId: event.alertId }, '[Observability] Webhook dispatched');
      })
      .catch(err => {
        logger.error({ alertId: event.alertId, err: err instanceof Error ? err.message : err }, '[Observability] Webhook dispatch error');
      });
  }

  private dispatchEmail(event: AlertEvent): void {
    if (!ALERT_EMAIL_ENDPOINT) {
      logger.warn({ alertId: event.alertId }, '[Observability] Email endpoint not configured (set ALERT_EMAIL_ENDPOINT)');
      return;
    }
    fetch(ALERT_EMAIL_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: process.env.ALERT_EMAIL_TO || 'admin@aimanagedsolutions.cloud',
        subject: `[AIMS ${event.severity.toUpperCase()}] ${event.name}`,
        body: `Alert: ${event.name}\nMetric: ${event.metric}\nValue: ${event.value} (threshold: ${event.threshold})\nSeverity: ${event.severity}\nTriggered: ${event.triggeredAt}`,
        alert: event,
      }),
    })
      .then(res => {
        if (!res.ok) logger.error({ alertId: event.alertId, status: res.status }, '[Observability] Email dispatch failed');
        else logger.info({ alertId: event.alertId }, '[Observability] Email dispatched');
      })
      .catch(err => {
        logger.error({ alertId: event.alertId, err: err instanceof Error ? err.message : err }, '[Observability] Email dispatch error');
      });
  }

  /**
   * Persist an alert event to SQLite for survival across restarts.
   */
  private persistAlert(event: AlertEvent): void {
    try {
      const db = getDb();
      db.prepare(`
        INSERT INTO alert_history (alertId, name, metric, value, threshold, condition, severity, triggered_at, acknowledged)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        event.alertId, event.name, event.metric, event.value,
        event.threshold, event.condition, event.severity,
        event.triggeredAt, event.acknowledged ? 1 : 0,
      );
    } catch (err) {
      logger.warn({ err }, '[Observability] Failed to persist alert — continuing in-memory');
    }
  }

  /**
   * Restore alert history from SQLite on startup.
   */
  restoreFromDb(): void {
    try {
      const db = getDb();
      const rows = db.prepare(
        `SELECT * FROM alert_history ORDER BY triggered_at DESC LIMIT 1000`
      ).all() as Array<{
        alertId: string; name: string; metric: string; value: number;
        threshold: number; condition: string; severity: string;
        triggered_at: string; acknowledged: number;
      }>;

      for (const row of rows) {
        this.alertHistory.push({
          alertId: row.alertId,
          name: row.name,
          metric: row.metric,
          value: row.value,
          threshold: row.threshold,
          condition: row.condition as AlertCondition,
          severity: row.severity as AlertSeverity,
          triggeredAt: row.triggered_at,
          acknowledged: row.acknowledged === 1,
        });
      }

      if (rows.length > 0) {
        logger.info({ count: rows.length }, '[Observability] Restored alert history from SQLite');
      }
    } catch (err) {
      logger.warn({ err }, '[Observability] Could not restore alert history — starting fresh');
    }
  }

  /**
   * Register the five default alerts required by the specification.
   */
  private registerDefaultAlerts(): void {
    const defaults: AlertConfig[] = [
      {
        id: 'default-error-rate',
        name: 'High Error Rate',
        metric: 'error_rate',
        condition: 'gt',
        threshold: 5,
        window: 300,
        severity: 'critical',
        channel: 'log',
      },
      {
        id: 'default-response-time',
        name: 'Slow Response Time',
        metric: 'response_time',
        condition: 'gt',
        threshold: 2000,
        window: 300,
        severity: 'warning',
        channel: 'log',
      },
      {
        id: 'default-uptime',
        name: 'Low Uptime',
        metric: 'uptime',
        condition: 'lt',
        threshold: 99,
        window: 300,
        severity: 'critical',
        channel: 'log',
      },
      {
        id: 'default-memory-usage',
        name: 'High Memory Usage',
        metric: 'memory_usage',
        condition: 'gt',
        threshold: 80,
        window: 300,
        severity: 'warning',
        channel: 'log',
      },
      {
        id: 'default-disk-usage',
        name: 'High Disk Usage',
        metric: 'disk_usage',
        condition: 'gt',
        threshold: 90,
        window: 300,
        severity: 'critical',
        channel: 'log',
      },
    ];

    for (const config of defaults) {
      this.alerts.set(config.id, config);
    }

    logger.info(
      { count: defaults.length },
      '[Observability] Default alerts registered',
    );
  }
}

// ---------------------------------------------------------------------------
// CorrelationManager
// ---------------------------------------------------------------------------

export class CorrelationManager {
  /**
   * Generate a unique correlation ID with the format:
   *   aims-{timestamp}-{uuid-short}
   */
  generateCorrelationId(): string {
    const ts = Date.now();
    const short = uuidv4().replace(/-/g, '').substring(0, 12);
    return `aims-${ts}-${short}`;
  }

  /**
   * Express middleware that ensures every request/response pair carries
   * a correlation ID. Incoming `x-correlation-id` headers are honoured;
   * otherwise a new ID is generated.
   */
  correlationMiddleware(): (req: Request, res: Response, next: NextFunction) => void {
    return (req: Request, res: Response, next: NextFunction): void => {
      const incoming = req.headers['x-correlation-id'];
      const correlationId =
        typeof incoming === 'string' && incoming.length > 0
          ? incoming
          : this.generateCorrelationId();

      // Attach to res.locals for downstream handlers
      res.locals.correlationId = correlationId;

      // Set response header
      res.setHeader('x-correlation-id', correlationId);

      // Create child logger with correlationId context
      const childLogger = logger.child({ correlationId });
      childLogger.info(
        { method: req.method, path: req.path },
        '[Observability] Request correlated',
      );

      next();
    };
  }
}

// ---------------------------------------------------------------------------
// MetricsExporter
// ---------------------------------------------------------------------------

/** Default metrics that are always tracked. */
const DEFAULT_METRIC_NAMES = [
  'http_requests_total',
  'http_request_duration_ms',
  'http_errors_total',
  'active_connections',
  'memory_usage_bytes',
];

export class MetricsExporter {
  private metrics: Map<string, MetricDataPoint[]> = new Map();
  private stats: Map<string, { sum: number; min: number; max: number }> = new Map();

  constructor() {
    // Pre-initialize default metric buckets
    for (const name of DEFAULT_METRIC_NAMES) {
      this.metrics.set(name, []);
      this.stats.set(name, { sum: 0, min: Infinity, max: -Infinity });
    }
  }

  /**
   * Record a metric data point.
   */
  record(metric: string, value: number, labels?: Record<string, string>): void {
    if (!this.metrics.has(metric)) {
      this.metrics.set(metric, []);
      this.stats.set(metric, { sum: 0, min: Infinity, max: -Infinity });
    }

    const dataPoints = this.metrics.get(metric)!;
    const stats = this.stats.get(metric)!;

    dataPoints.push({
      value,
      timestamp: new Date().toISOString(),
      labels,
    });

    // Update stats incrementally
    stats.sum += value;
    if (value < stats.min) stats.min = value;
    if (value > stats.max) stats.max = value;

    // Keep a rolling window of the last 10,000 data points per metric
    if (dataPoints.length > 10_000) {
      const removed = dataPoints.shift()!;
      stats.sum -= removed.value;
      if (removed.value === stats.min || removed.value === stats.max) {
        this.recalculateMinMax(metric);
      }
    }
  }

  /**
   * Retrieve the full series for a given metric name.
   */
  getMetric(name: string): MetricSeries {
    const values = this.metrics.get(name) ?? [];
    return this.buildSeries(name, values);
  }

  /**
   * Export all metrics in Prometheus text exposition format.
   */
  exportPrometheus(): string {
    const lines: string[] = [];

    for (const [name, dataPoints] of this.metrics.entries()) {
      if (dataPoints.length === 0) continue;

      const stats = this.stats.get(name)!;
      const count = dataPoints.length;
      const sumRounded = Math.round(stats.sum * 100) / 100;
      const avg = Math.round((stats.sum / count) * 100) / 100;

      // HELP line
      lines.push(`# HELP ${name} A.I.M.S. UEF Gateway metric`);

      // TYPE line — use gauge for everything in this simplified exporter
      lines.push(`# TYPE ${name} gauge`);

      // If we have the latest data point, emit it (optionally with labels)
      const latest = dataPoints[dataPoints.length - 1];
      const labelStr = this.formatLabels(latest.labels);
      lines.push(`${name}${labelStr} ${latest.value}`);

      // Also emit summary stats as suffixed metrics
      lines.push(`${name}_count ${count}`);
      lines.push(`${name}_sum ${sumRounded}`);
      lines.push(`${name}_avg ${avg}`);
      lines.push(`${name}_min ${stats.min}`);
      lines.push(`${name}_max ${stats.max}`);

      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Export all metrics as a JSON snapshot.
   */
  exportJSON(): MetricsSnapshot {
    const metricsRecord: Record<string, MetricSeries> = {};

    for (const [name, dataPoints] of this.metrics.entries()) {
      metricsRecord[name] = this.buildSeries(name, dataPoints);
    }

    return {
      timestamp: new Date().toISOString(),
      metrics: metricsRecord,
    };
  }

  /**
   * Flush recent metrics to SQLite. Only persists the latest snapshot per
   * metric (not every data point) to keep the DB lean. Called periodically.
   */
  flushToDb(): void {
    try {
      const db = getDb();
      const insert = db.prepare(`
        INSERT INTO metric_snapshots (metric, value, labels, recorded_at)
        VALUES (?, ?, ?, ?)
      `);

      const tx = db.transaction(() => {
        let flushed = 0;
        for (const [name, dataPoints] of this.metrics.entries()) {
          if (dataPoints.length === 0) continue;
          const latest = dataPoints[dataPoints.length - 1];
          insert.run(name, latest.value, JSON.stringify(latest.labels || {}), latest.timestamp);
          flushed++;
        }
        return flushed;
      });

      const count = tx();
      if (count > 0) {
        logger.debug({ count }, '[Observability] Flushed metric snapshots to SQLite');
      }
    } catch (err) {
      logger.warn({ err }, '[Observability] Failed to flush metrics — continuing in-memory');
    }
  }

  /**
   * Restore metric history from SQLite on startup.
   * Loads the most recent 100 snapshots per metric.
   */
  restoreFromDb(): void {
    try {
      const db = getDb();
      const rows = db.prepare(`
        SELECT metric, value, labels, recorded_at
        FROM metric_snapshots
        ORDER BY recorded_at DESC
        LIMIT 5000
      `).all() as Array<{ metric: string; value: number; labels: string; recorded_at: string }>;

      // Group by metric name and insert in chronological order
      const grouped = new Map<string, MetricDataPoint[]>();
      for (const row of rows) {
        const points = grouped.get(row.metric) || [];
        points.push({
          value: row.value,
          timestamp: row.recorded_at,
          labels: JSON.parse(row.labels),
        });
        grouped.set(row.metric, points);
      }

      for (const [metric, points] of grouped.entries()) {
        // Reverse so they're in chronological order
        const sorted = points.reverse();
        for (const point of sorted) {
          this.record(metric, point.value, point.labels);
        }
      }

      if (rows.length > 0) {
        logger.info({ snapshotCount: rows.length, metricCount: grouped.size }, '[Observability] Restored metrics from SQLite');
      }
    } catch (err) {
      logger.warn({ err }, '[Observability] Could not restore metrics — starting fresh');
    }
  }

  /**
   * Prune metric snapshots older than the given number of days.
   */
  pruneOldSnapshots(maxAgeDays: number = 7): void {
    try {
      const db = getDb();
      const cutoff = new Date(Date.now() - maxAgeDays * 24 * 60 * 60 * 1000).toISOString();
      const result = db.prepare(`DELETE FROM metric_snapshots WHERE recorded_at < ?`).run(cutoff);
      if (result.changes > 0) {
        logger.info({ deleted: result.changes, maxAgeDays }, '[Observability] Pruned old metric snapshots');
      }
    } catch (err) {
      logger.warn({ err }, '[Observability] Failed to prune metric snapshots');
    }
  }

  // -----------------------------------------------------------------------
  // Private
  // -----------------------------------------------------------------------

  /**
   * Build a MetricSeries aggregate from raw data points.
   */
  private buildSeries(name: string, values: MetricDataPoint[]): MetricSeries {
    if (values.length === 0) {
      return { name, values: [], count: 0, sum: 0, avg: 0, min: 0, max: 0 };
    }

    const stats = this.stats.get(name)!;
    const avg = Math.round((stats.sum / values.length) * 100) / 100;

    return {
      name,
      values: [...values],
      count: values.length,
      sum: Math.round(stats.sum * 100) / 100,
      avg,
      min: stats.min,
      max: stats.max,
    };
  }

  /**
   * Re-calculate min and max for a metric series.
   */
  private recalculateMinMax(name: string): void {
    const dataPoints = this.metrics.get(name)!;
    const stats = this.stats.get(name)!;

    if (dataPoints.length === 0) {
      stats.min = Infinity;
      stats.max = -Infinity;
      return;
    }

    let min = dataPoints[0].value;
    let max = dataPoints[0].value;

    for (let i = 1; i < dataPoints.length; i++) {
      const val = dataPoints[i].value;
      if (val < min) min = val;
      if (val > max) max = val;
    }

    stats.min = min;
    stats.max = max;
  }

  /**
   * Format labels into Prometheus label string: {key="val",key2="val2"}
   */
  private formatLabels(labels?: Record<string, string>): string {
    if (!labels || Object.keys(labels).length === 0) return '';
    const pairs = Object.entries(labels)
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');
    return `{${pairs}}`;
  }
}

// ---------------------------------------------------------------------------
// Singletons
// ---------------------------------------------------------------------------

export const alertEngine = new AlertEngine();
export const correlationManager = new CorrelationManager();
export const metricsExporter = new MetricsExporter();

// ---------------------------------------------------------------------------
// Startup Restore + Periodic Flush
// ---------------------------------------------------------------------------

/**
 * Initialize observability persistence: restore from SQLite and start
 * periodic flush. Call once after DB is initialized.
 */
export function initObservabilityPersistence(): void {
  // Restore historical data
  alertEngine.restoreFromDb();
  metricsExporter.restoreFromDb();

  // Flush metrics to SQLite every 5 minutes
  setInterval(() => {
    metricsExporter.flushToDb();
  }, 5 * 60 * 1000);

  // Prune old snapshots daily (keep 7 days)
  setInterval(() => {
    metricsExporter.pruneOldSnapshots(7);
  }, 24 * 60 * 60 * 1000);

  logger.info('[Observability] Persistence initialized — flush every 5m, prune every 24h');
}
