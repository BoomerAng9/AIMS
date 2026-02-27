/**
 * II-Agent Client for ACHEEVY Integration (External Mode)
 *
 * Connects to an externally-deployed ii-agent instance via native WebSocket.
 * The ii-agent source code no longer lives in this repo — it's deployed
 * separately using its own docker-compose overlay (docker-compose.aims.yaml).
 *
 * Protocol: JSON over raw WebSocket (ws://<host>:<port>/ws)
 * Previous protocol was Socket.IO — changed to raw WS for external deployment.
 *
 * Fallback chain (handled by ACHEEVY orchestrator, not here):
 *   ii-agent → Chicken Hawk → LLM chat → queue
 */

import { EventEmitter } from 'events';
import WebSocket from 'ws';
import { v4 as uuidv4 } from 'uuid';

export interface IIAgentTask {
  type: 'code' | 'research' | 'slides' | 'fullstack' | 'browser';
  prompt: string;
  context?: {
    userId?: string;
    sessionId?: string;
    previousMessages?: Array<{ role: string; content: string }>;
    workingDirectory?: string;
  };
  options?: {
    timeout?: number;
    maxTokens?: number;
    streaming?: boolean;
  };
}

export interface IIAgentResponse {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  type: IIAgentTask['type'];
  output?: string;
  artifacts?: Array<{
    name: string;
    type: 'file' | 'url' | 'code';
    content: string;
  }>;
  error?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface IIAgentEvent {
  type: 'status' | 'output' | 'artifact' | 'error' | 'complete';
  data: any;
  timestamp: number;
}

// Agent type mapping for ii-agent query content
const TASK_TYPE_TO_AGENT_TYPE: Record<string, string> = {
  code: 'coder',
  research: 'researcher',
  slides: 'general',
  fullstack: 'coder',
  browser: 'browser',
};

/**
 * IIAgentClient — WebSocket bridge to external ii-agent backend.
 *
 * Uses the `ws` package for native WebSocket communication.
 * If the external ii-agent is unavailable, callers (ACHEEVY orchestrator)
 * handle fallback to Chicken Hawk or direct LLM chat.
 */
export class IIAgentClient extends EventEmitter {
  private httpUrl: string;
  private wsUrl: string;
  private socket: WebSocket | null = null;
  private connected = false;
  private sessionUuid: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingTasks: Map<string, {
    resolve: (response: IIAgentResponse) => void;
    reject: (error: Error) => void;
    output: string[];
    artifacts: Array<{ name: string; type: 'file' | 'url' | 'code'; content: string }>;
    taskType: IIAgentTask['type'];
  }> = new Map();

  constructor(options?: { wsUrl?: string; httpUrl?: string }) {
    super();
    this.httpUrl = options?.httpUrl || process.env.II_AGENT_HTTP_URL || 'http://ii-agent:8000';
    // Derive WS URL from HTTP URL if not explicitly set
    const rawWsUrl = options?.wsUrl || process.env.II_AGENT_WS_URL || this.httpUrl;
    this.wsUrl = rawWsUrl.replace(/^http/, 'ws');
    this.sessionUuid = uuidv4();
  }

  /**
   * Connect to ii-agent via WebSocket
   */
  async connect(): Promise<void> {
    if (this.connected && this.socket?.readyState === WebSocket.OPEN) return;

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Connection to ii-agent timed out (10s)'));
      }, 10000);

      // Build WS URL with auth params
      const url = new URL('/ws', this.wsUrl);
      url.searchParams.set('token', process.env.II_AGENT_SERVICE_TOKEN || 'aims-service-token');
      url.searchParams.set('session_uuid', this.sessionUuid);

      this.socket = new WebSocket(url.toString());

      this.socket.on('open', () => {
        clearTimeout(timeoutId);
        console.log('[II-Agent] Connected via WebSocket');
        this.connected = true;
        this.reconnectAttempts = 0;

        // Join session
        this.send({
          event: 'join_session',
          session_uuid: this.sessionUuid,
        });

        this.emit('connected');
        resolve();
      });

      this.socket.on('message', (data: Buffer) => {
        try {
          const msg = JSON.parse(data.toString());
          // Handle both envelope formats:
          //   { event: 'chat_event', type: '...', content: ... }
          //   { type: '...', content: ... }
          if (msg.event === 'chat_event' || msg.type) {
            this.handleChatEvent(msg);
          }
        } catch {
          // Non-JSON message, ignore
        }
      });

