'use client';

/**
 * M.I.M. Automation Builder — A.I.M.S. AI-Powered Workflow Engine
 *
 * Chat-based workflow automation builder. Users describe the automation →
 * ACHEEVY generates a visual workflow with connected nodes →
 * live preview of the workflow diagram → iterative editing →
 * deploy as a Plug or export.
 *
 * Follows D.U.M.B. — Deep Universal Meticulous Build.
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Bot,
  Check,
  ChevronDown,
  Code,
  Copy,
  Download,
  Eye,
  Loader2,
  Maximize2,
  Minimize2,
  Rocket,
  Send,
  Workflow,
  X,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { transition, spring, stagger } from '@/lib/motion/tokens';

/* ─────────────────────────────────────────────────────────────────── */
/*  Constants                                                          */
/* ─────────────────────────────────────────────────────────────────── */

const MODELS = [
  { id: 'deepseek-v3',   label: 'DeepSeek V3',   description: 'Fast & capable (default)' },
  { id: 'qwen3-coder',   label: 'Qwen3 Coder',   description: 'Code specialist' },
  { id: 'gemini-flash',  label: 'Gemini Flash',   description: 'Speed optimised' },
  { id: 'claude-sonnet', label: 'Claude Sonnet',  description: 'Highest quality' },
  { id: 'gpt-4.1-mini',  label: 'GPT-4.1 Mini',  description: 'Balanced' },
] as const;

type ModelId    = typeof MODELS[number]['id'];
type PanelView  = 'preview' | 'code';

const STARTER_PROMPTS = [
  'When a new customer signs up, send a welcome email, create a CRM entry, and notify Slack',
  'Every Monday at 9am, pull analytics from Google, generate a report, and email the team',
  'When a support ticket is created, classify it with AI, route to the right team, and auto-reply',
  'Monitor a competitor\'s pricing page daily, compare changes, and alert via webhook',
  'When a file is uploaded to S3, process it with AI, extract metadata, and store in database',
  'On new Stripe payment, update CRM, send receipt, log to spreadsheet, and trigger onboarding',
];

/* ─────────────────────────────────────────────────────────────────── */
/*  Types                                                              */
/* ─────────────────────────────────────────────────────────────────── */

