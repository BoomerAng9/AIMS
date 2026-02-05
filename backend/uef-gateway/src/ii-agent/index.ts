/**
 * II-Agent Integration Module
 * 
 * Exports for integrating ii-agent with ACHEEVY orchestrator
 */

export { 
  IIAgentClient, 
  getIIAgentClient,
  type IIAgentTask,
  type IIAgentResponse,
  type IIAgentEvent,
} from './client';

export { default as iiAgentRouter } from './router';
