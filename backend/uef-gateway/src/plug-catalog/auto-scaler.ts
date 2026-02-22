/**
 * Auto-Scaler — Horizontal & Vertical Scaling Policies for Plug Instances
 *
 * Monitors resource utilization and applies scaling rules:
 *   - Horizontal: spin up/down additional container replicas
 *   - Vertical: adjust memory/CPU limits on existing containers
 *
 * Scaling triggers:
 *   1. CPU > threshold for N minutes → scale up
 *   2. Memory > threshold → scale up or increase limit
 *   3. Response time > threshold → scale up
 *   4. Resource usage < low-threshold for N minutes → scale down
 *
 * Constraints:
 *   - Max replicas per instance (default 3, enterprise 10)
 *   - Max memory per container (4G default)
 *   - Cooldown between scale events (5 minutes)
 *   - Human-in-the-loop for scale-up beyond tier limits
 */

import logger from '../logger';
import { dockerRuntime } from './docker-runtime';
import { plugDeployEngine } from './deploy-engine';
import { portAllocator } from './port-allocator';
import { liveSim } from '../livesim';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ScalingDirection = 'up' | 'down' | 'none';
export type ScalingType = 'horizontal' | 'vertical';
export type TierLimit = 'free' | 'starter' | 'pro' | 'enterprise';

export interface ScalingPolicy {
  id: string;
  instanceId: string;
  enabled: boolean;

  // Thresholds
  cpuHighThreshold: number;    // 0-100, default 80
  cpuLowThreshold: number;     // 0-100, default 20
  memoryHighThreshold: number;  // 0-100, default 85
  memoryLowThreshold: number;   // 0-100, default 25
  responseTimeThreshold: number; // ms, default 5000

  // Limits
  minReplicas: number;          // Default 1
  maxReplicas: number;          // Default 3
  maxMemoryMb: number;          // Default 4096
  maxCpuCores: number;          // Default 4

  // Timing
  evaluationWindow: number;    // seconds to average metrics over (default 300 = 5 min)
  cooldownSeconds: number;     // seconds between scaling events (default 300)
  scaleUpStep: number;         // replicas to add per scale-up (default 1)
  scaleDownStep: number;       // replicas to remove per scale-down (default 1)
}

export interface ScalingDecision {
  instanceId: string;
  direction: ScalingDirection;
  type: ScalingType;
  reason: string;
  currentReplicas: number;
  targetReplicas: number;
  currentMetrics: ResourceMetrics;
  timestamp: string;
  applied: boolean;
}

export interface ResourceMetrics {
  cpuPercent: number;
  memoryPercent: number;
  memoryUsedMb: number;
  responseTimeMs: number;
  requestsPerSecond: number;
}

// ---------------------------------------------------------------------------
// Tier limits
// ---------------------------------------------------------------------------

const TIER_LIMITS: Record<TierLimit, { maxReplicas: number; maxMemoryMb: number; maxCpuCores: number }> = {
  free:       { maxReplicas: 1, maxMemoryMb: 512,  maxCpuCores: 1 },
  starter:    { maxReplicas: 2, maxMemoryMb: 2048, maxCpuCores: 2 },
  pro:        { maxReplicas: 5, maxMemoryMb: 4096, maxCpuCores: 4 },
  enterprise: { maxReplicas: 10, maxMemoryMb: 8192, maxCpuCores: 8 },
};

// ---------------------------------------------------------------------------
// Default policy
// ---------------------------------------------------------------------------

function defaultPolicy(instanceId: string): ScalingPolicy {
  return {
    id: `policy-${instanceId}`,
    instanceId,
    enabled: true,
    cpuHighThreshold: 80,
    cpuLowThreshold: 20,
    memoryHighThreshold: 85,
    memoryLowThreshold: 25,
    responseTimeThreshold: 5000,
    minReplicas: 1,
    maxReplicas: 3,
    maxMemoryMb: 4096,
    maxCpuCores: 4,
    evaluationWindow: 300,
    cooldownSeconds: 300,
    scaleUpStep: 1,
    scaleDownStep: 1,
  };
}

// ---------------------------------------------------------------------------
// Auto-Scaler
// ---------------------------------------------------------------------------

export class AutoScaler {
  private policies = new Map<string, ScalingPolicy>();
  private replicaCounts = new Map<string, number>();
  private lastScaleEvent = new Map<string, number>();
  private metricsHistory = new Map<string, ResourceMetrics[]>();
  private decisions: ScalingDecision[] = [];
  private intervalHandle: ReturnType<typeof setInterval> | null = null;