      this.socket.on('close', (code: number, reason: Buffer) => {
        console.log(`[II-Agent] Disconnected: code=${code} reason=${reason.toString()}`);
        this.connected = false;
        this.emit('disconnected');
        this.scheduleReconnect();
      });

      this.socket.on('error', (error: Error) => {
        clearTimeout(timeoutId);
        console.error('[II-Agent] Connection error:', error.message);
        this.connected = false;
        this.emit('error', error);
        reject(error);
      });
    });
  }

  /**
   * Disconnect from ii-agent
   */
  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.socket) {
      this.send({ event: 'leave_session', session_uuid: this.sessionUuid });
      this.socket.close();
      this.socket = null;
      this.connected = false;
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connected && this.socket?.readyState === WebSocket.OPEN;
  }

  /**
   * Execute a task on ii-agent.
   * Translates IIAgentTask → WebSocket JSON message
   * Collects response events → assembles IIAgentResponse
   */
  async executeTask(task: IIAgentTask): Promise<IIAgentResponse> {
    if (!this.isConnected()) {
      await this.connect();
    }

    const taskId = `task_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingTasks.delete(taskId);
        reject(new Error(`Task ${taskId} timed out after ${task.options?.timeout || 300000}ms`));
      }, task.options?.timeout || 300000);

      // Store pending task with accumulator
      this.pendingTasks.set(taskId, {
        resolve: (response) => {
          clearTimeout(timeout);
          this.pendingTasks.delete(taskId);
          resolve(response);
        },
        reject: (error) => {
          clearTimeout(timeout);
          this.pendingTasks.delete(taskId);
          reject(error);
        },
        output: [],
        artifacts: [],
        taskType: task.type,
      });

      // Build ii-agent query content
      const queryContent = {
        text: task.prompt,
        model_id: process.env.II_AGENT_MODEL || 'anthropic/claude-sonnet-4-20250514',
        provider: 'openrouter',
        source: 'system',
        agent_type: TASK_TYPE_TO_AGENT_TYPE[task.type] || 'general',
        resume: false,
        files: [],
        metadata: {
          aims_task_id: taskId,
          aims_task_type: task.type,
          aims_user_id: task.context?.userId,
          aims_session_id: task.context?.sessionId,
        },
      };

      // Send as WebSocket JSON message
      this.send({
        event: 'chat_message',
        session_uuid: this.sessionUuid,
        type: 'query',
        content: queryContent,
      });
    });
  }

  /**
   * Execute a task with streaming output
   */
  async *executeTaskStream(task: IIAgentTask): AsyncGenerator<IIAgentEvent> {
    if (!this.isConnected()) {
      await this.connect();
    }

    const eventQueue: IIAgentEvent[] = [];
    let completed = false;
    let error: Error | null = null;

    const eventHandler = (event: { type: string; content: any }) => {
      const translated = this.translateEvent(event);
      if (translated) {
        eventQueue.push(translated);
        if (translated.type === 'complete' || translated.type === 'error') {
          completed = true;
          if (translated.type === 'error') {
            error = new Error(translated.data);
          }
        }
      }
    };

    this.on('ii_agent_event', eventHandler);

    // Send query
    this.send({
      event: 'chat_message',
      session_uuid: this.sessionUuid,
      type: 'query',
      content: {
        text: task.prompt,
        agent_type: TASK_TYPE_TO_AGENT_TYPE[task.type] || 'general',
        resume: false,
        files: [],
      },
    });

    try {
      while (!completed || eventQueue.length > 0) {
        if (eventQueue.length > 0) {
          yield eventQueue.shift()!;
        } else {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }
      if (error) throw error;
    } finally {
      this.off('ii_agent_event', eventHandler);
    }
  }

  /**
   * Cancel a running task
   */
  async cancelTask(_taskId: string): Promise<void> {
    if (this.isConnected()) {
      this.send({
        event: 'chat_message',
        session_uuid: this.sessionUuid,
        type: 'cancel',
        content: {},
      });
    }
  }

  /**
   * Check ii-agent health via HTTP
   */
  async healthCheck(): Promise<{ status: string; version: string }> {
    const response = await fetch(`${this.httpUrl}/health`);
    return response.json();
  }

  /**
   * Map ACHEEVY intent to ii-agent task type
   */
  static mapIntentToTaskType(intent: string): IIAgentTask['type'] {
    const intentMap: Record<string, IIAgentTask['type']> = {
      'build': 'fullstack',
      'code': 'code',
      'develop': 'fullstack',
      'research': 'research',
      'investigate': 'research',
      'analyze': 'research',
      'presentation': 'slides',
      'slides': 'slides',
      'deck': 'slides',
      'browse': 'browser',
      'scrape': 'browser',
      'navigate': 'browser',
    };

    const lowerIntent = intent.toLowerCase();
    for (const [key, type] of Object.entries(intentMap)) {
      if (lowerIntent.includes(key)) {
        return type;
      }
    }

    return 'code';
  }

  // ── Private Methods ───────────────────────────────────────

  /**
   * Send a JSON message over WebSocket
   */
  private send(data: Record<string, unknown>): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    }
  }

  /**
   * Schedule a reconnection attempt with exponential backoff
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[II-Agent] Max reconnect attempts reached');
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;

    console.log(`[II-Agent] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    this.reconnectTimer = setTimeout(() => {
      this.connect().catch((err) => {
        console.error('[II-Agent] Reconnection failed:', err.message);
      });
    }, delay);
  }

  /**
   * Handle incoming ii-agent event messages.
   * Translates ii-agent event types to IIAgentResponse for pending tasks.
   */
  private handleChatEvent(event: { type: string; content: any }): void {
    // Emit raw event for streaming subscribers
    this.emit('ii_agent_event', event);

    // For the most recent pending task, accumulate output
    const lastTaskId = Array.from(this.pendingTasks.keys()).pop();
    if (!lastTaskId) return;

    const pending = this.pendingTasks.get(lastTaskId);
    if (!pending) return;

    switch (event.type) {
      case 'agent_response':
        // Accumulate response text
        if (event.content?.text) {
          pending.output.push(event.content.text);
        } else if (typeof event.content === 'string') {
          pending.output.push(event.content);
        }
        break;

      case 'tool_result':
      case 'file_edit':
        // Collect as artifact
        if (event.content) {
          pending.artifacts.push({
            name: event.content.name || event.content.tool_name || 'result',
            type: 'code',
            content: typeof event.content === 'string' ? event.content : JSON.stringify(event.content),
          });
        }
        break;

      case 'complete':
      case 'stream_complete':
        // Task done — resolve with accumulated output
        pending.resolve({
          id: lastTaskId,
          status: 'completed',
          type: pending.taskType,
          output: pending.output.join('\n'),
          artifacts: pending.artifacts,
        });
        break;

      case 'error':
        pending.reject(new Error(event.content?.message || event.content || 'ii-agent error'));
        break;

      case 'status_update':
        if (event.content?.status === 'cancelled') {
          pending.reject(new Error('Task cancelled by ii-agent'));
        }
        break;

      case 'metrics_update':
        // Could extract token usage here if needed
        break;

      // Ignore informational events
      case 'connection_established':
      case 'system':
      case 'processing':
      case 'user_message':
      case 'agent_thinking':
      case 'tool_call':
      case 'agent_initialized':
      case 'pong':
        break;
    }
  }

  /**
   * Translate ii-agent event to IIAgentEvent for streaming
   */
  private translateEvent(event: { type: string; content: any }): IIAgentEvent | null {
    switch (event.type) {
      case 'agent_response':
        return { type: 'output', data: event.content?.text || event.content, timestamp: Date.now() };
      case 'status_update':
        return { type: 'status', data: event.content, timestamp: Date.now() };
      case 'tool_result':
      case 'file_edit':
        return { type: 'artifact', data: event.content, timestamp: Date.now() };
      case 'complete':
      case 'stream_complete':
        return { type: 'complete', data: event.content, timestamp: Date.now() };
      case 'error':
        return { type: 'error', data: event.content?.message || event.content, timestamp: Date.now() };
      default:
        return null;
    }
  }
}

// Singleton instance
let iiAgentClient: IIAgentClient | null = null;

export function getIIAgentClient(): IIAgentClient {
  if (!iiAgentClient) {
    iiAgentClient = new IIAgentClient();
  }
  return iiAgentClient;
}

export default IIAgentClient;
