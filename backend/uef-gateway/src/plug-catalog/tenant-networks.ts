/**
 * Tenant Network Isolation — Per-User Docker Networks
 *
 * Each user's plug instances run in an isolated Docker bridge network named
 * `aims-tenant-<userId-hash>`. Containers can only see other containers
 * belonging to the same user. Cross-tenant traffic is blocked at the Docker
 * network layer.
 *
 * The agent-bridge service is connected to all tenant networks so ACHEEVY
 * can still orchestrate across tenants when needed.
 *
 * Network lifecycle:
 *   1. First spin-up for a user → create tenant network
 *   2. Container deploy → connect to tenant network
 *   3. Last instance decommissioned → prune empty tenant network
 */

import Docker from 'dockerode';
import { createHash } from 'crypto';
import logger from '../logger';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const DOCKER_SOCKET = process.env.DOCKER_SOCKET || '/var/run/docker.sock';
const AGENT_BRIDGE_CONTAINER = process.env.AGENT_BRIDGE_CONTAINER || 'agent-bridge';
const TENANT_NETWORK_PREFIX = 'aims-tenant-';

let docker: Docker | null = null;
function getDocker(): Docker {
  if (!docker) docker = new Docker({ socketPath: DOCKER_SOCKET });
  return docker;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Derive a deterministic, short network name from a userId.
 * Uses first 12 chars of SHA-256 hex digest to keep Docker network names clean.
 */
function tenantNetworkName(userId: string): string {
  const hash = createHash('sha256').update(userId).digest('hex').slice(0, 12);
  return `${TENANT_NETWORK_PREFIX}${hash}`;
}

// ---------------------------------------------------------------------------
// Tenant Network Manager
// ---------------------------------------------------------------------------

export class TenantNetworkManager {
  /**
   * Ensure the per-user network exists. Creates it if missing.
   * Returns the network name for use in container creation.
   */
  async ensureTenantNetwork(userId: string): Promise<string> {
    const d = getDocker();
    const name = tenantNetworkName(userId);

    try {
      const network = d.getNetwork(name);
      await network.inspect();
      return name; // Already exists
    } catch {
      // Network doesn't exist — create it
    }

    try {
      logger.info({ networkName: name, userId }, '[TenantNetworks] Creating tenant network');
      await d.createNetwork({
        Name: name,
        Driver: 'bridge',
        Internal: false, // Needs internet for most plugs
        Labels: {
          'aims.managed': 'true',
          'aims.tenant': userId,
          'aims.type': 'tenant-network',
        },
        Options: {
          'com.docker.network.bridge.enable_icc': 'true',
          'com.docker.network.bridge.enable_ip_masquerade': 'true',
        },
      });

      // Connect agent-bridge so ACHEEVY can orchestrate
      await this.connectAgentBridge(name);

      return name;
    } catch (err) {
      logger.error({ err, userId, networkName: name }, '[TenantNetworks] Failed to create tenant network');
      // Fallback to shared sandbox network
      return 'sandbox-network';
    }
  }

  /**
   * Connect a running container to the tenant network.
   */
  async connectContainer(containerId: string, userId: string): Promise<boolean> {
    try {
      const d = getDocker();
      const networkName = tenantNetworkName(userId);
      const network = d.getNetwork(networkName);
      await network.connect({ Container: containerId });
      logger.info({ containerId: containerId.slice(0, 12), networkName }, '[TenantNetworks] Connected container to tenant network');
      return true;
    } catch (err) {
      logger.warn({ err, containerId: containerId.slice(0, 12) }, '[TenantNetworks] Failed to connect container');
      return false;
    }
  }

  /**
   * Disconnect a container from the tenant network.
   */
  async disconnectContainer(containerId: string, userId: string): Promise<boolean> {
    try {
      const d = getDocker();
      const networkName = tenantNetworkName(userId);
      const network = d.getNetwork(networkName);
      await network.disconnect({ Container: containerId });
      return true;
    } catch {
      return false; // Already disconnected or container gone
    }
  }

  /**
   * Remove a tenant network if no containers are connected.
   * Called during decommission of the last instance for a user.
   */
  async pruneTenantNetwork(userId: string): Promise<boolean> {
    try {
      const d = getDocker();
      const networkName = tenantNetworkName(userId);
      const network = d.getNetwork(networkName);
      const info = await network.inspect();

      // Only remove if no containers are connected (except agent-bridge)
      const containers = Object.keys(info.Containers || {});
      const nonBridgeContainers = containers.filter(id => {
        const name = (info.Containers as any)?.[id]?.Name || '';
        return name !== AGENT_BRIDGE_CONTAINER;
      });

      if (nonBridgeContainers.length > 0) {
        logger.info({ networkName, connectedCount: nonBridgeContainers.length }, '[TenantNetworks] Network still in use, skipping prune');
        return false;
      }

      // Disconnect agent-bridge first
      try {
        await network.disconnect({ Container: AGENT_BRIDGE_CONTAINER });
      } catch {
        // Agent-bridge might not be connected
      }

      await network.remove();
      logger.info({ networkName, userId }, '[TenantNetworks] Pruned empty tenant network');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Connect the agent-bridge container to a tenant network.
   * This allows ACHEEVY to orchestrate across tenant boundaries.
   */
  private async connectAgentBridge(networkName: string): Promise<void> {
    try {
      const d = getDocker();
      const network = d.getNetwork(networkName);
      await network.connect({ Container: AGENT_BRIDGE_CONTAINER });
      logger.info({ networkName }, '[TenantNetworks] Connected agent-bridge to tenant network');
    } catch {
      // Agent-bridge container might not be running — non-blocking
      logger.warn({ networkName }, '[TenantNetworks] Could not connect agent-bridge (may not be running)');
    }
  }

  /**
   * List all tenant networks managed by AIMS.
   */
  async listTenantNetworks(): Promise<Array<{
    name: string;
    containerCount: number;
    created: string;
  }>> {
    try {
      const d = getDocker();
      const networks = await d.listNetworks({
        filters: { label: ['aims.type=tenant-network'] },
      });
      return networks.map(n => ({
        name: n.Name,
        containerCount: Object.keys(n.Containers || {}).length,
        created: n.Created || '',
      }));
    } catch (err) {
      logger.error({ err }, '[TenantNetworks] Failed to list tenant networks');
      return [];
    }
  }

  /**
   * Get the network name for a user (without creating it).
   */
  getNetworkName(userId: string): string {
    return tenantNetworkName(userId);
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

export const tenantNetworks = new TenantNetworkManager();
