/**
 * A2A Agent Proxy — Bridges in-process Agent interface to HTTP A2A containers
 *
 * When a containerized agent is registered (e.g., research-ang on :3020),
 * this proxy creates an Agent object that the existing registry, router,
 * and Chicken Hawk can call as if it were in-process.
 *
 * The proxy:
 *   1. Converts AgentTaskInput → A2ATaskSendRequest
 *   2. POSTs to the container's /a2a/tasks/send endpoint
 *   3. Polls /a2a/tasks/:id until completion (or subscribes to SSE)
 *   4. Converts the A2A response → AgentTaskOutput
 *
 * This means the in-process agents and containerized agents are
 * interchangeable from the perspective of the router and Chicken Hawk.
 */

import logger from '../logger';
import { Agent, AgentProfile, AgentTaskInput, AgentTaskOutput, makeOutput, failOutput, AgentId } from '../agents/types';
import type { AgentCard } from './types';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const POLL_INTERVAL_MS = 2_000;       // 2 seconds between status polls
const MAX_POLL_ATTEMPTS = 60;          // Max 2 minutes of polling
const REQUEST_TIMEOUT_MS = 10_000;     // 10s timeout per HTTP request

// ---------------------------------------------------------------------------
// Proxy Agent Factory
// ---------------------------------------------------------------------------

/**
 * Create an Agent that delegates to a containerized A2A agent via HTTP.
 * The returned Agent conforms to the same interface as in-process agents.
 */
