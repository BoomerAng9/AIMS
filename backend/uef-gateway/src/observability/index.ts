/**
 * A.I.M.S. Observability Stack (Pillar 10)
 *
 * Three pillars of observability for the UEF Gateway:
 *   1. AlertEngine       — threshold-based alerting with configurable channels
 *   2. CorrelationManager — distributed trace IDs via Express middleware
 *   3. MetricsExporter    — Prometheus + JSON metrics exposition
 *
 * All data is held in-memory. A time-series DB or external alerting
 * service (PagerDuty, OpsGenie) can be wired in later.
 */

import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import logger from '../logger';

// ---------------------------------------------------------------------------
// Alert Types
// ---------------------------------------------------------------------------

export type AlertCondition = 'gt' | 'lt' | 'eq';
export type AlertSeverity = 'critical' | 'warning' | 'info';
export type AlertChannel = 'log' | 'webhook' | 'email';

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
   * Currently only 'log' is implemented; 'webhook' and 'email' are stubs.
   */
  private dispatch(config: AlertConfig, event: AlertEvent): void {
    switch (config.channel) {
      case 'log':
        logger.warn(
          {
            alertId: event.alertId,
            metric: event.metric,
            value: event.value,
            threshold: event.threshold,
            severity: event.severity,
          },
          `[Observability] ALERT FIRED: ${event.name}`,
        );
        break;

      case 'webhook':
        // Stub: In production, POST to a webhook URL
        logger.info(
          { alertId: event.alertId, channel: 'webhook' },
          '[Observability] Webhook dispatch (stub)',
        );
        break;

      case 'email':
        // Stub: In production, send email via SMTP/SES
        logger.info(
          { alertId: event.alertId, channel: 'email' },
          '[Observability] Email dispatch (stub)',
        );
        break;
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

  constructor() {
    // Pre-initialize default metric buckets
    for (const name of DEFAULT_METRIC_NAMES) {
      this.metrics.set(name, []);
    }
  }

  /**
   * Record a metric data point.
   */
  record(metric: string, value: number, labels?: Record<string, string>): void {
    if (!this.metrics.has(metric)) {
      this.metrics.set(metric, []);
    }

    const dataPoints = this.metrics.get(metric)!;
    dataPoints.push({
      value,
      timestamp: new Date().toISOString(),
      labels,
    });

    // Keep a rolling window of the last 10,000 data points per metric
    if (dataPoints.length > 10_000) {
      dataPoints.splice(0, dataPoints.length - 10_000);
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

      const series = this.buildSeries(name, dataPoints);

      // HELP line
      lines.push(`# HELP ${name} A.I.M.S. UEF Gateway metric`);

      // TYPE line — use gauge for everything in this simplified exporter
      lines.push(`# TYPE ${name} gauge`);

      // If we have the latest data point, emit it (optionally with labels)
      const latest = dataPoints[dataPoints.length - 1];
      const labelStr = this.formatLabels(latest.labels);
      lines.push(`${name}${labelStr} ${latest.value}`);

      // Also emit summary stats as suffixed metrics
      lines.push(`${name}_count ${series.count}`);
      lines.push(`${name}_sum ${series.sum}`);
      lines.push(`${name}_avg ${series.avg}`);
      lines.push(`${name}_min ${series.min}`);
      lines.push(`${name}_max ${series.max}`);

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

    let sum = 0;
    let min = values[0].value;
    let max = values[0].value;

    for (const dp of values) {
      sum += dp.value;
      if (dp.value < min) min = dp.value;
      if (dp.value > max) max = dp.value;
    }

    const avg = Math.round((sum / values.length) * 100) / 100;

    return {
      name,
      values: [...values],
      count: values.length,
      sum: Math.round(sum * 100) / 100,
      avg,
      min,
      max,
    };
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
