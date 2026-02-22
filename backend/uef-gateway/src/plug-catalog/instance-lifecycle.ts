/**
 * Instance Lifecycle Manager
 *
 * Orchestrates the full lifecycle of plug instances:
 *   Create → Configure → Deploy → Monitor → Scale → Decommission
 *
 * This module wires together:
 *   - PortAllocator (port management)
 *   - HealthMonitor (continuous monitoring)
 *   - DockerRuntime (container operations)
 *   - CloudflareClient (DNS subdomain management)
 *   - PlugDeployEngine (deployment orchestration)
 *
 * It provides the "glue" that the deploy engine was missing:
 *   - Proper port allocation with persistence
 *   - DNS subdomain creation/removal on deploy/decommission
 *   - Graceful decommission with cleanup
 *   - Instance recovery after server restart
 *   - Resource usage tracking
 */

import logger from '../logger';
import { portAllocator } from './port-allocator';
import { healthMonitor, type HealthEvent } from './health-monitor';
import { dockerRuntime } from './docker-runtime';
import { plugDeployEngine } from './deploy-engine';
import { plugCatalog } from './catalog';
import { cloudflare } from '../cloudflare/client';
import { kvSync } from './kv-sync';
import { alertEngine } from '../observability';
import { liveSim } from '../livesim';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const AIMS_DOMAIN = process.env.AIMS_DOMAIN || 'plugmein.cloud';
const VPS_IP = process.env.VPS_IP || '76.13.96.107';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DecommissionResult {
  instanceId: string;
  steps: Array<{ step: string; success: boolean; detail?: string }>;
  fullyDecommissioned: boolean;
}

export interface LifecycleStats {
  totalInstances: number;
  runningInstances: number;
  stoppedInstances: number;
  portCapacity: { used: number; total: number; percentage: number };
  healthStats: { monitored: number; healthy: number; unhealthy: number; unknown: number };
  recentEvents: HealthEvent[];
}

// ---------------------------------------------------------------------------
// Instance Lifecycle Manager
// ---------------------------------------------------------------------------

export class InstanceLifecycle {
  private initialized = false;

  // -----------------------------------------------------------------------
  // Initialize — call once at startup
  // -----------------------------------------------------------------------

  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Load persisted instances from SQLite (survives restarts)
    const restored = plugDeployEngine.loadFromStore();
    if (restored > 0) {
      logger.info({ restored }, '[InstanceLifecycle] Restored instances from database');
    }

    // Load port allocator state
    await portAllocator.load();

    // Wire health monitor to deploy engine
    healthMonitor.onGetInstances(() => {
      const instances = plugDeployEngine.listByUser('*'); // All instances
      // Since listByUser filters by user, we need a different approach
      // Use the port allocator's records instead
      const allocations = portAllocator.getAllocations();
      return allocations.map(alloc => {
        const instance = plugDeployEngine.getInstance(alloc.instanceId);
        const plug = instance ? plugCatalog.get(instance.plugId) : null;
        return {
          instanceId: alloc.instanceId,
          plugId: alloc.plugId,
          port: alloc.port,
          healthEndpoint: plug?.healthCheck.endpoint || '/health',
          status: instance?.status || 'unknown',
        };
      });
    });

    healthMonitor.onStatusUpdate((instanceId, healthStatus) => {
      const instance = plugDeployEngine.getInstance(instanceId);
      if (instance) {
        instance.healthStatus = healthStatus;
        instance.lastHealthCheck = new Date().toISOString();

        // Wire to observability: evaluate alerts per instance
        const metricName = `instance.${instanceId}.health`;
        alertEngine.evaluate(metricName, healthStatus === 'healthy' ? 1 : 0);

        // Wire to LiveSim: broadcast health status changes
        liveSim.emitDeployEvent(instanceId, 'health', `Instance ${instanceId} is now ${healthStatus}`, {
          plugId: instance.plugId,
          userId: instance.userId,
          healthStatus,
        });

        // Aggregate metric: total unhealthy instances
        const allInstances = portAllocator.getAllocations();
        let unhealthyCount = 0;
        for (const alloc of allInstances) {
          const inst = plugDeployEngine.getInstance(alloc.instanceId);
          if (inst?.healthStatus === 'unhealthy') unhealthyCount++;
        }
        alertEngine.evaluate('plug_instances_unhealthy', unhealthyCount);
      }
    });

