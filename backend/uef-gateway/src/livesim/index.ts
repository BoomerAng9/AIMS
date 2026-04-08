/**
 * LiveSim — Real-Time Agent Collaboration Feed
 *
 * WebSocket server that broadcasts agent activities, deployment events,
 * and system health updates to connected clients in real-time.
 *
 * Clients connect to ws://<host>/livesim and receive JSON events:
 *   { type: "agent_activity", agent, action, detail, timestamp }
 *   { type: "deploy_event", instanceId, stage, message, timestamp }
 *   { type: "health_update", services, overall, timestamp }
 *   { type: "system_metric", metric, value, timestamp }
 *
 * Rooms: Clients can subscribe to specific rooms:
 *   - "global"     — All events
 *   - "deploy:<id>" — Events for a specific deployment
 *   - "agents"     — Agent-only activity feed
 *   - "health"     — Health/metrics only
 */

import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import logger from '../logger';

// ── Types ──────────────────────────────────────────────────

export type LiveSimEventType =
  | 'agent_activity'
  | 'deploy_event'
  | 'health_update'
  | 'system_metric'
  | 'vertical_step'
  | 'error'
  | 'connected';

export interface LiveSimEvent {
  type: LiveSimEventType;
  room: string;
  data: Record<string, unknown>;
  timestamp: string;
}

interface ConnectedClient {
  ws: WebSocket;
  rooms: Set<string>;
  userId?: string;
  connectedAt: string;
}

// ── LiveSim Server ─────────────────────────────────────────

class LiveSimServer {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, ConnectedClient> = new Map();
  private eventHistory: LiveSimEvent[] = [];
  private maxHistory = 500;

  /**
   * Attach LiveSim WebSocket to an existing HTTP server.
   * Only handles upgrade requests to /livesim path.
   */
  attach(server: HttpServer): void {
    this.wss = new WebSocketServer({ noServer: true });

    server.on('upgrade', (request: IncomingMessage, socket, head) => {
      const url = new URL(request.url || '/', `http://${request.headers.host}`);
      if (url.pathname !== '/livesim') return;

      this.wss!.handleUpgrade(request, socket, head, (ws) => {
        this.wss!.emit('connection', ws, request);
      });
    });

    this.wss.on('connection', (ws: WebSocket, request: IncomingMessage) => {
      const clientId = Math.random().toString(36).substring(2, 10);
      const url = new URL(request.url || '/', `http://${request.headers.host}`);
      const userId = url.searchParams.get('userId') || undefined;

      const client: ConnectedClient = {
        ws,
        rooms: new Set(['global']),
        userId,
        connectedAt: new Date().toISOString(),
      };

      this.clients.set(clientId, client);
      logger.info({ clientId, userId, totalClients: this.clients.size }, '[LiveSim] Client connected');

      // Send connection acknowledgment + recent history
      this.sendToClient(clientId, {
        type: 'connected',
        room: 'global',
        data: {
          clientId,
          rooms: Array.from(client.rooms),
          recentEvents: this.eventHistory.slice(-20),
        },
        timestamp: new Date().toISOString(),
      });

      // Handle incoming messages (room subscriptions)
      ws.on('message', (raw) => {
        try {
          const msg = JSON.parse(raw.toString());
          this.handleClientMessage(clientId, msg);
        } catch {
          this.sendToClient(clientId, {
            type: 'error',
            room: 'global',
            data: { message: 'Invalid JSON message' },
            timestamp: new Date().toISOString(),
          });
        }
      });

      ws.on('close', () => {
        this.clients.delete(clientId);
        logger.info({ clientId, totalClients: this.clients.size }, '[LiveSim] Client disconnected');
      });

      ws.on('error', (err) => {
        logger.warn({ clientId, error: err.message }, '[LiveSim] Client error');
        this.clients.delete(clientId);
      });
    });

    logger.info('[LiveSim] WebSocket server attached to /livesim');
  }

