/**
 * A2A Module — Agent-to-Agent Protocol
 */

export { a2aRouter } from './discovery';
export { taskManager } from './task-manager';
export { getAgentCard, getAllAgentCards, findAgentsByCapability, AGENT_CARDS } from './agent-cards';
export { createProxyAgent, discoverAndRegister, checkAgentHealth } from './agent-proxy';
export type { ContainerAgentConfig } from './agent-proxy';
export type {
  AgentCard,
  AgentSkill,
  A2ATask,
  A2ATaskStatus,
  A2ATaskEvent,
  A2AMessage,
  A2APart,
  A2AArtifact,
  A2ATaskSendRequest,
  A2ATaskSendResponse,
} from './types';
