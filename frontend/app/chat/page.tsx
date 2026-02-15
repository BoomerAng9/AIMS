'use client';

/**
 * Chat w/ACHEEVY — Next-Level Command Center
 *
 * Two modes:
 *   TEXT  — Vercel AI SDK (useChat) with markdown rendering + voice TTS
 *   VOICE — ElevenLabs Conversational AI Agent SDK (real-time bi-directional)
 *
 * Design: Luxury Industrial AI / Hangar UI World
 *   - h-dvh fit-to-screen, zero dead space
 *   - Glass panel messages with depth layering
 *   - Gold accent system, ambient breathing glow
 *   - Audio frequency visualizer during voice sessions
 *   - File attachments, voice selector, model switcher
 *   - Needs analysis first (no info dumping)
 */

import { useChat } from 'ai/react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Image from 'next/image';
import { useConversation } from '@elevenlabs/react';
import {
  Send, Square, User, Copy, Check,
  Mic, MicOff, Volume2, VolumeX, Loader2,
  Paperclip, X, ChevronDown, Phone, PhoneOff,
  PanelLeftClose, PanelLeftOpen, Plus, MessageSquare, Trash2,
} from 'lucide-react';
import { SiteHeader } from '@/components/SiteHeader';
import { LogoWallBackground } from '@/components/LogoWallBackground';
import { TTS_VOICES } from '@/lib/voice';
import { sanitizeForTTS } from '@/lib/voice/sanitize';

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const ELEVENLABS_AGENT_ID = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID || '';

const AI_MODELS = [
  { key: 'claude-opus',   label: 'Claude Opus 4.6' },
  { key: 'claude-sonnet', label: 'Claude Sonnet 4.6' },
  { key: 'qwen',          label: 'Qwen 2.5 Coder 32B', tag: 'code' },
  { key: 'qwen-max',      label: 'Qwen Max' },
  { key: 'minimax',       label: 'MiniMax-01' },
  { key: 'glm',           label: 'GLM-5' },
  { key: 'kimi',          label: 'Kimi K2.5', tag: 'fast' },
  { key: 'nano-banana',   label: 'Nano Banana Pro', tag: 'fast' },
  { key: 'gemini-pro',    label: 'Gemini 2.5 Pro' },
] as const;

const THREADS_KEY = 'aims_chat_threads';
const SIDEBAR_KEY = 'aims_chat_sidebar';
const VOICE_SETTINGS_KEY = 'aims_voice_prefs';

interface Thread {
  id: string;
  title: string;
  createdAt: number;
  lastMessage?: string;
}

// ─────────────────────────────────────────────────────────────
// Thread Helpers
// ─────────────────────────────────────────────────────────────

function loadThreads(): Thread[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(THREADS_KEY) || '[]'); } catch { return []; }
}

function saveThreads(t: Thread[]) {
  try { localStorage.setItem(THREADS_KEY, JSON.stringify(t)); } catch {}
}

// ─────────────────────────────────────────────────────────────
// Audio Frequency Visualizer (Canvas)
// ─────────────────────────────────────────────────────────────

