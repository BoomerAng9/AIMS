'use client';

/**
 * Chat w/ACHEEVY — Clean Bezel Interface
 *
 * Real AI chat via OpenRouter (Vercel AI SDK).
 * Bezel-framed design with ACHEEVY helmet logo on edge.
 */

import { useChat } from 'ai/react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Image from 'next/image';
import {
  Send, Square, Copy, Check, Mic, MicOff, Lock,
  Paperclip, X, FileText, ImageIcon, Code2, Upload,
  Bot, Search, Hammer, Layers, Wand2, BookOpen, Rocket,
} from 'lucide-react';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { useUserTier } from '@/hooks/useUserTier';

// ─────────────────────────────────────────────────────────────
// Quick Action Chips (matching screenshot)
// ─────────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { label: 'Build a bot', icon: Bot, prompt: 'I want to build a new AI bot for my workflow' },
  { label: 'Deep research', icon: Search, prompt: 'Run deep research on the latest AI agent frameworks' },
  { label: 'Create images', icon: ImageIcon, prompt: 'I need to create images for my project' },
  { label: 'Office assistant', icon: BookOpen, prompt: 'I need help with office tasks and document management' },
  { label: 'Vertical Stories', icon: Layers, prompt: 'Create a vertical story format for social media' },
  { label: 'Make it mine', icon: Wand2, prompt: 'Help me customize and brand my tools' },
  { label: 'Deploy a tool', icon: Rocket, prompt: 'Deploy my latest build to production' },
] as const;

// ─────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────

