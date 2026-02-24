/**
 * PMO Pipeline — Module Barrel Export
 *
 * Chain of Command Pipeline:
 *   User → ACHEEVY → Boomer_Ang → Chicken Hawk → Squad → Lil_Hawks → Receipt → ACHEEVY → User
 */

export { pipeline } from './project-pipeline';
export type { PipelineState, PipelineStage } from './project-pipeline';
export { classifyIntent, buildDirective, createPipelinePacket } from './pmo-router';
export { executeChainOfCommand, executeChainOfCommandFull } from './chain-of-command';
export { triggerPmoPipeline, triggerVerticalWorkflow } from './client';
export type { VerticalTriggerPayload } from './client';
export type {
  PmoPipelinePacket,
  PipelineTriggerPayload,
  PipelineResponse,
  PmoClassification,
  BoomerDirective,
  ShiftReceipt,
  ChainPosition,
  ExecutionLane,
} from './types';
