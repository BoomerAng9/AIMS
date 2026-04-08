/**
 * A.I.M.S. Multi-VPS Placement Engine
 *
 * Determines which VPS node receives a new plug instance based on:
 *   1. Node health (CPU, memory, active plug count)
 *   2. Affinity rules (some services pinned to primary)
 *   3. Placement strategy (least-loaded or round-robin)
 *
 * Used by the Plug Spin-Up engine in UEF Gateway to route
 * new container deployments to the optimal node.
 */

export interface VPSNode {
  id: string;
  host: string;
  role: 'primary' | 'worker';
  cores: number;
  memoryGB: number;
  maxPlugInstances: number;
  portRange: { start: number; end: number };
  services: string[];
  tags: string[];
  // Runtime metrics (populated by heartbeat)
  plugCount?: number;
  memUsedPct?: number;
  loadAvg?: number;
  lastHeartbeat?: string;
  healthy?: boolean;
}

export interface AffinityRule {
  service: string;
  node: string;
  reason: string;
}

export interface PlacementConfig {
  strategy: 'least-loaded' | 'round-robin';
  fallback: 'round-robin' | 'primary';
  healthCheckIntervalSec: number;
  maxPlugsPerNode: number;
  reservedMemoryMB: number;
  affinityRules: AffinityRule[];
}

export interface PlacementResult {
  nodeId: string;
  host: string;
  port: number;
  reason: string;
}

// ── Round-robin state ───────────────────────────────────────
let roundRobinIndex = 0;

/**
 * Select the best node for a new plug instance.
 */
export function selectNode(
  nodes: VPSNode[],
  config: PlacementConfig,
  plugId?: string,
): PlacementResult | null {
  // Filter to healthy nodes with capacity
  const eligible = nodes.filter((n) => {
    const healthy = n.healthy !== false;
    const hasCapacity = (n.plugCount ?? 0) < config.maxPlugsPerNode;
    const memOk = (n.memUsedPct ?? 0) < 90;
    return healthy && hasCapacity && memOk;
  });

  if (eligible.length === 0) {
    return null; // No capacity available
  }

  let selected: VPSNode;

  // Check affinity rules first
  if (plugId) {
    const affinity = config.affinityRules.find((r) => r.service === plugId);
    if (affinity) {
      const pinned = eligible.find((n) => n.id === affinity.node);
      if (pinned) {
        return {
          nodeId: pinned.id,
          host: pinned.host,
          port: allocatePort(pinned),
          reason: `Affinity: ${affinity.reason}`,
        };
      }
    }
  }

  // Apply placement strategy
  switch (config.strategy) {
    case 'least-loaded':
      selected = eligible.sort((a, b) => {
        // Score: lower is better. Weight: 60% memory, 40% plug count
        const scoreA = (a.memUsedPct ?? 50) * 0.6 + ((a.plugCount ?? 0) / config.maxPlugsPerNode * 100) * 0.4;
        const scoreB = (b.memUsedPct ?? 50) * 0.6 + ((b.plugCount ?? 0) / config.maxPlugsPerNode * 100) * 0.4;
        return scoreA - scoreB;
      })[0];
      break;

    case 'round-robin':
    default:
      selected = eligible[roundRobinIndex % eligible.length];
      roundRobinIndex++;
      break;
  }

  return {
    nodeId: selected.id,
    host: selected.host,
    port: allocatePort(selected),
    reason: `Strategy: ${config.strategy} (${selected.plugCount ?? 0}/${config.maxPlugsPerNode} plugs, ${selected.memUsedPct ?? 0}% mem)`,
  };
}

/**
 * Allocate the next available port on a node.
 */
function allocatePort(node: VPSNode): number {
  const currentCount = node.plugCount ?? 0;
  // Each plug gets a 10-port increment for service + auxiliary ports
  return node.portRange.start + currentCount * 10;
}

/**
 * Check if a node should be drained (all plugs migrated off).
 */
export function shouldDrainNode(node: VPSNode): boolean {
  if (!node.lastHeartbeat) return false;
  const lastSeen = new Date(node.lastHeartbeat).getTime();
  const staleMs = Date.now() - lastSeen;
  // Drain if no heartbeat for 5 minutes
  return staleMs > 5 * 60 * 1000;
}

/**
 * Get cluster summary for monitoring.
 */
export function clusterSummary(nodes: VPSNode[], config: PlacementConfig) {
  const total = nodes.length;
  const healthy = nodes.filter((n) => n.healthy !== false).length;
  const totalPlugs = nodes.reduce((sum, n) => sum + (n.plugCount ?? 0), 0);
  const totalCapacity = nodes.reduce((sum, n) => sum + config.maxPlugsPerNode, 0);
  const avgMemory = nodes.length > 0
    ? Math.round(nodes.reduce((sum, n) => sum + (n.memUsedPct ?? 0), 0) / nodes.length)
    : 0;

  return {
    totalNodes: total,
    healthyNodes: healthy,
    totalPlugInstances: totalPlugs,
    totalCapacity,
    utilization: totalCapacity > 0 ? Math.round((totalPlugs / totalCapacity) * 100) : 0,
    avgMemoryPct: avgMemory,
  };
}
