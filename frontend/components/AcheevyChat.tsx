'use client';

/**
 * AcheevyChat — Floating Chat Panel Component
 *
 * Compact version of Chat w/ACHEEVY for the FloatingChat overlay.
 * Uses Vercel AI SDK (useChat) with real-time PMO classification,
 * voice I/O (Groq Whisper STT + ElevenLabs TTS), and file upload.
 */

import { useChat } from 'ai/react';
import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  User, Send, Zap, Sparkles, Hammer, Search, Layers, Square,
  Mic, MicOff, Volume2, VolumeX, Paperclip, X, FileText, ImageIcon, Code2, Loader2,
} from 'lucide-react';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { useVoiceOutput } from '@/hooks/useVoiceOutput';

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
        content: "Greetings. I am ACHEEVY — your AI assistant.\n\nTell me what you need, and my team will make it happen.",
      }
    ]
  });

  // ── Voice Input (Groq Whisper STT) ──
  const voiceInput = useVoiceInput({
    onTranscript: (result) => {
      if (result.text) {
        setInput((prev: string) => prev ? `${prev} ${result.text}` : result.text);
      }
    },
  });

  // ── Voice Output (ElevenLabs TTS) ──
  const voiceOutput = useVoiceOutput({
    config: { provider: 'elevenlabs', autoPlay: true },
  });

  // ── State ──
  const [pmo, setPmo] = useState<PmoClassification | null>(null);
  const [intent, setIntent] = useState('CHAT');
  const [showIntentPicker, setShowIntentPicker] = useState(false);
  const [attachments, setAttachments] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prevMessageCountRef = useRef(0);

  // ── Auto-scroll ──
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Auto-TTS: speak new assistant messages when streaming completes ──
  useEffect(() => {
    if (isLoading) return;
    if (messages.length <= prevMessageCountRef.current) {
      prevMessageCountRef.current = messages.length;
      return;
    }
    prevMessageCountRef.current = messages.length;

    const last = messages[messages.length - 1];
    if (last?.role === 'assistant' && last.id !== 'welcome' && voiceOutput.autoPlayEnabled) {
      // Strip markdown for cleaner TTS
      const clean = last.content
        .replace(/```[\s\S]*?```/g, '') // remove code blocks
        .replace(/[#*_`~\[\]()>|]/g, '') // remove markdown chars
        .replace(/\n{2,}/g, '. ')
        .replace(/\n/g, ' ')
        .trim();
      if (clean.length > 0 && clean.length <= 5000) {
        voiceOutput.speak(clean);
      }
    }
  }, [isLoading, messages, voiceOutput]);

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

  // ── Enhanced submit with attachments ──
  const handleEnhancedSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if ((!input.trim() && attachments.length === 0) || isLoading) return;

    // Build message with attachment context
    let fullMessage = input.trim();
    if (attachments.length > 0) {
      const fileList = attachments.map(f => `${f.name} (${f.category})`).join(', ');
      fullMessage = `[Attached files: ${fileList}]\n${fullMessage}`;
    }

    classifyMessage(fullMessage);

    // If we modified the message with attachments, update input before submit
    if (attachments.length > 0) {
      setInput(fullMessage);
      // Small delay to let setInput propagate before submit
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
      voiceOutput.stop(); // stop any playing TTS before recording
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

  return (
    <div className="flex flex-col h-full relative overflow-hidden bg-[#0A0A0A] text-white font-sans">
      {/* Branded background — helmet watermark + gold glow */}
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
      {/* Dot grid overlay */}
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
              <h2 className="font-medium text-sm text-white">Chat w/ACHEEVY</h2>
              <div className="flex items-center gap-1 text-[9px] text-emerald-400/80 font-mono uppercase tracking-widest">
                <Zap className="w-2 h-2" /> Online
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Speaker toggle — auto-TTS on/off */}
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

        {/* Team shelf (sanitized — no internal agent names exposed) */}
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

      {/* Messages */}
      <div className="relative z-10 flex-1 overflow-y-auto px-4 py-4 space-y-4 scroll-smooth">
        {messages.map((m, i) => (
          <div key={m.id} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'assistant' && (
              <div className={`w-7 h-7 rounded-lg bg-white/5 border border-gold/10 flex items-center justify-center flex-shrink-0 mt-0.5 overflow-hidden ${
                voiceOutput.isPlaying && i === messages.length - 1 ? 'ring-2 ring-gold/40 animate-pulse' : ''
              }`}>
                <Image
                  src="/images/acheevy/acheevy-helmet.png"
                  alt="ACHEEVY"
                  width={20}
                  height={20}
                  className="object-contain"
                />
              </div>
            )}
            <div className={`relative px-4 py-3 rounded-2xl text-sm leading-relaxed max-w-[85%] ${
              m.role === 'user'
                ? 'bg-gold/10 text-white rounded-tr-sm border border-gold/20'
                : 'wireframe-card text-white/90 rounded-tl-sm'
            }`}>
              {m.role === 'user' ? (
                m.content
              ) : (
                <div className="prose prose-invert prose-sm max-w-none prose-code:text-gold prose-code:bg-black/40 prose-code:px-1 prose-code:rounded">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                  {isLoading && i === messages.length - 1 && (
                    <span className="inline-block w-1.5 h-4 bg-gold ml-0.5 animate-pulse" />
                  )}
                </div>
              )}
            </div>
            {m.role === 'user' && (
              <div className="w-7 h-7 rounded-lg bg-white/5 border border-wireframe-stroke flex items-center justify-center flex-shrink-0 mt-0.5">
                <User className="w-3.5 h-3.5 text-white/50" />
              </div>
            )}
          </div>
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
            <div className="px-4 py-3 wireframe-card rounded-2xl rounded-tl-sm flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-gold/50 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <div className="w-1.5 h-1.5 bg-gold/50 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <div className="w-1.5 h-1.5 bg-gold/50 rounded-full animate-bounce" />
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

      {/* Voice recording indicator */}
      {(voiceInput.isListening || voiceInput.isProcessing) && (
        <div className="relative z-10 mx-3 mt-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/5 border border-red-500/20">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs text-red-400 font-mono">
            {voiceInput.isListening ? 'Listening...' : 'Transcribing...'}
          </span>
          {voiceInput.isListening && (
            <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-red-500/50 rounded-full transition-all duration-100"
                style={{ width: `${Math.min(voiceInput.audioLevel * 100, 100)}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* Input */}
      <div className="relative z-20 p-3 bg-[#0A0A0A]/80 backdrop-blur-xl border-t border-wireframe-stroke">
        {/* Hidden file input */}
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

          {/* Mic button */}
          <button
            type="button"
            onClick={handleMicToggle}
            disabled={voiceInput.isProcessing}
            title={voiceInput.isListening ? 'Stop recording' : 'Start voice input'}
            className={`p-2 rounded-lg transition-all ${
              voiceInput.isListening
                ? 'bg-red-500/20 text-red-400 ring-2 ring-red-500/30'
                : 'text-white/30 hover:text-gold hover:bg-gold/10'
            } disabled:opacity-30`}
          >
            {voiceInput.isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          {/* Text input */}
          <input
            value={input}
            onChange={handleInputChange}
            placeholder="Tell me what you need..."
            disabled={isLoading}
            className="flex-1 bg-white/5 hover:bg-white/10 focus:bg-black border border-wireframe-stroke focus:border-gold/40 rounded-xl py-3 pl-4 pr-12 text-white text-sm placeholder:text-white/20 transition-all outline-none"
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
            alt="Achievemor"
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