  /**
   * Handle messages from connected clients.
   * Supported actions: subscribe, unsubscribe, ping
   */
  private handleClientMessage(clientId: string, msg: { action: string; room?: string }): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    switch (msg.action) {
      case 'subscribe':
        if (msg.room) {
          client.rooms.add(msg.room);
          this.sendToClient(clientId, {
            type: 'connected',
            room: msg.room,
            data: { subscribed: true, rooms: Array.from(client.rooms) },
            timestamp: new Date().toISOString(),
          });
        }
        break;

      case 'unsubscribe':
        if (msg.room && msg.room !== 'global') {
          client.rooms.delete(msg.room);
        }
        break;

      case 'ping':
        this.sendToClient(clientId, {
          type: 'connected',
          room: 'global',
          data: { pong: true },
          timestamp: new Date().toISOString(),
        });
        break;
    }
  }

  /**
   * Broadcast an event to all clients subscribed to the event's room.
   */
  broadcast(event: Omit<LiveSimEvent, 'timestamp'>): void {
    const fullEvent: LiveSimEvent = {
      ...event,
      timestamp: new Date().toISOString(),
    };

    // Store in history
    this.eventHistory.push(fullEvent);
    if (this.eventHistory.length > this.maxHistory) {
      this.eventHistory.splice(0, this.eventHistory.length - this.maxHistory);
    }

    // Send to all clients in the matching room (or 'global')
    for (const [, client] of this.clients) {
      if (client.ws.readyState !== WebSocket.OPEN) continue;
      if (client.rooms.has(event.room) || client.rooms.has('global')) {
        try {
          client.ws.send(JSON.stringify(fullEvent));
        } catch {
          // Client send failed — will be cleaned up on close
        }
      }
    }
  }

  /**
   * Emit an agent activity event.
   */
  emitAgentActivity(agent: string, action: string, detail: string, metadata?: Record<string, unknown>): void {
    this.broadcast({
      type: 'agent_activity',
      room: 'agents',
      data: { agent, action, detail, ...metadata },
    });
  }

  /**
   * Emit a deployment lifecycle event.
   */
  emitDeployEvent(instanceId: string, stage: string, message: string, metadata?: Record<string, unknown>): void {
    this.broadcast({
      type: 'deploy_event',
      room: `deploy:${instanceId}`,
      data: { instanceId, stage, message, ...metadata },
    });
    // Also broadcast to global
    this.broadcast({
      type: 'deploy_event',
      room: 'deploy',
      data: { instanceId, stage, message, ...metadata },
    });
  }

  /**
   * Emit a health update.
   */
  emitHealthUpdate(services: Array<{ name: string; status: string }>, overall: string): void {
    this.broadcast({
      type: 'health_update',
      room: 'health',
      data: { services, overall },
    });
  }

  /**
   * Emit a vertical execution step.
   */
  emitVerticalStep(verticalId: string, step: number, totalSteps: number, description: string, agent: string): void {
    this.broadcast({
      type: 'vertical_step',
      room: 'agents',
      data: { verticalId, step, totalSteps, description, agent },
    });
  }

  /**
   * Emit a system metric.
   */
  emitSystemMetric(metric: string, value: number, unit?: string): void {
    this.broadcast({
      type: 'system_metric',
      room: 'health',
      data: { metric, value, unit },
    });
  }

  private sendToClient(clientId: string, event: LiveSimEvent): void {
    const client = this.clients.get(clientId);
    if (!client || client.ws.readyState !== WebSocket.OPEN) return;
    try {
      client.ws.send(JSON.stringify(event));
    } catch {
      // Ignore send errors
    }
  }

  /** Get stats about connected clients. */
  getStats(): { connectedClients: number; totalRooms: string[]; historySize: number } {
    const allRooms = new Set<string>();
    for (const [, client] of this.clients) {
      for (const room of client.rooms) allRooms.add(room);
    }
    return {
      connectedClients: this.clients.size,
      totalRooms: Array.from(allRooms),
      historySize: this.eventHistory.length,
    };
  }

  /** Get recent event history. */
  getRecentEvents(limit = 50): LiveSimEvent[] {
    return this.eventHistory.slice(-limit);
  }
}

export const liveSim = new LiveSimServer();
