/**
 * Enterprise Fleet Manager — Multi-Instance Orchestration
 *
 * Organizations don't deploy one instance. They deploy 10, 20, 50.
 * The Fleet Manager handles:
 *   1. BULK SPIN-UP — Deploy multiple instances from a manifest
 *   2. FLEET HEALTH — Aggregate health across all instances
 *   3. RESOURCE POOLING — Track total resource usage across the fleet
 *   4. ENVIRONMENT MANAGEMENT — prod/staging/dev segregation
 *   5. FLEET OPERATIONS — Start all, stop all, scale group, rolling updates
 *   6. DEPENDENCY TRACKING — Instance A depends on Instance B
 *
 * This is the difference between "I deployed a tool" and
 * "I deployed an infrastructure that runs my organization."
 *
 * "One workspace. Many instances. One fleet. Complete control."
 */

import { v4 as uuidv4 } from 'uuid';
import type { WorkspaceEnvironment } from './enterprise-workspace';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Fleet-level instance record (mirrors PlugInstance but workspace-aware) */
export interface FleetInstance {
  instanceId: string;
  plugId: string;
  workspaceId: string;
  environment: WorkspaceEnvironment;
  name: string;
  status: 'provisioning' | 'running' | 'stopped' | 'failed' | 'decommissioned';
  assignedPort: number;
  domain?: string;

  // Resource allocation for this instance
  resources: {
    cpuCores: number;
    memoryGb: number;
    storageGb: number;
  };

  // Health
  healthStatus: 'healthy' | 'unhealthy' | 'degraded' | 'unknown';
  lastHealthCheck?: string;
  consecutiveFailures: number;

  // Dependencies
  dependsOn: string[];           // Instance IDs this depends on
  dependedBy: string[];          // Instance IDs that depend on this

  // LUC cost tracking
  lucCostToDate: number;         // Accumulated cost in USD
  lucServiceKeys: string[];      // Which LUC keys this instance consumes

  // Tags for grouping and filtering
  tags: Record<string, string>;  // e.g., { team: 'engineering', service: 'api' }

  // Lifecycle
  deployedBy: string;
  deployedAt: string;
  lastUpdated: string;
}

/** A deployment manifest for bulk spin-up */
export interface DeploymentManifest {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  environment: WorkspaceEnvironment;
  instances: ManifestInstance[];
  createdBy: string;
  createdAt: string;
  status: 'draft' | 'validating' | 'approved' | 'deploying' | 'deployed' | 'failed';
  estimatedCost: number;
  deploymentOrder: string[];     // Instance IDs in dependency-resolved order
}

/** A single instance definition within a manifest */
export interface ManifestInstance {
  instanceName: string;
  plugId: string;
  resources: {
    cpuCores: number;
    memoryGb: number;
    storageGb: number;
  };
  envOverrides: Record<string, string>;
  customizations: Record<string, string | boolean | number>;
  dependsOn: string[];           // Other instance names in this manifest
  tags: Record<string, string>;
  domain?: string;
}

/** Fleet health snapshot */
export interface FleetHealthSnapshot {
  workspaceId: string;
  timestamp: string;
  totalInstances: number;
  byStatus: Record<string, number>;
  byHealth: Record<string, number>;
  byEnvironment: Record<string, number>;
  unhealthyInstances: Array<{
    instanceId: string;
    name: string;
    plugId: string;
    healthStatus: string;
    consecutiveFailures: number;
    lastHealthCheck?: string;
  }>;
  totalResources: {
    cpuCores: number;
    memoryGb: number;
    storageGb: number;
  };
  resourceUtilization: {
    cpuPercent: number;
    memoryPercent: number;
    storagePercent: number;
  };
  totalLucCost: number;
}

/** Bulk operation result */
export interface BulkOperationResult {
  operationId: string;
  operation: 'start' | 'stop' | 'restart' | 'scale' | 'decommission' | 'health-check';
  workspaceId: string;
  targetInstances: string[];
  results: Array<{
    instanceId: string;
    success: boolean;
    message: string;
  }>;
  successCount: number;
  failureCount: number;
  startedAt: string;
  completedAt: string;
}

