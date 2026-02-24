'use client';

/**
 * Chat w/ACHEEVY — Next-Level Command Center
 *
 * Full Nano Banana Pro UI (Obsidian & Gold)
 * Glassmorphic Panels, Dark Mode Default
 * Integrated Vercel AI SDK & ElevenLabs Voice
 */

import { useChat } from 'ai/react';
import { useState, useRef, useEffect, useCallback, Suspense } from 'react';
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
import { TTS_VOICES } from '@/lib/voice';
import { sanitizeForTTS } from '@/lib/voice/sanitize';

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const ELEVENLABS_AGENT_ID = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID || '';

const AI_MODELS = [
  { key: 'claude-opus', label: 'Claude Opus 4.6' },
  { key: 'claude-sonnet', label: 'Claude Sonnet 4.6' },
  { key: 'qwen', label: 'Qwen 2.5 Coder 32B', tag: 'code' },
  { key: 'qwen-max', label: 'Qwen Max' },
  { key: 'minimax', label: 'MiniMax-01' },
  { key: 'glm', label: 'GLM-5' },
  { key: 'kimi', label: 'Kimi K2.5', tag: 'fast' },
  { key: 'nano-banana', label: 'Nano Banana Pro', tag: 'fast' },
  { key: 'gemini-pro', label: 'Gemini 2.5 Pro' },
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
  try { localStorage.setItem(THREADS_KEY, JSON.stringify(t)); } catch { }
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
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg border border-[rgba(255,255,255,0.1)] bg-[#111111] hover:border-[#D4AF37]/50 text-[11px] text-[rgba(255,255,255,0.6)] font-mono transition-colors"
      >
        <Volume2 className="w-3 h-3 text-[#D4AF37]/50" />
        <span>{cur?.name || 'Voice'}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 w-52 max-h-64 overflow-y-auto rounded-xl border border-[rgba(255,255,255,0.1)] bg-[#111111]/95 backdrop-blur-xl shadow-2xl">
            {(['elevenlabs', 'deepgram'] as const).map(prov => (
              <div key={prov}>
                <div className="px-3 py-1.5 border-b border-[rgba(255,255,255,0.1)]">
                  <span className="text-[9px] text-[rgba(255,255,255,0.4)] font-mono uppercase tracking-wider">{prov}</span>
                </div>
                {TTS_VOICES.filter(v => v.provider === prov).map(v => (
                  <button
                    key={v.id}
                    onClick={() => { onSelect(v.id, v.provider); setOpen(false); }}
                    className={`w-full text-left px-3 py-1.5 text-[11px] hover:bg-[rgba(255,255,255,0.05)] flex justify-between ${voiceId === v.id ? 'text-[#D4AF37] bg-[rgba(212,175,55,0.1)]' : 'text-white'
                      }`}
                  >
                    <span>{v.name}</span>
                    <span className="text-[rgba(255,255,255,0.4)]">{v.style}</span>
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
          <div className="w-8 h-8 rounded-full bg-[rgba(212,175,55,0.1)] border border-[rgba(212,175,55,0.3)] flex items-center justify-center">
            <User className="w-4 h-4 text-[#D4AF37]" />
          </div>
        ) : (
          <div className="relative w-8 h-8 rounded-full overflow-hidden bg-[rgba(212,175,55,0.1)] border border-[rgba(212,175,55,0.3)] shadow-[0_0_10px_rgba(212,175,55,0.2)]">
            <Image src="/images/acheevy/acheevy-helmet.png" alt="ACHEEVY" width={32} height={32} className="w-full h-full object-cover" />
            {isStreaming && (
              <div className="absolute inset-0 rounded-full border-2 border-[#D4AF37]/50 animate-ping" />
            )}
          </div>
        )}
      </div>

      {/* Bubble */}
      <div className={`min-w-0 max-w-[85%] ${isUser ? 'ml-auto' : ''}`}>
        <div className={`px-4 py-3 text-sm leading-relaxed break-words overflow-hidden ${isUser
          ? 'bg-[rgba(212,175,55,0.15)] text-white rounded-2xl rounded-tr-sm border border-[rgba(212,175,55,0.3)]'
          : 'bg-[#111111]/80 backdrop-blur-md text-[rgba(255,255,255,0.9)] rounded-2xl rounded-tl-sm border border-[rgba(255,255,255,0.08)] shadow-[0_4px_16px_rgba(0,0,0,0.5)]'
          }`}>
          {isUser ? (
            <p className="whitespace-pre-wrap break-words">{content}</p>
          ) : (
            <div className="prose prose-invert prose-sm max-w-none break-words
              prose-headings:text-white prose-a:text-[#D4AF37] prose-strong:text-white
              prose-code:text-[#D4AF37] prose-code:bg-[rgba(255,255,255,0.05)] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
              prose-pre:max-w-full prose-pre:overflow-x-auto prose-p:my-1.5 prose-headings:my-2
              prose-pre:bg-[#0A0A0A] prose-pre:border prose-pre:border-[rgba(255,255,255,0.1)]">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ className, children, ...props }) {
                    if (!className) {
                      return <code className="bg-[rgba(255,255,255,0.05)] px-1.5 py-0.5 rounded text-[#D4AF37] text-[13px] font-mono" {...props}>{children}</code>;
                    }
                    return (
                      <pre className="bg-[#0A0A0A] rounded-xl p-4 overflow-x-auto border border-[rgba(255,255,255,0.1)] my-3 max-w-full shadow-inner">
                        <code className={`${className} text-[13px] font-mono`} {...props}>{children}</code>
                      </pre>
                    );
                  },
                }}
              >
                {content}
              </ReactMarkdown>
              {isStreaming && <span className="inline-block w-1.5 h-4 bg-[#D4AF37] ml-1 animate-pulse rounded-sm" />}
            </div>
          )}
        </div>

        {/* Copy */}
        {!isUser && !isStreaming && content && (
          <button
            onClick={() => { navigator.clipboard.writeText(content); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            className="mt-1 flex items-center gap-1.5 px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 hover:opacity-100 text-[10px] uppercase font-bold tracking-wider text-[rgba(255,255,255,0.4)] hover:text-[#D4AF37] hover:bg-[rgba(212,175,55,0.1)] transition-all"
          >
            {copied ? <Check className="w-3 h-3 text-[#10B981]" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copied' : 'Copy'}
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
      animate={{ width: 260, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="flex-shrink-0 overflow-hidden border-r border-[rgba(255,255,255,0.08)] bg-[#0A0A0A]/95 backdrop-blur-xl z-20"
    >
      <div className="flex flex-col h-full w-[260px]">
        <div className="flex items-center justify-between px-4 py-4 border-b border-[rgba(255,255,255,0.08)]">
          <span className="text-[10px] uppercase tracking-[0.2em] text-[rgba(255,255,255,0.4)] font-mono font-bold">Encrypted Threads</span>
          <div className="flex gap-2">
            <button onClick={onNew} className="p-1.5 rounded-md bg-[rgba(255,255,255,0.05)] text-[rgba(255,255,255,0.6)] hover:bg-[rgba(212,175,55,0.1)] hover:text-[#D4AF37] transition-colors"><Plus size={14} /></button>
            <button onClick={onToggle} className="p-1.5 rounded-md bg-[rgba(255,255,255,0.05)] text-[rgba(255,255,255,0.6)] hover:bg-[rgba(255,255,255,0.1)] hover:text-white transition-colors"><PanelLeftClose size={14} /></button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-2 space-y-1">
          {threads.length === 0 ? (
            <div className="px-4 py-10 text-center flex flex-col items-center">
              <div className="w-12 h-12 rounded-full border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.02)] flex items-center justify-center mb-3">
                <MessageSquare className="w-5 h-5 text-[rgba(255,255,255,0.2)]" />
              </div>
              <p className="text-xs text-[rgba(255,255,255,0.3)] font-mono uppercase tracking-widest">No Active Links</p>
            </div>
          ) : threads.map(t => (
            <div
              key={t.id}
              onClick={() => onSelect(t.id)}
              className={`group flex items-center gap-3 mx-2 px-3 py-3 rounded-xl cursor-pointer transition-all ${activeId === t.id
                ? 'bg-[rgba(212,175,55,0.1)] border border-[rgba(212,175,55,0.3)] shadow-[inset_2px_0_0_#D4AF37]'
                : 'border border-transparent hover:bg-[rgba(255,255,255,0.03)]'
                }`}
            >
              <MessageSquare size={14} className={activeId === t.id ? 'text-[#D4AF37]' : 'text-[rgba(255,255,255,0.3)]'} />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${activeId === t.id ? 'text-white' : 'text-[rgba(255,255,255,0.6)] group-hover:text-white transition-colors'}`}>{t.title}</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(t.id); }}
                className="p-1 rounded-md opacity-0 group-hover:opacity-100 text-[rgba(255,255,255,0.3)] hover:text-red-400 hover:bg-red-400/10 transition-all"
              ><Trash2 size={12} /></button>
            </div>
          ))}
        </div>
      </div>
    </motion.aside>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Chat Page
// ─────────────────────────────────────────────────────────────

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-dvh bg-[#0A0A0A]"><Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" /></div>}>
      <ChatContent />
    </Suspense>
  );
}

function ChatContent() {
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

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(VOICE_SETTINGS_KEY) || '{}');
      if (saved.voiceId) setTtsVoiceId(saved.voiceId);
      if (saved.provider) setTtsProvider(saved.provider);
      if (saved.enabled === false) setTtsEnabled(false);
    } catch { /* ignore */ }
  }, []);

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

  const [files, setFiles] = useState<File[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setThreads(loadThreads());
    try { if (localStorage.getItem(SIDEBAR_KEY) === 'true') setSidebarOpen(true); } catch { /* ignore */ }
  }, []);

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, voiceTranscript]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }
  }, [input]);

  useEffect(() => {
    if (!isLoading && messages.length > 0) {
      const last = messages[messages.length - 1];
      if (last.role === 'assistant' && last.content && last.content !== lastAssistantRef.current) {
        lastAssistantRef.current = last.content;
        speakText(last.content);
      }
    }
  }, [isLoading, messages, speakText]);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen(p => { const n = !p; try { localStorage.setItem(SIDEBAR_KEY, String(n)); } catch { /* ignore */ } return n; });
  }, []);

  const createThread = useCallback(() => {
    const t: Thread = { id: `t_${Date.now()}`, title: `Terminal Session ${threads.length + 1}`, createdAt: Date.now() };
    const updated = [t, ...threads];
    setThreads(updated); saveThreads(updated); setActiveThreadId(t.id);
  }, [threads]);

  const deleteThread = useCallback((id: string) => {
    const updated = threads.filter(t => t.id !== id);
    setThreads(updated); saveThreads(updated);
    if (activeThreadId === id) setActiveThreadId(null);
  }, [threads, activeThreadId]);

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

  return (
    <div className="h-dvh w-full flex flex-col overflow-hidden bg-[#0A0A0A] text-white selection:bg-[#D4AF37]/30">
      {/* Global dark matrix ambient overlay */}
      <div className="fixed inset-0 bg-[url('/assets/noise.png')] opacity-[0.03] pointer-events-none z-[999]" />
      <div className="fixed inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px] pointer-events-none z-[998]" />

      <SiteHeader />

      <div className="flex-1 flex overflow-hidden min-h-0 relative z-10">
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

        <main className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden relative">

          {/* ACHEEVY Watermark Background inside the chat terminal */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none mix-blend-screen scale-125 md:scale-150">
            <Image src="/images/acheevy/acheevy-helmet.png" alt="" width={800} height={800} className="object-contain" />
          </div>

          {/* Top Panel Matrix */}
          <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-[rgba(255,255,255,0.08)] bg-[#111111]/90 backdrop-blur-xl z-20 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
            <div className="flex items-center gap-4 min-w-0">
              {!sidebarOpen && (
                <button onClick={toggleSidebar} className="p-1.5 rounded-lg bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-[rgba(255,255,255,0.6)] hover:bg-[rgba(212,175,55,0.1)] hover:text-[#D4AF37] hover:border-[#D4AF37]/30 transition-all shadow-md">
                  <PanelLeftOpen size={16} />
                </button>
              )}
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 rounded-xl bg-[rgba(212,175,55,0.1)] border border-[rgba(212,175,55,0.3)] flex items-center justify-center overflow-hidden shadow-[0_0_15px_rgba(212,175,55,0.2)]">
                  <Image src="/images/acheevy/acheevy-helmet.png" alt="ACHEEVY" width={40} height={40} className="w-full h-full object-cover" />
                </div>
                <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-[#111111] ${voiceActive ? 'bg-[#D4AF37] animate-pulse shadow-[0_0_10px_#D4AF37]' : 'bg-[#10B981] shadow-[0_0_10px_#10B981]'
                  }`} />
              </div>
              <div className="min-w-0">
                <h1 className="font-black text-lg text-white tracking-widest uppercase flex items-center gap-2">ACHEEVY <span className="text-[10px] bg-[rgba(255,255,255,0.1)] px-2 py-0.5 rounded-sm border border-[rgba(255,255,255,0.1)] text-[rgba(255,255,255,0.5)]">V.3.1.PRO</span></h1>
                <p className="text-xs text-[#D4AF37] font-mono uppercase tracking-[0.2em] opacity-80">
                  {voiceActive ? '>> SECURE AUDIO ENCLAVE <<' : '>> TEXT TERMINAL ONLINE <<'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="bg-[#0A0A0A] border border-[rgba(255,255,255,0.1)] rounded-lg px-3 py-2 text-xs text-[rgba(255,255,255,0.8)] font-mono outline-none cursor-pointer focus:border-[#D4AF37]/50 appearance-none shadow-inner"
              >
                {AI_MODELS.map(m => (
                  <option key={m.key} value={m.key} className="bg-[#0A0A0A] text-white">
                    [{m.key}] {m.label}
                  </option>
                ))}
              </select>

              <VoiceSelector
                voiceId={ttsVoiceId}
                provider={ttsProvider}
                onSelect={(id, p) => { setTtsVoiceId(id); setTtsProvider(p); }}
              />

              {hasAgent && (
                <button
                  onClick={voiceActive ? endVoiceSession : startVoiceSession}
                  className={`px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg ${voiceActive
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.3)]'
                    : 'bg-[#D4AF37] text-[#0A0A0A] hover:bg-amber-400 shadow-[0_0_15px_rgba(212,175,55,0.3)] hover:scale-105'
                    }`}
                >
                  {voiceActive ? <><PhoneOff size={14} /> Kill Link</> : <><Mic size={14} /> Initialize Audio</>}
                </button>
              )}
            </div>
          </div>

          {/* Chat Feed */}
          <div className="flex-1 overflow-y-auto scroll-smooth min-h-0 relative z-10 px-4 md:px-8 py-8">
            <div className="max-w-4xl mx-auto flex flex-col gap-6">

              {messages.length === 0 && !voiceActive && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-20"
                >
                  <div className="relative w-24 h-24 mb-6">
                    <div className="absolute inset-0 rounded-2xl bg-[rgba(212,175,55,0.05)] border border-[#D4AF37]/20 overflow-hidden shadow-[0_0_40px_rgba(212,175,55,0.15)] backdrop-blur-3xl transform rotate-3">
                      <Image src="/images/acheevy/acheevy-helmet.png" alt="ACHEEVY" width={96} height={96} className="w-full h-full object-cover scale-110" />
                    </div>
                  </div>
                  <h2 className="text-2xl font-black text-white tracking-widest mb-3" style={{ textShadow: "0 0 20px rgba(212,175,55,0.4)" }}>Chat w/ACHEEVY</h2>
                  <p className="text-[rgba(255,255,255,0.5)] text-sm text-center max-w-sm font-mono uppercase tracking-wider leading-relaxed">
                    What will we deploy today?
                  </p>
                </motion.div>
              )}

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

              {voiceActive && voiceTranscript.map((entry, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${entry.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`px-4 py-3 text-sm break-words max-w-[85%] border shadow-lg ${entry.role === 'user'
                    ? 'bg-[rgba(212,175,55,0.15)] text-white rounded-2xl rounded-tr-sm border-[rgba(212,175,55,0.3)]'
                    : 'bg-[#111111]/90 text-[rgba(255,255,255,0.9)] rounded-2xl rounded-tl-sm border-[rgba(255,255,255,0.1)] backdrop-blur-md'
                    }`}>
                    {entry.text}
                  </div>
                </motion.div>
              ))}

              {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
                <div className="flex gap-4 items-start">
                  <div className="w-8 h-8 rounded-full bg-[rgba(212,175,55,0.1)] border border-[#D4AF37]/30 overflow-hidden flex-shrink-0 animate-pulse">
                    <Image src="/images/acheevy/acheevy-helmet.png" alt="" width={32} height={32} className="w-full h-full object-cover" />
                  </div>
                  <div className="px-4 py-3 bg-[#111111]/80 rounded-2xl rounded-tl-sm border border-[rgba(255,255,255,0.08)] flex items-center gap-2 shadow-lg backdrop-blur-md">
                    <div className="w-2 h-2 bg-[#D4AF37] opacity-80 rounded-sm animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-2 h-2 bg-[#D4AF37] opacity-80 rounded-sm animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-2 h-2 bg-[#D4AF37] opacity-80 rounded-sm animate-bounce" />
                    <span className="text-[10px] font-mono text-[rgba(255,255,255,0.4)] ml-2 uppercase tracking-wide">Processing...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} className="h-4" />
            </div>
          </div>

          {/* Voice Session Graphic Panel */}
          <AnimatePresence>
            {voiceActive && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="w-full max-w-4xl mx-auto mb-4 px-4"
              >
                <div className="rounded-2xl border border-[#D4AF37]/30 bg-[#111111]/90 backdrop-blur-xl p-6 shadow-[0_0_40px_rgba(212,175,55,0.15)] relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37] opacity-5 blur-[100px] rounded-full pointer-events-none" />

                  <div className="flex items-center justify-between mb-4 relative z-10">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${conversation.status === 'connected' ? 'bg-[#10B981] animate-pulse shadow-[0_0_15px_#10B981]' : 'bg-[#F59E0B] animate-pulse shadow-[0_0_15px_#F59E0B]'}`} />
                      <span className="text-[11px] font-mono text-white font-bold uppercase tracking-widest">
                        {conversation.status === 'connected' ? (conversation.isSpeaking ? 'ACHEEVY TRANSMITTING' : 'ACHEEVY LISTENING...') : 'ESTABLISHING HANDSHAKE...'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6 relative z-10">
                    <div className="bg-[#0A0A0A] rounded-xl border border-[rgba(255,255,255,0.05)] p-3 shadow-inner">
                      <p className="text-[10px] text-[rgba(255,255,255,0.4)] font-mono uppercase tracking-widest mb-2 flex justify-between">
                        <span>[USER_MIC_INPUT]</span>
                        <span>{conversation.status === 'connected' ? 'ACTIVE' : 'STANDBY'}</span>
                      </p>
                      <FrequencyVisualizer getData={conversation.getInputByteFrequencyData} active={conversation.status === 'connected'} color="#10B981" />
                    </div>
                    <div className="bg-[rgba(212,175,55,0.02)] rounded-xl border border-[#D4AF37]/20 p-3 shadow-inner">
                      <p className="text-[10px] text-[#D4AF37]/60 font-mono uppercase tracking-widest mb-2 flex justify-between">
                        <span>[AGENT_AI_OUTPUT]</span>
                        <span>{conversation.isSpeaking ? 'TX_ON' : 'IDLE'}</span>
                      </p>
                      <FrequencyVisualizer getData={conversation.getOutputByteFrequencyData} active={conversation.isSpeaking} color="#D4AF37" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Secure Chat Input */}
          <div className="flex-shrink-0 bg-[#111111]/95 backdrop-blur-2xl border-t border-[rgba(255,255,255,0.05)] px-4 py-5 z-20">
            <div className="max-w-4xl mx-auto w-full relative group">
              <form id="chat-form" onSubmit={handleEnhancedSubmit} className="relative flex items-end w-full rounded-2xl bg-[#0A0A0A] border border-[rgba(255,255,255,0.1)] focus-within:border-[#D4AF37]/50 focus-within:ring-1 focus-within:ring-[#D4AF37]/50 shadow-[0_4px_25px_rgba(0,0,0,0.5)] transition-all overflow-hidden">

                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Message ACHEEVY..."
                  disabled={isLoading || voiceActive}
                  className="flex-1 max-h-40 min-h-[56px] py-4 pl-5 pr-14 bg-transparent outline-none resize-none text-white text-sm placeholder-[rgba(255,255,255,0.3)] disabled:opacity-50 font-mono"
                  rows={1}
                />

                <div className="absolute right-2 bottom-2 flex items-center gap-1 bg-[#0A0A0A]">
                  {isLoading ? (
                    <button type="button" onClick={stop} className="p-2.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors border border-red-500/30">
                      <Square size={16} fill="currentColor" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={!input.trim() || voiceActive}
                      className="p-2.5 rounded-xl bg-[#D4AF37] text-[#0A0A0A] hover:bg-amber-400 disabled:opacity-20 disabled:bg-[rgba(255,255,255,0.1)] disabled:text-[rgba(255,255,255,0.3)] transition-all font-bold group-focus-within:shadow-[0_0_15px_rgba(212,175,55,0.4)]"
                    >
                      <Send size={16} className={input.trim() ? 'translate-x-[1px] translate-y-[-1px]' : ''} />
                    </button>
                  )}
                </div>
              </form>

              <div className="text-center mt-3 flex justify-center gap-4 text-[10px] font-mono text-[rgba(255,255,255,0.3)] tracking-widest uppercase">
                <span>Shift+Enter to add new line</span>
                <span>Enter to send</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
