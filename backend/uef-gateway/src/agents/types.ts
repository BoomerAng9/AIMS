/**
 * Agent Registry — Boomer_Ang Team + Chicken Hawk Bot
 *
 * Every agent is an in-process worker that fulfills ACP task contracts.
 * When external containers come online they'll implement the same interface
 * and AgentClient will delegate over HTTP instead.
 */

import logger from '../logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AgentId =
  | 'engineer-ang'
  | 'marketer-ang'
  | 'analyst-ang'
  | 'quality-ang'
  | 'chicken-hawk'
  | 'research-ang'
  | 'router-ang'
  | 'workflow-smith-squad'
  | 'vision-scout-squad'
  // Boomer_Ang roster (spawnable via Deployment Hub)
  | 'scout-ang'
  | 'opsconsole-ang'
  | 'chronicle-ang'
  | 'gatekeeper-ang'
  | 'patchsmith-ang'
  | 'runner-ang'
  | 'showrunner-ang'
  | 'scribe-ang'
  | 'lab-ang'
  | 'index-ang';

export type AgentStatus = 'IDLE' | 'BUSY' | 'OFFLINE';

export interface AgentCapability {
  name: string;
  weight: number; // 0-1, how central this skill is to the agent
}

export interface AgentProfile {
  id: AgentId;
  name: string;
  role: string;
  capabilities: AgentCapability[];
  maxConcurrency: number;
}

export interface AgentTaskInput {
  taskId: string;
  intent: string;
  query: string;
  context?: Record<string, unknown>;
}

export interface AgentTaskOutput {
  taskId: string;
  agentId: AgentId;
  status: 'COMPLETED' | 'FAILED';
  result: {
    summary: string;
    artifacts: string[];
    logs: string[];
  };
  cost: {
    tokens: number;
    usd: number;
  };
}

export interface Agent {
  profile: AgentProfile;
  execute(input: AgentTaskInput): Promise<AgentTaskOutput>;
}

// ---------------------------------------------------------------------------
// Base helpers
// ---------------------------------------------------------------------------

export function makeOutput(
  taskId: string,
  agentId: AgentId,
  summary: string,
  artifacts: string[] = [],
  logs: string[] = [],
  tokens = 0,
  usd = 0
): AgentTaskOutput {
  return {
    taskId,
    agentId,
    status: 'COMPLETED',
    result: { summary, artifacts, logs },
    cost: { tokens, usd },
  };
}

export function failOutput(
  taskId: string,
  agentId: AgentId,
  reason: string
): AgentTaskOutput {
  logger.error({ taskId, agentId, reason }, '[Agent] Task failed');
  return {
    taskId,
    agentId,
    status: 'FAILED',
    result: { summary: reason, artifacts: [], logs: [`FAIL: ${reason}`] },
    cost: { tokens: 0, usd: 0 },
  };
}
