'use client';

/**
 * Chat w/ACHEEVY — Command Center
 *
 * Built with Vercel AI SDK (useChat) + n8n PMO pipeline visualization.
 * Streams AI responses via Google Gemini while showing real-time
 * Chain of Command routing (PMO Office → Boomer_Ang Director → Chicken Hawk).
 *
 * Features:
 * - Conversation threads sidebar (collapsible, localStorage persistence)
 * - Action feedback status bar below agent shelf
 * - Toggleable "Activity breeds Activity" MottoBar
 */

import { useChat } from 'ai/react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Image from 'next/image';
import {
  Send, Square, User, Copy, Check,
  Trophy, Search, Hammer, Layers, Container, Wand2,
  Building2, DollarSign, Activity, Megaphone, Palette, BookOpen,
  PanelLeftClose, PanelLeftOpen, Plus, MessageSquare, Trash2, Flame,
  Mic, MicOff, Volume2, Loader2,
} from 'lucide-react';
import { SiteHeader } from '@/components/SiteHeader';
import { LogoWallBackground } from '@/components/LogoWallBackground';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface PmoClassification {
  pmoOffice: string;
  officeLabel: string;
  director: string;
  confidence: number;
  keywords: string[];
  executionLane: 'deploy_it' | 'guide_me';
  complexity: number;
}

interface Thread {
  id: string;
  title: string;
  createdAt: number;
  lastMessage?: string;
}

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

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

const ACHEEVY_VERBS = ['Deploy', 'Build', 'Create', 'Launch', 'Ship', 'Forge', 'Craft', 'Execute'] as const;

const QUICK_INTENTS = [
  { label: 'Launch Perform', icon: Trophy, prompt: 'Launch the Perform Stack and analyze the latest athlete data' },
  { label: 'Build a Plug', icon: Hammer, prompt: 'I want to build a new plug for my workflow' },
  { label: 'Deep Research', icon: Search, prompt: 'Run deep research on the latest AI agent frameworks' },
  { label: 'Deploy Tool', icon: Container, prompt: 'Deploy my latest build to the VPS production environment' },
  { label: 'Create Workflow', icon: Layers, prompt: 'Create a multi-step n8n automation workflow' },
  { label: 'Browse Skills', icon: Wand2, prompt: 'Show me the available ACHEEVY skills and capabilities' },
] as const;

const PMO_OFFICE_ICONS: Record<string, typeof Building2> = {
  'tech-office': Container,
  'finance-office': DollarSign,
  'ops-office': Activity,
  'marketing-office': Megaphone,
  'design-office': Palette,
  'publishing-office': BookOpen,
};

const BOOMER_ANGS = [
  { id: 'cto', name: 'Boomer_CTO', office: 'tech-office', color: 'emerald' },
  { id: 'cfo', name: 'Boomer_CFO', office: 'finance-office', color: 'blue' },
  { id: 'coo', name: 'Boomer_COO', office: 'ops-office', color: 'violet' },
  { id: 'cmo', name: 'Boomer_CMO', office: 'marketing-office', color: 'pink' },
  { id: 'cdo', name: 'Boomer_CDO', office: 'design-office', color: 'orange' },
  { id: 'cpo', name: 'Boomer_CPO', office: 'publishing-office', color: 'cyan' },
  { id: 'hawk', name: 'Chicken Hawk', office: 'dispatch', color: 'red' },
] as const;

// Status chip labels (owner can toggle back to corporate in Circuit Box)
const STATUS_LABELS: Record<string, string> = {
  active: "Maintainin'",
  idle: "Chillin'",
  building: "Buildin'",
  error: 'Stay Loose',
};

const THREADS_STORAGE_KEY = 'aims_chat_threads';
const SIDEBAR_STORAGE_KEY = 'aims_chat_sidebar';
const MOTTOBAR_STORAGE_KEY = 'aims_chat_motto';

// ─────────────────────────────────────────────────────────────
// Thread Helpers
// ─────────────────────────────────────────────────────────────