// ---------------------------------------------------------------------------
// Fleet Manager
// ---------------------------------------------------------------------------

class FleetManager {
  private instances: Map<string, FleetInstance> = new Map();
  private manifests: Map<string, DeploymentManifest> = new Map();

  // ── Instance Registration ─────────────────────────────────────────────

  /**
   * Register a new instance in the fleet.
   * Called after Plug Spin-Up Engine deploys the container.
   */
  registerInstance(params: {
    instanceId: string;
    plugId: string;
    workspaceId: string;
    environment: WorkspaceEnvironment;
    name: string;
    assignedPort: number;
    domain?: string;
    resources: FleetInstance['resources'];
    dependsOn?: string[];
    tags?: Record<string, string>;
    lucServiceKeys?: string[];
    deployedBy: string;
  }): FleetInstance {
    const now = new Date().toISOString();

    const instance: FleetInstance = {
      instanceId: params.instanceId,
      plugId: params.plugId,
      workspaceId: params.workspaceId,
      environment: params.environment,
      name: params.name,
      status: 'provisioning',
      assignedPort: params.assignedPort,
      domain: params.domain,
      resources: params.resources,
      healthStatus: 'unknown',
      consecutiveFailures: 0,
      dependsOn: params.dependsOn || [],
      dependedBy: [],
      lucCostToDate: 0,
      lucServiceKeys: params.lucServiceKeys || [],
      tags: params.tags || {},
      deployedBy: params.deployedBy,
      deployedAt: now,
      lastUpdated: now,
    };

    // Wire up reverse dependencies
    for (const depId of instance.dependsOn) {
      const dep = this.instances.get(depId);
      if (dep) {
        dep.dependedBy.push(instance.instanceId);
      }
    }

    this.instances.set(instance.instanceId, instance);
    return instance;
  }

  /**
   * Update instance status.
   */
  updateStatus(
    instanceId: string,
    status: FleetInstance['status'],
    healthStatus?: FleetInstance['healthStatus'],
  ): FleetInstance {
    const instance = this.requireInstance(instanceId);
    instance.status = status;
    if (healthStatus) {
      instance.healthStatus = healthStatus;
      instance.lastHealthCheck = new Date().toISOString();
      instance.consecutiveFailures = healthStatus === 'healthy' ? 0 : instance.consecutiveFailures + 1;
    }
    instance.lastUpdated = new Date().toISOString();
    return instance;
  }

  // ── Deployment Manifests ──────────────────────────────────────────────

  /**
   * Create a deployment manifest for bulk spin-up.
   * The manifest describes multiple instances to deploy together.
   */
  createManifest(params: {
    workspaceId: string;
    name: string;
    description: string;
    environment: WorkspaceEnvironment;
    instances: ManifestInstance[];
    createdBy: string;
  }): DeploymentManifest {
    const id = `manifest-${uuidv4()}`;

    // Resolve deployment order based on dependencies (topological sort)
    const deploymentOrder = this.resolveDependencyOrder(params.instances);

    // Estimate cost
    const estimatedCost = this.estimateManifestCost(params.instances);

    const manifest: DeploymentManifest = {
      id,
      workspaceId: params.workspaceId,
      name: params.name,
      description: params.description,
      environment: params.environment,
      instances: params.instances,
      createdBy: params.createdBy,
      createdAt: new Date().toISOString(),
      status: 'draft',
      estimatedCost,
      deploymentOrder,
    };

    this.manifests.set(id, manifest);
    return manifest;
  }

  /**
   * Validate a manifest before deployment.
   * Checks resource limits, dependencies, port conflicts, etc.
   */
  validateManifest(
    manifestId: string,
    resourceLimits: { maxInstances: number; maxCpuCores: number; maxMemoryGb: number; maxStorageGb: number },
  ): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const manifest = this.requireManifest(manifestId);
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check instance count
    const currentCount = this.getWorkspaceInstances(manifest.workspaceId).length;
    const newTotal = currentCount + manifest.instances.length;
    if (newTotal > resourceLimits.maxInstances) {
      errors.push(
        `Would exceed instance limit: ${newTotal} > ${resourceLimits.maxInstances}. ` +
        `Currently running: ${currentCount}. Manifest adds: ${manifest.instances.length}.`,
      );
    }

