'use client';

/**
 * ACHEEVY Chat Page
 *
 * Enhanced chat interface with Deploy Platform integration.
 * Users interact with ACHEEVY, who orchestrates the Chicken_Hawk
 * execution engine and Lil_Hawk workers via the Circuit Box.
 *
 * Built with Vercel AI SDK patterns and A.I.M.S. branding.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Image from 'next/image';
import { AIMS_CIRCUIT_COLORS, CircuitBoardPattern } from '@/components/ui/CircuitBoard';
import { LiveOpsTheater } from '@/components/deploy-platform/LiveOpsTheater';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  shiftId?: string;
  toolCalls?: ToolCall[];
}

interface ToolCall {
  tool: string;
  status: 'pending' | 'executing' | 'complete' | 'error';
  result?: string;
}

// ─────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────

const SendIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const StopIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="6" width="12" height="12" rx="2" />
  </svg>
);

const CopyIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const DeployIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2L2 7l10 5 10-5-10-5z" />
    <path d="M2 17l10 5 10-5" />
    <path d="M2 12l10 5 10-5" />
  </svg>
);

const YardIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="7" width="20" height="14" rx="2" />
    <path d="M12 7V3M7 7V4M17 7V4" />
    <path d="M6 14h4M14 14h4" />
  </svg>
);

const MicIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" />
  </svg>
);

const SparklesIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 3v1m0 16v1m-8-9H3m18 0h-1M5.6 5.6l.7.7m12.1-.7-.7.7m0 11.4.7.7m-12.1-.7-.7.7" />
    <circle cx="12" cy="12" r="4" />
  </svg>
);

// ─────────────────────────────────────────────────────────────
// Message Component
// ─────────────────────────────────────────────────────────────

function ChatMessage({
  message,
  onCopy,
  onWatchShift,
}: {
  message: Message;
  onCopy: (text: string) => void;
  onWatchShift?: (shiftId: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';
  const isStreaming = message.isStreaming;

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onCopy(message.content);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-4 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        {isUser ? (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-black font-bold">
            U
          </div>
        ) : (
          <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-amber-500/20 to-amber-600/20 border border-amber-500/30">
            <Image
              src="/images/acheevy/acheevy-helmet.png"
              alt="ACHEEVY"
              width={40}
              height={40}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback to letter if image fails
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <span className="flex items-center justify-center w-full h-full text-amber-400 font-bold">A</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className={`flex-1 max-w-[80%] ${isUser ? 'text-right' : ''}`}>
        {/* Role Label */}
        <div className={`text-xs font-medium mb-1 ${isUser ? 'text-amber-400' : 'text-amber-300'}`}>
          {isUser ? 'You' : 'ACHEEVY'}
        </div>

        {/* Message Bubble */}
        <div
          className={`inline-block rounded-2xl px-4 py-3 ${
            isUser
              ? 'bg-amber-500/20 text-amber-50 rounded-tr-sm'
              : 'bg-white/[0.03] text-amber-100/90 rounded-tl-sm border border-white/5'
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap text-[15px]">{message.content}</p>
          ) : (
            <div className="prose prose-invert prose-sm max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ className, children, ...props }) {
                    const isInline = !className;
                    if (isInline) {
                      return (
                        <code className="bg-black/40 px-1.5 py-0.5 rounded text-amber-300 text-[13px]" {...props}>
                          {children}
                        </code>
                      );
                    }
                    return (
                      <div className="relative group my-3">
                        <pre className="bg-black/60 rounded-lg p-4 overflow-x-auto border border-white/5">
                          <code className={`${className} text-[13px]`} {...props}>
                            {children}
                          </code>
                        </pre>
                      </div>
                    );
                  },
                  a({ href, children }) {
                    return (
                      <a href={href} target="_blank" rel="noopener noreferrer" className="text-amber-300 hover:text-amber-200 underline">
                        {children}
                      </a>
                    );
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>

              {isStreaming && (
                <span className="inline-block w-2 h-5 bg-amber-400 ml-1 animate-pulse" />
              )}
            </div>
          )}

          {/* Tool Calls */}
          {message.toolCalls && message.toolCalls.length > 0 && (
            <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
              {message.toolCalls.map((call, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      call.status === 'complete'
                        ? 'bg-green-500'
                        : call.status === 'executing'
                        ? 'bg-amber-500 animate-pulse'
                        : call.status === 'error'
                        ? 'bg-red-500'
                        : 'bg-gray-500'
                    }`}
                  />
                  <span className="font-mono text-amber-300">{call.tool}</span>
                  {call.result && (
                    <span className="text-gray-500 truncate max-w-xs">{call.result}</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Shift Watch Button */}
          {message.shiftId && onWatchShift && (
            <button
              onClick={() => onWatchShift(message.shiftId!)}
              className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 transition-colors text-xs"
            >
              <YardIcon className="w-4 h-4" />
              Watch Shift in Live Ops Theater
            </button>
          )}
        </div>

        {/* Actions */}
        {!isUser && !isStreaming && message.content && (
          <div className="flex items-center gap-2 mt-2 opacity-0 hover:opacity-100 transition-opacity">
            <button
              onClick={handleCopy}
              className="p-1.5 rounded hover:bg-white/10 text-gray-500 hover:text-amber-300 transition-colors"
            >
              {copied ? <span className="text-green-400 text-xs">Copied!</span> : <CopyIcon className="w-4 h-4" />}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// Quick Actions
// ─────────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { id: 'deploy', label: 'Deploy It', icon: DeployIcon, prompt: 'Deploy my latest changes to staging' },
  { id: 'guide', label: 'Guide Me', icon: SparklesIcon, prompt: 'Help me plan my next deployment' },
  { id: 'status', label: 'Check Status', icon: YardIcon, prompt: "What's the status of my current shift?" },
];

function QuickActions({ onSelect, disabled }: { onSelect: (prompt: string) => void; disabled: boolean }) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {QUICK_ACTIONS.map((action) => (
        <button
          key={action.id}
          onClick={() => onSelect(action.prompt)}
          disabled={disabled}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-amber-100/70 hover:bg-white/10 hover:text-amber-100 hover:border-amber-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <action.icon className="w-4 h-4" />
          {action.label}
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Page Component
// ─────────────────────────────────────────────────────────────

export default function ACHEEVYChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeShiftId, setActiveShiftId] = useState<string | null>(null);
  const [showTheater, setShowTheater] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [inputValue]);

  // Send message
  const sendMessage = useCallback(async (text?: string) => {
    const messageText = text || inputValue;
    if (!messageText.trim() || isStreaming) return;

    setError(null);
    setInputValue('');

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    // Add assistant placeholder
    const assistantId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    };
    setMessages((prev) => [...prev, assistantMessage]);

    setIsStreaming(true);
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          model: 'gemini-3-flash',
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let accumulatedContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            if (line.includes('[DONE]')) continue;
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                accumulatedContent += data.content;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, content: accumulatedContent }
                      : m
                  )
                );
              }
              if (data.error) {
                throw new Error(data.error);
              }
            } catch (e) {
              // Skip malformed JSON
            }
          }
        }
      }

      // Check for deploy-related content and simulate shift creation
      if (messageText.toLowerCase().includes('deploy') || messageText.toLowerCase().includes('shift')) {
        const shiftId = `SH-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
        setActiveShiftId(shiftId);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, shiftId } : m
          )
        );
      }

      // Finalize
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, isStreaming: false } : m
        )
      );
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      setError(err.message);
      setMessages((prev) => prev.filter((m) => m.id !== assistantId));
    } finally {
      setIsStreaming(false);
    }
  }, [inputValue, isStreaming, messages]);

  // Stop generation
  const stopGeneration = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsStreaming(false);
    setMessages((prev) =>
      prev.map((m) => (m.isStreaming ? { ...m, isStreaming: false } : m))
    );
  }, []);

  // Keyboard handling
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="relative flex flex-col h-[calc(100vh-64px)] overflow-hidden" style={{ backgroundColor: AIMS_CIRCUIT_COLORS.background }}>
      {/* Background Pattern */}
      <CircuitBoardPattern density="sparse" animated glowIntensity={0.15} />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <span className="text-xl font-bold text-black">A</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-amber-100">ACHEEVY</h1>
            <p className="text-xs text-gray-500">AI Executive Assistant</p>
          </div>
        </div>

        {activeShiftId && (
          <button
            onClick={() => setShowTheater(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 transition-colors"
          >
            <YardIcon className="w-4 h-4" />
            <span className="text-sm">Live Ops Theater</span>
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="relative z-10 flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Welcome State */}
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-2xl shadow-amber-500/30">
                <span className="text-3xl font-bold text-black">A</span>
              </div>
              <h2 className="text-2xl font-bold text-amber-100 mb-2">Hello! I'm ACHEEVY</h2>
              <p className="text-amber-100/50 max-w-md mx-auto mb-8">
                Your AI executive assistant. I orchestrate deployments through the Circuit Box,
                commanding the Chicken_Hawk engine and Lil_Hawk workers to execute your requests.
              </p>

              <QuickActions onSelect={sendMessage} disabled={isStreaming} />
            </motion.div>
          )}

          {/* Message List */}
          <AnimatePresence>
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                onCopy={() => {}}
                onWatchShift={(shiftId) => {
                  setActiveShiftId(shiftId);
                  setShowTheater(true);
                }}
              />
            ))}
          </AnimatePresence>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400 text-sm"
            >
              {error}
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="relative z-10 border-t border-white/5 bg-black/40 backdrop-blur-sm px-4 py-4">
        <div className="max-w-3xl mx-auto">
          <div className="relative flex items-end gap-3 bg-white/[0.03] border border-white/10 rounded-2xl p-3 focus-within:border-amber-400/30 transition-colors">
            {/* Mic Button */}
            <button
              className="p-3 rounded-xl bg-white/5 text-amber-100/60 hover:bg-white/10 hover:text-amber-100 transition-colors"
              title="Voice input (coming soon)"
            >
              <MicIcon className="w-5 h-5" />
            </button>

            {/* Text Input */}
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message ACHEEVY..."
              disabled={isStreaming}
              rows={1}
              className="flex-1 bg-transparent text-amber-50 placeholder:text-white/20 resize-none outline-none text-[15px] leading-relaxed max-h-[200px] py-2"
            />

            {/* Send/Stop Button */}
            {isStreaming ? (
              <button
                onClick={stopGeneration}
                className="p-3 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
              >
                <StopIcon className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={() => sendMessage()}
                disabled={!inputValue.trim()}
                className={`p-3 rounded-xl transition-all ${
                  inputValue.trim()
                    ? 'bg-amber-400 text-black hover:bg-amber-300'
                    : 'bg-white/5 text-amber-100/30 cursor-not-allowed'
                }`}
              >
                <SendIcon className="w-5 h-5" />
              </button>
            )}
          </div>

          <p className="text-center text-xs text-gray-600 mt-3">
            ACHEEVY orchestrates via Circuit Box \u2192 Chicken_Hawk \u2192 Lil_Hawks
          </p>
        </div>
      </div>

      {/* Live Ops Theater Modal */}
      <LiveOpsTheater
        shiftId={activeShiftId || undefined}
        isOpen={showTheater}
        onClose={() => setShowTheater(false)}
      />
    </div>
  );
}
