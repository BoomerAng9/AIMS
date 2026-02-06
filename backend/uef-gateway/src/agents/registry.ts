/**
 * Agent Registry
 *
 * Central lookup for all in-process agents.
 * When containers come online, this will add a proxy layer that delegates
 * to external HTTP endpoints instead of in-process calls.
 */

import { Agent, AgentId, AgentProfile } from './types';
import { EngineerAng } from './boomerangs/engineer-ang';
import { MarketerAng } from './boomerangs/marketer-ang';
import { AnalystAng } from './boomerangs/analyst-ang';
import { QualityAng } from './boomerangs/quality-ang';
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
registry.register(EngineerAng);
registry.register(MarketerAng);
registry.register(AnalystAng);
registry.register(QualityAng);
registry.register(ChickenHawk);