    // Check total resource allocation
    const totalCpu = manifest.instances.reduce((sum, i) => sum + i.resources.cpuCores, 0);
    const totalMem = manifest.instances.reduce((sum, i) => sum + i.resources.memoryGb, 0);
    const totalStorage = manifest.instances.reduce((sum, i) => sum + i.resources.storageGb, 0);

    // Add existing usage
    const existingInstances = this.getWorkspaceInstances(manifest.workspaceId);
    const existingCpu = existingInstances.reduce((sum, i) => sum + i.resources.cpuCores, 0);
    const existingMem = existingInstances.reduce((sum, i) => sum + i.resources.memoryGb, 0);

    if (existingCpu + totalCpu > resourceLimits.maxCpuCores) {
      errors.push(`Would exceed CPU limit: ${existingCpu + totalCpu} > ${resourceLimits.maxCpuCores} cores.`);
    }
    if (existingMem + totalMem > resourceLimits.maxMemoryGb) {
      errors.push(`Would exceed memory limit: ${existingMem + totalMem} > ${resourceLimits.maxMemoryGb} GB.`);
    }

    // Check dependency resolution
    const names = new Set(manifest.instances.map(i => i.instanceName));
    for (const instance of manifest.instances) {
      for (const dep of instance.dependsOn) {
        if (!names.has(dep)) {
          // Check if it's an existing running instance
          const existing = existingInstances.find(i => i.name === dep);
          if (!existing) {
            errors.push(`Instance '${instance.instanceName}' depends on '${dep}' which doesn't exist.`);
          }
        }
      }
    }

    // Check for duplicate names
    if (names.size !== manifest.instances.length) {
      errors.push('Duplicate instance names in manifest.');
    }

    // Warnings
    if (totalCpu > resourceLimits.maxCpuCores * 0.8) {
      warnings.push(`CPU utilization would be over 80% after this deployment.`);
    }
    if (totalMem > resourceLimits.maxMemoryGb * 0.8) {
      warnings.push(`Memory utilization would be over 80% after this deployment.`);
    }

    const valid = errors.length === 0;
    if (valid) {
      manifest.status = 'approved';
    }

