/**
 * Health Monitor — Continuous Background Health Checks
 *
 * Runs a periodic sweep across all running plug instances:
 *   - Polls each instance's health endpoint
 *   - Detects status transitions (healthy → unhealthy, running → stopped)
 *   - Emits events for status changes (consumed by ACHEEVY for notifications)
 *   - Auto-restarts instances that fail repeatedly (configurable)
 *   - Updates instance health status in the deploy engine
 *
 * Lifecycle:
 *   healthMonitor.start()  — Begin periodic sweeps
 *   healthMonitor.stop()   — Stop monitoring
 *   healthMonitor.sweep()  — Manual single sweep
 */

import logger from '../logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MonitoredInstance {
  instanceId: string;
  plugId: string;
  port: number;
  healthEndpoint: string;
  consecutiveFailures: number;
  lastStatus: 'healthy' | 'unhealthy' | 'unknown';
  lastCheck: string;
  lastStatusChange: string;
}

export interface HealthEvent {
  instanceId: string;
  plugId: string;
  type: 'healthy' | 'unhealthy' | 'stopped' | 'auto-restarted' | 'alert';
  message: string;
  timestamp: string;
  previousStatus: string;
}

interface MonitorConfig {
  sweepIntervalMs: number;     // How often to run sweeps (default: 30s)
  healthTimeoutMs: number;     // Per-instance health check timeout (default: 5s)
  maxConsecutiveFailures: number; // Before emitting alert (default: 3)
  autoRestart: boolean;        // Auto-restart on repeated failures
  autoRestartThreshold: number; // Failures before auto-restart (default: 5)
}

type InstanceProvider = () => Array<{
  instanceId: string;
  plugId: string;
  port: number;
  healthEndpoint: string;
  status: string;
}>;

type StatusUpdater = (instanceId: string, healthStatus: 'healthy' | 'unhealthy' | 'unknown') => void;

type RestartHandler = (instanceId: string) => Promise<void>;

// ---------------------------------------------------------------------------
// Health Monitor
// ---------------------------------------------------------------------------

export class HealthMonitor {
  private config: MonitorConfig;
  private monitored = new Map<string, MonitoredInstance>();
  private events: HealthEvent[] = [];
  private timer: ReturnType<typeof setInterval> | null = null;
  private sweeping = false;

  // Callbacks — set by the deploy engine
  private instanceProvider: InstanceProvider | null = null;
  private statusUpdater: StatusUpdater | null = null;
  private restartHandler: RestartHandler | null = null;

  constructor(config?: Partial<MonitorConfig>) {
    this.config = {
      sweepIntervalMs: config?.sweepIntervalMs || 30_000,
      healthTimeoutMs: config?.healthTimeoutMs || 5_000,
      maxConsecutiveFailures: config?.maxConsecutiveFailures || 3,
      autoRestart: config?.autoRestart ?? false,
      autoRestartThreshold: config?.autoRestartThreshold || 5,
    };
  }

  // -----------------------------------------------------------------------
  // Wire up callbacks
  // -----------------------------------------------------------------------

  onGetInstances(provider: InstanceProvider): void {
    this.instanceProvider = provider;
  }

  onStatusUpdate(updater: StatusUpdater): void {
    this.statusUpdater = updater;
  }

  onRestart(handler: RestartHandler): void {
    this.restartHandler = handler;
  }

  // -----------------------------------------------------------------------
  // Start / Stop
  // -----------------------------------------------------------------------

