'use client';

/**
 * AcheevyChat — Chat w/ACHEEVY Production Interface
 *
 * Features:
 * - Voice recording with live waveform + clear state indicators
 * - Editable transcription before submission
 * - Per-message TTS playback controls (play, pause, replay, mute)
 * - PMO classification routing
 * - File attachments
 */

import React from 'react';
import { useChat } from 'ai/react';
import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import {
  Send, Zap, Sparkles, Hammer, Search, Layers, Square,
  Mic, MicOff, Volume2, VolumeX, Paperclip, X, FileText, ImageIcon, Code2, Loader2,
  Play, Pause,
} from 'lucide-react';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { useVoiceOutput } from '@/hooks/useVoiceOutput';
import { createReadReceipt, advanceReceipt, classifyIntent } from '@/lib/acheevy/read-receipt';
import type { ReadReceipt } from '@/lib/acheevy/read-receipt';
import AcheevyMessage from './AcheevyMessage';

// ── Types ──

interface PmoClassification {
  pmoOffice: string;
  officeLabel: string;
  director: string;
  confidence: number;
  executionLane: 'deploy_it' | 'guide_me';
}

interface UploadedFile {
  id: string;
  name: string;
  type: string;
  category: string;
  size: number;
  url: string;
  uploadedAt: string;
}

// ── Constants ──

const INTENT_OPTIONS = [
  { value: 'CHAT', label: 'Chat', icon: Sparkles, desc: 'Ask anything' },
  { value: 'BUILD_PLUG', label: 'Build', icon: Hammer, desc: 'Create a tool' },
  { value: 'RESEARCH', label: 'Research', icon: Search, desc: 'Market intel' },
  { value: 'AGENTIC_WORKFLOW', label: 'Workflow', icon: Layers, desc: 'Multi-step pipeline' },
];

const TEAM_SLOTS = [
  { id: 'engineer', name: 'Engineer', color: 'emerald' },
  { id: 'marketer', name: 'Marketer', color: 'blue' },
  { id: 'analyst', name: 'Analyst', color: 'violet' },
  { id: 'quality', name: 'Quality', color: 'amber' },
  { id: 'executor', name: 'Executor', color: 'red' },
];

const FILE_CATEGORY_ICON: Record<string, typeof FileText> = {
  document: FileText,
  image: ImageIcon,
  code: Code2,
  spreadsheet: FileText,
  archive: FileText,
};

// ── Helpers ──