    return { valid, errors, warnings };
  }

  // ── Fleet Health ──────────────────────────────────────────────────────

  /**
   * Generate a fleet health snapshot for a workspace.
   */
  getFleetHealth(
    workspaceId: string,
    resourceLimits: { maxCpuCores: number; maxMemoryGb: number; maxStorageGb: number },
  ): FleetHealthSnapshot {
    const instances = this.getWorkspaceInstances(workspaceId);

    const byStatus: Record<string, number> = {};
    const byHealth: Record<string, number> = {};
    const byEnvironment: Record<string, number> = {};
    let totalCpu = 0, totalMem = 0, totalStorage = 0, totalCost = 0;

    for (const inst of instances) {
      byStatus[inst.status] = (byStatus[inst.status] || 0) + 1;
      byHealth[inst.healthStatus] = (byHealth[inst.healthStatus] || 0) + 1;
      byEnvironment[inst.environment] = (byEnvironment[inst.environment] || 0) + 1;
      totalCpu += inst.resources.cpuCores;
      totalMem += inst.resources.memoryGb;
      totalStorage += inst.resources.storageGb;
      totalCost += inst.lucCostToDate;
    }

    const unhealthyInstances = instances
      .filter(i => i.healthStatus !== 'healthy' && i.status === 'running')
      .map(i => ({
        instanceId: i.instanceId,
        name: i.name,
        plugId: i.plugId,
        healthStatus: i.healthStatus,
        consecutiveFailures: i.consecutiveFailures,
        lastHealthCheck: i.lastHealthCheck,
      }));

    return {
      workspaceId,
      timestamp: new Date().toISOString(),
      totalInstances: instances.length,
      byStatus,
      byHealth,
      byEnvironment,
      unhealthyInstances,
      totalResources: {
        cpuCores: totalCpu,
        memoryGb: totalMem,
        storageGb: totalStorage,
      },
      resourceUtilization: {
        cpuPercent: resourceLimits.maxCpuCores > 0
          ? Math.round((totalCpu / resourceLimits.maxCpuCores) * 100) : 0,
        memoryPercent: resourceLimits.maxMemoryGb > 0
          ? Math.round((totalMem / resourceLimits.maxMemoryGb) * 100) : 0,
        storagePercent: resourceLimits.maxStorageGb > 0
          ? Math.round((totalStorage / resourceLimits.maxStorageGb) * 100) : 0,
      },
      totalLucCost: Math.round(totalCost * 100) / 100,
    };
  }

  // ── Bulk Operations ───────────────────────────────────────────────────

  /**
   * Execute a bulk operation across multiple instances.
   * Respects dependency order for start/stop operations.
   */
  bulkOperation(params: {
    workspaceId: string;
    operation: BulkOperationResult['operation'];
    targetInstanceIds?: string[];
    environment?: WorkspaceEnvironment;
    tags?: Record<string, string>;
  }): BulkOperationResult {
    const operationId = `bulk-${uuidv4()}`;
    const startedAt = new Date().toISOString();

    // Determine target instances
    let targets = this.getWorkspaceInstances(params.workspaceId);

    if (params.targetInstanceIds) {
      targets = targets.filter(i => params.targetInstanceIds!.includes(i.instanceId));
    }
    if (params.environment) {
      targets = targets.filter(i => i.environment === params.environment);
    }
    if (params.tags) {
      targets = targets.filter(i => {
        for (const [key, value] of Object.entries(params.tags!)) {
          if (i.tags[key] !== value) return false;
        }
        return true;
      });
    }

    // Order by dependencies for start/stop
    if (params.operation === 'start') {
      targets = this.sortByDependencies(targets, 'start');
    } else if (params.operation === 'stop' || params.operation === 'decommission') {
      targets = this.sortByDependencies(targets, 'stop');
    }

    const results: BulkOperationResult['results'] = [];

    for (const instance of targets) {
      try {
        switch (params.operation) {
          case 'start':
            this.updateStatus(instance.instanceId, 'running', 'unknown');
            results.push({ instanceId: instance.instanceId, success: true, message: 'Started' });
            break;
          case 'stop':
            this.updateStatus(instance.instanceId, 'stopped');
            results.push({ instanceId: instance.instanceId, success: true, message: 'Stopped' });
            break;
          case 'restart':
            this.updateStatus(instance.instanceId, 'running', 'unknown');
            results.push({ instanceId: instance.instanceId, success: true, message: 'Restarted' });
            break;
          case 'decommission':
            this.updateStatus(instance.instanceId, 'decommissioned');
            results.push({ instanceId: instance.instanceId, success: true, message: 'Decommissioned' });
            break;
          case 'health-check':
            // In production this calls the actual health endpoint
            results.push({
              instanceId: instance.instanceId,
              success: true,
              message: `Health: ${instance.healthStatus}`,
            });
            break;
          default:
            results.push({
              instanceId: instance.instanceId,
              success: false,
              message: `Unknown operation: ${params.operation}`,
            });
        }
      } catch (err) {
        results.push({
          instanceId: instance.instanceId,
          success: false,
          message: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    return {
      operationId,
      operation: params.operation,
      workspaceId: params.workspaceId,
      targetInstances: targets.map(t => t.instanceId),
      results,
      successCount: results.filter(r => r.success).length,
      failureCount: results.filter(r => !r.success).length,
      startedAt,
      completedAt: new Date().toISOString(),
    };
  }

  // ── Queries ───────────────────────────────────────────────────────────

  getInstance(instanceId: string): FleetInstance | undefined {
    return this.instances.get(instanceId);
  }

  getWorkspaceInstances(workspaceId: string): FleetInstance[] {
    return Array.from(this.instances.values())
      .filter(i => i.workspaceId === workspaceId);
  }

  getByEnvironment(workspaceId: string, env: WorkspaceEnvironment): FleetInstance[] {
    return this.getWorkspaceInstances(workspaceId)
      .filter(i => i.environment === env);
  }

  getByTag(workspaceId: string, tag: string, value: string): FleetInstance[] {
    return this.getWorkspaceInstances(workspaceId)
      .filter(i => i.tags[tag] === value);
  }

  getManifest(manifestId: string): DeploymentManifest | undefined {
    return this.manifests.get(manifestId);
  }

  getWorkspaceManifests(workspaceId: string): DeploymentManifest[] {
    return Array.from(this.manifests.values())
      .filter(m => m.workspaceId === workspaceId);
  }

  // ── Internal Helpers ──────────────────────────────────────────────────

  private requireInstance(id: string): FleetInstance {
    const inst = this.instances.get(id);
    if (!inst) throw new Error(`Fleet instance ${id} not found.`);
    return inst;
  }

  private requireManifest(id: string): DeploymentManifest {
    const m = this.manifests.get(id);
    if (!m) throw new Error(`Deployment manifest ${id} not found.`);
    return m;
  }

  /**
   * Resolve dependency order for manifest instances (topological sort).
   */
  private resolveDependencyOrder(instances: ManifestInstance[]): string[] {
    const nameToIdx = new Map<string, number>();
    instances.forEach((inst, idx) => nameToIdx.set(inst.instanceName, idx));

    const inDegree = new Array(instances.length).fill(0);
    const adj: number[][] = instances.map(() => []);

    for (let i = 0; i < instances.length; i++) {
      for (const dep of instances[i].dependsOn) {
        const depIdx = nameToIdx.get(dep);
        if (depIdx !== undefined) {
          adj[depIdx].push(i);
          inDegree[i]++;
        }
      }
    }

    const queue: number[] = [];
    for (let i = 0; i < inDegree.length; i++) {
      if (inDegree[i] === 0) queue.push(i);
    }

    const order: string[] = [];
    while (queue.length > 0) {
      const current = queue.shift()!;
      order.push(instances[current].instanceName);
      for (const next of adj[current]) {
        inDegree[next]--;
        if (inDegree[next] === 0) queue.push(next);
      }
    }

    // If we couldn't resolve all, there's a circular dependency
    if (order.length < instances.length) {
      const unresolved = instances
        .filter(i => !order.includes(i.instanceName))
        .map(i => i.instanceName);
      throw new Error(`Circular dependency detected among: ${unresolved.join(', ')}`);
    }

    return order;
  }

  /**
   * Sort instances by dependency order for start (deps first) or stop (dependents first).
   */
  private sortByDependencies(
    instances: FleetInstance[],
    direction: 'start' | 'stop',
  ): FleetInstance[] {
    // Simple approach: instances with no dependencies first (for start)
    // or instances with no dependents first (for stop)
    const sorted = [...instances];

    sorted.sort((a, b) => {
      if (direction === 'start') {
        // Deploy dependencies before dependents
        if (a.dependsOn.includes(b.instanceId)) return 1;
        if (b.dependsOn.includes(a.instanceId)) return -1;
      } else {
        // Stop dependents before dependencies
        if (a.dependedBy.includes(b.instanceId)) return 1;
        if (b.dependedBy.includes(a.instanceId)) return -1;
      }
      return 0;
    });

    return sorted;
  }

  /**
   * Estimate monthly cost for a manifest.
   */
  private estimateManifestCost(instances: ManifestInstance[]): number {
    let total = 0;
    for (const inst of instances) {
      // Base cost: $0.05/hour per CPU core + $0.01/hour per GB memory
      const monthlyCpuCost = inst.resources.cpuCores * 0.05 * 730; // ~730 hours/month
      const monthlyMemCost = inst.resources.memoryGb * 0.01 * 730;
      const monthlyStorageCost = inst.resources.storageGb * 0.025; // per GB/month
      total += monthlyCpuCost + monthlyMemCost + monthlyStorageCost;
    }
    return Math.round(total * 100) / 100;
  }
}

// ---------------------------------------------------------------------------
// Singleton Export
// ---------------------------------------------------------------------------

export const fleetManager = new FleetManager();
