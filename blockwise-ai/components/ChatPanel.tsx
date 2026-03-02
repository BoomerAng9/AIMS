'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useConversation } from '@elevenlabs/react';
import type { Property, ChatMessage } from '@/lib/types';

// ── Props ──

interface ChatPanelProps {
  selectedProperty: Property | null;
  onClose: () => void;
}

// ── Helpers ──

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ── Animation variants ──

const messageVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' as const } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
};

// ── Component ──

export function ChatPanel({ selectedProperty, onClose }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastSuggestedPropertyRef = useRef<string | null>(null);

  // ── ElevenLabs voice ──

  const conversation = useConversation({
    onMessage: useCallback((payload: { message: string; source: string }) => {
      const role = payload.source === 'ai' ? 'assistant' : 'user';
      setMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          role,
          content: payload.message,
          timestamp: Date.now(),
        },
      ]);
    }, []),
    onError: useCallback((message: string) => {
      setError(message || 'Voice connection error');
      setIsMicActive(false);
    }, []),
  });

  // Derive voice status from the hook's own state
  const voiceConnected = conversation.status === 'connected';
  const voiceStatus: 'idle' | 'listening' | 'speaking' =
    !voiceConnected ? 'idle' : conversation.isSpeaking ? 'speaking' : 'listening';

  // ── Auto-scroll ──

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Property suggestion ──

  useEffect(() => {
    if (
      selectedProperty &&
      selectedProperty.id !== lastSuggestedPropertyRef.current
    ) {
      lastSuggestedPropertyRef.current = selectedProperty.id;
      setMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          role: 'assistant',
          content: `I see you're looking at ${selectedProperty.address}. Want me to run a full analysis?`,
          timestamp: Date.now(),
          propertyContext: selectedProperty,
        },
      ]);
    }
  }, [selectedProperty]);

  // ── Cleanup on unmount ──

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── SSE text chat ──

  const sendMessage = useCallback(async () => {
    const text = inputValue.trim();
    if (!text || isStreaming) return;

    setError(null);
    setInputValue('');

    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
      propertyContext: selectedProperty,
    };

    setMessages((prev) => [...prev, userMessage]);

    // Build the messages payload (only user/assistant, not system)
    const chatHistory = [...messages, userMessage]
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({ role: m.role, content: m.content }));

    const assistantMessageId = generateId();

    setMessages((prev) => [
      ...prev,
      {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
      },
    ]);

    setIsStreaming(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: chatHistory,
          propertyContext: selectedProperty,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error(`Chat request failed (${res.status})`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder();
      let accumulated = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        // Keep the last potentially incomplete line in the buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;

          const payload = trimmed.slice(6);
          if (payload === '[DONE]') continue;

          try {
            const parsed = JSON.parse(payload) as { text: string };
            accumulated += parsed.text;

            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMessageId
                  ? { ...m, content: accumulated }
                  : m
              )
            );
          } catch {
            // Skip malformed SSE chunks
          }
        }
      }

      // If the final message is still empty after streaming, remove it
      if (!accumulated) {
        setMessages((prev) => prev.filter((m) => m.id !== assistantMessageId));
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;

      const errorMsg = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMsg);

      // Remove the empty assistant message on error
      setMessages((prev) => prev.filter((m) => m.id !== assistantMessageId));
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, [inputValue, isStreaming, messages, selectedProperty]);

  // ── Voice toggle ──

  const toggleMic = useCallback(async () => {
    if (isMicActive) {
      await conversation.endSession();
      setIsMicActive(false);
    } else {
      setError(null);
      try {
        await conversation.startSession({
          agentId: process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID!,
          connectionType: 'websocket',
        });
        setIsMicActive(true);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to start voice session';
        setError(errorMsg);
      }
    }
  }, [isMicActive, conversation]);

  // Sync mic state if ElevenLabs disconnects on its own
  useEffect(() => {
    if (isMicActive && conversation.status === 'disconnected') {
      setIsMicActive(false);
    }
  }, [isMicActive, conversation.status]);

  // ── Key handler ──

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    },
    [sendMessage]
  );

  // ── Render ──

  return (
    <div className="h-full flex flex-col bg-[#0A0A0F] text-white">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold tracking-wide text-[#D4A843]">
            ACHEEVY
          </h2>
          {/* Voice status indicator */}
          <AnimatePresence mode="wait">
            {voiceStatus !== 'idle' && (
              <motion.span
                key={voiceStatus}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                className="text-xs text-zinc-400"
              >
                {voiceStatus === 'listening' ? 'Listening...' : 'Speaking...'}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-zinc-400 hover:text-white"
          aria-label="Close chat panel"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-zinc-500 text-sm text-center max-w-60">
              Ask ACHEEVY anything about a property, neighborhood, or deal analysis.
            </p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              variants={messageVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              layout
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-[#D4A843] text-black rounded-br-sm'
                    : msg.role === 'system'
                      ? 'bg-white/3 text-zinc-500 italic border border-white/5'
                      : 'bg-white/5 text-zinc-200 rounded-bl-sm'
                }`}
              >
                <p className="whitespace-pre-wrap wrap-break-word">{msg.content}</p>
                {/* Streaming cursor */}
                {msg.role === 'assistant' && isStreaming && msg.content === '' && (
                  <span className="inline-block w-1.5 h-4 bg-[#D4A843] animate-pulse rounded-sm" />
                )}
                <span className="block text-[10px] mt-1.5 opacity-40">
                  {formatTimestamp(msg.timestamp)}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* ── Error banner ── */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 py-2 bg-red-500/10 border-t border-red-500/20 text-red-400 text-xs flex items-center justify-between"
          >
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError(null)}
              className="ml-2 text-red-400 hover:text-red-300"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Input bar ── */}
      <div className="px-3 py-3 bg-white/5 border-t border-white/10">
        <div className="flex items-center gap-2">
          {/* Mic button */}
          <button
            type="button"
            onClick={toggleMic}
            disabled={isStreaming}
            className={`relative shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
              isMicActive
                ? 'bg-[#D4A843] text-black'
                : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
            } ${isStreaming ? 'opacity-40 cursor-not-allowed' : ''}`}
            aria-label={isMicActive ? 'Stop voice session' : 'Start voice session'}
          >
            {/* Pulsing gold ring when mic active */}
            {isMicActive && (
              <span className="absolute inset-0 rounded-full border-2 border-[#D4A843] animate-ping opacity-50" />
            )}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="22" />
            </svg>
          </button>

          {/* Text input */}
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isMicActive ? 'Voice active — or type here...' : 'Ask ACHEEVY...'}
            disabled={isStreaming}
            className="flex-1 bg-transparent text-sm text-white placeholder-zinc-500 outline-none disabled:opacity-40"
          />

          {/* Send button */}
          <button
            type="button"
            onClick={sendMessage}
            disabled={!inputValue.trim() || isStreaming}
            className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
              inputValue.trim() && !isStreaming
                ? 'bg-[#D4A843] text-black hover:bg-[#c49a3a]'
                : 'bg-zinc-700/50 text-zinc-500 cursor-not-allowed'
            }`}
            aria-label="Send message"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
