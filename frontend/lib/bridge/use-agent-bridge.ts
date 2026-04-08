'use client';

/**
 * A.I.M.S. Agent Bridge WebSocket Hook
 *
 * Connects to ACHEEVY via the Agent Bridge (:3003).
 * Handles reconnection, message routing, and streaming.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import type {
  BridgeMessage,
  ChatMessage,
  ConnectionState,
  GenerativeBlock,
  TextPayload,
  ToolExecution,
  ApprovalRequest,
  StatusUpdate,
  UserAction,
  SessionReady,
} from './types';

const BRIDGE_URL = process.env.NEXT_PUBLIC_AGENT_BRIDGE_URL || 'ws://localhost:3003';
const MAX_RECONNECT_ATTEMPTS = 10;
const RECONNECT_DELAY_MS = 3000;
const HEARTBEAT_INTERVAL_MS = 30000;

interface UseAgentBridgeOptions {
  sessionId?: string;
  autoConnect?: boolean;
  onMessage?: (msg: ChatMessage) => void;
  onConnectionChange?: (state: ConnectionState) => void;
}

export function useAgentBridge(opts: UseAgentBridgeOptions = {}) {
  const { autoConnect = true, onMessage, onConnectionChange } = opts;

  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string>(opts.sessionId || '');
  const [isStreaming, setIsStreaming] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>();
  const heartbeatTimer = useRef<ReturnType<typeof setInterval>>();

  const updateConnection = useCallback(
    (state: ConnectionState) => {
      setConnectionState(state);
      onConnectionChange?.(state);
    },
    [onConnectionChange]
  );

  const addMessage = useCallback(
    (msg: ChatMessage) => {
      setMessages((prev) => {
        // If streaming, update the last assistant message
        const existing = prev.find((m) => m.id === msg.id);
        if (existing) {
          return prev.map((m) => (m.id === msg.id ? { ...m, ...msg } : m));
        }
        return [...prev, msg];
      });
      onMessage?.(msg);
    },
    [onMessage]
  );

  const handleBridgeMessage = useCallback(
    (raw: MessageEvent) => {
      try {
        const msg: BridgeMessage = JSON.parse(raw.data);

        switch (msg.type) {
          case 'session_ready': {
            const payload = msg.payload as SessionReady;
            setSessionId(payload.sessionId);
            break;
          }

          case 'text': {
            const payload = msg.payload as TextPayload;
            const chatMsg: ChatMessage = {
              id: msg.id,
              role: msg.sender === 'user' ? 'user' : 'assistant',
              content: payload.content,
              timestamp: msg.timestamp,
              streaming: payload.streaming,
            };
            setIsStreaming(payload.streaming || false);
            addMessage(chatMsg);
            break;
          }

          case 'generative_block': {
            const block = msg.payload as GenerativeBlock;
            setMessages((prev) => {
              const lastAssistant = [...prev].reverse().find((m) => m.role === 'assistant');
              if (lastAssistant) {
                return prev.map((m) =>
                  m.id === lastAssistant.id
                    ? { ...m, blocks: [...(m.blocks || []), block] }
                    : m
                );
              }
              // Create new assistant message with block
              return [
                ...prev,
                {
                  id: msg.id,
                  role: 'assistant',
                  content: '',
                  timestamp: msg.timestamp,
                  blocks: [block],
                },
              ];
            });
            break;
          }

          case 'tool_execution': {
            const tool = msg.payload as ToolExecution;
            setMessages((prev) => {
              const lastAssistant = [...prev].reverse().find((m) => m.role === 'assistant');
              if (lastAssistant) {
                return prev.map((m) =>
                  m.id === lastAssistant.id
                    ? { ...m, tools: [...(m.tools || []), tool] }
                    : m
                );
              }
              return prev;
            });
            break;
          }

          case 'approval_request': {
            const approval = msg.payload as ApprovalRequest;
            addMessage({
              id: msg.id,
              role: 'assistant',
              content: approval.description,
              timestamp: msg.timestamp,
              approval,
            });
            break;
          }

          case 'status_update': {
            const status = msg.payload as StatusUpdate;
            setMessages((prev) => {
              const lastAssistant = [...prev].reverse().find((m) => m.role === 'assistant');
              if (lastAssistant) {
                return prev.map((m) =>
                  m.id === lastAssistant.id ? { ...m, status } : m
                );
              }
              return prev;
            });
            break;
          }

          case 'error': {
            const err = msg.payload as { message: string; code?: string };
            addMessage({
              id: msg.id,
              role: 'system',
              content: `Error: ${err.message}`,
              timestamp: msg.timestamp,
            });
            break;
          }

          case 'heartbeat':
            // Acknowledged — keep connection alive
            break;
        }
      } catch (err) {
        console.error('[bridge] Failed to parse message:', err);
      }
    },
    [addMessage]
  );

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    updateConnection('connecting');

    const url = sessionId
      ? `${BRIDGE_URL}/session/${sessionId}`
      : `${BRIDGE_URL}/session/new`;

    const ws = new WebSocket(url);

    ws.onopen = () => {
      updateConnection('connected');
      reconnectAttempts.current = 0;

      // Start heartbeat
      heartbeatTimer.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'heartbeat', timestamp: new Date().toISOString() }));
        }
      }, HEARTBEAT_INTERVAL_MS);
    };

    ws.onmessage = handleBridgeMessage;

    ws.onclose = () => {
      updateConnection('disconnected');
      clearInterval(heartbeatTimer.current);

      // Auto-reconnect
      if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
        updateConnection('reconnecting');
        reconnectTimer.current = setTimeout(() => {
          reconnectAttempts.current++;
          connect();
        }, RECONNECT_DELAY_MS);
      }
    };

    ws.onerror = () => {
      updateConnection('error');
    };

    wsRef.current = ws;
  }, [sessionId, updateConnection, handleBridgeMessage]);

  const disconnect = useCallback(() => {
    clearTimeout(reconnectTimer.current);
    clearInterval(heartbeatTimer.current);
    reconnectAttempts.current = MAX_RECONNECT_ATTEMPTS; // Prevent auto-reconnect
    wsRef.current?.close();
    wsRef.current = null;
    updateConnection('disconnected');
  }, [updateConnection]);

  const sendMessage = useCallback(
    (content: string) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        console.warn('[bridge] Not connected');
        return;
      }

      const msg: BridgeMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: 'text',
        timestamp: new Date().toISOString(),
        sender: 'user',
        payload: { content } satisfies TextPayload,
      };

      wsRef.current.send(JSON.stringify(msg));

      // Optimistically add user message
      addMessage({
        id: msg.id,
        role: 'user',
        content,
        timestamp: msg.timestamp,
      });
    },
    [addMessage]
  );

  const sendAction = useCallback(
    (action: UserAction) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

      const msg: BridgeMessage = {
        id: `action-${Date.now()}`,
        type: 'approval_request',
        timestamp: new Date().toISOString(),
        sender: 'user',
        payload: action,
      };

      wsRef.current.send(JSON.stringify(msg));
    },
    []
  );

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) connect();
    return () => disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    messages,
    connectionState,
    sessionId,
    isStreaming,
    connect,
    disconnect,
    sendMessage,
    sendAction,
    clearMessages: () => setMessages([]),
  };
}