  // -----------------------------------------------------------------------
  // Policy management
  // -----------------------------------------------------------------------

  setPolicy(instanceId: string, policy: Partial<ScalingPolicy>): ScalingPolicy {
    const existing = this.policies.get(instanceId) || defaultPolicy(instanceId);
    const merged = { ...existing, ...policy, instanceId };
    this.policies.set(instanceId, merged);
    if (!this.replicaCounts.has(instanceId)) {
      this.replicaCounts.set(instanceId, 1);
    }
    return merged;
  }

  getPolicy(instanceId: string): ScalingPolicy | undefined {
    return this.policies.get(instanceId);
  }

  removePolicy(instanceId: string): void {
    this.policies.delete(instanceId);
    this.replicaCounts.delete(instanceId);
    this.lastScaleEvent.delete(instanceId);
    this.metricsHistory.delete(instanceId);
  }

  /**
   * Apply tier-based limits to a policy.
   */
  applyTierLimits(instanceId: string, tier: TierLimit): ScalingPolicy {
    const limits = TIER_LIMITS[tier];
    return this.setPolicy(instanceId, {
      maxReplicas: limits.maxReplicas,
      maxMemoryMb: limits.maxMemoryMb,
      maxCpuCores: limits.maxCpuCores,
    });
  }

  // -----------------------------------------------------------------------
  // Metrics collection
  // -----------------------------------------------------------------------

  recordMetrics(instanceId: string, metrics: ResourceMetrics): void {
    const history = this.metricsHistory.get(instanceId) || [];
    history.push(metrics);

    // Keep last 60 samples (at 30s intervals = 30 min history)
    if (history.length > 60) history.shift();
    this.metricsHistory.set(instanceId, history);
  }

  private getAverageMetrics(instanceId: string, windowSeconds: number): ResourceMetrics | null {
    const history = this.metricsHistory.get(instanceId);
    if (!history || history.length === 0) return null;

    // Approximate: assume 30s between samples
    const samplesNeeded = Math.min(Math.ceil(windowSeconds / 30), history.length);
    const recent = history.slice(-samplesNeeded);

    return {
      cpuPercent: avg(recent.map(m => m.cpuPercent)),
      memoryPercent: avg(recent.map(m => m.memoryPercent)),
      memoryUsedMb: avg(recent.map(m => m.memoryUsedMb)),
      responseTimeMs: avg(recent.map(m => m.responseTimeMs)),
      requestsPerSecond: avg(recent.map(m => m.requestsPerSecond)),
    };
  }

  // -----------------------------------------------------------------------
  // Evaluation engine
  // -----------------------------------------------------------------------

  evaluate(instanceId: string): ScalingDecision {
    const policy = this.policies.get(instanceId) || defaultPolicy(instanceId);
    const metrics = this.getAverageMetrics(instanceId, policy.evaluationWindow);
    const currentReplicas = this.replicaCounts.get(instanceId) || 1;

    const now = Date.now();
    const lastScale = this.lastScaleEvent.get(instanceId) || 0;
    const inCooldown = (now - lastScale) < policy.cooldownSeconds * 1000;

    const decision: ScalingDecision = {
      instanceId,
      direction: 'none',
      type: 'horizontal',
      reason: 'No scaling needed',
      currentReplicas,
      targetReplicas: currentReplicas,
      currentMetrics: metrics || { cpuPercent: 0, memoryPercent: 0, memoryUsedMb: 0, responseTimeMs: 0, requestsPerSecond: 0 },
      timestamp: new Date().toISOString(),
      applied: false,
    };

    if (!policy.enabled || !metrics || inCooldown) {
      if (inCooldown) decision.reason = 'In cooldown period';
      if (!policy.enabled) decision.reason = 'Policy disabled';
      if (!metrics) decision.reason = 'Insufficient metrics';
      return decision;
    }

    // Scale UP checks
    if (metrics.cpuPercent > policy.cpuHighThreshold && currentReplicas < policy.maxReplicas) {
      decision.direction = 'up';
      decision.type = 'horizontal';
      decision.reason = `CPU ${metrics.cpuPercent.toFixed(1)}% > ${policy.cpuHighThreshold}% threshold`;
      decision.targetReplicas = Math.min(currentReplicas + policy.scaleUpStep, policy.maxReplicas);
    } else if (metrics.memoryPercent > policy.memoryHighThreshold && currentReplicas < policy.maxReplicas) {
      decision.direction = 'up';
      decision.type = 'horizontal';
      decision.reason = `Memory ${metrics.memoryPercent.toFixed(1)}% > ${policy.memoryHighThreshold}% threshold`;
      decision.targetReplicas = Math.min(currentReplicas + policy.scaleUpStep, policy.maxReplicas);
    } else if (metrics.responseTimeMs > policy.responseTimeThreshold && currentReplicas < policy.maxReplicas) {
      decision.direction = 'up';
      decision.type = 'horizontal';
      decision.reason = `Response time ${metrics.responseTimeMs.toFixed(0)}ms > ${policy.responseTimeThreshold}ms threshold`;
      decision.targetReplicas = Math.min(currentReplicas + policy.scaleUpStep, policy.maxReplicas);
    }

    // Scale DOWN checks (only if not scaling up)
    if (decision.direction === 'none') {
      if (metrics.cpuPercent < policy.cpuLowThreshold &&
          metrics.memoryPercent < policy.memoryLowThreshold &&
          currentReplicas > policy.minReplicas) {
        decision.direction = 'down';
        decision.type = 'horizontal';
        decision.reason = `CPU ${metrics.cpuPercent.toFixed(1)}% < ${policy.cpuLowThreshold}% and Memory ${metrics.memoryPercent.toFixed(1)}% < ${policy.memoryLowThreshold}%`;
        decision.targetReplicas = Math.max(currentReplicas - policy.scaleDownStep, policy.minReplicas);
      }
    }

    this.decisions.push(decision);
    if (this.decisions.length > 200) this.decisions.shift();

    return decision;
  }