function loadThreads(): Thread[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(THREADS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveThreads(threads: Thread[]) {
  try { localStorage.setItem(THREADS_STORAGE_KEY, JSON.stringify(threads)); } catch {}
}

// ─────────────────────────────────────────────────────────────
// Voice Recording Hook
// ─────────────────────────────────────────────────────────────

function useVoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [audioLevels, setAudioLevels] = useState<number[]>(new Array(20).fill(0));
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>(0);
  const chunksRef = useRef<Blob[]>([]);
  const speechRecRef = useRef<any>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Set up audio analyzer for visualization
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      // Animate audio levels
      const updateLevels = () => {
        if (!analyserRef.current) return;
        const data = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(data);
        const levels = Array.from(data.slice(0, 20)).map(v => v / 255);
        setAudioLevels(levels);
        animFrameRef.current = requestAnimationFrame(updateLevels);
      };
      updateLevels();

      // Start browser SpeechRecognition for live interim transcription
      setInterimTranscript('');
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognition.onresult = (event: any) => {
          let interim = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            interim += event.results[i][0].transcript;
          }
          setInterimTranscript(interim);
        };
        recognition.onerror = () => { /* ignore — Groq Whisper is the final source */ };
        recognition.start();
        speechRecRef.current = recognition;
      }

      // Start recording
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('[Voice] Mic access denied:', err);
    }
  }, []);

  const stopRecording = useCallback(async (): Promise<string> => {
    // Stop browser speech recognition
    if (speechRecRef.current) {
      try { speechRecRef.current.stop(); } catch {}
      speechRecRef.current = null;
    }

    return new Promise((resolve) => {
      if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
        resolve('');
        return;
      }

      mediaRecorderRef.current.onstop = async () => {
        // Clean up audio context
        cancelAnimationFrame(animFrameRef.current);
        audioContextRef.current?.close();
        setAudioLevels(new Array(20).fill(0));
        setIsRecording(false);
        setIsTranscribing(true);

        // Stop all tracks
        mediaRecorderRef.current?.stream.getTracks().forEach(t => t.stop());

        // Transcribe via Groq Whisper for final quality result
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const formData = new FormData();
        formData.append('audio', blob, 'recording.webm');

        try {
          const res = await fetch('/api/voice/stt', { method: 'POST', body: formData });
          if (res.ok) {
            const data = await res.json();
            setIsTranscribing(false);
            setInterimTranscript('');
            resolve(data.text || '');
          } else {
            setIsTranscribing(false);
            setInterimTranscript('');
            resolve('');
          }
        } catch {
          setIsTranscribing(false);
          setInterimTranscript('');
          resolve('');
        }
      };

      mediaRecorderRef.current.stop();
    });
  }, []);

  return { isRecording, isTranscribing, interimTranscript, audioLevels, startRecording, stopRecording };
}

// ─────────────────────────────────────────────────────────────
// Audio Waveform Visualization
// ─────────────────────────────────────────────────────────────