function FrequencyVisualizer({ getData, active, color = '#D4AF37' }: {
  getData: (() => Uint8Array | undefined) | undefined;
  active: boolean;
  color?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);

  useEffect(() => {
    if (!active || !getData || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const data = getData();
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (data) {
        const bars = 40;
        const barW = canvas.width / bars;
        for (let i = 0; i < bars; i++) {
          const val = data[i * Math.floor(data.length / bars)] || 0;
          const h = (val / 255) * canvas.height * 0.85;
          const opacity = 0.25 + (val / 255) * 0.75;
          ctx.fillStyle = color.startsWith('#')
            ? `${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`
            : color;
          ctx.beginPath();
          ctx.roundRect(
            i * barW + barW * 0.15,
            canvas.height - h,
            barW * 0.7,
            h,
            [2, 2, 0, 0],
          );
          ctx.fill();
        }
      }

      frameRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(frameRef.current);
  }, [active, getData, color]);

  return (
    <canvas
      ref={canvasRef}
      width={320}
      height={48}
      className="w-full h-12 rounded-lg"
    />
  );
}

// ─────────────────────────────────────────────────────────────
// Voice Selector Dropdown
// ─────────────────────────────────────────────────────────────

function VoiceSelector({ voiceId, provider, onSelect }: {
  voiceId: string;
  provider: string;
  onSelect: (id: string, p: 'elevenlabs' | 'deepgram') => void;
}) {
  const [open, setOpen] = useState(false);
  const cur = TTS_VOICES.find(v => v.id === voiceId);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg border border-white/[0.06] bg-white/[0.03] hover:border-gold/20 text-[11px] text-white/50 font-mono transition-colors"
      >
        <Volume2 className="w-3 h-3 text-gold/50" />
        <span>{cur?.name || 'Voice'}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 w-52 max-h-64 overflow-y-auto rounded-xl border border-white/[0.08] bg-[#0A0A0A]/95 backdrop-blur-xl shadow-2xl">
            {(['elevenlabs', 'deepgram'] as const).map(prov => (
              <div key={prov}>
                <div className="px-3 py-1.5 border-b border-white/[0.04]">
                  <span className="text-[9px] text-white/25 font-mono uppercase tracking-wider">{prov}</span>
                </div>
                {TTS_VOICES.filter(v => v.provider === prov).map(v => (
                  <button
                    key={v.id}
                    onClick={() => { onSelect(v.id, v.provider); setOpen(false); }}
                    className={`w-full text-left px-3 py-1.5 text-[11px] hover:bg-white/[0.04] flex justify-between ${
                      voiceId === v.id ? 'text-gold bg-gold/[0.06]' : 'text-white/50'
                    }`}
                  >
                    <span>{v.name}</span>
                    <span className="text-white/20">{v.style}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Message Bubble (Glass Panel)
// ─────────────────────────────────────────────────────────────

function MessageBubble({ role, content, isStreaming }: {
  role: string;
  content: string;
  isStreaming?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const isUser = role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0, 0, 0.2, 1] }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      {/* Avatar */}
      <div className="flex-shrink-0 mt-0.5">
        {isUser ? (
          <div className="w-7 h-7 rounded-full bg-gold/15 border border-gold/25 flex items-center justify-center">
            <User className="w-3.5 h-3.5 text-gold/70" />
          </div>
        ) : (
          <div className="relative w-7 h-7 rounded-full overflow-hidden bg-gold/10 border border-gold/20">
            <Image src="/images/acheevy/acheevy-helmet.png" alt="ACHEEVY" width={28} height={28} className="w-full h-full object-cover" />
            {isStreaming && (
              <div className="absolute inset-0 rounded-full border-2 border-gold/40 animate-ping" />
            )}
          </div>
        )}
      </div>

      {/* Bubble */}
      <div className={`min-w-0 max-w-[80%] ${isUser ? 'ml-auto' : ''}`}>
        <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed break-words overflow-hidden ${
          isUser
            ? 'bg-gold/10 text-white/90 rounded-tr-sm border border-gold/15'
            : 'bg-white/[0.03] backdrop-blur-sm text-white/85 rounded-tl-sm border border-white/[0.06] shadow-[0_2px_8px_rgba(0,0,0,0.3)]'
        }`}>
          {isUser ? (
            <p className="whitespace-pre-wrap break-words">{content}</p>
          ) : (
            <div className="prose prose-invert prose-sm max-w-none break-words
              prose-headings:text-white/90 prose-a:text-gold prose-strong:text-white/90
              prose-code:text-gold/80 prose-code:bg-black/30 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
              prose-pre:max-w-full prose-pre:overflow-x-auto prose-p:my-1.5 prose-headings:my-2">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ className, children, ...props }) {
                    if (!className) {
                      return <code className="bg-black/30 px-1 py-0.5 rounded text-gold/80 text-[12px]" {...props}>{children}</code>;
                    }
                    return (
                      <pre className="bg-black/40 rounded-lg p-3 overflow-x-auto border border-white/[0.04] my-2 max-w-full">
                        <code className={`${className} text-[12px]`} {...props}>{children}</code>
                      </pre>
                    );
                  },
                }}
              >
                {content}
              </ReactMarkdown>
              {isStreaming && <span className="inline-block w-1.5 h-4 bg-gold/60 ml-0.5 animate-pulse rounded-sm" />}
            </div>
          )}
        </div>

        {/* Copy */}
        {!isUser && !isStreaming && content && (
          <button
            onClick={() => { navigator.clipboard.writeText(content); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
            className="mt-0.5 p-1 rounded opacity-0 hover:opacity-100 text-white/20 hover:text-gold/60 transition-all"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// Threads Sidebar
// ─────────────────────────────────────────────────────────────

function ThreadsSidebar({ threads, activeId, onSelect, onNew, onDelete, open, onToggle }: {
  threads: Thread[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  open: boolean;
  onToggle: () => void;
}) {
  if (!open) return null;

  return (
    <motion.aside
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 240, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      className="flex-shrink-0 overflow-hidden border-r border-white/[0.06] bg-black/60"
    >
      <div className="flex flex-col h-full w-[240px]">
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/[0.06]">
          <span className="text-[9px] uppercase tracking-[0.15em] text-white/30 font-mono">Threads</span>
          <div className="flex gap-1">
            <button onClick={onNew} className="p-1 rounded text-white/30 hover:text-gold transition-colors"><Plus size={13} /></button>
            <button onClick={onToggle} className="p-1 rounded text-white/30 hover:text-white/60 transition-colors"><PanelLeftClose size={13} /></button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-1.5 space-y-0.5">
          {threads.length === 0 ? (
            <div className="px-3 py-8 text-center">
              <MessageSquare className="w-5 h-5 text-white/[0.08] mx-auto mb-1.5" />
              <p className="text-[9px] text-white/15 font-mono">No threads yet</p>
            </div>
          ) : threads.map(t => (
            <div
              key={t.id}
              onClick={() => onSelect(t.id)}
              className={`group flex items-center gap-2 mx-1.5 px-2.5 py-2 rounded-lg cursor-pointer transition-all ${
                activeId === t.id
                  ? 'bg-gold/[0.08] border border-gold/15'
                  : 'border border-transparent hover:bg-white/[0.03]'
              }`}
            >
              <MessageSquare size={11} className={activeId === t.id ? 'text-gold/60' : 'text-white/20'} />
              <div className="flex-1 min-w-0">
                <p className={`text-[11px] truncate ${activeId === t.id ? 'text-gold/80' : 'text-white/50'}`}>{t.title}</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(t.id); }}
                className="p-0.5 rounded opacity-0 group-hover:opacity-100 text-white/15 hover:text-red-400 transition-all"
              ><Trash2 size={10} /></button>
            </div>
          ))}
        </div>
      </div>
    </motion.aside>
  );
}

// ─────────────────────────────────────────────────────────────
// Voice Session Panel (ElevenLabs Agent SDK)
// ─────────────────────────────────────────────────────────────

function VoiceSessionPanel({ conversation, active, onEnd }: {
  conversation: ReturnType<typeof useConversation>;
  active: boolean;
  onEnd: () => void;
}) {
  if (!active) return null;

  const isConnected = conversation.status === 'connected';
  const isSpeaking = conversation.isSpeaking;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="mx-auto w-full max-w-2xl mb-3"
    >
      <div className="rounded-2xl border border-gold/15 bg-gradient-to-b from-gold/[0.04] to-transparent backdrop-blur-sm p-4">
        {/* Status */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400 animate-pulse'}`} />
            <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider">
              {isConnected ? (isSpeaking ? 'ACHEEVY Speaking' : 'Listening') : 'Connecting...'}
            </span>
          </div>
          <button
            onClick={onEnd}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/15 text-red-400 text-[10px] font-mono uppercase tracking-wider hover:bg-red-500/25 transition-colors"
          >
            <PhoneOff className="w-3 h-3" />
            End
          </button>
        </div>

        {/* Visualizers */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[8px] text-white/20 font-mono uppercase mb-1">You</p>
            <div className="rounded-lg bg-white/[0.02] border border-white/[0.04] p-1">
              <FrequencyVisualizer
                getData={conversation.getInputByteFrequencyData}
                active={isConnected}
                color="#3B82F6"
              />
            </div>
          </div>
          <div>
            <p className="text-[8px] text-gold/30 font-mono uppercase mb-1">ACHEEVY</p>
            <div className="rounded-lg bg-gold/[0.02] border border-gold/[0.06] p-1">
              <FrequencyVisualizer
                getData={conversation.getOutputByteFrequencyData}
                active={isSpeaking}
                color="#D4AF37"
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Chat Page
// ─────────────────────────────────────────────────────────────

export default function ChatPage() {
  const searchParams = useSearchParams();
  const [selectedModel, setSelectedModel] = useState('claude-opus');

  // ── Text Chat (Vercel AI SDK) ──
  const {
    messages, input, handleInputChange, handleSubmit,
    isLoading, stop, setInput,
  } = useChat({ api: '/api/chat', body: { model: selectedModel } });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const prefillHandled = useRef(false);
  const lastAssistantRef = useRef('');

  // ── Voice Session (ElevenLabs Agent SDK) ──
  const [voiceActive, setVoiceActive] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState<Array<{ role: string; text: string }>>([]);
  const conversation = useConversation({
    onMessage: (msg: { source?: string; role?: string; message?: string; content?: string }) => {
      const text = msg.message || msg.content || '';
      const role = msg.source === 'user' || msg.role === 'user' ? 'user' : 'agent';
      if (text) setVoiceTranscript(prev => [...prev, { role, text }]);
    },
    onError: (message: string) => console.error('[Voice]', message),
  });

  const startVoiceSession = useCallback(async () => {
    if (!ELEVENLABS_AGENT_ID) return;
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      await conversation.startSession({ agentId: ELEVENLABS_AGENT_ID, connectionType: 'websocket' });
      setVoiceActive(true);
      setVoiceTranscript([]);
    } catch (err) {
      console.error('[Voice] Start failed:', err);
    }
  }, [conversation]);

  const endVoiceSession = useCallback(async () => {
    try {
      if (conversation.status === 'connected') await conversation.endSession();
    } catch { /* ignore */ }
    setVoiceActive(false);
  }, [conversation]);

  // ── TTS for text chat (sanitized) ──
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [ttsVoiceId, setTtsVoiceId] = useState('pNInz6obpgDQGcFmaJgB');
  const [ttsProvider, setTtsProvider] = useState<'elevenlabs' | 'deepgram'>('elevenlabs');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load voice prefs
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(VOICE_SETTINGS_KEY) || '{}');
      if (saved.voiceId) setTtsVoiceId(saved.voiceId);
      if (saved.provider) setTtsProvider(saved.provider);
      if (saved.enabled === false) setTtsEnabled(false);
    } catch { /* ignore */ }
  }, []);

  // Save voice prefs
  useEffect(() => {
    try {
      localStorage.setItem(VOICE_SETTINGS_KEY, JSON.stringify({
        voiceId: ttsVoiceId, provider: ttsProvider, enabled: ttsEnabled,
      }));
    } catch { /* ignore */ }
  }, [ttsVoiceId, ttsProvider, ttsEnabled]);

  const speakText = useCallback(async (text: string) => {
    if (!ttsEnabled || !text || voiceActive) return;
    const clean = sanitizeForTTS(text);
    if (!clean) return;

    try {
      setIsSpeaking(true);
      const res = await fetch('/api/voice/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: clean.slice(0, 3000), provider: ttsProvider, voiceId: ttsVoiceId }),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        if (audioRef.current) { audioRef.current.pause(); URL.revokeObjectURL(audioRef.current.src); }
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onended = () => { setIsSpeaking(false); URL.revokeObjectURL(url); };
        audio.onerror = () => { setIsSpeaking(false); URL.revokeObjectURL(url); };
        await audio.play().catch(() => setIsSpeaking(false));
      } else {
        setIsSpeaking(false);
      }
    } catch { setIsSpeaking(false); }
  }, [ttsEnabled, ttsProvider, ttsVoiceId, voiceActive]);

  const stopSpeaking = useCallback(() => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    setIsSpeaking(false);
  }, []);

  // ── File attachments ──
  const [files, setFiles] = useState<File[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Threads ──
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ── Init ──
  useEffect(() => {
    setThreads(loadThreads());
    try { if (localStorage.getItem(SIDEBAR_KEY) === 'true') setSidebarOpen(true); } catch { /* ignore */ }
  }, []);

  // Pre-fill from ?q=
  useEffect(() => {
    const q = searchParams.get('q');
    if (q && !prefillHandled.current) {
      prefillHandled.current = true;
      setInput(q);
      setTimeout(() => {
        (document.getElementById('chat-form') as HTMLFormElement)?.requestSubmit();
      }, 100);
    }
  }, [searchParams, setInput]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, voiceTranscript]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }
  }, [input]);

  // Auto TTS on new assistant message
  useEffect(() => {
    if (!isLoading && messages.length > 0) {
      const last = messages[messages.length - 1];
      if (last.role === 'assistant' && last.content && last.content !== lastAssistantRef.current) {
        lastAssistantRef.current = last.content;
        speakText(last.content);
      }
    }
  }, [isLoading, messages, speakText]);

  // Thread management
  const toggleSidebar = useCallback(() => {
    setSidebarOpen(p => { const n = !p; try { localStorage.setItem(SIDEBAR_KEY, String(n)); } catch { /* ignore */ } return n; });
  }, []);

  const createThread = useCallback(() => {
    const t: Thread = { id: `t_${Date.now()}`, title: `Thread ${threads.length + 1}`, createdAt: Date.now() };
    const updated = [t, ...threads];
    setThreads(updated); saveThreads(updated); setActiveThreadId(t.id);
  }, [threads]);

  const deleteThread = useCallback((id: string) => {
    const updated = threads.filter(t => t.id !== id);
    setThreads(updated); saveThreads(updated);
    if (activeThreadId === id) setActiveThreadId(null);
  }, [threads, activeThreadId]);

  // Update thread title
  useEffect(() => {
    if (activeThreadId && messages.length > 0) {
      const firstUser = messages.find(m => m.role === 'user');
      if (firstUser) {
        setThreads(prev => {
          const upd = prev.map(t => t.id === activeThreadId
            ? { ...t, title: firstUser.content.slice(0, 35), lastMessage: messages[messages.length - 1].content.slice(0, 50) }
            : t
          );
          saveThreads(upd);
          return upd;
        });
      }
    }
  }, [messages, activeThreadId]);

  // Submit handlers
  const handleEnhancedSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    handleSubmit(e);
  }, [input, isLoading, handleSubmit]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      (document.getElementById('chat-form') as HTMLFormElement)?.requestSubmit();
    }
  };

  const hasAgent = Boolean(ELEVENLABS_AGENT_ID);

  // ─────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────

  return (
    <LogoWallBackground mode="dashboard">
      <div className="h-dvh w-full flex flex-col overflow-hidden">
        <SiteHeader />

        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Sidebar */}
          <AnimatePresence>
            {sidebarOpen && (
              <ThreadsSidebar
                threads={threads}
                activeId={activeThreadId}
                onSelect={setActiveThreadId}
                onNew={createThread}
                onDelete={deleteThread}
                open={sidebarOpen}
                onToggle={toggleSidebar}
              />
            )}
          </AnimatePresence>

          {/* Main Area */}
          <main className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
            {/* ── Header ── */}
            <div className="flex-shrink-0 flex items-center gap-3 px-4 py-2.5 border-b border-white/[0.06] bg-[#0A0A0A]/90 backdrop-blur-xl">
              {/* Left */}
              <div className="flex items-center gap-2.5 min-w-0">
                {!sidebarOpen && (
                  <button onClick={toggleSidebar} className="p-1 rounded text-white/30 hover:text-gold transition-colors flex-shrink-0">
                    <PanelLeftOpen size={15} />
                  </button>
                )}
                <div className="relative flex-shrink-0">
                  <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-gold/15 overflow-hidden">
                    <Image src="/images/acheevy/acheevy-helmet.png" alt="ACHEEVY" width={32} height={32} className="w-full h-full object-cover" />
                  </div>
                  <div className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border-[1.5px] border-[#0A0A0A] ${
                    voiceActive ? 'bg-gold animate-pulse' : 'bg-emerald-400'
                  }`} />
                </div>
                <div className="min-w-0">
                  <h1 className="font-semibold text-sm text-white tracking-tight truncate">Chat w/ACHEEVY</h1>
                  <p className="text-[9px] text-white/25 font-mono truncate">
                    {voiceActive ? 'Voice Session Active' : 'Vercel AI SDK + ElevenLabs Agent'}
                  </p>
                </div>
              </div>

              {/* Right controls */}
              <div className="flex items-center gap-1.5 ml-auto flex-shrink-0">
                {/* Model */}
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="bg-white/[0.03] border border-white/[0.06] rounded-lg px-2 py-1 text-[10px] text-white/50 font-mono outline-none cursor-pointer max-w-[90px] appearance-none"
                  title="AI Model"
                >
                  {AI_MODELS.map(m => (
                    <option key={m.key} value={m.key} className="bg-[#0A0A0A]">
                      {m.label}
                    </option>
                  ))}
                </select>

                {/* Voice */}
                <VoiceSelector
                  voiceId={ttsVoiceId}
                  provider={ttsProvider}
                  onSelect={(id, p) => { setTtsVoiceId(id); setTtsProvider(p); }}
                />

                {/* Voice session */}
                {hasAgent && (
                  <button
                    onClick={voiceActive ? endVoiceSession : startVoiceSession}
                    className={`p-1.5 rounded-lg transition-all ${
                      voiceActive
                        ? 'bg-red-500/15 text-red-400 hover:bg-red-500/25'
                        : 'bg-gold/10 text-gold/70 hover:bg-gold/20 hover:text-gold'
                    }`}
                    title={voiceActive ? 'End voice session' : 'Start voice session'}
                  >
                    {voiceActive ? <PhoneOff size={14} /> : <Phone size={14} />}
                  </button>
                )}
              </div>
            </div>

            {/* ── Messages ── */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth min-h-0">
              <div className="max-w-2xl mx-auto px-4 py-4 space-y-4 w-full">
                {/* Welcome */}
                {messages.length === 0 && !voiceActive && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-8"
                  >
                    <div className="relative w-16 h-16 mb-4">
                      <div className="absolute inset-0 rounded-2xl bg-gold/10 border border-gold/15 overflow-hidden">
                        <Image src="/images/acheevy/acheevy-helmet.png" alt="ACHEEVY" width={64} height={64} className="w-full h-full object-cover" />
                      </div>
                      <div className="absolute inset-0 rounded-2xl border border-gold/20 animate-pulse" style={{ animationDuration: '3s' }} />
                    </div>
                    <h2 className="text-lg font-semibold text-white mb-1">Chat w/ACHEEVY</h2>
                    <p className="text-white/35 text-sm text-center max-w-sm">
                      What will we deploy today?
                    </p>
                    {hasAgent && (
                      <button
                        onClick={startVoiceSession}
                        className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-gold/10 border border-gold/20 text-gold/80 text-sm hover:bg-gold/15 hover:border-gold/30 transition-all"
                      >
                        <Phone className="w-4 h-4" />
                        Start Voice Session
                      </button>
                    )}
                  </motion.div>
                )}

                {/* Text messages */}
                <AnimatePresence>
                  {messages.map((m, i) => (
                    <MessageBubble
                      key={m.id}
                      role={m.role}
                      content={m.content}
                      isStreaming={isLoading && i === messages.length - 1 && m.role === 'assistant'}
                    />
                  ))}
                </AnimatePresence>

                {/* Voice transcript */}
                {voiceActive && voiceTranscript.map((entry, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-3 ${entry.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm break-words ${
                      entry.role === 'user'
                        ? 'bg-gold/10 text-white/90 rounded-tr-sm border border-gold/15'
                        : 'bg-white/[0.03] text-white/85 rounded-tl-sm border border-white/[0.06]'
                    }`}>
                      {entry.text}
                    </div>
                  </motion.div>
                ))}

                {/* Loading */}
                {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
                  <div className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-gold/10 border border-gold/15 overflow-hidden flex-shrink-0">
                      <Image src="/images/acheevy/acheevy-helmet.png" alt="" width={28} height={28} className="w-full h-full object-cover animate-pulse" />
                    </div>
                    <div className="px-3 py-2.5 bg-white/[0.03] rounded-2xl rounded-tl-sm border border-white/[0.06] flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-gold/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <div className="w-1.5 h-1.5 bg-gold/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <div className="w-1.5 h-1.5 bg-gold/40 rounded-full animate-bounce" />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* ── Voice Session Panel ── */}
            <AnimatePresence>
              {voiceActive && (
                <div className="flex-shrink-0 px-4">
                  <VoiceSessionPanel conversation={conversation} active={voiceActive} onEnd={endVoiceSession} />
                </div>
              )}
            </AnimatePresence>

            {/* ── Input Area ── */}
            <div className="flex-shrink-0 border-t border-white/[0.06] bg-[#0A0A0A]/90 backdrop-blur-xl px-4 py-3">
              <div className="max-w-2xl mx-auto w-full">
                {/* File previews */}
                {files.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {files.map((f, i) => (
                      <div key={`${f.name}-${i}`} className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-white/[0.06] bg-white/[0.02] text-[10px] text-white/50">
                        <Paperclip className="w-2.5 h-2.5 text-gold/40" />
                        <span className="max-w-[100px] truncate">{f.name}</span>
                        <button onClick={() => setFiles(p => p.filter((_, j) => j !== i))} className="text-white/20 hover:text-red-400"><X className="w-2.5 h-2.5" /></button>
                      </div>
                    ))}
                  </div>
                )}

                <form id="chat-form" onSubmit={handleEnhancedSubmit}>
                  <div className="flex items-end gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-2.5 focus-within:border-gold/20 transition-colors">
                    {/* File attach */}
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="p-2 rounded-xl bg-white/[0.03] text-white/30 hover:text-gold/60 hover:bg-gold/[0.06] transition-all flex-shrink-0"
                    >
                      <Paperclip className="w-4 h-4" />
                    </button>
                    <input
                      ref={fileRef}
                      type="file"
                      multiple
                      accept="image/*,.pdf,.txt,.csv,.json,.md,.doc,.docx"
                      onChange={(e) => {
                        const f = Array.from(e.target.files || []);
                        if (f.length) setFiles(p => [...p, ...f].slice(0, 5));
                        if (fileRef.current) fileRef.current.value = '';
                      }}
                      className="hidden"
                    />

                    {/* Text input */}
                    <textarea
                      ref={textareaRef}
                      value={input}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      placeholder={voiceActive ? 'Voice session active...' : 'Message ACHEEVY...'}
                      disabled={isLoading || voiceActive}
                      rows={1}
                      className="flex-1 bg-transparent text-white/90 placeholder:text-white/15 resize-none outline-none text-sm leading-relaxed max-h-[140px] py-1.5 min-w-0"
                    />

                    {/* TTS toggle */}
                    <button
                      type="button"
                      onClick={() => { isSpeaking ? stopSpeaking() : setTtsEnabled(!ttsEnabled); }}
                      className={`p-2 rounded-xl transition-all flex-shrink-0 ${
                        isSpeaking ? 'bg-gold/15 text-gold animate-pulse'
                          : ttsEnabled ? 'bg-gold/[0.06] text-gold/60' : 'bg-white/[0.03] text-white/20'
                      }`}
                      title={ttsEnabled ? (isSpeaking ? 'Stop' : 'TTS On') : 'Enable TTS'}
                    >
                      {ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    </button>

                    {/* Send / Stop */}
                    {isLoading ? (
                      <button type="button" onClick={stop} className="p-2 rounded-xl bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors flex-shrink-0">
                        <Square className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={!input.trim() || voiceActive}
                        className={`p-2 rounded-xl transition-all flex-shrink-0 ${
                          input.trim() && !voiceActive
                            ? 'bg-gold text-black hover:bg-[#F6C453]'
                            : 'bg-white/[0.04] text-white/20 cursor-not-allowed'
                        }`}
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </form>

              </div>
            </div>
          </main>
        </div>
      </div>
    </LogoWallBackground>
  );
}