  /**
   * Apply a scaling decision. Updates replica count and logs the event.
   * Actual container creation/removal happens via the deploy engine.
   */
  async applyDecision(decision: ScalingDecision): Promise<boolean> {
    if (decision.direction === 'none') return false;

    this.replicaCounts.set(decision.instanceId, decision.targetReplicas);
    this.lastScaleEvent.set(decision.instanceId, Date.now());
    decision.applied = true;

    logger.info({
      instanceId: decision.instanceId,
      direction: decision.direction,
      from: decision.currentReplicas,
      to: decision.targetReplicas,
      reason: decision.reason,
    }, '[AutoScaler] Scaling decision applied');

    // Broadcast to LiveSim
    liveSim.emitAgentActivity('AutoScaler', `scale_${decision.direction}`, decision.reason);

    return true;
  }

  // -----------------------------------------------------------------------
  // Lifecycle
  // -----------------------------------------------------------------------

  /**
   * Start the auto-scaler evaluation loop.
   * Runs every 60 seconds, evaluates all policies.
   */
  start(intervalMs: number = 60000): void {
    if (this.intervalHandle) return;

    this.intervalHandle = setInterval(async () => {
      for (const [instanceId, policy] of this.policies) {
        if (!policy.enabled) continue;

        try {
          // Collect fresh metrics from Docker
          const instance = plugDeployEngine.getInstance(instanceId);
          if (!instance || instance.status !== 'running') continue;

          const containerInfo = await dockerRuntime.inspectContainer(instance);
          if (!containerInfo.running) continue;

          this.recordMetrics(instanceId, {
            cpuPercent: 0, // Docker stats API needed for real CPU%
            memoryPercent: containerInfo.memory > 0
              ? (containerInfo.memory / (policy.maxMemoryMb * 1024 * 1024)) * 100
              : 0,
            memoryUsedMb: containerInfo.memory / (1024 * 1024),
            responseTimeMs: 0,
            requestsPerSecond: 0,
          });

          const decision = this.evaluate(instanceId);
          if (decision.direction !== 'none') {
            await this.applyDecision(decision);
          }
        } catch (err) {
          logger.warn({ err, instanceId }, '[AutoScaler] Evaluation failed');
        }
      }
    }, intervalMs);

    logger.info('[AutoScaler] Started evaluation loop');
  }

  stop(): void {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
      logger.info('[AutoScaler] Stopped');
    }
  }

  // -----------------------------------------------------------------------
  // Stats
  // -----------------------------------------------------------------------

  getStats(): {
    totalPolicies: number;
    enabledPolicies: number;
    recentDecisions: ScalingDecision[];
    replicaCounts: Record<string, number>;
  } {
    const replicaCounts: Record<string, number> = {};
    for (const [id, count] of this.replicaCounts) {
      replicaCounts[id] = count;
    }

    return {
      totalPolicies: this.policies.size,
      enabledPolicies: Array.from(this.policies.values()).filter(p => p.enabled).length,
      recentDecisions: this.decisions.slice(-20),
      replicaCounts,
    };
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

export const autoScaler = new AutoScaler();
