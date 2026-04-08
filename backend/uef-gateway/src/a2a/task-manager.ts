/**
 * A2A Task Manager — Task lifecycle, storage, and SSE streaming
 *
 * Creates tasks, routes them to agents, tracks status, and streams events.
 * Tasks are stored in-memory with a configurable TTL.
 */

import { v4 as uuidv4 } from 'uuid';
import logger from '../logger';
import { registry } from '../agents/registry';
import { findAgentsByCapability, getAgentCard } from './agent-cards';
import type {
  A2ATask,
  A2ATaskStatus,
  A2ATaskEvent,
  A2ATaskSendRequest,
  A2AArtifact,
} from './types';

// ---------------------------------------------------------------------------
// Task Store (in-memory, TTL-based eviction)
// ---------------------------------------------------------------------------

const TASK_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

class A2ATaskManager {
  private tasks = new Map<string, A2ATask>();
  private listeners = new Map<string, Set<(event: A2ATaskEvent) => void>>();

  /**
   * Create and dispatch a new task.
   */
  async send(request: A2ATaskSendRequest): Promise<A2ATask> {
    // Resolve target agent
    let agentId: string;
    if (request.agentId) {
      agentId = request.agentId;
    } else if (request.capability) {
      const candidates = findAgentsByCapability(request.capability);
      if (candidates.length === 0) {
        throw new Error(`No agent found with capability: ${request.capability}`);
      }
      agentId = candidates[0].id;
    } else {
      throw new Error('Either agentId or capability must be specified');
    }

    // Verify agent exists
    const card = getAgentCard(agentId);
    if (!card) {
      throw new Error(`Agent "${agentId}" not found in A2A registry`);
    }

    // Create task
    const task: A2ATask = {
      id: uuidv4(),
      agentId,
      status: 'submitted',
      messages: [{
        role: 'user',
        parts: request.message.parts,
        timestamp: new Date().toISOString(),
      }],
      artifacts: [],
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        requestedBy: request.requestedBy,
        matchedCapability: request.capability,
      },
    };

    this.tasks.set(task.id, task);
    logger.info({ taskId: task.id, agentId, capability: request.capability }, '[A2A] Task created');

    // Dispatch to agent (async — don't block the response)
    this.executeTask(task).catch(err => {
      logger.error({ taskId: task.id, err }, '[A2A] Task execution failed');
      this.updateStatus(task.id, 'failed');
      this.emit(task.id, { type: 'error', error: { code: 'EXECUTION_FAILED', message: err.message } });
      this.emit(task.id, { type: 'done' });
    });

    return task;
  }

  /**
   * Get a task by ID.
   */
  get(taskId: string): A2ATask | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * Cancel a running task.
   */
  cancel(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (!task) return false;
    if (task.status === 'completed' || task.status === 'failed' || task.status === 'canceled') return false;

    this.updateStatus(taskId, 'canceled');
    this.emit(taskId, { type: 'status', status: 'canceled' });
    this.emit(taskId, { type: 'done' });
    return true;
  }

  /**
   * Subscribe to task events (SSE).
   * Returns an unsubscribe function.
   */
  subscribe(taskId: string, callback: (event: A2ATaskEvent) => void): () => void {
    if (!this.listeners.has(taskId)) {
      this.listeners.set(taskId, new Set());
    }
    this.listeners.get(taskId)!.add(callback);

    return () => {
      this.listeners.get(taskId)?.delete(callback);
      if (this.listeners.get(taskId)?.size === 0) {
        this.listeners.delete(taskId);
      }
    };
  }

  /**
   * List recent tasks (for admin/debugging).
   */
  listRecent(limit: number = 20): A2ATask[] {
    return Array.from(this.tasks.values())
      .sort((a, b) => b.metadata.createdAt.localeCompare(a.metadata.createdAt))
      .slice(0, limit);
  }

  // ── Internal ───────────────────────────────────────────────────────

  private async executeTask(task: A2ATask): Promise<void> {
    this.updateStatus(task.id, 'working');
    this.emit(task.id, { type: 'status', status: 'working' });

    // Extract text from the message parts
    const textParts = task.messages[0]?.parts
      .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
      .map(p => p.text);
    const query = textParts.join('\n') || '';

    // Route to the in-process agent via the existing registry
    const agent = registry.get(task.agentId as any);
    if (!agent) {
      throw new Error(`Agent "${task.agentId}" not found in process registry`);
    }

    this.emit(task.id, { type: 'progress', progress: { percent: 10, message: `Dispatched to ${task.agentId}` } });

    const output = await agent.execute({
      taskId: task.id,
      intent: task.metadata.matchedCapability || 'CHAT',
      query,
      context: task.messages[0]?.parts
        .filter((p): p is { type: 'data'; data: Record<string, unknown> } => p.type === 'data')
        .reduce((acc, p) => ({ ...acc, ...p.data }), {} as Record<string, unknown>),
    });

    // Record results
    const agentMessage = {
      role: 'agent' as const,
      parts: [{ type: 'text' as const, text: output.result.summary }],
      timestamp: new Date().toISOString(),
    };
    task.messages.push(agentMessage);

    // Convert artifacts
    for (const artifactStr of output.result.artifacts) {
      const artifact: A2AArtifact = {
        id: uuidv4(),
        name: artifactStr,
        type: 'text',
        content: artifactStr,
      };
      task.artifacts.push(artifact);
      this.emit(task.id, { type: 'artifact', artifact });
    }

    // Record cost
    task.cost = { tokens: output.cost.tokens, usd: output.cost.usd };
    this.emit(task.id, { type: 'cost', cost: task.cost });

    // Finalize
    const finalStatus: A2ATaskStatus = output.status === 'COMPLETED' ? 'completed' : 'failed';
    this.updateStatus(task.id, finalStatus);
    this.emit(task.id, { type: 'message', message: agentMessage });
    this.emit(task.id, { type: 'status', status: finalStatus });
    this.emit(task.id, { type: 'done' });

    logger.info({ taskId: task.id, agentId: task.agentId, status: finalStatus, tokens: task.cost.tokens }, '[A2A] Task complete');
  }

  private updateStatus(taskId: string, status: A2ATaskStatus): void {
    const task = this.tasks.get(taskId);
    if (task) {
      task.status = status;
      task.metadata.updatedAt = new Date().toISOString();
    }
  }

  private emit(taskId: string, event: A2ATaskEvent): void {
    const listeners = this.listeners.get(taskId);
    if (listeners) {
      for (const cb of listeners) {
        try { cb(event); } catch { /* don't let one listener break others */ }
      }
    }
  }

  /**
   * Evict tasks older than TTL.
   */
  evictStale(): number {
    const cutoff = new Date(Date.now() - TASK_TTL_MS).toISOString();
    let evicted = 0;
    for (const [id, task] of this.tasks) {
      if (task.metadata.updatedAt < cutoff) {
        this.tasks.delete(id);
        this.listeners.delete(id);
        evicted++;
      }
    }
    return evicted;
  }
}

export const taskManager = new A2ATaskManager();

// Evict stale tasks every 30 minutes
setInterval(() => taskManager.evictStale(), 30 * 60 * 1000).unref();
