'use client';

/**
 * AcheevyChatInput — Agentic-UI-powered chat input for ACHEEVY
 *
 * Composes agentic-ui primitives (Button, Badge, AttachmentButton, ToolsButton)
 * with A.I.M.S.-specific controls: voice input, model selector, persona selector,
 * language selector, ElevenLabs voice agent toggle, and orchestration board toggles.
 *
 * The textarea remains controlled (external state) to support voice transcript
 * pre-filling, vertical flow classification, and external input management.
 */

import { useRef, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from 'agentic-ui';
import { Badge } from 'agentic-ui';
import {
  Mic,
  Send,
  Square,
  Phone,
  PhoneOff,
  Globe,
  BrainCircuit,
  Volume2,
  LayoutDashboard,
  Eye,
  Loader2,
} from 'lucide-react';
import { transition, spring } from '@/lib/motion/tokens';
import type { AchievyPersona } from '@/lib/acheevy/persona';

// ─────────────────────────────────────────────────────────────
// Voice Input Sub-components (isolated for perf)
// ─────────────────────────────────────────────────────────────

interface VoicePingProps {
  audioLevel: number;
}

function VoicePing({ audioLevel }: VoicePingProps) {
  return (
    <div
      className="absolute inset-0 rounded-xl border-2 border-red-400 animate-ping"
      style={{ opacity: audioLevel * 0.5 }}
    />
  );
}

function VoiceEqualizer({ audioLevel }: { audioLevel: number }) {
  return (
    <div className="flex gap-0.5 items-end h-4">
      {[0.3, 0.6, 1, 0.7, 0.4].map((scale, i) => (
        <div
          key={i}
          className="w-0.5 bg-red-400/60 rounded-full transition-all duration-75"
          style={{ height: `${Math.max(4, audioLevel * scale * 16)}px` }}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Model & Persona types
// ─────────────────────────────────────────────────────────────

export interface AIModel {
  key: string;
  label: string;
  tag: string;
}

// ─────────────────────────────────────────────────────────────
// Main Component Props
// ─────────────────────────────────────────────────────────────

export interface AcheevyChatInputProps {
  // Core input state (controlled)
  value: string;
  onChange: (value: string) => void;
  onSend: (text?: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  placeholder?: string;
  disabled?: boolean;
  isStreaming?: boolean;
  isLoading?: boolean;

  // Voice input
  voiceInput: {
    isListening: boolean;
    isProcessing: boolean;
    stream: MediaStream | null;
    startListening: () => void;
    stopListening: () => void;
  };
  voiceTranscriptReady?: boolean;
  onClearTranscript?: () => void;
  audioLevel?: number;

  // ElevenLabs voice agent
  hasVoiceAgent?: boolean;
  voiceSessionActive?: boolean;
  voiceAgentStatus?: string;
  voiceAgentSpeaking?: boolean;
  onStartVoiceSession?: () => void;
  onEndVoiceSession?: () => void;

  // Voice output
  isVoicePlaying?: boolean;
  onStopVoice?: () => void;

  // Model / Persona / Language selectors
  models: AIModel[];
  selectedModel: string;
  onModelChange: (model: string) => void;
  personas: AchievyPersona[];
  selectedPersona: string;
  onPersonaChange: (persona: string) => void;
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;

  // Orchestration controls
  showOrchestration?: boolean;
  onOpenBoard?: () => void;
  onOpenCollabFeed?: () => void;

  // Stop / Regenerate
  onStop?: () => void;
  onRegenerate?: () => void;
  hasMessages?: boolean;
}

// ─────────────────────────────────────────────────────────────
// VoiceInputButton (with timer)
// ─────────────────────────────────────────────────────────────

const VoiceInputBtn = memo(function VoiceInputBtn({
  isListening,
  isProcessing,
  audioLevel,
  onStart,
  onStop,
}: {
  isListening: boolean;
  isProcessing: boolean;
  audioLevel: number;
  onStart: () => void;
  onStop: () => void;
}) {
  const [elapsed, setElapsed] = React.useState(0);

  React.useEffect(() => {
    if (!isListening) { setElapsed(0); return; }
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [isListening]);

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={isListening ? onStop : onStart}
        disabled={isProcessing}
        className={`
          relative p-3 rounded-xl transition-all
          ${isListening
            ? 'bg-red-500/20 text-red-400'
            : 'bg-surface text-zinc-500 hover:bg-white/5 hover:text-zinc-300'
          }
          ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        {isListening && <VoicePing audioLevel={audioLevel} />}
        {isProcessing ? (
          <Loader2 className="w-5 h-5 animate-spin text-gold" />
        ) : (
          <Mic className="w-5 h-5" />
        )}
      </button>

      {isListening && (
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs font-mono text-red-400">{fmt(elapsed)}</span>
          <VoiceEqualizer audioLevel={audioLevel} />
        </div>
      )}

      {isProcessing && (
        <span className="text-xs text-gold/60 animate-pulse">Transcribing...</span>
      )}
    </div>
  );
});

// Need React for the sub-component useState/useEffect
import React from 'react';

// ─────────────────────────────────────────────────────────────
// Language options
// ─────────────────────────────────────────────────────────────

const LANGUAGES = [
  { code: 'en', label: 'EN' },
  { code: 'es', label: 'ES' },
  { code: 'fr', label: 'FR' },
  { code: 'de', label: 'DE' },
  { code: 'zh', label: 'ZH' },
  { code: 'ja', label: 'JA' },
] as const;

// ─────────────────────────────────────────────────────────────
// AcheevyChatInput
// ─────────────────────────────────────────────────────────────

export function AcheevyChatInput({
  value,
  onChange,
  onSend,
  onKeyDown,
  placeholder = 'Message ACHEEVY...',
  disabled = false,
  isStreaming = false,
  isLoading = false,
  voiceInput,
  voiceTranscriptReady = false,
  onClearTranscript,
  audioLevel = 0,
  hasVoiceAgent = false,
  voiceSessionActive = false,
  voiceAgentStatus,
  voiceAgentSpeaking = false,
  onStartVoiceSession,
  onEndVoiceSession,
  isVoicePlaying = false,
  onStopVoice,
  models,
  selectedModel,
  onModelChange,
  personas,
  selectedPersona,
  onPersonaChange,
  selectedLanguage,
  onLanguageChange,
  showOrchestration = false,
  onOpenBoard,
  onOpenCollabFeed,
  onStop,
  onRegenerate,
  hasMessages = false,
}: AcheevyChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [value]);

  const canSend = value.trim() && !isStreaming && !isLoading;

  return (
    <div className="aims-agentic border-t border-wireframe-stroke bg-obsidian/90 backdrop-blur-xl px-4 py-4">
      <div className="max-w-3xl mx-auto space-y-3">
        {/* ── Regenerate button ──────────────────────────────── */}
        {hasMessages && !isStreaming && onRegenerate && (
          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={onRegenerate}
              className="text-zinc-500 hover:text-zinc-300 gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
              Regenerate response
            </Button>
          </div>
        )}

        {/* ── Selector Row ──────────────────────────────────── */}
        <div className="flex justify-end gap-2">
          {/* Model Selector */}
          <div className="flex items-center gap-1.5 bg-surface/80 rounded-lg px-2.5 py-1.5 text-xs border border-wireframe-stroke hover:border-white/15 transition-colors">
            <BrainCircuit className="w-3.5 h-3.5 text-zinc-500" />
            <select
              value={selectedModel}
              onChange={(e) => onModelChange(e.target.value)}
              className="bg-transparent border-none outline-none text-zinc-300 text-xs cursor-pointer appearance-none pr-4"
              title="Select AI Model"
            >
              {models.map((m) => (
                <option key={m.key} value={m.key} className="bg-[#18181B]">
                  {m.label}{m.tag ? ` (${m.tag})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Persona Selector — only when multiple */}
          {personas.length > 1 && (
            <div className="flex items-center gap-1.5 bg-surface/80 rounded-lg px-2.5 py-1.5 text-xs border border-wireframe-stroke hover:border-white/15 transition-colors">
              <Volume2 className="w-3.5 h-3.5 text-zinc-500" />
              <select
                value={selectedPersona}
                onChange={(e) => onPersonaChange(e.target.value)}
                className="bg-transparent border-none outline-none text-zinc-300 text-xs cursor-pointer appearance-none pr-4"
                title="Select Voice Persona"
              >
                {personas.map((p) => (
                  <option key={p.id} value={p.id} className="bg-[#18181B]">
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Language Selector */}
          <div className="flex items-center gap-1.5 bg-surface/80 rounded-lg px-2.5 py-1.5 text-xs border border-wireframe-stroke hover:border-white/15 transition-colors">
            <Globe className="w-3.5 h-3.5 text-zinc-500" />
            <select
              value={selectedLanguage}
              onChange={(e) => onLanguageChange(e.target.value)}
              title="Select Language"
              className="bg-transparent border-none outline-none text-zinc-300 text-xs cursor-pointer appearance-none"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code} className="bg-[#18181B]">
                  {l.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ── ElevenLabs Voice Agent Status ──────────────────── */}
        <AnimatePresence>
          {voiceSessionActive && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={transition.fast}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gold/5 border border-gold/20">
                <div className="relative flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-gold" />
                  </span>
                  <span className="text-xs font-mono text-gold/80 uppercase tracking-wider">
                    {voiceAgentStatus === 'connected'
                      ? (voiceAgentSpeaking ? 'ACHEEVY Speaking...' : 'ACHEEVY Listening...')
                      : 'Connecting...'}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onEndVoiceSession}
                  className="ml-auto gap-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/15"
                >
                  <PhoneOff className="w-3 h-3" />
                  End
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Voice Transcript Ready ────────────────────────── */}
        <AnimatePresence>
          {voiceTranscriptReady && value.trim() && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={transition.fast}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gold/5 border border-gold/15 text-xs text-gold/70">
                <Mic className="w-3 h-3" />
                <span>Voice transcript ready — review and press Enter to send</span>
                <button
                  onClick={onClearTranscript}
                  className="ml-auto text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  Clear
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Main Input Card ───────────────────────────────── */}
        <div
          className={`
            relative flex items-end gap-3 rounded-2xl p-3
            bg-surface-raised/50 border transition-colors
            ${voiceTranscriptReady
              ? 'border-gold/20'
              : 'border-wireframe-stroke focus-within:border-gold/30'
            }
          `}
        >
          {/* Voice Input Button */}
          <VoiceInputBtn
            isListening={voiceInput.isListening}
            isProcessing={voiceInput.isProcessing}
            audioLevel={audioLevel}
            onStart={voiceInput.startListening}
            onStop={voiceInput.stopListening}
          />

          {/* ElevenLabs Voice Agent Toggle */}
          {hasVoiceAgent && (
            <button
              onClick={voiceSessionActive ? onEndVoiceSession : onStartVoiceSession}
              className={`p-3 rounded-xl transition-all ${
                voiceSessionActive
                  ? 'bg-gold/20 text-gold'
                  : 'bg-surface text-zinc-500 hover:bg-white/5 hover:text-zinc-300'
              }`}
              title={voiceSessionActive ? 'End voice session' : 'Start voice session'}
            >
              {voiceSessionActive ? <PhoneOff className="w-5 h-5" /> : <Phone className="w-5 h-5" />}
            </button>
          )}

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            disabled={isStreaming}
            rows={1}
            className="flex-1 bg-transparent text-zinc-100 placeholder:text-zinc-600 resize-none outline-none text-[15px] leading-relaxed max-h-[200px] py-2"
          />

          {/* Agent Viewport Toggle */}
          {showOrchestration && onOpenCollabFeed && (
            <button
              onClick={onOpenCollabFeed}
              className="p-3 rounded-xl bg-surface text-zinc-500 hover:bg-white/5 hover:text-zinc-300 transition-colors"
              title="View Agent Viewport"
            >
              <Eye className="w-5 h-5" />
            </button>
          )}

          {/* Department Board Toggle */}
          {showOrchestration && onOpenBoard && (
            <button
              onClick={onOpenBoard}
              className="p-3 rounded-xl bg-surface text-zinc-500 hover:bg-white/5 hover:text-zinc-300 transition-colors"
              title="View Department Board"
            >
              <LayoutDashboard className="w-5 h-5" />
            </button>
          )}

          {/* Send / Stop Button */}
          {isStreaming ? (
            <motion.button
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={spring.snappy}
              onClick={onStop}
              className="p-3 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
            >
              <Square className="w-5 h-5" />
            </motion.button>
          ) : (
            <motion.button
              whileTap={{ scale: 0.95 }}
              transition={spring.snappy}
              onClick={() => onSend()}
              disabled={!canSend}
              className={`
                p-3 rounded-xl transition-all
                ${canSend
                  ? 'bg-gold text-black hover:bg-gold-light shadow-lg shadow-gold/20'
                  : 'bg-surface text-zinc-600 cursor-not-allowed'
                }
              `}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </motion.button>
          )}
        </div>

        {/* ── Voice Output Status ───────────────────────────── */}
        <AnimatePresence>
          {isVoicePlaying && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              transition={transition.fast}
              className="flex items-center justify-center gap-2 text-sm text-zinc-400"
            >
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1 h-3 bg-gold rounded-full animate-pulse"
                    style={{ animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </div>
              <span>Speaking...</span>
              <button onClick={onStopVoice} className="text-gold hover:text-gold-light">
                Stop
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Footer ────────────────────────────────────────── */}
        <p className="text-center text-xs text-zinc-600">
          ACHEEVY may produce inaccurate information. Voice powered by ElevenLabs.
        </p>
      </div>
    </div>
  );
}