function stripMarkdownForTTS(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, '')
    .replace(/[#*_`~\[\]()>|]/g, '')
    .replace(/\n{2,}/g, '. ')
    .replace(/\n/g, ' ')
    .trim();
}

// ── Waveform Visualizer ──

function VoiceWaveform({ audioLevel, state }: { audioLevel: number; state: 'idle' | 'listening' | 'processing' | 'error' }) {
  const bars = 32;

  if (state === 'processing') {
    return (
      <div className="flex items-center justify-center gap-1 h-12 px-4">
        <div className="flex items-center gap-1.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="w-1.5 h-6 bg-gold/60 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.1}s`, animationDuration: '0.8s' }}
            />
          ))}
        </div>
        <span className="ml-3 text-xs text-gold/80 font-mono uppercase tracking-wider animate-pulse">
          Transcribing
        </span>
      </div>
    );
  }

  if (state !== 'listening') return null;

  return (
    <div className="flex items-end justify-center gap-[2px] h-12 px-4">
      {Array.from({ length: bars }).map((_, i) => {
        const position = Math.sin((i / bars) * Math.PI);
        const height = Math.max(
          3,
          audioLevel * 48 * position * (0.7 + Math.random() * 0.3)
        );
        return (
          <div
            key={i}
            className="w-1 rounded-full transition-all duration-75"
            style={{
              height: `${height}px`,
              backgroundColor: `rgba(212, 175, 55, ${0.4 + audioLevel * 0.6})`,
            }}
          />
        );
      })}
    </div>
  );
}

// ── Playback Progress Bar ──

function PlaybackBar({ progress, isPlaying }: { progress: number; isPlaying: boolean }) {
  if (!isPlaying && progress === 0) return null;
  return (
    <div className="w-full h-0.5 bg-white/5 rounded-full overflow-hidden">
      <div
        className="h-full bg-gold/60 rounded-full transition-all duration-200"
        style={{ width: `${progress * 100}%` }}
      />
    </div>
  );
}

export default function AcheevyChat() {
  const {
    messages,
    input,
    setInput,
    handleInputChange,
    handleSubmit,
    isLoading,
    stop,
  } = useChat({
    api: '/api/chat',
    initialMessages: [
      {
        id: 'welcome',
        role: 'assistant',
        content: "Greetings. I am ACHEEVY — your AI executive orchestrator.\n\nTell me what you need — my team will classify, route, execute, and deliver.\n\n**How it works:**\n- 🧠 **Classify** — I detect your intent\n- 🔀 **Route** — I assign the right team\n- ⚡ **Execute** — The pipeline runs\n- ✅ **Deliver** — Verified results, with proof",
      }
    ]
  });

  // ── Voice Input (Groq Whisper STT → Deepgram fallback) ──
  const voiceInput = useVoiceInput({
    onTranscript: (result) => {
      if (result.text) {
        // Populate text field — user can edit before submitting
        setInput((prev: string) => prev ? `${prev} ${result.text}` : result.text);
      }
    },
  });

  // ── Voice Output (ElevenLabs → Deepgram TTS) ──
  const voiceOutput = useVoiceOutput({
    config: { provider: 'elevenlabs', autoPlay: true },
  });

  // ── State ──
  const [pmo, setPmo] = useState<PmoClassification | null>(null);
  const [intent, setIntent] = useState('CHAT');
  const [showIntentPicker, setShowIntentPicker] = useState(false);
  const [attachments, setAttachments] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [readReceipts, setReadReceipts] = useState<Map<string, ReadReceipt>>(new Map());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prevMessageCountRef = useRef(0);

  // ── Auto-scroll ──
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Auto-TTS + Read Receipt: on new assistant messages ──
  useEffect(() => {
    if (isLoading) return;
    if (messages.length <= prevMessageCountRef.current) {
      prevMessageCountRef.current = messages.length;
      return;
    }
    prevMessageCountRef.current = messages.length;

    const last = messages[messages.length - 1];
    if (last?.role === 'assistant' && last.id !== 'welcome') {
      // Auto-TTS
      if (voiceOutput.autoPlayEnabled) {
        const clean = stripMarkdownForTTS(last.content);
        if (clean.length > 0 && clean.length <= 5000) {
          setSpeakingMessageId(last.id);
          voiceOutput.speak(clean);
        }
      }

      // Generate Read Receipt for this response
      // Find the preceding user message to classify intent
      const msgIndex = messages.findIndex(m => m.id === last.id);
      const precedingUser = messages.slice(0, msgIndex).reverse().find(m => m.role === 'user');
      if (precedingUser) {
        const intentCat = classifyIntent(precedingUser.content);
        let receipt = createReadReceipt(precedingUser.content, intentCat);
        receipt = advanceReceipt(receipt, 'classifying', 'Intent classified');
        receipt = advanceReceipt(receipt, 'routing', 'Routed to agent');
        receipt = advanceReceipt(receipt, 'in_progress', 'Processing');
        receipt = advanceReceipt(receipt, 'delivered', 'Response delivered');
        setReadReceipts(prev => new Map(prev).set(last.id, receipt));
      }
    }
  }, [isLoading, messages, voiceOutput]);

  // Track when speaking ends
  useEffect(() => {
    if (!voiceOutput.isPlaying && !voiceOutput.isLoading) {
      setSpeakingMessageId(null);
    }
  }, [voiceOutput.isPlaying, voiceOutput.isLoading]);

  // ── Stable Voice Controls ──
  const voiceOutputRef = useRef(voiceOutput);
  useEffect(() => {
    voiceOutputRef.current = voiceOutput;
  });

  const handleSpeak = useCallback((id: string, content: string) => {
    const clean = stripMarkdownForTTS(content);
    if (clean.length > 0 && clean.length <= 5000) {
      setSpeakingMessageId(id);
      voiceOutputRef.current.speak(clean, true);
    }
  }, []);

  const handlePause = useCallback(() => {
    voiceOutputRef.current.pause();
  }, []);

  const handleReplay = useCallback((id: string, content: string) => {
    handleSpeak(id, content);
  }, [handleSpeak]);

  const togglePlayback = useCallback(() => {
    if (voiceOutput.isPlaying) {
      voiceOutput.pause();
    } else if (voiceOutput.isPaused) {
      voiceOutput.resume();
    }
  }, [voiceOutput]);

  // ── Classify on submit ──
  const classifyMessage = useCallback(async (message: string) => {
    try {
      const res = await fetch('/api/chat/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      if (res.ok) setPmo(await res.json());
    } catch { /* non-critical */ }
  }, []);

  // ── Enhanced submit ──
  const handleEnhancedSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if ((!input.trim() && attachments.length === 0) || isLoading) return;

    let fullMessage = input.trim();
    if (attachments.length > 0) {
      const fileList = attachments.map(f => `${f.name} (${f.category})`).join(', ');
      fullMessage = `[Attached files: ${fileList}]\n${fullMessage}`;
    }

    classifyMessage(fullMessage);

    if (attachments.length > 0) {
      setInput(fullMessage);
      setTimeout(() => {
        handleSubmit(e);
        setAttachments([]);
      }, 10);
    } else {
      handleSubmit(e);
    }
  }, [input, isLoading, classifyMessage, handleSubmit, attachments, setInput]);

  // ── Mic toggle ──
  const handleMicToggle = useCallback(async () => {
    if (voiceInput.isListening) {
      await voiceInput.stopListening();
    } else {
      voiceOutput.stop();
      await voiceInput.startListening();
    }
  }, [voiceInput, voiceOutput]);

  // ── File upload ──
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach(f => formData.append('files', f));

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setAttachments(prev => [...prev, ...data.files]);
      }
    } catch (err) {
      console.error('[AcheevyChat] Upload failed:', err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, []);

  const removeAttachment = useCallback((id: string) => {
    setAttachments(prev => prev.filter(f => f.id !== id));
  }, []);

  const selectedIntent = INTENT_OPTIONS.find(i => i.value === intent) || INTENT_OPTIONS[0];

  // Voice state for UI
  const voiceState = voiceInput.isListening ? 'listening' : voiceInput.isProcessing ? 'processing' : 'idle';

  return (
    <div className="flex flex-col h-full relative overflow-hidden bg-[#0A0A0A] text-white font-sans">
      {/* Branded background */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(ellipse at center, rgba(212,175,55,0.03) 0%, transparent 70%),
            url(/images/acheevy/acheevy-helmet.png)
          `,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center center',
          backgroundSize: 'auto, 200px 200px',
          opacity: 0.04,
        }}
      />
      <div className="absolute inset-0 z-0 pointer-events-none aims-page-bg" />

      {/* Header */}
      <div className="relative z-10 border-b border-wireframe-stroke bg-[#0A0A0A]/80 backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="w-8 h-8 rounded-lg bg-white/5 border border-gold/20 flex items-center justify-center overflow-hidden">
                <Image
                  src="/images/acheevy/acheevy-helmet.png"
                  alt="ACHEEVY"
                  width={24}
                  height={24}
                  className="object-contain"
                />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full border border-black animate-pulse" />
            </div>
            <div>
              <h2 className="font-medium text-base text-white">Chat w/ACHEEVY</h2>
              <div className="flex items-center gap-1 text-[10px] text-emerald-400/80 font-mono uppercase tracking-widest">
                <Zap className="w-2.5 h-2.5" /> Online
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Speaker toggle */}
            <button
              type="button"
              onClick={() => voiceOutput.setAutoPlay(!voiceOutput.autoPlayEnabled)}
              title={voiceOutput.autoPlayEnabled ? 'Mute auto-speak' : 'Enable auto-speak'}
              className={`p-1.5 rounded-lg transition-colors ${
                voiceOutput.autoPlayEnabled
                  ? 'text-gold bg-gold/10'
                  : 'text-white/30 hover:text-white/60'
              }`}
            >
              {voiceOutput.autoPlayEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
            </button>

            {/* Intent selector */}
            <div className="relative">
              <button
                onClick={() => setShowIntentPicker(!showIntentPicker)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-wireframe-stroke hover:border-gold/30 transition-all text-xs"
              >
                <selectedIntent.icon className="w-3.5 h-3.5 text-gold" />
                <span className="text-white/80">{selectedIntent.label}</span>
              </button>
              {showIntentPicker && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-[#0A0A0A]/95 border border-wireframe-stroke rounded-xl p-1.5 backdrop-blur-xl shadow-2xl z-50">
                  {INTENT_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => { setIntent(opt.value); setShowIntentPicker(false); }}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all text-xs ${
                        intent === opt.value ? 'bg-gold/10 border border-gold/20' : 'hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      <opt.icon className={`w-3.5 h-3.5 ${intent === opt.value ? 'text-gold' : 'text-white/40'}`} />
                      <div>
                        <div className={`font-medium ${intent === opt.value ? 'text-gold' : 'text-white/80'}`}>{opt.label}</div>
                        <div className="text-[9px] text-white/30 font-mono">{opt.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Team shelf */}
        <div className="px-4 pb-2 flex gap-1.5 overflow-x-auto no-scrollbar">
          {TEAM_SLOTS.map(slot => (
            <div key={slot.id} className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border transition-colors cursor-default ${
              pmo?.director?.toLowerCase().includes(slot.id) ? 'border-gold/20 bg-gold/5' : 'border-wireframe-stroke bg-white/[0.02]'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${
                pmo?.director?.toLowerCase().includes(slot.id) ? 'bg-gold animate-pulse' : 'bg-white/20'
              }`} />
              <span className="text-[9px] font-mono text-white/50 uppercase tracking-wider">{slot.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* PMO routing pill */}
      {pmo && (
        <div className="relative z-10 mx-3 mt-2 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gold/5 border border-gold/10 text-[10px]">
          <span className="text-gold font-medium">{pmo.officeLabel}</span>
          <span className={`ml-auto px-1.5 py-0.5 rounded-full font-mono uppercase ${
            pmo.executionLane === 'deploy_it' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'
          }`}>{pmo.executionLane === 'deploy_it' ? 'DEPLOY' : 'GUIDE'}</span>
        </div>
      )}

      {/* Global playback bar */}
      {(voiceOutput.isPlaying || voiceOutput.isPaused) && (
        <div className="relative z-10 mx-3 mt-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-gold/5 border border-gold/15">
          <button
            type="button"
            onClick={togglePlayback}
            className="p-1 rounded-md bg-gold/10 text-gold hover:bg-gold/20 transition-colors"
          >
            {voiceOutput.isPlaying ? <Pause size={12} /> : <Play size={12} />}
          </button>
          <div className="flex-1">
            <PlaybackBar progress={voiceOutput.progress} isPlaying={voiceOutput.isPlaying} />
          </div>
          <button
            type="button"
            onClick={() => voiceOutput.stop()}
            className="p-1 rounded-md text-white/30 hover:text-red-400 transition-colors"
          >
            <X size={12} />
          </button>
          <span className="text-[9px] text-gold/60 font-mono uppercase">
            {voiceOutput.isPlaying ? 'Speaking' : 'Paused'}
          </span>
        </div>
      )}

      {/* Messages */}
      <div className="relative z-10 flex-1 overflow-y-auto px-4 py-4 space-y-4 scroll-smooth">
        {messages.map((m, i) => (
          <AcheevyMessage
            key={m.id}
            message={m}
            isSpeaking={speakingMessageId === m.id && voiceOutput.isPlaying}
            isLoading={isLoading}
            isLast={i === messages.length - 1}
            readReceipt={readReceipts.get(m.id)}
            onSpeak={handleSpeak}
            onPause={handlePause}
            onReplay={handleReplay}
          />
        ))}
        {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-lg bg-white/5 border border-gold/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
              <Image
                src="/images/acheevy/acheevy-helmet.png"
                alt="ACHEEVY"
                width={20}
                height={20}
                className="object-contain animate-pulse"
              />
            </div>
            <div className="flex flex-col gap-2">
              {/* Action Chain — visible pipeline during processing */}
              <div className="px-4 py-3 wireframe-card rounded-2xl rounded-tl-sm">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-mono text-gold/60 uppercase tracking-widest">Processing Pipeline</span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { label: 'Classify', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', delay: '0s' },
                    { label: 'Route', color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', delay: '0.3s' },
                    { label: 'Execute', color: 'text-gold', bg: 'bg-gold/10', border: 'border-gold/20', delay: '0.6s' },
                    { label: 'Deliver', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', delay: '0.9s' },
                  ].map((step, i) => (
                    <div key={step.label} className="flex items-center gap-1.5">
                      {i > 0 && <div className="w-3 h-px bg-white/10" />}
                      <span
                        className={`text-[10px] font-mono ${step.color} px-2 py-0.5 rounded-md ${step.bg} border ${step.border} animate-pulse`}
                        style={{ animationDelay: step.delay }}
                      >
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Typing indicator */}
              <div className="px-4 py-3 wireframe-card rounded-2xl rounded-tl-sm flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-gold/50 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <div className="w-1.5 h-1.5 bg-gold/50 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="w-1.5 h-1.5 bg-gold/50 rounded-full animate-bounce" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Attachment preview bar */}
      {attachments.length > 0 && (
        <div className="relative z-10 px-3 pt-2 flex gap-2 flex-wrap">
          {attachments.map(file => {
            const Icon = FILE_CATEGORY_ICON[file.category] || FileText;
            return (
              <div
                key={file.id}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 border border-wireframe-stroke text-xs"
              >
                <Icon className="w-3 h-3 text-gold/60" />
                <span className="text-white/70 max-w-[120px] truncate">{file.name}</span>
                <button
                  type="button"
                  onClick={() => removeAttachment(file.id)}
                  className="p-0.5 rounded text-white/30 hover:text-red-400 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Voice recording panel — waveform + state indicators */}
      {(voiceState === 'listening' || voiceState === 'processing') && (
        <div className="relative z-10 mx-3 mt-2 rounded-xl overflow-hidden border border-gold/20 bg-black/60 backdrop-blur-md">
          {/* State label */}
          <div className="flex items-center justify-between px-4 pt-3">
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${
                voiceState === 'listening' ? 'bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]' : 'bg-gold animate-pulse'
              }`} />
              <span className={`text-xs font-mono uppercase tracking-wider ${
                voiceState === 'listening' ? 'text-red-400' : 'text-gold'
              }`}>
                {voiceState === 'listening' ? 'Recording' : 'Processing'}
              </span>
            </div>
            {voiceState === 'listening' && (
              <button
                type="button"
                onClick={() => voiceInput.cancelListening()}
                className="text-[10px] text-white/30 hover:text-red-400 font-mono uppercase transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
          {/* Waveform */}
          <VoiceWaveform audioLevel={voiceInput.audioLevel} state={voiceState} />
        </div>
      )}

      {/* Input */}
      <div className="relative z-20 p-3 bg-[#0A0A0A]/80 backdrop-blur-xl border-t border-wireframe-stroke">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.txt,.csv,.png,.jpg,.jpeg,.json,.yaml,.yml,.ts,.tsx,.js,.jsx,.py,.go,.rs,.md"
          onChange={handleFileUpload}
          className="hidden"
        />

        <form onSubmit={handleEnhancedSubmit} className="relative flex items-center gap-2">
          {/* Attachment button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            title="Attach files"
            className="p-2 rounded-lg text-white/30 hover:text-gold hover:bg-gold/10 transition-all disabled:opacity-30"
          >
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
          </button>

          {/* Mic button — enhanced with state ring */}
          <button
            type="button"
            onClick={handleMicToggle}
            disabled={voiceInput.isProcessing}
            title={voiceInput.isListening ? 'Stop recording' : 'Start voice input'}
            className={`relative p-2 rounded-lg transition-all ${
              voiceInput.isListening
                ? 'bg-red-500/20 text-red-400 ring-2 ring-red-500/40 shadow-[0_0_12px_rgba(239,68,68,0.3)]'
                : voiceInput.isProcessing
                ? 'bg-gold/20 text-gold animate-pulse'
                : 'text-white/30 hover:text-gold hover:bg-gold/10'
            } disabled:opacity-30`}
          >
            {voiceInput.isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            {voiceInput.isListening && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500 animate-ping" />
            )}
          </button>

          {/* Text input */}
          <input
            value={input}
            onChange={handleInputChange}
            placeholder={voiceInput.isProcessing ? 'Transcribing your voice...' : 'Tell me what you need...'}
            disabled={isLoading}
            className="flex-1 bg-white/5 hover:bg-white/10 focus:bg-black border border-wireframe-stroke focus:border-gold/40 rounded-xl py-3 pl-4 pr-12 text-white text-base placeholder:text-white/20 transition-all outline-none"
          />

          {/* Send / Stop button */}
          {isLoading ? (
            <button
              type="button"
              onClick={stop}
              className="absolute right-2 top-1.5 p-2 bg-red-500/10 text-red-400 rounded-lg transition-all hover:bg-red-500/20"
            >
              <Square className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim() && attachments.length === 0}
              className="absolute right-2 top-1.5 p-2 bg-gold/10 hover:bg-gold text-gold hover:text-black rounded-lg transition-all disabled:opacity-30"
            >
              <Send className="w-4 h-4" />
            </button>
          )}
        </form>
        <div className="flex items-center justify-center gap-1.5 mt-2">
          <Image
            src="/images/logos/achievemor-gold.png"
            alt="A.I.M.S."
            width={12}
            height={12}
            className="opacity-30"
          />
          <p className="text-[9px] font-mono text-white/15 uppercase tracking-[0.2em]">
            A.I.M.S. v2.0 &bull; {intent} Mode
          </p>
        </div>
      </div>
    </div>
  );
}
