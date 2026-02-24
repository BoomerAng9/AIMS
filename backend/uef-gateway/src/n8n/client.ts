/**
 * Pipeline Client — Direct Chain-of-Command Execution
 *
 * Runs the PMO pipeline in-process using pmo-router + chain-of-command.
 * No external workflow engine dependency — all orchestration runs natively.
 */

import logger from '../logger';
import { createPipelinePacket } from './pmo-router';
import { executeChainOfCommand } from './chain-of-command';
import { N8nTriggerPayload, N8nPipelineResponse } from './types';

// Re-export types under pipeline-oriented names
export type PipelineTriggerPayload = N8nTriggerPayload;
export type PipelineResponse = N8nPipelineResponse;

// ---------------------------------------------------------------------------
// Vertical-to-Pipeline Mapping
// ---------------------------------------------------------------------------

export interface VerticalTriggerPayload {
  verticalId: string;
  userId: string;
  collectedData: Record<string, unknown>;
  sessionId?: string;
  requestId?: string;
}

// ---------------------------------------------------------------------------
// Pipeline Execution — Direct (no external workflow engine)
// ---------------------------------------------------------------------------

/**
 * Execute the PMO pipeline in-process.
 * Uses chain-of-command: ACHEEVY → Boomer_Ang → Chicken Hawk → Squad → Lil_Hawks → Receipt
 */
async function executePipeline(payload: N8nTriggerPayload): Promise<N8nPipelineResponse> {
  const packet = createPipelinePacket(payload);
  return executeChainOfCommand(packet);
}

/**
 * Trigger the PMO routing pipeline.
 */
export async function triggerPmoPipeline(payload: N8nTriggerPayload): Promise<N8nPipelineResponse> {
  logger.info(
    { userId: payload.userId, requestId: payload.requestId },
    '[Pipeline] Triggering PMO pipeline',
  );
  return executePipeline(payload);
}

// Keep backward-compatible export name during migration
export const triggerN8nPmoWorkflow = triggerPmoPipeline;

/**
 * Trigger a vertical-specific pipeline after Phase A completes.
 */
export async function triggerVerticalWorkflow(
  payload: VerticalTriggerPayload,
): Promise<N8nPipelineResponse> {
  logger.info(
    { verticalId: payload.verticalId, userId: payload.userId },
    '[Pipeline] Triggering vertical pipeline',
  );

  return executePipeline({
    userId: payload.userId,
    message: `[VERTICAL:${payload.verticalId}] Execute Phase B with collected data: ${JSON.stringify(payload.collectedData)}`,
    requestId: payload.requestId,
  });
}