export function createProxyAgent(card: AgentCard): Agent {
  const profile: AgentProfile = {
    id: card.id as AgentId,
    name: card.name,
    role: card.description,
    capabilities: card.capabilities.map(cap => ({
      name: cap.id,
      weight: cap.weight,
    })),
    maxConcurrency: 5,
  };

  async function execute(input: AgentTaskInput): Promise<AgentTaskOutput> {
    logger.info(
      { taskId: input.taskId, agentId: card.id, url: card.url },
      '[AgentProxy] Delegating task to container'
    );

    try {
      // 1. Submit task via A2A
      const submitResponse = await fetch(`${card.url}/a2a/tasks/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        body: JSON.stringify({
          agentId: card.id,
          message: {
            role: 'user',
            parts: [
              { type: 'text', text: input.query },
              ...(input.context ? [{ type: 'data', data: input.context }] : []),
            ],
          },
          requestedBy: 'uef-gateway',
          metadata: {
            originalTaskId: input.taskId,
            intent: input.intent,
          },
        }),
      });

      if (!submitResponse.ok) {
        const errText = await submitResponse.text().catch(() => 'Unknown error');
        return failOutput(
          input.taskId,
          card.id as AgentId,
          `Container agent returned ${submitResponse.status}: ${errText}`
        );
      }

      const submitData = await submitResponse.json();
      const remoteTaskId = submitData.task?.id;

      if (!remoteTaskId) {
        return failOutput(input.taskId, card.id as AgentId, 'No task ID returned from container');
      }

      logger.info(
        { taskId: input.taskId, remoteTaskId, agentId: card.id },
        '[AgentProxy] Task submitted — polling for result'
      );

      // 2. Poll for completion
      const result = await pollForCompletion(card.url, remoteTaskId, card.id as AgentId, input.taskId);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown proxy error';
      logger.error(
        { taskId: input.taskId, agentId: card.id, err: message },
        '[AgentProxy] Delegation failed'
      );
      return failOutput(input.taskId, card.id as AgentId, `Proxy delegation failed: ${message}`);
    }
  }

  return { profile, execute };
}

// ---------------------------------------------------------------------------
// Polling
// ---------------------------------------------------------------------------

async function pollForCompletion(
  baseUrl: string,
  remoteTaskId: string,
  agentId: AgentId,
  localTaskId: string,
): Promise<AgentTaskOutput> {
  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    try {
      const response = await fetch(`${baseUrl}/a2a/tasks/${remoteTaskId}`, {
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });

      if (!response.ok) {
        logger.warn(
          { remoteTaskId, attempt, status: response.status },
          '[AgentProxy] Poll returned non-OK'
        );
        await sleep(POLL_INTERVAL_MS);
        continue;
      }

      const data = await response.json();
      const task = data.task;

      if (!task) {
        await sleep(POLL_INTERVAL_MS);
        continue;
      }

      // Check terminal states
      if (task.status === 'completed') {
        return convertToOutput(localTaskId, agentId, task);
      }

      if (task.status === 'failed' || task.status === 'canceled') {
        const errorMsg = task.messages
          ?.filter((m: { role: string }) => m.role === 'agent')
          .map((m: { parts: Array<{ text?: string }> }) => m.parts.map(p => p.text).join(''))
          .join('\n') || `Task ${task.status}`;
        return failOutput(localTaskId, agentId, errorMsg);
      }

      // Still working — continue polling
      if (attempt % 5 === 0) {
        logger.info(
          { remoteTaskId, attempt, status: task.status },
          '[AgentProxy] Still polling...'
        );
      }
    } catch (err) {
      logger.warn(
        { remoteTaskId, attempt, err: (err as Error).message },
        '[AgentProxy] Poll error'
      );
    }

    await sleep(POLL_INTERVAL_MS);
  }

  return failOutput(localTaskId, agentId, `Task timed out after ${MAX_POLL_ATTEMPTS * POLL_INTERVAL_MS / 1000}s`);
}

// ---------------------------------------------------------------------------
// A2A → AgentTaskOutput Converter
// ---------------------------------------------------------------------------

function convertToOutput(
  localTaskId: string,
  agentId: AgentId,
  task: {
    messages?: Array<{ role: string; parts: Array<{ type: string; text?: string }> }>;
    artifacts?: Array<{ name: string; content: string }>;
    cost?: { tokens: number; usd: number };
  },
): AgentTaskOutput {
  // Extract agent response text
  const agentMessages = task.messages
    ?.filter(m => m.role === 'agent')
    .map(m => m.parts.filter(p => p.type === 'text').map(p => p.text).join(''))
    .filter(Boolean) || [];

  const summary = agentMessages.join('\n') || 'Task completed (no summary)';

  // Extract artifacts
  const artifacts = task.artifacts?.map(a => a.content || a.name) || [];

  // Cost
  const tokens = task.cost?.tokens || 0;
  const usd = task.cost?.usd || 0;

  return makeOutput(
    localTaskId,
    agentId,
    summary,
    artifacts,
    [`[proxy] Delegated to container agent ${agentId}`],
    tokens,
    usd,
  );
}

// ---------------------------------------------------------------------------
// Health Check
// ---------------------------------------------------------------------------

/**
 * Check if a container agent is healthy.
 */
export async function checkAgentHealth(url: string): Promise<{
  healthy: boolean;
  latencyMs: number;
  details?: Record<string, unknown>;
}> {
  const start = Date.now();
  try {
    const response = await fetch(`${url}/health`, {
      signal: AbortSignal.timeout(5_000),
    });
    const latencyMs = Date.now() - start;

    if (!response.ok) {
      return { healthy: false, latencyMs };
    }

    const data = await response.json();
    return { healthy: true, latencyMs, details: data };
  } catch {
    return { healthy: false, latencyMs: Date.now() - start };
  }
}

// ---------------------------------------------------------------------------
// Container Agent Registration Helper
// ---------------------------------------------------------------------------

export interface ContainerAgentConfig {
  id: string;
  name: string;
  url: string;
  description?: string;
}

/**
 * Discover and register a container agent.
 * Fetches its /.well-known/agent.json card and creates a proxy.
 */
export async function discoverAndRegister(config: ContainerAgentConfig): Promise<Agent | null> {
  try {
    // Fetch agent card from the container
    const response = await fetch(`${config.url}/.well-known/agent.json`, {
      signal: AbortSignal.timeout(5_000),
    });

    if (!response.ok) {
      logger.warn(
        { agentId: config.id, url: config.url, status: response.status },
        '[AgentProxy] Failed to fetch agent card'
      );
      return null;
    }

    const card: AgentCard = await response.json();
    const proxy = createProxyAgent(card);

    logger.info(
      { agentId: card.id, name: card.name, url: card.url, capabilities: card.capabilities.length },
      '[AgentProxy] Container agent discovered and proxied'
    );

    return proxy;
  } catch (err) {
    logger.warn(
      { agentId: config.id, url: config.url, err: (err as Error).message },
      '[AgentProxy] Discovery failed — agent not available'
    );
    return null;
  }
}

// ---------------------------------------------------------------------------
// Util
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
