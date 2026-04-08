/**
 * Pipeline Client — Direct Chain-of-Command Execution
 *
 * Runs the PMO pipeline in-process using pmo-router + chain-of-command.
 * No external workflow engine dependency — all orchestration runs natively.
 */

import logger from '../logger';
import { createPipelinePacket } from './pmo-router';
import { executeChainOfCommand } from './chain-of-command';
import { PipelineTriggerPayload, PipelineResponse } from './types';

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
async function executePipeline(payload: PipelineTriggerPayload): Promise<PipelineResponse> {
  const packet = createPipelinePacket(payload);
  return executeChainOfCommand(packet);
}

/**
 * Trigger the PMO routing pipeline.
 */
export async function triggerPmoPipeline(payload: PipelineTriggerPayload): Promise<PipelineResponse> {
  logger.info(
    { userId: payload.userId, requestId: payload.requestId },
    '[Pipeline] Triggering PMO pipeline',
  );
  return executePipeline(payload);
}

/**
 * Trigger a vertical-specific pipeline after Phase A completes.
 */
export async function triggerVerticalWorkflow(
  payload: VerticalTriggerPayload,
): Promise<PipelineResponse> {
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