interface ChatMessage {
  id:        string;
  role:      'user' | 'assistant';
  content:   string;
  timestamp: number;
  isError?:  boolean;
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Root Component                                                     */
/* ─────────────────────────────────────────────────────────────────── */

export default function AutomationBuilderPage() {
  const [prompt,        setPrompt]        = useState('');
  const [messages,      setMessages]      = useState<ChatMessage[]>([]);
  const [generatedCode, setGeneratedCode] = useState('');
  const [isGenerating,  setIsGenerating]  = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelId>('deepseek-v3');
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [panelView,     setPanelView]     = useState<PanelView>('preview');
  const [copied,        setCopied]        = useState(false);
  const [isFullscreen,  setIsFullscreen]  = useState(false);
  const [error,         setError]         = useState<string | null>(null);

  const chatEndRef  = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const animProps = (delay = 0) =>
    prefersReducedMotion
      ? {}
      : { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 },
          transition: { ...transition.enter, delay } };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [prompt]);

  const extractHTML = useCallback((raw: string) => {
    let s = raw.trim();
    if (s.startsWith('```html')) s = s.slice(7);
    else if (s.startsWith('```'))  s = s.slice(3);
    if (s.endsWith('```')) s = s.slice(0, -3);
    return s.trim();
  }, []);

  /* ── Generate / Edit ── */
  const handleGenerate = useCallback(async () => {
    const text = prompt.trim();
    if (!text || isGenerating) return;

    setError(null);
    setIsGenerating(true);
    setPrompt('');

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`, role: 'user', content: text, timestamp: Date.now(),
    };
    setMessages(prev => [...prev, userMsg]);
    if (!generatedCode) setPanelView('preview');

    try {
      const res = await fetch('/api/make-it-mine/generate-automation', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: text,
          code:   generatedCode || undefined,
          model:  selectedModel,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(data.error ?? `Server error ${res.status}`);
      }

      const reader  = res.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split('\n')) {
          if (line.startsWith('0:')) {
            try {
              const token = JSON.parse(line.slice(2)) as string;
              accumulated += token;
              setGeneratedCode(extractHTML(accumulated));
            } catch { /* skip non-JSON */ }
          }
        }
      }

      setGeneratedCode(extractHTML(accumulated));
      setMessages(prev => [...prev, {
        id: `a-${Date.now()}`, role: 'assistant',
        content: generatedCode
          ? '✓ Updated your automation workflow. Describe more changes or add nodes.'
          : '✓ Your automation workflow is ready! Describe edits to add or modify nodes.',
        timestamp: Date.now(),
      }]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Generation failed';
      setError(msg);
      setMessages(prev => [...prev, {
        id: `e-${Date.now()}`, role: 'assistant',
        content: `Error: ${msg}`, timestamp: Date.now(), isError: true,
      }]);
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, isGenerating, generatedCode, selectedModel, extractHTML]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleGenerate(); }
  }, [handleGenerate]);

  const handleCopy = useCallback(async () => {
    if (!generatedCode) return;
    await navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [generatedCode]);

  const handleDownload = useCallback(() => {
    if (!generatedCode) return;
    const blob = new Blob([generatedCode], { type: 'text/html' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'automation-workflow.html'; a.click();
    URL.revokeObjectURL(url);
  }, [generatedCode]);

  const currentModel = MODELS.find(m => m.id === selectedModel) ?? MODELS[0];

  /* ─────────────────────────────────────────────────────────────── */
  /*  Render                                                         */
  /* ─────────────────────────────────────────────────────────────── */

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col bg-[#0A0A0B]">

      {/* ── Top Bar ── */}
      <header className="flex shrink-0 items-center justify-between border-b border-white/[0.06] bg-[#0A0A0B]/95 px-4 py-2.5 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/make-it-mine"
            className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-300"
          >
            <ArrowLeft size={14} />
            M.I.M.
          </Link>
          <div className="h-4 w-px bg-white/[0.08]" />
          <div className="flex items-center gap-2">
            <Image src="/assets/aims_transparent_logo.svg" alt="A.I.M.S." width={22} height={22} className="opacity-90" />
            <span className="text-base font-bold text-zinc-100">Automation Builder</span>
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-400">
              Powered by ACHEEVY
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Model picker */}
          <div className="relative">
            <button
              onClick={() => setShowModelMenu(v => !v)}
              className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-base font-medium text-zinc-400 transition-colors hover:border-white/20 hover:text-zinc-300"
            >
              <Bot size={13} />
              {currentModel.label}
              <ChevronDown size={12} />
            </button>
            <AnimatePresence>
              {showModelMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.97 }}
                  transition={transition.fast}
                  className="absolute right-0 top-full z-50 mt-1 w-56 overflow-hidden rounded-xl border border-white/[0.08] bg-[#111115] shadow-2xl"
                >
                  {MODELS.map(m => (
                    <button
                      key={m.id}
                      onClick={() => { setSelectedModel(m.id); setShowModelMenu(false); }}
                      className={`flex w-full items-center justify-between px-3 py-2.5 text-left text-sm transition-colors hover:bg-white/[0.04] ${
                        selectedModel === m.id ? 'bg-emerald-500/10 text-emerald-400' : 'text-zinc-400'
                      }`}
                    >
                      <div>
                        <p className="font-medium">{m.label}</p>
                        <p className="text-sm text-zinc-500">{m.description}</p>
                      </div>
                      {selectedModel === m.id && <Check size={14} />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {generatedCode && (
            <div className="flex items-center gap-1">
              <button onClick={handleCopy} title="Copy HTML" className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-zinc-500 transition-colors hover:bg-white/[0.04] hover:text-zinc-300">
                {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              </button>
              <button onClick={handleDownload} title="Download workflow" className="rounded-lg px-2 py-1.5 text-sm font-medium text-zinc-500 transition-colors hover:bg-white/[0.04] hover:text-zinc-300">
                <Download size={13} />
              </button>
              <button onClick={() => setIsFullscreen(v => !v)} title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'} className="rounded-lg px-2 py-1.5 text-sm font-medium text-zinc-500 transition-colors hover:bg-white/[0.04] hover:text-zinc-300">
                {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
              </button>
              <Link href="/dashboard/plugs" className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 py-1.5 text-sm font-semibold text-emerald-400 transition-colors hover:bg-emerald-500/20">
                <Rocket size={12} />
                Deploy as Plug
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left: Chat */}
        {!isFullscreen && (
          <div className="flex w-full flex-col border-r border-white/[0.06] md:w-[380px] lg:w-[420px]">
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {messages.length === 0
                ? <AutomationEmptyState onSelect={p => { setPrompt(p); setTimeout(() => textareaRef.current?.focus(), 50); }} />
                : (
                  <div className="space-y-3">
                    {messages.map((msg) => (
                      <motion.div
                        key={msg.id}
                        {...animProps()}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[88%] rounded-2xl px-4 py-2.5 text-base leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-emerald-500/[0.12] text-emerald-200'
                            : msg.isError
                              ? 'bg-red-500/10 text-red-400'
                              : 'bg-white/[0.04] text-zinc-400'
                        }`}>{msg.content}</div>
                      </motion.div>
                    ))}
                    {isGenerating && (
                      <div className="flex items-center gap-2 text-sm text-zinc-500">
                        <Loader2 size={13} className="animate-spin" />
                        ACHEEVY is building your automation…
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>
                )
              }
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mx-4 mb-2 flex items-start gap-2 rounded-lg bg-red-500/[0.08] px-3 py-2 text-sm text-red-400"
                >
                  <span className="flex-1">{error}</span>
                  <button onClick={() => setError(null)} title="Dismiss" className="shrink-0 mt-0.5"><X size={12} /></button>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="border-t border-white/[0.06] p-4">
              <div className="flex items-end gap-2 rounded-xl border border-white/[0.08] bg-white/[0.02] p-2.5 transition-colors focus-within:border-emerald-500/30">
                <textarea
                  ref={textareaRef}
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={generatedCode
                    ? 'Tell ACHEEVY what to change (e.g. "Add an error handling branch")'
                    : 'Describe the automation you want to build…'}
                  rows={1}
                  className="max-h-[150px] flex-1 resize-none bg-transparent text-sm text-zinc-200 outline-none placeholder:text-zinc-600"
                />
                <button
                  onClick={handleGenerate}
                  disabled={!prompt.trim() || isGenerating}
                  className="flex shrink-0 items-center justify-center rounded-lg bg-emerald-500 p-2 text-white transition-all hover:bg-emerald-400 active:scale-95 disabled:cursor-not-allowed disabled:opacity-25"
                >
                  {isGenerating ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                </button>
              </div>
              <p className="mt-2 text-sm text-zinc-600">
                Enter to send · Shift+Enter for new line · Generates visual workflow automations
              </p>
            </div>
          </div>
        )}

        {/* Right: Preview / Code */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex shrink-0 items-center justify-between border-b border-white/[0.06] px-4 py-2">
            <div className="flex items-center gap-1">
              {(['preview', 'code'] as PanelView[]).map(v => (
                <button
                  key={v}
                  onClick={() => setPanelView(v)}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                    panelView === v ? 'bg-white/[0.08] text-zinc-200' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {v === 'preview' ? <Eye size={13} /> : <Code size={13} />}
                  {v}
                </button>
              ))}
            </div>
            {isFullscreen && (
              <button onClick={() => setIsFullscreen(false)} className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-zinc-500 transition-colors hover:bg-white/[0.04] hover:text-zinc-300">
                <Minimize2 size={13} /> Exit Fullscreen
              </button>
            )}
          </div>

          <div className="flex-1 overflow-hidden">
            {panelView === 'preview'
              ? <WorkflowPreviewPanel code={generatedCode} isGenerating={isGenerating} />
              : <WorkflowCodePanel code={generatedCode} onCodeChange={setGeneratedCode} />
            }
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Empty State                                                        */
/* ─────────────────────────────────────────────────────────────────── */

function AutomationEmptyState({ onSelect }: { onSelect: (p: string) => void }) {
  const pref = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <div className="flex h-full flex-col items-center justify-center px-4 py-8">
      <motion.div
        initial={pref ? undefined : { opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={spring.gentle}
        className="mb-8 text-center"
      >
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10">
          <Workflow size={28} className="text-emerald-400" />
        </div>
        <h2 className="text-base font-semibold text-zinc-200">A.I.M.S. Automation Builder</h2>
        <p className="mt-1.5 max-w-[300px] text-base font-medium text-zinc-400 leading-relaxed">
          Describe your workflow and ACHEEVY will generate a visual automation with connected nodes, triggers, and actions.
        </p>
      </motion.div>

      <div className="w-full max-w-sm space-y-2">
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-600">Workflow ideas</p>
        {STARTER_PROMPTS.slice(0, 4).map((sp, i) => (
          <motion.button
            key={i}
            initial={pref ? undefined : { opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...transition.enter, delay: pref ? 0 : i * stagger.normal }}
            onClick={() => onSelect(sp)}
            className="w-full rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-left text-sm font-medium text-zinc-400 leading-relaxed transition-all hover:border-emerald-500/20 hover:bg-emerald-500/[0.04] hover:text-zinc-300"
          >
            {sp}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Workflow Preview Panel                                             */
/* ─────────────────────────────────────────────────────────────────── */

function WorkflowPreviewPanel({ code, isGenerating }: { code: string; isGenerating: boolean }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const doc = iframeRef.current?.contentDocument;
    if (doc && code) {
      doc.open();
      doc.write(code);
      doc.close();
    }
  }, [code]);

  if (!code && !isGenerating) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-zinc-700">
        <Workflow size={36} strokeWidth={1.5} />
        <p className="text-base font-semibold">Workflow preview appears here</p>
        <p className="max-w-xs text-center text-sm font-medium text-zinc-700">
          Describe a trigger → action → output chain and ACHEEVY will visualise it
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full items-start justify-center overflow-auto bg-[#0D0D10] p-4">
      <div
        className="relative h-full w-full overflow-hidden rounded-lg border border-white/[0.06] bg-[#0A0A0B] transition-all duration-300"
      >
        {isGenerating && !code && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#0A0A0B]/90">
            <Loader2 size={24} className="animate-spin text-emerald-400" />
            <p className="text-base font-medium text-zinc-400">Building your automation workflow…</p>
          </div>
        )}
        <iframe
          ref={iframeRef}
          className="h-full w-full border-0"
          sandbox="allow-scripts allow-same-origin"
          title="Workflow Preview"
        />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Code Panel                                                         */
/* ─────────────────────────────────────────────────────────────────── */

function WorkflowCodePanel({ code, onCodeChange }: { code: string; onCodeChange: (c: string) => void }) {
  if (!code) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-zinc-700">
        <Code size={36} strokeWidth={1.5} />
        <p className="text-base font-semibold">Generated code appears here</p>
      </div>
    );
  }

  return (
    <div className="relative h-full">
      <textarea
        value={code}
        onChange={e => onCodeChange(e.target.value)}
        spellCheck={false}
        placeholder="Generated workflow code"
        aria-label="Generated workflow code"
        className="h-full w-full resize-none bg-[#0D0D10] p-4 font-mono text-sm leading-relaxed text-emerald-400/85 outline-none selection:bg-emerald-500/20"
      />
      <div className="pointer-events-none absolute bottom-3 right-4 rounded bg-white/[0.04] px-2 py-0.5 text-xs text-zinc-600">
        {code.split('\n').length.toLocaleString()} lines
      </div>
    </div>
  );
}
