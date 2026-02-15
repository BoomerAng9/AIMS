/**
 * In-memory Task Store with SSE event support
 *
 * Stores task state, manages event listeners for streaming,
 * and evicts stale tasks after TTL.
 */

import { v4 as uuidv4 } from 'uuid';

// ---------------------------------------------------------------------------
// Types (mirrors A2A protocol types)
// ---------------------------------------------------------------------------

export type TaskStatus = 'submitted' | 'working' | 'input-required' | 'completed' | 'failed' | 'canceled';

export interface TaskMessage {
  role: 'user' | 'agent';
  parts: Array<{ type: string; [key: string]: unknown }>;
  timestamp: string;
}

export interface TaskArtifact {
  id: string;
  name: string;
  type: 'text' | 'code' | 'file' | 'data';
  content: string;
  mimeType?: string;
  metadata?: Record<string, unknown>;
}

export interface TaskState {
  id: string;
  agentId: string;
  status: TaskStatus;
  query: string;
  context: Record<string, unknown>;
  messages: TaskMessage[];
  artifacts: TaskArtifact[];
  metadata: {
    createdAt: string;
    updatedAt: string;
    requestedBy: string;
    matchedCapability?: string;
  };
  cost?: {
    tokens: number;
    usd: number;
  };
}

export interface TaskEvent {
  type: 'status' | 'message' | 'artifact' | 'progress' | 'cost' | 'error' | 'done';
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

const TASK_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

class TaskStore {
  private tasks = new Map<string, TaskState>();
  private listeners = new Map<string, Set<(event: TaskEvent) => void>>();
  private completedCount = 0;

  set(task: TaskState): void {
    this.tasks.set(task.id, task);
  }

  get(taskId: string): TaskState | undefined {
    return this.tasks.get(taskId);
  }

  updateStatus(taskId: string, status: TaskStatus): void {
    const task = this.tasks.get(taskId);
    if (task) {
      task.status = status;
      task.metadata.updatedAt = new Date().toISOString();
      if (status === 'completed') this.completedCount++;
    }
  }

  addMessage(taskId: string, message: TaskMessage): void {
    const task = this.tasks.get(taskId);
    if (task) {
      task.messages.push(message);
      task.metadata.updatedAt = new Date().toISOString();
    }
  }

  addArtifact(taskId: string, artifact: TaskArtifact): void {
    const task = this.tasks.get(taskId);
    if (task) {
      task.artifacts.push(artifact);
      task.metadata.updatedAt = new Date().toISOString();
    }
  }

  setCost(taskId: string, tokens: number, usd: number): void {
    const task = this.tasks.get(taskId);
    if (task) {
      task.cost = { tokens, usd };
    }
  }

  subscribe(taskId: string, callback: (event: TaskEvent) => void): () => void {
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

  emit(taskId: string, event: TaskEvent): void {
    const listeners = this.listeners.get(taskId);
    if (listeners) {
      for (const cb of listeners) {
        try { cb(event); } catch { /* don't let one listener break others */ }
      }
    }
  }

  listRecent(limit: number = 20): TaskState[] {
    return Array.from(this.tasks.values())
      .sort((a, b) => b.metadata.createdAt.localeCompare(a.metadata.createdAt))
      .slice(0, limit);
  }

  countCompleted(): number {
    return this.completedCount;
  }

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

export const taskStore = new TaskStore();

// Evict stale tasks every 30 minutes
setInterval(() => taskStore.evictStale(), 30 * 60 * 1000).unref();
