/**
 * n8n Client — Triggers workflows on the VPS n8n instance
 *
 * Provides both:
 *  1. Direct pipeline execution (in-process, using pmo-router + chain-of-command)
 *  2. n8n webhook trigger (sends to the n8n VPS for visual workflow execution)
 *
 * The n8n workflow at /webhook/pmo-intake mirrors the same logic as the
 * in-process pipeline, but runs inside n8n for visual monitoring and debugging.
 */

import logger from '../logger';
import { createPipelinePacket } from './pmo-router';
import { executeChainOfCommand } from './chain-of-command';
import { N8nTriggerPayload, N8nPipelineResponse } from './types';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const N8N_HOST = process.env.N8N_HOST || 'http://n8n:5678';
const N8N_API_KEY = process.env.N8N_API_KEY || '';
const PMO_WEBHOOK_PATH = '/webhook/pmo-intake';

// ---------------------------------------------------------------------------
// n8n HTTP Client
// ---------------------------------------------------------------------------

export class N8nClient {
  private host: string;
  private apiKey: string;

  constructor(host?: string, apiKey?: string) {
    this.host = host || N8N_HOST;
    this.apiKey = apiKey || N8N_API_KEY;
  }

  /**
   * Trigger the PMO routing workflow via n8n webhook.
   * The workflow runs inside n8n on the VPS.
   */
  async triggerPmoWorkflow(payload: N8nTriggerPayload): Promise<N8nPipelineResponse> {
    const url = `${this.host}${PMO_WEBHOOK_PATH}`;

    logger.info(
      { url, userId: payload.userId },
      '[n8n Client] Triggering PMO workflow via webhook',
    );

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey ? { 'X-N8N-API-KEY': this.apiKey } : {}),
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`n8n returned HTTP ${res.status}: ${body}`);
      }

      const data = await res.json() as N8nPipelineResponse;
      logger.info(
        { requestId: data.requestId, status: data.status },
        '[n8n Client] PMO workflow response received',
      );
      return data;
    } catch (err) {
      logger.warn(
        { error: (err as Error).message },
        '[n8n Client] n8n webhook unreachable — falling back to in-process pipeline',
      );
      // Fallback: run the pipeline in-process
      return this.executePipelineLocal(payload);
    }
  }

  /**
   * Execute the PMO pipeline in-process (no n8n dependency).
   * Uses the same logic as the n8n workflow but runs locally.
   * Now async — each step dispatches to real agents via A2A registry.
   */
  async executePipelineLocal(payload: N8nTriggerPayload): Promise<N8nPipelineResponse> {
    const packet = createPipelinePacket(payload);
    return executeChainOfCommand(packet);
  }

  /**
   * Deploy the PMO routing workflow to n8n via API.
   */
  async deployWorkflow(workflowJson: Record<string, unknown>): Promise<{ id: string; active: boolean }> {
    if (!this.apiKey) {
      throw new Error('N8N_API_KEY required to deploy workflows');
    }

    const url = `${this.host}/api/v1/workflows`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-N8N-API-KEY': this.apiKey,
      },
      body: JSON.stringify(workflowJson),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Failed to deploy workflow: HTTP ${res.status} — ${body}`);
    }

    const data = await res.json() as { id: string; active: boolean };
    logger.info({ workflowId: data.id }, '[n8n Client] Workflow deployed');
    return data;
  }

  /**
   * Activate a workflow on n8n.
   */
  async activateWorkflow(workflowId: string): Promise<void> {
    if (!this.apiKey) {
      throw new Error('N8N_API_KEY required to activate workflows');
    }

    const url = `${this.host}/api/v1/workflows/${workflowId}/activate`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'X-N8N-API-KEY': this.apiKey },
    });

    if (!res.ok) {
      throw new Error(`Failed to activate workflow ${workflowId}: HTTP ${res.status}`);
    }

    logger.info({ workflowId }, '[n8n Client] Workflow activated');
  }

  /**
   * List existing workflows on n8n.
   */
  async listWorkflows(): Promise<Array<{ id: string; name: string; active: boolean }>> {
    if (!this.apiKey) {
      throw new Error('N8N_API_KEY required to list workflows');
    }

    const url = `${this.host}/api/v1/workflows`;
    const res = await fetch(url, {
      headers: { 'X-N8N-API-KEY': this.apiKey },
    });

    if (!res.ok) {
      throw new Error(`Failed to list workflows: HTTP ${res.status}`);
    }

    const data = await res.json() as { data: Array<{ id: string; name: string; active: boolean }> };
    return data.data;
  }

  /**
   * Health check for n8n instance.
   */
  async healthCheck(): Promise<{ ok: boolean; status?: number; error?: string }> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(`${this.host}/healthz`, { signal: controller.signal });
      clearTimeout(timeout);
      return { ok: res.ok, status: res.status };
    } catch (err) {
      return { ok: false, error: (err as Error).message };
    }
  }
}

// ---------------------------------------------------------------------------
// Vertical-to-Workflow Mapping
// ---------------------------------------------------------------------------

/**
 * Maps vertical IDs to n8n webhook paths.
 * Each vertical can trigger a dedicated n8n workflow for Phase B execution.
 * When no specific workflow exists, falls back to the PMO intake workflow.
 */
const VERTICAL_WORKFLOW_MAP: Record<string, string> = {
  'automation':        '/webhook/vertical-automation',
  'content-calendar':  '/webhook/vertical-content-calendar',
  'social-hooks':      '/webhook/vertical-social-launch',
  'cold-outreach':     '/webhook/vertical-cold-outreach',
  'mvp-plan':          '/webhook/vertical-mvp-build',
  'chicken-hawk':      '/webhook/vertical-code-deploy',
  'custom-hawk':       '/webhook/vertical-custom-hawk',
  'livesim':           '/webhook/vertical-livesim',
};

export interface VerticalTriggerPayload {
  verticalId: string;
  userId: string;
  collectedData: Record<string, unknown>;
  sessionId?: string;
  requestId?: string;
}

// ---------------------------------------------------------------------------
// Convenience functions
// ---------------------------------------------------------------------------

let defaultClient: N8nClient | null = null;

function getClient(): N8nClient {
  if (!defaultClient) defaultClient = new N8nClient();
  return defaultClient;
}

/**
 * Trigger the PMO routing workflow (tries n8n first, falls back to local).
 */
export async function triggerN8nPmoWorkflow(payload: N8nTriggerPayload): Promise<N8nPipelineResponse> {
  return getClient().triggerPmoWorkflow(payload);
}

/**
 * Trigger a vertical-specific n8n workflow after Phase A completes.
 * Falls back to PMO intake if no vertical-specific workflow exists.
 */
export async function triggerVerticalWorkflow(
  payload: VerticalTriggerPayload,
): Promise<N8nPipelineResponse> {
  const client = getClient();
  const webhookPath = VERTICAL_WORKFLOW_MAP[payload.verticalId] || PMO_WEBHOOK_PATH;
  const url = `${N8N_HOST}${webhookPath}`;

  logger.info(
    { verticalId: payload.verticalId, userId: payload.userId, webhookPath },
    '[n8n Client] Triggering vertical workflow',
  );

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(N8N_API_KEY ? { 'X-N8N-API-KEY': N8N_API_KEY } : {}),
      },
      body: JSON.stringify({
        ...payload,
        type: 'vertical_execution',
        timestamp: new Date().toISOString(),
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`n8n returned HTTP ${res.status}`);
    }

    const data = await res.json() as N8nPipelineResponse;
    logger.info(
      { requestId: data.requestId, verticalId: payload.verticalId, status: data.status },
      '[n8n Client] Vertical workflow response received',
    );
    return data;
  } catch (err) {
    logger.warn(
      { error: (err as Error).message, verticalId: payload.verticalId },
      '[n8n Client] Vertical workflow unreachable — falling back to PMO pipeline',
    );
    // Fallback: convert to PMO payload and run through standard pipeline
    return client.executePipelineLocal({
      userId: payload.userId,
      message: `[VERTICAL:${payload.verticalId}] Execute Phase B with collected data: ${JSON.stringify(payload.collectedData)}`,
      requestId: payload.requestId,
    });
  }
}
