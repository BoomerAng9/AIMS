/**
 * Agent Registry
 *
 * Central lookup for all in-process agents.
 * When containers come online, this will add a proxy layer that delegates
 * to external HTTP endpoints instead of in-process calls.
 */

import { Agent, AgentId, AgentProfile } from './types';
import { Engineer_Ang } from './boomerangs/engineer-ang';
import { Marketer_Ang } from './boomerangs/marketer-ang';
import { Analyst_Ang } from './boomerangs/analyst-ang';
import { Quality_Ang } from './boomerangs/quality-ang';
import { ChickenHawk } from './chicken-hawk';

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
}

export const registry = new AgentRegistry();

// Register all agents
registry.register(Engineer_Ang);
registry.register(Marketer_Ang);
registry.register(Analyst_Ang);
registry.register(Quality_Ang);
registry.register(ChickenHawk);
