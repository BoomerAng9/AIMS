/**
 * useStreamingChat Hook
 * Handles streaming chat with SSE, message state, and voice integration
 *
 * This is the core hook that provides the "typing" effect like Claude/ChatGPT
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { ChatMessage } from '@/lib/chat/types';

interface UseStreamingChatOptions {
  sessionId?: string;
  model?: string;
  personaId?: string;
  onMessageStart?: () => void;
  onMessageComplete?: (message: ChatMessage) => void;
  onError?: (error: string) => void;
}

interface UseStreamingChatReturn {
  messages: ChatMessage[];
  isStreaming: boolean;
  isLoading: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  regenerate: () => Promise<void>;
  stopGeneration: () => void;
  clearMessages: () => void;
  editMessage: (id: string, newContent: string) => void;
}

export function useStreamingChat(options: UseStreamingChatOptions = {}): UseStreamingChatReturn {
  const { sessionId, model = 'gemini-3-flash', personaId, onMessageStart, onMessageComplete, onError } = options;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const currentMessageRef = useRef<string>('');

  // ─────────────────────────────────────────────────────────
  // Send Message with Streaming
  // ─────────────────────────────────────────────────────────

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isStreaming) return;

    setError(null);
    setIsLoading(true);

    // Add user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    // Add placeholder assistant message
    const assistantMessage: ChatMessage = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    };

    setMessages(prev => [...prev, userMessage, assistantMessage]);
    currentMessageRef.current = '';

    try {
      // Create abort controller for cancellation
      abortControllerRef.current = new AbortController();

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
          model,
          sessionId,
          personaId,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`Chat request failed: ${response.statusText}`);
      }

      setIsLoading(false);
      setIsStreaming(true);
      onMessageStart?.();

      // Read the stream
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          // Handle Vercel AI SDK format: 0:"text chunk"\n
          if (/^\d+:/.test(line)) {
            const colonIdx = line.indexOf(':');
            const prefix = line.slice(0, colonIdx);
            const payload = line.slice(colonIdx + 1);

            // 0 = text token, d = done/data, e = error
            if (prefix === '0') {
              try {
                const text = JSON.parse(payload);
                if (typeof text === 'string') {
                  currentMessageRef.current += text;
                  setMessages(prev => {
                    const updated = [...prev];
                    const lastMsg = updated[updated.length - 1];
                    if (lastMsg.role === 'assistant' && lastMsg.isStreaming) {
                      lastMsg.content = currentMessageRef.current;
                    }
                    return [...updated];
                  });
                }
              } catch {
                // Skip malformed tokens
              }
            } else if (prefix === 'e') {
              // Vercel AI SDK finish signal
              setIsStreaming(false);
              setMessages(prev => {
                const updated = [...prev];
                const lastMsg = updated[updated.length - 1];
                if (lastMsg.role === 'assistant') {
                  lastMsg.isStreaming = false;
                  onMessageComplete?.(lastMsg);
                }
                return updated;
              });
              return;
            }
            continue;
          }

          // Handle raw SSE format: data: {content}
          if (line.startsWith('data: ')) {
            const data = line.slice(6);

            if (data === '[DONE]') {
              setIsStreaming(false);
              setMessages(prev => {
                const updated = [...prev];
                const lastMsg = updated[updated.length - 1];
                if (lastMsg.role === 'assistant') {
                  lastMsg.isStreaming = false;
                  onMessageComplete?.(lastMsg);
                }
                return updated;
              });
              return;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.error) throw new Error(parsed.error);
              if (parsed.content) {
                currentMessageRef.current += parsed.content;
                setMessages(prev => {
                  const updated = [...prev];
                  const lastMsg = updated[updated.length - 1];
                  if (lastMsg.role === 'assistant' && lastMsg.isStreaming) {
                    lastMsg.content = currentMessageRef.current;
                  }
                  return [...updated];
                });
              }
            } catch {
              // Skip malformed chunks
            }
          }
        }
      }

      // Stream ended without explicit done signal — finalize
      if (currentMessageRef.current) {
        setIsStreaming(false);
        setMessages(prev => {
          const updated = [...prev];
          const lastMsg = updated[updated.length - 1];
          if (lastMsg.role === 'assistant' && lastMsg.isStreaming) {
            lastMsg.isStreaming = false;
            onMessageComplete?.(lastMsg);
          }
          return updated;
        });
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // User cancelled
        setMessages(prev => {
          const updated = [...prev];
          const lastMsg = updated[updated.length - 1];
          if (lastMsg.role === 'assistant') {
            lastMsg.isStreaming = false;
            lastMsg.content = currentMessageRef.current || '(cancelled)';
          }
          return updated;
        });
      } else {
        const errorMsg = err.message || 'Unknown error';
        setError(errorMsg);
        onError?.(errorMsg);

        // Remove the empty assistant message
        setMessages(prev => prev.filter(m => m.content || m.role === 'user'));
      }
    } finally {
      setIsStreaming(false);
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [messages, isStreaming, model, sessionId, onMessageStart, onMessageComplete, onError]);

  // ─────────────────────────────────────────────────────────
  // Regenerate Last Response
  // ─────────────────────────────────────────────────────────

  const regenerate = useCallback(async () => {
    if (messages.length < 2) return;

    // Find the last user message
    const lastUserIndex = messages.findLastIndex(m => m.role === 'user');
    if (lastUserIndex === -1) return;

    const lastUserMessage = messages[lastUserIndex];

    // Remove messages after the last user message
    setMessages(prev => prev.slice(0, lastUserIndex));

    // Resend
    await sendMessage(lastUserMessage.content);
  }, [messages, sendMessage]);

  // ─────────────────────────────────────────────────────────
  // Stop Generation
  // ─────────────────────────────────────────────────────────

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  // ─────────────────────────────────────────────────────────
  // Clear Messages
  // ─────────────────────────────────────────────────────────

  const clearMessages = useCallback(() => {
    stopGeneration();
    setMessages([]);
    setError(null);
  }, [stopGeneration]);

  // ─────────────────────────────────────────────────────────
  // Edit Message (for regeneration from a specific point)
  // ─────────────────────────────────────────────────────────

  const editMessage = useCallback((id: string, newContent: string) => {
    setMessages(prev => {
      const index = prev.findIndex(m => m.id === id);
      if (index === -1) return prev;

      // Remove all messages after this one
      const updated = prev.slice(0, index + 1);
      updated[index] = { ...updated[index], content: newContent };

      return updated;
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  return {
    messages,
    isStreaming,
    isLoading,
    error,
    sendMessage,
    regenerate,
    stopGeneration,
    clearMessages,
    editMessage,
  };
}