  start(): void {
    if (this.timer) return; // Already running

    logger.info(
      { intervalMs: this.config.sweepIntervalMs, autoRestart: this.config.autoRestart },
      '[HealthMonitor] Starting continuous health monitoring',
    );

    this.timer = setInterval(() => {
      this.sweep().catch(err => {
        logger.error({ err }, '[HealthMonitor] Sweep failed');
      });
    }, this.config.sweepIntervalMs);

    // Run first sweep immediately
    this.sweep().catch(() => {});
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      logger.info('[HealthMonitor] Stopped');
    }
  }

  isRunning(): boolean {
    return this.timer !== null;
  }

  // -----------------------------------------------------------------------
  // Sweep — check all instances
  // -----------------------------------------------------------------------

  async sweep(): Promise<HealthEvent[]> {
    if (this.sweeping) return []; // Prevent concurrent sweeps
    this.sweeping = true;

    const sweepEvents: HealthEvent[] = [];

    try {
      // Get current running instances
      const instances = this.instanceProvider?.() || [];

      // Register new instances, remove stale ones
      const activeIds = new Set(instances.map(i => i.instanceId));
      for (const id of this.monitored.keys()) {
        if (!activeIds.has(id)) {
          this.monitored.delete(id);
        }
      }

      // Check each instance
      const checks = instances
        .filter(i => i.status === 'running')
        .map(async (inst) => {
          const event = await this.checkInstance(inst);
          if (event) sweepEvents.push(event);
        });

      await Promise.allSettled(checks);

      // Store events
      this.events.push(...sweepEvents);

      // Keep event history bounded (last 1000)
      if (this.events.length > 1000) {
        this.events = this.events.slice(-1000);
      }

      if (sweepEvents.length > 0) {
        logger.info(
          { events: sweepEvents.length, monitored: this.monitored.size },
          '[HealthMonitor] Sweep complete with status changes',
        );
      }
    } finally {
      this.sweeping = false;
    }

    return sweepEvents;
  }

  // -----------------------------------------------------------------------
  // Check single instance
  // -----------------------------------------------------------------------

  private async checkInstance(inst: {
    instanceId: string;
    plugId: string;
    port: number;
    healthEndpoint: string;
  }): Promise<HealthEvent | null> {
    const now = new Date().toISOString();

    let monitored = this.monitored.get(inst.instanceId);
    if (!monitored) {
      monitored = {
        instanceId: inst.instanceId,
        plugId: inst.plugId,
        port: inst.port,
        healthEndpoint: inst.healthEndpoint,
        consecutiveFailures: 0,
        lastStatus: 'unknown',
        lastCheck: now,
        lastStatusChange: now,
      };
      this.monitored.set(inst.instanceId, monitored);
    }

    // Perform health check
    const healthy = await this.ping(inst.port, inst.healthEndpoint);
    monitored.lastCheck = now;

    const previousStatus = monitored.lastStatus;
    let event: HealthEvent | null = null;

    if (healthy) {
      monitored.consecutiveFailures = 0;

      if (previousStatus !== 'healthy') {
        monitored.lastStatus = 'healthy';
        monitored.lastStatusChange = now;
        this.statusUpdater?.(inst.instanceId, 'healthy');

        event = {
          instanceId: inst.instanceId,
          plugId: inst.plugId,
          type: 'healthy',
          message: `Instance recovered (was ${previousStatus})`,
          timestamp: now,
          previousStatus,
        };
      }
    } else {
      monitored.consecutiveFailures++;
      monitored.lastStatus = 'unhealthy';
      this.statusUpdater?.(inst.instanceId, 'unhealthy');

      // Status change — was healthy, now unhealthy
      if (previousStatus === 'healthy') {
        monitored.lastStatusChange = now;
        event = {
          instanceId: inst.instanceId,
          plugId: inst.plugId,
          type: 'unhealthy',
          message: `Instance became unhealthy`,
          timestamp: now,
          previousStatus,
        };
      }

      // Alert threshold
      if (monitored.consecutiveFailures === this.config.maxConsecutiveFailures) {
        event = {
          instanceId: inst.instanceId,
          plugId: inst.plugId,
          type: 'alert',
          message: `${monitored.consecutiveFailures} consecutive health check failures`,
          timestamp: now,
          previousStatus,
        };
      }

      // Auto-restart threshold
      if (
        this.config.autoRestart &&
        this.restartHandler &&
        monitored.consecutiveFailures === this.config.autoRestartThreshold
      ) {
        logger.warn(
          { instanceId: inst.instanceId, failures: monitored.consecutiveFailures },
          '[HealthMonitor] Auto-restarting instance',
        );

        try {
          await this.restartHandler(inst.instanceId);
          monitored.consecutiveFailures = 0;
          event = {
            instanceId: inst.instanceId,
            plugId: inst.plugId,
            type: 'auto-restarted',
            message: `Auto-restarted after ${this.config.autoRestartThreshold} failures`,
            timestamp: now,
            previousStatus,
          };
        } catch (err) {
          logger.error({ err, instanceId: inst.instanceId }, '[HealthMonitor] Auto-restart failed');
        }
      }
    }

    return event;
  }

  // -----------------------------------------------------------------------
  // HTTP health ping
  // -----------------------------------------------------------------------

  private async ping(port: number, endpoint: string): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.config.healthTimeoutMs);
      const res = await fetch(`http://127.0.0.1:${port}${endpoint}`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);
      return res.ok;
    } catch {
      return false;
    }
  }

  // -----------------------------------------------------------------------
  // Query events
  // -----------------------------------------------------------------------

  getRecentEvents(limit: number = 50): HealthEvent[] {
    return this.events.slice(-limit);
  }

  getInstanceStatus(instanceId: string): MonitoredInstance | undefined {
    return this.monitored.get(instanceId);
  }

  getAllStatuses(): MonitoredInstance[] {
    return Array.from(this.monitored.values());
  }

  getStats(): {
    monitored: number;
    healthy: number;
    unhealthy: number;
    unknown: number;
    recentEvents: number;
  } {
    let healthy = 0;
    let unhealthy = 0;
    let unknown = 0;

    for (const m of this.monitored.values()) {
      if (m.lastStatus === 'healthy') healthy++;
      else if (m.lastStatus === 'unhealthy') unhealthy++;
      else unknown++;
    }

    return {
      monitored: this.monitored.size,
      healthy,
      unhealthy,
      unknown,
      recentEvents: this.events.length,
    };
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

export const healthMonitor = new HealthMonitor({
  sweepIntervalMs: parseInt(process.env.HEALTH_SWEEP_INTERVAL_MS || '30000'),
  autoRestart: process.env.HEALTH_AUTO_RESTART === 'true',
});