export default function ChatWithAcheevy() {
  const {
    messages, input, handleInputChange, handleSubmit, isLoading, stop, setInput,
  } = useChat({ api: '/api/chat' });

  const { gates } = useUserTier();
  const voiceInput = useVoiceInput({
    onTranscript: (result) => {
      setInput(result.text);
      if (result.text.trim()) {
        setTimeout(() => {
          formRef.current?.requestSubmit();
        }, 100);
      }
    },
  });

  const [copied, setCopied] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [input]);

  const handleCopy = useCallback((id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  const handleQuickAction = useCallback((prompt: string) => {
    setInput(prompt);
    setTimeout(() => formRef.current?.requestSubmit(), 50);
  }, [setInput]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      formRef.current?.requestSubmit();
    }
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    handleSubmit(e);
  };

  const handleVoiceClick = useCallback(() => {
    if (!gates.voiceStt) return;
    if (voiceInput.isListening) voiceInput.stopListening();
    else voiceInput.startListening();
  }, [gates.voiceStt, voiceInput]);

  return (
    <div className="flex flex-col w-full h-full">
      {/* ── Bezel Container ── */}
      <div className="relative w-full flex-1 flex flex-col rounded-[20px] overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, #1a1a1a 0%, #0d0d0d 50%, #1a1a1a 100%)',
          boxShadow: '0 0 0 2px rgba(212,168,67,0.15), 0 0 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.03)',
        }}
      >
        {/* ── Bezel Top Frame with logo + etched text ── */}
        <div className="relative flex items-center gap-4 px-6 py-4 border-b border-gold/10"
          style={{
            background: 'linear-gradient(180deg, rgba(30,30,30,0.95) 0%, rgba(15,15,15,0.98) 100%)',
          }}
        >
          {/* ACHEEVY Helmet — sits on the edge of the bezel */}
          <div className="relative flex-shrink-0">
            <div className="w-11 h-11 rounded-xl overflow-hidden border border-gold/30 bg-black/40 shadow-lg shadow-gold/10">
              <Image
                src="/images/acheevy/acheevy-helmet.png"
                alt="ACHEEVY"
                width={44}
                height={44}
                className="w-full h-full object-cover"
              />
            </div>
            {/* Online indicator */}
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#1a1a1a]">
              <div className="w-full h-full rounded-full bg-emerald-400 animate-ping opacity-40" />
            </div>
          </div>

          {/* Etched title */}
          <div>
            <h1 className="text-lg tracking-wide text-white/90"
              style={{
                fontFamily: 'var(--font-display, "Doto", monospace)',
                textShadow: '0 1px 2px rgba(0,0,0,0.8), 0 0 10px rgba(212,168,67,0.1)',
              }}
            >
              Chat w/ACHEEVY
            </h1>
            <p className="text-[11px] text-white/35 tracking-wide">
              Describe what you want; ACHEEVY coordinates the tools.
            </p>
          </div>
        </div>

        {/* ── Chat Area ── */}
        <div className="flex-1 overflow-y-auto px-6 py-6 scroll-smooth">
          <div className="max-w-3xl mx-auto space-y-5">
            {/* Welcome message from ACHEEVY */}
            {messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden bg-gold/10 border border-gold/20 flex-shrink-0">
                  <Image
                    src="/images/acheevy/acheevy-helmet.png"
                    alt="ACHEEVY"
                    width={32}
                    height={32}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="rounded-2xl rounded-tl-sm px-4 py-3 bg-white/[0.04] border border-white/[0.06] max-w-[85%]">
                  <p className="text-sm text-white/80 leading-relaxed">
                    Welcome to A.I.M.S. Describe what you want to build, research, or deploy &mdash; I will coordinate the right tools for you.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Message thread */}
            <AnimatePresence>
              {messages.map((m, i) => {
                const isUser = m.role === 'user';
                const isStreaming = isLoading && i === messages.length - 1 && !isUser;

                return (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
                  >
                    {/* Avatar */}
                    <div className="flex-shrink-0 mt-0.5">
                      {isUser ? (
                        <div className="w-8 h-8 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center">
                          <span className="text-xs font-bold text-gold">U</span>
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-gold/10 border border-gold/20">
                          <Image
                            src="/images/acheevy/acheevy-helmet.png"
                            alt="ACHEEVY"
                            width={32}
                            height={32}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>

                    {/* Bubble */}
                    <div className={`max-w-[85%] ${isUser ? 'text-right' : ''}`}>
                      <div className={`inline-block rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        isUser
                          ? 'bg-gold/10 text-white rounded-tr-sm border border-gold/20'
                          : 'bg-white/[0.04] border border-white/[0.06] text-white/90 rounded-tl-sm'
                      }`}>
                        {isUser ? (
                          <p className="whitespace-pre-wrap">{m.content}</p>
                        ) : (
                          <div className="prose prose-invert prose-sm max-w-none prose-headings:text-white prose-a:text-gold prose-strong:text-white prose-code:text-gold prose-code:bg-black/40 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                code({ className, children, ...props }) {
                                  const isInline = !className;
                                  if (isInline) {
                                    return <code className="bg-black/40 px-1.5 py-0.5 rounded text-gold text-[13px]" {...props}>{children}</code>;
                                  }
                                  return (
                                    <pre className="bg-black/60 rounded-lg p-4 overflow-x-auto border border-white/[0.06] my-3">
                                      <code className={`${className} text-[13px]`} {...props}>{children}</code>
                                    </pre>
                                  );
                                },
                              }}
                            >
                              {m.content}
                            </ReactMarkdown>
                            {isStreaming && <span className="inline-block w-2 h-5 bg-gold ml-1 animate-pulse" />}
                          </div>
                        )}
                      </div>

                      {/* Copy button on assistant messages */}
                      {!isUser && !isStreaming && m.content && (
                        <div className="mt-1 opacity-0 hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => handleCopy(m.id, m.content)}
                            className="p-1 rounded hover:bg-white/10 text-white/30 hover:text-gold transition-colors"
                          >
                            {copied === m.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Typing indicator */}
            {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center flex-shrink-0">
                  <Image src="/images/acheevy/acheevy-helmet.png" alt="ACHEEVY" width={32} height={32} className="w-full h-full object-cover rounded-full" />
                </div>
                <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-white/[0.04] border border-white/[0.06] flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-gold/50 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-1.5 h-1.5 bg-gold/50 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-1.5 h-1.5 bg-gold/50 rounded-full animate-bounce" />
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* ── Quick Action Chips ── */}
        {messages.length === 0 && (
          <div className="px-6 pb-3">
            <div className="flex flex-wrap gap-2 max-w-3xl mx-auto">
              {QUICK_ACTIONS.map(chip => (
                <button
                  key={chip.label}
                  onClick={() => handleQuickAction(chip.prompt)}
                  disabled={isLoading}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-full text-xs text-white/50 bg-white/[0.03] border border-white/[0.08] hover:bg-gold/10 hover:border-gold/20 hover:text-gold transition-all disabled:opacity-50"
                >
                  <chip.icon className="w-3.5 h-3.5" />
                  {chip.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Input Bar ── */}
        <div className="border-t border-gold/10 px-6 py-5"
          style={{
            background: 'linear-gradient(0deg, rgba(30,30,30,0.95) 0%, rgba(15,15,15,0.98) 100%)',
          }}
        >
          <div className="max-w-3xl mx-auto">
            <form ref={formRef} onSubmit={onSubmit}>
              <div className="relative flex items-end gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-2 focus-within:border-gold/25 transition-colors">
                {/* File attach */}
                <button
                  type="button"
                  className="p-2 rounded-xl text-white/30 hover:bg-white/5 hover:text-white/50 transition-colors flex-shrink-0"
                  title="Attach files"
                >
                  <Paperclip className="w-5 h-5" />
                </button>

                {/* Voice input */}
                <button
                  type="button"
                  onClick={handleVoiceClick}
                  className={`p-2 rounded-xl transition-all flex-shrink-0 ${
                    voiceInput.isListening
                      ? 'bg-red-500/20 text-red-400'
                      : gates.voiceStt
                        ? 'text-white/30 hover:bg-white/5 hover:text-white/50'
                        : 'text-white/15 cursor-default'
                  }`}
                  title={gates.voiceStt ? 'Voice input' : 'Voice input (paid plans)'}
                >
                  <div className="relative">
                    {voiceInput.isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    {!gates.voiceStt && <Lock className="w-2.5 h-2.5 absolute -top-1 -right-1 text-gold/40" />}
                  </div>
                </button>

                {/* Textarea */}
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Describe what you want to build, research, or deploy..."
                  disabled={isLoading}
                  rows={1}
                  className="flex-1 bg-transparent text-white/90 placeholder:text-white/20 resize-none outline-none text-[15px] leading-relaxed max-h-[160px] py-2 px-1"
                />

                {/* Send / Stop */}
                {isLoading ? (
                  <button type="button" onClick={stop} className="p-2.5 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors flex-shrink-0">
                    <Square className="w-5 h-5" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!input.trim()}
                    className={`p-2.5 rounded-xl transition-all flex-shrink-0 ${
                      input.trim()
                        ? 'bg-gold text-black hover:bg-gold-light'
                        : 'bg-white/5 text-white/20 cursor-not-allowed'
                    }`}
                  >
                    <Send className="w-5 h-5" />
                  </button>
                )}
              </div>
            </form>

            {/* Status line - Reserved height to fix "loading issue" layout shift */}
            <div className="flex items-center gap-2 mt-2 px-1 min-h-[20px]">
              {isLoading && (
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
                  <span className="text-[10px] text-gold/60 font-mono">Compiling...</span>
                </div>
              )}
              {voiceInput.isListening && (
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                  <span className="text-[10px] text-red-400/80 font-mono">Recording...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