function AudioWaveform({ levels, isActive }: { levels: number[]; isActive: boolean }) {
  if (!isActive) return null;

  return (
    <div className="flex items-center gap-[2px] h-6">
      {levels.map((level, i) => (
        <motion.div
          key={i}
          animate={{ height: Math.max(3, level * 24) }}
          transition={{ duration: 0.05 }}
          className="w-[3px] rounded-full bg-gold"
          style={{ opacity: 0.4 + level * 0.6 }}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// TTS Playback Hook
// ─────────────────────────────────────────────────────────────

function useTtsPlayback() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const speak = useCallback(async (text: string) => {
    if (!ttsEnabled || !text) return;

    try {
      setIsSpeaking(true);
      const res = await fetch('/api/voice/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.slice(0, 2000) }),
      });

      if (res.ok && res.body) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        if (audioRef.current) {
          audioRef.current.pause();
          URL.revokeObjectURL(audioRef.current.src);
        }
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onended = () => { setIsSpeaking(false); URL.revokeObjectURL(url); };
        audio.onerror = () => { setIsSpeaking(false); URL.revokeObjectURL(url); };
        await audio.play();
      } else {
        setIsSpeaking(false);
      }
    } catch {
      setIsSpeaking(false);
    }
  }, [ttsEnabled]);

  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

  return { isSpeaking, ttsEnabled, setTtsEnabled, speak, stopSpeaking };
}

// ─────────────────────────────────────────────────────────────
// PMO Pipeline Status Bar
// ─────────────────────────────────────────────────────────────

function PipelineStatus({ classification }: { classification: PmoClassification | null }) {
  if (!classification) return null;

  const OfficeIcon = PMO_OFFICE_ICONS[classification.pmoOffice] || Building2;
  const isDeployLane = classification.executionLane === 'deploy_it';

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="mx-4 mb-2"
    >
      <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-gold/5 border border-gold/10">
        {/* Office */}
        <div className="flex items-center gap-2">
          <OfficeIcon className="w-4 h-4 text-gold" />
          <span className="text-xs font-medium text-gold">{classification.officeLabel}</span>
        </div>

        <div className="w-px h-4 bg-wireframe-stroke" />

        {/* Director */}
        <span className="text-xs font-mono text-white/60">{classification.director}</span>

        <div className="w-px h-4 bg-wireframe-stroke" />

        {/* Lane */}
        <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full ${
          isDeployLane
            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
        }`}>
          {isDeployLane ? 'DEPLOY IT' : 'GUIDE ME'}
        </span>

        {/* Confidence */}
        <div className="ml-auto flex items-center gap-2">
          <div className="w-16 h-1.5 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full rounded-full bg-gold transition-all"
              style={{ width: `${classification.confidence * 100}%` }}
            />
          </div>
          <span className="text-[10px] text-white/40 font-mono">{Math.round(classification.confidence * 100)}%</span>
        </div>

        {/* Complexity */}
        <span className="text-[10px] text-white/40 font-mono">C:{classification.complexity}</span>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// Action Feedback Status Bar
// ─────────────────────────────────────────────────────────────

function ActionFeedback({ classification, isLoading }: { classification: PmoClassification | null; isLoading: boolean }) {
  if (!isLoading && !classification) return null;

  return (
    <div className="mx-4 mb-2">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-wireframe-stroke bg-white/[0.02]">
        {isLoading ? (
          <>
            <div className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
            <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider">
              Processing request{classification ? ` via ${classification.director}` : ''}...
            </span>
          </>
        ) : classification ? (
          <>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider">
              Routed to {classification.officeLabel} &bull; {classification.executionLane === 'deploy_it' ? 'Auto-deploy' : 'Guided'} lane
            </span>
          </>
        ) : null}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MottoBar
// ─────────────────────────────────────────────────────────────

function MottoBar({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="border-t border-wireframe-stroke bg-gold/[0.03]"
        >
          <div className="flex items-center justify-center gap-3 py-2 px-4">
            <Flame className="w-3 h-3 text-gold/50" />
            <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-gold/40">
              Activity breeds Activity
            </span>
            <Flame className="w-3 h-3 text-gold/50" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────────────────────
// Threads Sidebar
// ─────────────────────────────────────────────────────────────

function ThreadsSidebar({
  threads,
  activeThreadId,
  onSelect,
  onNew,
  onDelete,
  open,
  onToggle,
}: {
  threads: Thread[];
  activeThreadId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 260, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="flex-shrink-0 overflow-hidden border-r border-wireframe-stroke bg-[#0A0A0A]/60"
        >
          <div className="flex flex-col h-full w-[260px]">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-wireframe-stroke">
              <span className="text-[0.6rem] uppercase tracking-[0.2em] text-white/40 font-mono">
                Threads
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={onNew}
                  className="p-1.5 rounded-lg text-white/40 hover:text-gold hover:bg-white/5 transition-colors"
                  title="New thread"
                >
                  <Plus size={14} />
                </button>
                <button
                  onClick={onToggle}
                  className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors"
                  title="Close sidebar"
                >
                  <PanelLeftClose size={14} />
                </button>
              </div>
            </div>

            {/* Thread list */}
            <div className="flex-1 overflow-y-auto py-2 space-y-0.5">
              {threads.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <MessageSquare className="w-6 h-6 text-white/10 mx-auto mb-2" />
                  <p className="text-[10px] text-white/20 font-mono">No threads yet</p>
                </div>
              ) : (
                threads.map(thread => (
                  <div
                    key={thread.id}
                    className={`group flex items-center gap-2 mx-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all ${
                      activeThreadId === thread.id
                        ? 'bg-gold/10 border border-gold/20'
                        : 'border border-transparent hover:bg-white/5'
                    }`}
                    onClick={() => onSelect(thread.id)}
                  >
                    <MessageSquare size={12} className={activeThreadId === thread.id ? 'text-gold' : 'text-white/30'} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs truncate ${activeThreadId === thread.id ? 'text-gold' : 'text-white/60'}`}>
                        {thread.title}
                      </p>
                      {thread.lastMessage && (
                        <p className="text-[9px] text-white/20 truncate font-mono mt-0.5">
                          {thread.lastMessage}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDelete(thread.id); }}
                      className="p-1 rounded opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 transition-all"
                      title="Delete thread"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────────────────────
// Message Bubble
// ─────────────────────────────────────────────────────────────

function MessageBubble({ role, content, isStreaming }: {
  role: string;
  content: string;
  isStreaming?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const isUser = role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      {/* Avatar */}
      <div className="flex-shrink-0 mt-1">
        {isUser ? (
          <div className="w-8 h-8 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center">
            <User className="w-4 h-4 text-gold" />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full overflow-hidden bg-gold/10 border border-gold/20">
            <Image
              src="/images/acheevy/acheevy-helmet.png"
              alt="ACHEEVY"
              width={32}
              height={32}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div className={`flex-1 max-w-[85%] ${isUser ? 'text-right' : ''}`}>
        <div
          className={`inline-block rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? 'bg-gold/10 text-white rounded-tr-sm border border-gold/20'
              : 'wireframe-card text-white/90 rounded-tl-sm'
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{content}</p>
          ) : (
            <div className="prose prose-invert prose-sm max-w-none prose-headings:text-white prose-a:text-gold prose-strong:text-white prose-code:text-gold prose-code:bg-black/40 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ className, children, ...props }) {
                    const isInline = !className;
                    if (isInline) {
                      return (
                        <code className="bg-black/40 px-1.5 py-0.5 rounded text-gold text-[13px]" {...props}>
                          {children}
                        </code>
                      );
                    }
                    return (
                      <pre className="bg-black/60 rounded-lg p-4 overflow-x-auto border border-wireframe-stroke my-3">
                        <code className={`${className} text-[13px]`} {...props}>
                          {children}
                        </code>
                      </pre>
                    );
                  },
                }}
              >
                {content}
              </ReactMarkdown>
              {isStreaming && (
                <span className="inline-block w-2 h-5 bg-gold ml-1 animate-pulse" />
              )}
            </div>
          )}
        </div>

        {/* Copy button for assistant messages */}
        {!isUser && !isStreaming && content && (
          <div className="mt-1 opacity-0 hover:opacity-100 transition-opacity inline-flex">
            <button
              onClick={handleCopy}
              className="p-1 rounded hover:bg-white/10 text-white/30 hover:text-gold transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}
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
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    stop,
    setInput,
  } = useChat({
    api: '/api/chat',
    body: { model: selectedModel },
  });

  const [pmoClassification, setPmoClassification] = useState<PmoClassification | null>(null);
  const [activeDirector, setActiveDirector] = useState<string | null>(null);
  const [currentVerb, setCurrentVerb] = useState('Deploy');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const prefillHandled = useRef(false);

  // Voice I/O
  const { isRecording, isTranscribing, interimTranscript, audioLevels, startRecording, stopRecording } = useVoiceRecorder();
  const { isSpeaking, ttsEnabled, setTtsEnabled, speak, stopSpeaking } = useTtsPlayback();
  const lastAssistantRef = useRef<string>('');

  // Threads
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mottoVisible, setMottoVisible] = useState(true);

  // Pre-fill from ?q= query param (from FloatingACHEEVY launcher)
  useEffect(() => {
    const prefill = searchParams.get('q');
    if (prefill && !prefillHandled.current) {
      prefillHandled.current = true;
      setInput(prefill);
      // Auto-submit after a brief delay to let the component mount
      setTimeout(() => {
        const form = document.getElementById('chat-form') as HTMLFormElement;
        form?.requestSubmit();
      }, 100);
    }
  }, [searchParams, setInput]);

  // Load persisted state
  useEffect(() => {
    setThreads(loadThreads());
    try {
      const savedSidebar = localStorage.getItem(SIDEBAR_STORAGE_KEY);
      if (savedSidebar === 'true') setSidebarOpen(true);
      const savedMotto = localStorage.getItem(MOTTOBAR_STORAGE_KEY);
      if (savedMotto === 'false') setMottoVisible(false);
    } catch {}
    setCurrentVerb(ACHEEVY_VERBS[Math.floor(Math.random() * ACHEEVY_VERBS.length)]);
  }, []);

  // Persist sidebar state
  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => {
      const next = !prev;
      try { localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next)); } catch {}
      return next;
    });
  }, []);

  // Persist motto state
  const toggleMotto = useCallback(() => {
    setMottoVisible(prev => {
      const next = !prev;
      try { localStorage.setItem(MOTTOBAR_STORAGE_KEY, String(next)); } catch {}
      return next;
    });
  }, []);

  // Thread management
  const createThread = useCallback(() => {
    const thread: Thread = {
      id: `t_${Date.now()}`,
      title: `Thread ${threads.length + 1}`,
      createdAt: Date.now(),
    };
    const updated = [thread, ...threads];
    setThreads(updated);
    saveThreads(updated);
    setActiveThreadId(thread.id);
  }, [threads]);

  const deleteThread = useCallback((id: string) => {
    const updated = threads.filter(t => t.id !== id);
    setThreads(updated);
    saveThreads(updated);
    if (activeThreadId === id) setActiveThreadId(null);
  }, [threads, activeThreadId]);

  const selectThread = useCallback((id: string) => {
    setActiveThreadId(id);
  }, []);

  // Update thread title from first user message
  useEffect(() => {
    if (activeThreadId && messages.length > 0) {
      const firstUserMsg = messages.find(m => m.role === 'user');
      if (firstUserMsg) {
        setThreads(prev => {
          const updated = prev.map(t =>
            t.id === activeThreadId
              ? { ...t, title: firstUserMsg.content.slice(0, 40), lastMessage: messages[messages.length - 1].content.slice(0, 60) }
              : t
          );
          saveThreads(updated);
          return updated;
        });
      }
    }
  }, [messages, activeThreadId]);

  // Auto-scroll
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

  // PMO Classification
  const classifyMessage = useCallback(async (message: string) => {
    try {
      const res = await fetch('/api/chat/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      if (res.ok) {
        const data = await res.json();
        setPmoClassification(data);
        setActiveDirector(data.director);
      }
    } catch {
      // Classification is non-critical
    }
  }, []);

  const handleEnhancedSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    classifyMessage(input.trim());
    handleSubmit(e);
  }, [input, isLoading, classifyMessage, handleSubmit]);

  const handleQuickIntent = useCallback((prompt: string) => {
    setInput(prompt);
    classifyMessage(prompt);
    setTimeout(() => {
      const form = document.getElementById('chat-form') as HTMLFormElement;
      form?.requestSubmit();
    }, 50);
  }, [setInput, classifyMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const form = document.getElementById('chat-form') as HTMLFormElement;
      form?.requestSubmit();
    }
  };

  // Voice recording toggle
  const handleVoiceToggle = useCallback(async () => {
    if (isRecording) {
      const text = await stopRecording();
      if (text) {
        // Put transcribed text into input for user to review/edit before sending
        setInput(text);
        textareaRef.current?.focus();
      }
    } else {
      startRecording();
    }
  }, [isRecording, stopRecording, startRecording, setInput]);

  // Auto-play TTS when assistant finishes responding
  useEffect(() => {
    if (!isLoading && messages.length > 0) {
      const last = messages[messages.length - 1];
      if (last.role === 'assistant' && last.content && last.content !== lastAssistantRef.current) {
        lastAssistantRef.current = last.content;
        speak(last.content);
      }
    }
  }, [isLoading, messages, speak]);

  return (
    <LogoWallBackground mode="dashboard">
    <div className="h-full flex flex-col overflow-hidden">
      <SiteHeader />

      <div className="flex-1 flex overflow-hidden">
        {/* ── Threads Sidebar ── */}
        <ThreadsSidebar
          threads={threads}
          activeThreadId={activeThreadId}
          onSelect={selectThread}
          onNew={createThread}
          onDelete={deleteThread}
          open={sidebarOpen}
          onToggle={toggleSidebar}
        />

        {/* ── Main Chat Area ── */}
        <main className="flex-1 flex flex-col min-w-0">
          {/* ── Header Bar ── */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-wireframe-stroke bg-[#0A0A0A]/80 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              {/* Sidebar toggle */}
              {!sidebarOpen && (
                <button
                  onClick={toggleSidebar}
                  className="p-2 rounded-lg text-white/40 hover:text-gold hover:bg-white/5 transition-colors"
                  title="Open threads"
                >
                  <PanelLeftOpen size={18} />
                </button>
              )}

              <div className="relative">
                <div className="w-11 h-11 rounded-xl bg-white/5 border border-gold/20 overflow-hidden flex items-center justify-center">
                  <Image
                    src="/images/acheevy/acheevy-helmet.png"
                    alt="ACHEEVY"
                    width={44}
                    height={44}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#0A0A0A] animate-pulse" />
              </div>
              <div>
                <h1 className="font-bold text-lg text-white tracking-tight">Chat w/ACHEEVY</h1>
                <p className="text-[11px] text-gold/50 font-mono">Think It. Prompt It. Let ACHEEVY {currentVerb} it!</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Model Switcher */}
              <div className="flex items-center gap-1.5 bg-white/5 rounded-lg px-2.5 py-1.5 border border-wireframe-stroke hover:border-gold/20 transition-colors">
                <svg className="w-3.5 h-3.5 text-gold/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="4" r="2" /><circle cx="4" cy="12" r="2" /><circle cx="20" cy="12" r="2" /><circle cx="12" cy="20" r="2" />
                  <path d="M12 6v4m0 4v4M6 12h4m4 0h4" />
                </svg>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="bg-transparent border-none outline-none text-white/70 text-xs cursor-pointer appearance-none pr-3 font-mono"
                  title="Select AI Model"
                >
                  {AI_MODELS.map(m => (
                    <option key={m.key} value={m.key} className="bg-[#0A0A0A]">
                      {m.label}{'tag' in m ? ` (${m.tag})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* MottoBar toggle */}
              <button
                onClick={toggleMotto}
                className={`p-2 rounded-lg transition-colors ${
                  mottoVisible ? 'text-gold bg-gold/10' : 'text-white/30 hover:text-white/50'
                }`}
                title={mottoVisible ? 'Hide motto' : 'Show motto'}
              >
                <Flame size={16} />
              </button>

              {/* Agent Shelf */}
              <div className="hidden lg:flex items-center gap-1.5">
                {BOOMER_ANGS.map(agent => (
                  <div
                    key={agent.id}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all cursor-default ${
                      activeDirector === agent.name
                        ? 'border-gold/30 bg-gold/10'
                        : 'border-wireframe-stroke bg-white/[0.02] hover:bg-white/5'
                    }`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      activeDirector === agent.name ? 'bg-gold animate-pulse' : 'bg-white/20'
                    }`} />
                    <span className="text-[10px] font-mono text-white/50 uppercase tracking-wider">
                      {agent.name.replace('Boomer_', '')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Action Feedback ── */}
          <ActionFeedback classification={pmoClassification} isLoading={isLoading} />

          {/* ── PMO Pipeline Status ── */}
          <AnimatePresence>
            {pmoClassification && <PipelineStatus classification={pmoClassification} />}
          </AnimatePresence>

          {/* ── Chat Messages ── */}
          <div className="flex-1 overflow-y-auto px-4 py-6 scroll-smooth">
            <div className="max-w-3xl mx-auto space-y-6">
              {/* Welcome State */}
              {messages.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-16"
                >
                  <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gold/10 border border-gold/20 overflow-hidden">
                    <Image
                      src="/images/acheevy/acheevy-helmet.png"
                      alt="ACHEEVY"
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Chat w/ACHEEVY</h2>
                  <p className="text-white/50 max-w-lg mx-auto leading-relaxed mb-10">
                    I&apos;m ACHEEVY, at your service.<br />
                    What will we deploy today?
                  </p>

                  {/* Quick Intents */}
                  <div className="flex flex-wrap gap-2 justify-center max-w-xl mx-auto">
                    {QUICK_INTENTS.map(chip => (
                      <button
                        key={chip.label}
                        onClick={() => handleQuickIntent(chip.prompt)}
                        disabled={isLoading}
                        className="inline-flex items-center gap-2 wireframe-card px-4 py-2.5 text-sm text-white/60 hover:bg-gold/10 hover:border-gold/20 hover:text-gold transition-all disabled:opacity-50"
                      >
                        <chip.icon className="w-4 h-4" />
                        {chip.label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Messages */}
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

              {/* Loading indicator */}
              {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-3"
                >
                  <div className="w-8 h-8 rounded-full bg-gold/10 border border-gold/20 overflow-hidden flex-shrink-0">
                    <Image
                      src="/images/acheevy/acheevy-helmet.png"
                      alt="ACHEEVY"
                      width={32}
                      height={32}
                      className="w-full h-full object-cover animate-pulse"
                    />
                  </div>
                  <div className="px-4 py-3 wireframe-card rounded-2xl rounded-tl-sm flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-gold/50 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-1.5 h-1.5 bg-gold/50 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-1.5 h-1.5 bg-gold/50 rounded-full animate-bounce" />
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* ── MottoBar ── */}
          <MottoBar visible={mottoVisible} />

          {/* ── Input Area ── */}
          <div className="border-t border-wireframe-stroke bg-[#0A0A0A]/80 backdrop-blur-xl px-4 py-4">
            <div className="max-w-3xl mx-auto">
              {/* Recording indicator with waveform */}
              <AnimatePresence>
                {(isRecording || isTranscribing) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-3"
                  >
                    <div className="flex flex-col gap-2 px-4 py-2.5 rounded-xl border border-gold/20 bg-gold/5">
                      {isRecording && (
                        <>
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            <span className="text-xs text-white/60 font-mono">Recording...</span>
                            <AudioWaveform levels={audioLevels} isActive={isRecording} />
                            <button
                              onClick={handleVoiceToggle}
                              className="ml-auto px-3 py-1 rounded-lg bg-gold/20 text-gold text-xs hover:bg-gold/30 transition-colors"
                            >
                              Stop & Transcribe
                            </button>
                          </div>
                          {interimTranscript && (
                            <p className="text-xs text-white/40 italic pl-5 truncate">
                              {interimTranscript}
                            </p>
                          )}
                        </>
                      )}
                      {isTranscribing && (
                        <div className="flex items-center gap-3">
                          <Loader2 className="w-4 h-4 text-gold animate-spin" />
                          <span className="text-xs text-white/60 font-mono">Transcribing audio...</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <form id="chat-form" onSubmit={handleEnhancedSubmit}>
                <div className="relative flex items-end gap-2 wireframe-card rounded-2xl p-3 focus-within:border-gold/30 transition-colors">
                  {/* Mic button */}
                  <button
                    type="button"
                    onClick={handleVoiceToggle}
                    disabled={isLoading || isTranscribing}
                    title={isRecording ? 'Stop recording' : 'Voice input'}
                    className={`p-3 rounded-xl transition-all flex-shrink-0 ${
                      isRecording
                        ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 animate-pulse'
                        : 'bg-white/5 text-white/40 hover:text-gold hover:bg-gold/10'
                    } disabled:opacity-40`}
                  >
                    {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>

                  {/* Textarea */}
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder={isRecording ? 'Recording... click Stop to transcribe' : 'Message ACHEEVY...'}
                    disabled={isLoading || isRecording}
                    rows={1}
                    className="flex-1 bg-transparent text-white placeholder:text-white/20 resize-none outline-none text-[15px] leading-relaxed max-h-[160px] py-2 px-2"
                  />

                  {/* TTS toggle */}
                  <button
                    type="button"
                    onClick={() => {
                      if (isSpeaking) stopSpeaking();
                      else setTtsEnabled(!ttsEnabled);
                    }}
                    title={ttsEnabled ? (isSpeaking ? 'Stop speaking' : 'Voice output ON') : 'Enable voice output'}
                    className={`p-3 rounded-xl transition-all flex-shrink-0 ${
                      isSpeaking
                        ? 'bg-gold/20 text-gold animate-pulse'
                        : ttsEnabled
                        ? 'bg-gold/10 text-gold'
                        : 'bg-white/5 text-white/30 hover:text-white/50'
                    }`}
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>

                  {/* Send / Stop */}
                  {isLoading ? (
                    <button
                      type="button"
                      onClick={stop}
                      title="Stop generation"
                      className="p-3 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors flex-shrink-0"
                    >
                      <Square className="w-5 h-5" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={!input.trim() || isRecording}
                      title="Send message"
                      className={`p-3 rounded-xl transition-all flex-shrink-0 ${
                        input.trim() && !isRecording
                          ? 'bg-gold text-black hover:bg-gold-light'
                          : 'bg-white/5 text-white/30 cursor-not-allowed'
                      }`}
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </form>

              <p className="text-center text-[10px] font-mono text-white/15 uppercase tracking-[0.2em] mt-3">
                A.I.M.S. Neural Link v2.0 &bull; Vercel AI SDK &bull; Chain of Command Active
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
    </LogoWallBackground>
  );
}
