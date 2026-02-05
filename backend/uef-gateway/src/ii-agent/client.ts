/**
 * II-Agent Client for ACHEEVY Integration
 * 
 * This client bridges ACHEEVY orchestrator with the ii-agent autonomous execution engine.
 * It provides WebSocket-based communication for real-time task execution and streaming.
 */

import WebSocket from 'ws';
import { EventEmitter } from 'events';

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

export class IIAgentClient extends EventEmitter {
  private wsUrl: string;
  private httpUrl: string;
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private pendingTasks: Map<string, (response: IIAgentResponse) => void> = new Map();

  constructor(options?: { wsUrl?: string; httpUrl?: string }) {
    super();
    this.wsUrl = options?.wsUrl || process.env.II_AGENT_WS_URL || 'ws://localhost:4001/ws';
    this.httpUrl = options?.httpUrl || process.env.II_AGENT_HTTP_URL || 'http://localhost:4001';
  }

  /**
   * Connect to ii-agent WebSocket server
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.wsUrl);

        this.ws.on('open', () => {
          console.log('[II-Agent] Connected to ii-agent server');
          this.reconnectAttempts = 0;
          this.emit('connected');
          resolve();
        });

        this.ws.on('message', (data: WebSocket.Data) => {
          this.handleMessage(data.toString());
        });

        this.ws.on('close', () => {
          console.log('[II-Agent] Connection closed');
          this.emit('disconnected');
          this.attemptReconnect();
        });

        this.ws.on('error', (error) => {
          console.error('[II-Agent] WebSocket error:', error.message);
          this.emit('error', error);
          reject(error);
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect from ii-agent server
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Check if connected to ii-agent
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Execute a task on ii-agent
   */
  async executeTask(task: IIAgentTask): Promise<IIAgentResponse> {
    if (!this.isConnected()) {
      await this.connect();
    }

    const taskId = this.generateTaskId();

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingTasks.delete(taskId);
        reject(new Error(`Task ${taskId} timed out`));
      }, task.options?.timeout || 300000); // 5 minute default

      this.pendingTasks.set(taskId, (response) => {
        clearTimeout(timeout);
        this.pendingTasks.delete(taskId);
        resolve(response);
      });

      this.sendMessage({
        type: 'execute_task',
        taskId,
        task,
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

    const taskId = this.generateTaskId();
    const eventQueue: IIAgentEvent[] = [];
    let completed = false;
    let error: Error | null = null;

    const eventHandler = (event: IIAgentEvent & { taskId: string }) => {
      if (event.taskId === taskId) {
        eventQueue.push(event);
        if (event.type === 'complete' || event.type === 'error') {
          completed = true;
          if (event.type === 'error') {
            error = new Error(event.data);
          }
        }
      }
    };

    this.on('task_event', eventHandler);

    this.sendMessage({
      type: 'execute_task',
      taskId,
      task: { ...task, options: { ...task.options, streaming: true } },
    });

    try {
      while (!completed || eventQueue.length > 0) {
        if (eventQueue.length > 0) {
          yield eventQueue.shift()!;
        } else {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }

      if (error) {
        throw error;
      }
    } finally {
      this.off('task_event', eventHandler);
    }
  }

  /**
   * Cancel a running task
   */
  async cancelTask(taskId: string): Promise<void> {
    this.sendMessage({
      type: 'cancel_task',
      taskId,
    });
  }

  /**
   * Check ii-agent health
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

    return 'code'; // Default to code execution
  }

  // Private methods

  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data);

      switch (message.type) {
        case 'task_response':
          const resolver = this.pendingTasks.get(message.taskId);
          if (resolver) {
            resolver(message.response);
          }
          break;

        case 'task_event':
          this.emit('task_event', message);
          break;

        case 'error':
          this.emit('error', new Error(message.error));
          break;

        case 'ping':
          this.sendMessage({ type: 'pong' });
          break;
      }
    } catch (error) {
      console.error('[II-Agent] Failed to parse message:', error);
    }
  }

  private sendMessage(message: object): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      throw new Error('WebSocket not connected');
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`[II-Agent] Attempting reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      setTimeout(() => {
        this.connect().catch(() => {
          this.attemptReconnect();
        });
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('[II-Agent] Max reconnect attempts reached');
      this.emit('max_reconnect_reached');
    }
  }

  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
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
