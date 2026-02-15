/**
 * n8n PMO Routing — Module Barrel Export
 *
 * Chain of Command Pipeline:
 *   User → ACHEEVY → Boomer_Ang → Chicken Hawk → Squad → Lil_Hawks → Receipt → ACHEEVY → User
 */

export { classifyIntent, buildDirective, createPipelinePacket } from './pmo-router';
export { executeChainOfCommand, executeChainOfCommandFull } from './chain-of-command';
export { triggerN8nPmoWorkflow, N8nClient } from './client';
export type {
  PmoPipelinePacket,
  N8nTriggerPayload,
  N8nPipelineResponse,
  PmoClassification,
  BoomerDirective,
  ShiftReceipt,
  ChainPosition,
  ExecutionLane,
} from './types';
