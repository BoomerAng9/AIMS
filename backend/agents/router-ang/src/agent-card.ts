/**
 * Router_Ang Agent Card — A2A Capability Advertisement
 *
 * Smart routing agent that discovers and delegates to the best available
 * agent for any given task. Acts as a meta-router within the A2A network.
 */

export interface AgentCard {
  id: string;
  name: string;
  description: string;
  url: string;
  protocolVersion: '1.0';
  capabilities: Array<{
    id: string;
    name: string;
    description: string;
    weight: number;
    tags: string[];
  }>;
  inputModes: Array<'text' | 'file' | 'data'>;
  outputModes: Array<'text' | 'file' | 'data'>;
  authentication?: {
    type: 'none' | 'api-key' | 'bearer';
    headerName?: string;
  };
  hosting: 'in-process' | 'container' | 'external';
  status: 'online' | 'offline' | 'degraded';
}

const SELF_URL = process.env.AGENT_URL || 'http://router-ang:3021';

export const agentCard: AgentCard = {
  id: 'router-ang',
  name: 'Router_Ang',
  description: 'Smart routing agent. Discovers available agents via A2A, classifies intent, and delegates tasks to the best-matched specialist.',
  url: SELF_URL,
  protocolVersion: '1.0',
  capabilities: [
    {
      id: 'intent-routing',
      name: 'Intent Routing',
      description: 'Classify user intent and route to the most capable agent',
      weight: 1.0,
      tags: ['routing', 'intent', 'classification', 'dispatch'],
    },
    {
      id: 'agent-discovery',
      name: 'Agent Discovery',
      description: 'Discover and health-check available agents across the A2A network',
      weight: 0.95,
      tags: ['discovery', 'a2a', 'health', 'registry'],
    },
    {
      id: 'load-balancing',
      name: 'Load Balancing',
      description: 'Distribute tasks across agents based on capability weight and availability',
      weight: 0.85,
      tags: ['load-balancing', 'availability', 'capacity'],
    },
    {
      id: 'fallback-orchestration',
      name: 'Fallback Orchestration',
      description: 'Retry failed tasks with alternative agents or decompose complex tasks',
      weight: 0.80,
      tags: ['fallback', 'retry', 'decompose', 'resilience'],
    },
  ],
  inputModes: ['text', 'data'],
  outputModes: ['text', 'data'],
  authentication: { type: 'none' },
  hosting: 'container',
  status: 'online',
};
