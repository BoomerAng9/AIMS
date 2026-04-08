/**
 * A2A Discovery Client — Discovers agents across the network
 *
 * Router_Ang periodically polls the UEF Gateway's /a2a/agents endpoint
 * and individual agent /.well-known/agent.json endpoints to build
 * a live registry of available agents with their capabilities.
 *
 * Also supports direct agent registration for container-based agents
 * that announce themselves on startup.
 */

import { logger } from './logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DiscoveredAgent {
  id: string;
  name: string;
  description: string;
  url: string;
  capabilities: Array<{
    id: string;
    name: string;
    description: string;
    weight: number;
    tags: string[];
  }>;
  hosting: 'in-process' | 'container' | 'external';
  status: 'online' | 'offline' | 'degraded';
  lastHealthCheck: string;
  latencyMs?: number;
}

// ---------------------------------------------------------------------------
// Discovery Client
// ---------------------------------------------------------------------------

const UEF_GATEWAY_URL = process.env.UEF_GATEWAY_URL || 'http://uef-gateway:3001';
const HEALTH_CHECK_INTERVAL_MS = 60_000; // 1 minute
const HEALTH_CHECK_TIMEOUT_MS = 5_000;

class DiscoveryClient {
  private agents = new Map<string, DiscoveredAgent>();
  private healthCheckTimer?: NodeJS.Timeout;

  /**
   * Initialize discovery — fetch initial agent list and start health checks.
   */
  async initialize(): Promise<void> {
    await this.refreshFromGateway();
    this.healthCheckTimer = setInterval(() => this.healthCheckAll(), HEALTH_CHECK_INTERVAL_MS);
    this.healthCheckTimer.unref();
    logger.info({ agentCount: this.agents.size }, '[Discovery] Initialized');
  }

  /**
   * Get all discovered agents.
   */
  getAll(): DiscoveredAgent[] {
    return Array.from(this.agents.values());
  }

  /**
   * Get online agents only.
   */
  getOnline(): DiscoveredAgent[] {
    return this.getAll().filter(a => a.status === 'online');
  }

  /**
   * Find agents matching a capability ID or tag.
   * Sorted by capability weight (highest first).
   */
  findByCapability(capabilityOrTag: string): DiscoveredAgent[] {
    const matches: Array<{ agent: DiscoveredAgent; weight: number }> = [];

    for (const agent of this.agents.values()) {
      if (agent.status !== 'online') continue;
      // Don't route to ourselves
      if (agent.id === 'router-ang') continue;

      for (const cap of agent.capabilities) {
        if (cap.id === capabilityOrTag || cap.tags.includes(capabilityOrTag)) {
          matches.push({ agent, weight: cap.weight });
          break;
        }
      }
    }

    return matches
      .sort((a, b) => b.weight - a.weight)
      .map(m => m.agent);
  }

  /**
   * Find the best agent for a set of keywords (from intent classification).
   * Scores each agent by total matching tag weight.
   */
  findBestMatch(keywords: string[]): DiscoveredAgent | null {
    let bestAgent: DiscoveredAgent | null = null;
    let bestScore = 0;

    for (const agent of this.agents.values()) {
      if (agent.status !== 'online') continue;
      if (agent.id === 'router-ang') continue;

      let score = 0;
      for (const cap of agent.capabilities) {
        for (const kw of keywords) {
          if (cap.id.includes(kw) || cap.tags.some(t => t.includes(kw))) {
            score += cap.weight;
          }
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestAgent = agent;
      }
    }

    return bestAgent;
  }

  /**
   * Manually register an agent (e.g., from container self-announcement).
   */
  register(agent: DiscoveredAgent): void {
    this.agents.set(agent.id, agent);
    logger.info({ agentId: agent.id, url: agent.url }, '[Discovery] Agent registered');
  }

  /**
   * Refresh agent list from UEF Gateway.
   */
  async refreshFromGateway(): Promise<void> {
    try {
      const response = await fetch(`${UEF_GATEWAY_URL}/a2a/agents`, {
        signal: AbortSignal.timeout(HEALTH_CHECK_TIMEOUT_MS),
      });

      if (!response.ok) {
        logger.warn({ status: response.status }, '[Discovery] Gateway /a2a/agents returned non-OK');
        return;
      }

      const data = (await response.json()) as Record<string, unknown>;
      const cards: Array<{
        id: string;
        name: string;
        description: string;
        url: string;
        capabilities: DiscoveredAgent['capabilities'];
        hosting: DiscoveredAgent['hosting'];
        status: DiscoveredAgent['status'];
      }> = (data.agents as typeof cards) || [];

      for (const card of cards) {
        const existing = this.agents.get(card.id);
        this.agents.set(card.id, {
          id: card.id,
          name: card.name,
          description: card.description,
          url: card.url,
          capabilities: card.capabilities,
          hosting: card.hosting,
          status: card.status,
          lastHealthCheck: existing?.lastHealthCheck || new Date().toISOString(),
          latencyMs: existing?.latencyMs,
        });
      }

      logger.info({ count: cards.length }, '[Discovery] Refreshed from gateway');
    } catch (err) {
      logger.warn({ err: (err as Error).message }, '[Discovery] Failed to refresh from gateway');
    }
  }

  /**
   * Health check all container agents.
   */
  async healthCheckAll(): Promise<void> {
    const containerAgents = Array.from(this.agents.values()).filter(a => a.hosting === 'container');

    const checks = containerAgents.map(async (agent) => {
      const start = Date.now();
      try {
        const response = await fetch(`${agent.url}/health`, {
          signal: AbortSignal.timeout(HEALTH_CHECK_TIMEOUT_MS),
        });
        const latency = Date.now() - start;

        agent.latencyMs = latency;
        agent.lastHealthCheck = new Date().toISOString();
        agent.status = response.ok ? 'online' : 'degraded';
      } catch {
        agent.status = 'offline';
        agent.lastHealthCheck = new Date().toISOString();
        logger.warn({ agentId: agent.id, url: agent.url }, '[Discovery] Agent health check failed');
      }
    });

    await Promise.allSettled(checks);
  }

  /**
   * Shutdown — clear timers.
   */
  shutdown(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }
  }
}

export const discoveryClient = new DiscoveryClient();