    healthMonitor.onRestart(async (instanceId) => {
      await plugDeployEngine.restartInstance(instanceId);
      liveSim.emitAgentActivity('HealthMonitor', 'auto_restart', `Auto-restarted instance ${instanceId}`);
    });

    // Register per-instance alert templates
    alertEngine.defineAlert({
      id: 'plug-instances-unhealthy',
      name: 'Unhealthy Plug Instances',
      metric: 'plug_instances_unhealthy',
      condition: 'gt',
      threshold: 0,
      window: 60,
      severity: 'warning',
      channel: 'log',
    });

    // Start health monitoring
    healthMonitor.start();

    // Reconcile port allocator with actual Docker state
    await this.reconcile();

    this.initialized = true;
    logger.info('[InstanceLifecycle] Initialized');
  }

  // -----------------------------------------------------------------------
  // Allocate port (called by deploy engine)
  // -----------------------------------------------------------------------

  async allocatePort(instanceId: string, plugId: string, userId: string): Promise<number> {
    return portAllocator.allocate(instanceId, plugId, userId);
  }

  // -----------------------------------------------------------------------
  // Post-deploy setup (DNS, monitoring registration)
  // -----------------------------------------------------------------------

  async onInstanceDeployed(instanceId: string): Promise<void> {
    const instance = plugDeployEngine.getInstance(instanceId);
    if (!instance) return;

    const plug = plugCatalog.get(instance.plugId);
    if (!plug) return;

    // Create DNS subdomain if Cloudflare is configured
    const cfConfigured = await cloudflare.isConfigured();
    if (cfConfigured && !instance.domain) {
      const sanitizedName = instance.name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
      const result = await cloudflare.createPlugSubdomain(sanitizedName, AIMS_DOMAIN, VPS_IP);
      if (!result.error) {
        instance.domain = result.fqdn;
        logger.info(
          { instanceId, fqdn: result.fqdn },
          '[InstanceLifecycle] DNS subdomain created',
        );
      } else {
        logger.warn(
          { instanceId, error: result.error },
          '[InstanceLifecycle] DNS subdomain creation failed — instance accessible via port',
        );
      }
    }

    // Sync route to Cloudflare KV for edge routing
    if (instance.domain || instance.name) {
      const subdomain = (instance.domain || instance.name).split('.')[0].toLowerCase().replace(/[^a-z0-9-]/g, '-');
      await kvSync.pushRoute(subdomain, instance.assignedPort, instanceId);
    }

    logger.info({ instanceId, plugId: plug.id }, '[InstanceLifecycle] Post-deploy setup complete');
  }

  // -----------------------------------------------------------------------
  // Decommission — full cleanup
  // -----------------------------------------------------------------------

  async decommission(instanceId: string): Promise<DecommissionResult> {
    const steps: DecommissionResult['steps'] = [];
    const instance = plugDeployEngine.getInstance(instanceId);

    if (!instance) {
      return {
        instanceId,
        steps: [{ step: 'lookup', success: false, detail: 'Instance not found' }],
        fullyDecommissioned: false,
      };
    }

    logger.info({ instanceId, plugId: instance.plugId }, '[InstanceLifecycle] Decommission starting');

    // 1. Stop the container
    try {
      const stopResult = await dockerRuntime.stopContainer(instance);
      steps.push({ step: 'stop-container', success: stopResult.stopped, detail: stopResult.error });
    } catch (err) {
      steps.push({ step: 'stop-container', success: false, detail: String(err) });
    }

    // 2. Remove DNS subdomain
    if (instance.domain) {
      try {
        const sanitizedName = instance.name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
        const removed = await cloudflare.removePlugSubdomain(sanitizedName, AIMS_DOMAIN);
        steps.push({ step: 'remove-dns', success: removed, detail: instance.domain });
      } catch (err) {
        steps.push({ step: 'remove-dns', success: false, detail: String(err) });
      }
    } else {
      steps.push({ step: 'remove-dns', success: true, detail: 'No DNS record to remove' });
    }

    // 3. Remove nginx config
    try {
      await dockerRuntime.removeNginxConfig(instance);
      steps.push({ step: 'remove-nginx', success: true });
    } catch (err) {
      steps.push({ step: 'remove-nginx', success: false, detail: String(err) });
    }

    // 4. Remove the container
    try {
      const removeResult = await dockerRuntime.removeContainer(instance);
      steps.push({ step: 'remove-container', success: removeResult.removed, detail: removeResult.error });
    } catch (err) {
      steps.push({ step: 'remove-container', success: false, detail: String(err) });
    }

    // 5. Remove KV route (edge routing cleanup)
    try {
      const subdomain = (instance.domain || instance.name).split('.')[0].toLowerCase().replace(/[^a-z0-9-]/g, '-');
      const kvRemoved = await kvSync.removeRoute(subdomain);
      steps.push({ step: 'remove-kv-route', success: kvRemoved || !kvSync.isEnabled(), detail: subdomain });
    } catch (err) {
      steps.push({ step: 'remove-kv-route', success: false, detail: String(err) });
    }

    // 6. Release port
    try {
      const releasedPort = await portAllocator.release(instanceId);
      steps.push({ step: 'release-port', success: true, detail: `Port ${releasedPort}` });
    } catch (err) {
      steps.push({ step: 'release-port', success: false, detail: String(err) });
    }

    // 7. Remove from deploy engine
    try {
      plugDeployEngine.removeInstance(instanceId);
      steps.push({ step: 'remove-record', success: true });
    } catch (err) {
      steps.push({ step: 'remove-record', success: false, detail: String(err) });
    }

    const fullyDecommissioned = steps.every(s => s.success);

    logger.info(
      { instanceId, fullyDecommissioned, stepCount: steps.length },
      '[InstanceLifecycle] Decommission complete',
    );

    return { instanceId, steps, fullyDecommissioned };
  }

  // -----------------------------------------------------------------------
  // Reconcile — sync state after restart
  // -----------------------------------------------------------------------

  async reconcile(): Promise<void> {
    try {
      const managedContainers = await dockerRuntime.listManagedContainers();
      const runningIds = new Set(managedContainers.map(c => c.instanceId));

      const { orphanedPorts, missingAllocations } = await portAllocator.reconcile(runningIds);

      if (orphanedPorts.length > 0) {
        logger.info(
          { orphanedPorts },
          '[InstanceLifecycle] Found orphaned port allocations — will clean up on next sweep',
        );
      }

      if (missingAllocations.length > 0) {
        logger.warn(
          { missingAllocations },
          '[InstanceLifecycle] Found running containers without port allocations',
        );
      }
    } catch (err) {
      logger.error({ err }, '[InstanceLifecycle] Reconciliation failed');
    }
  }

  // -----------------------------------------------------------------------
  // Stats
  // -----------------------------------------------------------------------

  getStats(): LifecycleStats {
    const allocations = portAllocator.getAllocations();
    const healthStats = healthMonitor.getStats();
    const portCapacity = portAllocator.getCapacity();
    const recentEvents = healthMonitor.getRecentEvents(20);

    let running = 0;
    let stopped = 0;

    for (const alloc of allocations) {
      const instance = plugDeployEngine.getInstance(alloc.instanceId);
      if (instance?.status === 'running') running++;
      else stopped++;
    }

    return {
      totalInstances: allocations.length,
      runningInstances: running,
      stoppedInstances: stopped,
      portCapacity,
      healthStats,
      recentEvents,
    };
  }

  // -----------------------------------------------------------------------
  // Health monitor controls
  // -----------------------------------------------------------------------

  getHealthMonitor(): typeof healthMonitor {
    return healthMonitor;
  }

  getPortAllocator(): typeof portAllocator {
    return portAllocator;
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

export const instanceLifecycle = new InstanceLifecycle();
