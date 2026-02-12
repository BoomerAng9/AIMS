/**
 * Agent Registry
 *
 * Central lookup for all agents — in-process AND containerized.
 *
 * In-process agents (Boomer_Angs, Chicken Hawk) are registered at startup.
 * Container agents are discovered asynchronously via A2A and proxied through
 * agent-proxy.ts so they conform to the same Agent interface.
 *
 * The router and Chicken Hawk don't care where an agent lives — they just
 * call registry.get(id).execute(input) and it works.
 */

import { Agent, AgentId, AgentProfile } from './types';
import { Engineer_Ang } from './boomerangs/engineer-ang';
import { Marketer_Ang } from './boomerangs/marketer-ang';
import { Analyst_Ang } from './boomerangs/analyst-ang';
import { Quality_Ang } from './boomerangs/quality-ang';
import { ChickenHawk } from './chicken-hawk';
import { discoverAndRegister, type ContainerAgentConfig } from '../a2a/agent-proxy';
import logger from '../logger';

class AgentRegistry {
  private agents = new Map<AgentId, Agent>();

  register(agent: Agent): void {
    this.agents.set(agent.profile.id, agent);
  }

  get(id: AgentId): Agent | undefined {
    return this.agents.get(id);
  }

  list(): AgentProfile[] {
    return Array.from(this.agents.values()).map(a => a.profile);
  }

  has(id: AgentId): boolean {
    return this.agents.has(id);
  }

  /**
   * Discover and register a container-based A2A agent.
   * Fetches the agent card, creates a proxy, and registers it.
   * Non-blocking — if the container isn't ready, logs a warning and skips.
   */
  async registerContainer(config: ContainerAgentConfig): Promise<boolean> {
    const proxy = await discoverAndRegister(config);
    if (proxy) {
      this.register(proxy);
      logger.info({ agentId: config.id, url: config.url }, '[Registry] Container agent registered');
      return true;
    }
    logger.warn({ agentId: config.id, url: config.url }, '[Registry] Container agent not available — will retry');
    return false;
  }

  /**
   * Attempt to discover and register all known container agents.
   * Called at gateway startup and periodically.
   */
  async discoverContainerAgents(): Promise<void> {
    const containerConfigs: ContainerAgentConfig[] = [
      {
        id: 'research-ang',
        name: 'Research_Ang',
        url: process.env.RESEARCH_ANG_URL || 'http://research-ang:3020',
        description: 'Containerized research and analysis agent',
      },
      {
        id: 'router-ang',
        name: 'Router_Ang',
        url: process.env.ROUTER_ANG_URL || 'http://router-ang:3021',
        description: 'Smart routing agent with A2A discovery delegation',
      },
    ];

    const results = await Promise.allSettled(
      containerConfigs.map(config => this.registerContainer(config))
    );

    const registered = results.filter(r => r.status === 'fulfilled' && r.value).length;
    logger.info(
      { total: containerConfigs.length, registered },
      '[Registry] Container agent discovery complete'
    );
  }
}

export const registry = new AgentRegistry();

// Register all in-process agents
registry.register(Engineer_Ang);
registry.register(Marketer_Ang);
registry.register(Analyst_Ang);
registry.register(Quality_Ang);
registry.register(ChickenHawk);

// Discover container agents asynchronously (non-blocking startup)
// Retry every 60s for agents that weren't available at boot
registry.discoverContainerAgents().catch(err => {
  logger.warn({ err }, '[Registry] Initial container discovery failed');
});

const CONTAINER_RETRY_INTERVAL = 60_000;
setInterval(() => {
  registry.discoverContainerAgents().catch(() => { /* silent retry */ });
}, CONTAINER_RETRY_INTERVAL).unref();
