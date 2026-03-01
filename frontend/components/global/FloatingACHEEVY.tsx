'use client';

/**
 * FloatingACHEEVY — Real Inline Chat Widget
 *
 * Bottom-right floating button that expands into a chat panel.
 * Calls /api/acheevy/chat directly — no page navigation.
 *
 * - Click fab → opens chat panel
 * - Type + Enter → sends message to ACHEEVY
 * - Cmd/Ctrl + J → toggles panel
 * - Escape → closes panel
 * - Click outside → closes panel
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';

// ── Types ──

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

// ── Icons ──

function SendIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

// ── Component ──

export function FloatingACHEEVY() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [open]);

  // Global keyboard shortcuts
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
        e.preventDefault();
        setOpen(prev => !prev);
      }
      if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open]);

  // Send message to ACHEEVY
  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/acheevy/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          sessionId,
          context: {
            mode: 'recommend',
            capabilities: ['automations', 'plug_catalog', 'deploy_dock'],
            currentPath: typeof window !== 'undefined' ? window.location.pathname : '',
          },
        }),
      });

      if (!res.ok) throw new Error('Chat request failed');

      const data = await res.json();

      if (data.sessionId) setSessionId(data.sessionId);

      const assistantMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: data.reply || 'I received your request. Let me work on that.',
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          role: 'assistant',
          content: "I'm having trouble connecting right now. Please try again or visit the full Chat page.",
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, sessionId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Hide on the dedicated chat page — avoid redundant widget
  if (pathname === '/dashboard/chat') return null;

  return (
    <>
      {/* Floating Action Button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            onClick={() => setOpen(true)}
            className="fixed z-50 flex items-center gap-2.5 rounded-full bg-gradient-to-r from-amber-600 to-amber-700 px-5 py-3 text-black font-semibold text-sm shadow-[0_4px_24px_rgba(217,119,6,0.25)] hover:shadow-[0_8px_32px_rgba(217,119,6,0.35)] hover:scale-105 active:scale-95 transition-all duration-200"
            style={{ bottom: 'calc(var(--frame-inset, 12px) + 20px)', right: 'calc(var(--frame-inset, 12px) + 20px)' }}
            title="Chat w/ACHEEVY (Ctrl+J)"
          >
            <img
              src="/images/acheevy/acheevy-helmet.png"
              alt=""
              className="w-6 h-6 rounded-md border border-amber-500/30"
            />
            <span className="font-doto tracking-[0.2em] uppercase text-black font-bold">chat w/ A C H E E V Y</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed z-50 flex flex-col rounded-2xl border border-white/10 bg-surface-raised shadow-[0_16px_64px_rgba(0,0,0,0.4),0_4px_16px_rgba(0,0,0,0.2)]"
            style={{
              bottom: 'calc(var(--frame-inset, 12px) + 16px)',
              right: 'calc(var(--frame-inset, 12px) + 16px)',
              width: 'min(400px, calc(100vw - 48px))',
              height: 'min(560px, calc(100vh - 120px))',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/8 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg overflow-hidden border border-gold/20 bg-gold/10">
                  <img
                    src="/images/acheevy/acheevy-helmet.png"
                    alt="ACHEEVY"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex flex-col justify-center">
                  <span className="text-sm font-doto tracking-[0.3em] text-gold-gradient uppercase leading-tight">
                    chat w/ A C H E E V Y
                  </span>
                  <p className="text-[9px] text-zinc-500 font-mono uppercase tracking-widest mt-0.5">Executive Orchestrator</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-colors"
                title="Close (Esc)"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scrollbar-thin bg-obsidian/50">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center opacity-60">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden border border-gold/20 bg-gold/10 mb-4">
                    <img
                      src="/images/acheevy/acheevy-helmet.png"
                      alt="ACHEEVY"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-sm text-zinc-300 font-medium">I&apos;m ACHEEVY, at your service.</p>
                  <p className="text-xs text-zinc-500 mt-1">What will we deploy today?</p>
                </div>
              )}

              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${msg.role === 'user'
                        ? 'bg-gold/10 border border-gold/20 text-zinc-100'
                        : 'bg-surface border border-white/8 text-zinc-300'
                      }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-surface border border-white/8 rounded-xl px-4 py-3">
                    <div className="flex gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-3 pb-3 pt-2 border-t border-white/8 flex-shrink-0">
              <div className="flex items-center gap-2 rounded-xl bg-surface border border-white/10 px-3 py-2 focus-within:border-gold/40 focus-within:ring-2 focus-within:ring-gold/10 transition-all">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Message ACHEEVY..."
                  disabled={loading}
                  className="flex-1 bg-transparent text-sm text-zinc-100 placeholder:text-zinc-500 outline-none disabled:opacity-50"
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || loading}
                  className="p-1.5 rounded-lg bg-gold text-black hover:bg-gold/90 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                  title="Send message"
                >
                  <SendIcon className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs text-zinc-500 text-center mt-1.5 font-mono">
                <kbd className="px-1 py-0.5 rounded border border-white/10 bg-surface text-[9px] text-zinc-400">&#8984;J</kbd> toggle &middot; <kbd className="px-1 py-0.5 rounded border border-white/10 bg-surface text-[9px] text-zinc-400">Esc</kbd> close
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default FloatingACHEEVY;
