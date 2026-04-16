'use client';

/**
 * AcheevyChatInput — AgenticUI-backed Bottom Composer Bezel for ACHEEVY
 *
 * Uses the real agentic-ui ChatInput for prompt composition, attachments,
 * tool selection, and business-function selection while preserving A.I.M.S.
 * controls for voice input, model routing, Context Packs, speech output,
 * and orchestration surfaces.
 */

import React, { memo, useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Badge,
  Button,
  ChatInput,
  Toaster,
  type BusinessFunction,
  type Tool,
  type UploadedFile,
} from 'agentic-ui';
import {
  BrainCircuit,
  Database,
  Eye,
  Globe,
  LayoutDashboard,
  Loader2,
  Mic,
  Phone,
  PhoneOff,
  Square,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { transition } from '@/lib/motion/tokens';
import type { ContextPackOption } from '@/lib/context-packs/contracts';
import { useAudioLevel } from '@/hooks/useAudioLevel';

interface VoicePingProps {
  audioLevel: number;
}

function VoicePing({ audioLevel }: VoicePingProps) {
  if (audioLevel <= 0.05) {
    return null;
  }

  return (
    <div className="absolute inset-0 rounded-full border-2 border-red-400/60 animate-ping" />
  );
}

function VoiceEqualizer({ audioLevel }: { audioLevel: number }) {
  const barHeights = audioLevel > 0.66
    ? ['h-2', 'h-3', 'h-4', 'h-3', 'h-2']
    : audioLevel > 0.33
      ? ['h-1.5', 'h-2.5', 'h-3', 'h-2.5', 'h-1.5']
      : ['h-1', 'h-1.5', 'h-2', 'h-1.5', 'h-1'];

  return (
    <div className="flex h-4 items-end gap-0.5">
      {barHeights.map((heightClass, index) => (
        <div
          key={index}
          className={`w-0.5 rounded-full bg-red-400/60 transition-all duration-75 ${heightClass}`}
        />
      ))}
    </div>
  );
}

export interface AIModel {
  key: string;
  label: string;
  tag: string;
}

export interface AgenticComposerPayload {
  message: string;
  files?: UploadedFile[];
  tools?: Tool[];
  businessFunction?: BusinessFunction;
  deepResearch?: boolean;
}

export interface AcheevyChatInputProps {
  onSend: (payload: AgenticComposerPayload) => void;
  placeholder?: string;
  disabled?: boolean;
  isStreaming?: boolean;
  isLoading?: boolean;
  voiceInput: {
    isListening: boolean;
    isProcessing: boolean;
    stream: MediaStream | null;
    startListening: () => void;
    stopListening: () => void;
  };
  voiceTranscript?: string;
  onSendVoiceTranscript?: () => void;
  onClearTranscript?: () => void;
  hasVoiceAgent?: boolean;
  voiceSessionActive?: boolean;
  voiceAgentStatus?: string;
  voiceAgentSpeaking?: boolean;
  onStartVoiceSession?: () => void;
  onEndVoiceSession?: () => void;
  isVoicePlaying?: boolean;
  onStopVoice?: () => void;
  autoPlayVoice?: boolean;
  onToggleAutoPlayVoice?: () => void;
  models: AIModel[];
  selectedModel: string;
  onModelChange: (model: string) => void;
  contextPacks: ContextPackOption[];
  selectedContextPackId: string;
  onContextPackChange: (contextPackId: string) => void;
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
  showOrchestration?: boolean;
  onOpenBoard?: () => void;
  onOpenCollabFeed?: () => void;
  onStop?: () => void;
  onRegenerate?: () => void;
  hasMessages?: boolean;
}

const VoiceInputBtn = memo(function VoiceInputBtn({
  isListening,
  isProcessing,
  stream,
  onStart,
  onStop,
}: {
  isListening: boolean;
  isProcessing: boolean;
  stream: MediaStream | null;
  onStart: () => void;
  onStop: () => void;
}) {
  const [elapsed, setElapsed] = React.useState(0);
  // ⚡ Bolt Optimization: Moved high-frequency audio level hook here to prevent
  // continuous re-renders of the large parent ChatInterface component.
  const audioLevel = useAudioLevel(stream, isListening);

  useEffect(() => {
    if (!isListening) {
      setElapsed(0);
      return;
    }

    const timer = setInterval(() => setElapsed((seconds) => seconds + 1), 1000);
    return () => clearInterval(timer);
  }, [isListening]);

  const formattedTime = `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, '0')}`;

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={isListening ? onStop : onStart}
        disabled={isProcessing}
        className={`relative flex h-10 w-10 items-center justify-center rounded-full border transition-all ${
          isListening
            ? 'border-red-400/40 bg-red-500/15 text-red-300'
            : 'border-white/10 bg-black/10 text-zinc-400 hover:border-white/20 hover:text-zinc-200'
        } ${isProcessing ? 'cursor-not-allowed opacity-60' : ''}`}
        title={isListening ? 'Stop voice capture' : 'Start voice capture'}
        aria-label="Voice Capture Toggle"
      >
        {isListening && <VoicePing audioLevel={audioLevel} />}
        {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mic className="h-4 w-4" />}
      </button>

      {(isListening || isProcessing) && (
        <div className="flex items-center gap-2 text-[11px] font-label text-zinc-400">
          {isListening && (
            <>
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
              <span className="font-mono text-red-300">{formattedTime}</span>
              <VoiceEqualizer audioLevel={audioLevel} />
            </>
          )}
          {isProcessing && <span className="text-gold/80">TRANSCRIBING</span>}
        </div>
      )}
    </div>
  );
});

const LANGUAGES = [
  { code: 'en', label: 'EN' },
  { code: 'es', label: 'ES' },
  { code: 'fr', label: 'FR' },
  { code: 'de', label: 'DE' },
  { code: 'zh', label: 'ZH' },
  { code: 'ja', label: 'JA' },
] as const;

export function AcheevyChatInput({
  onSend,
  placeholder = 'Message ACHEEVY...',
  disabled = false,
  isStreaming = false,
  isLoading = false,
  voiceInput,
  voiceTranscript,
  onSendVoiceTranscript,
  onClearTranscript,
  hasVoiceAgent = false,
  voiceSessionActive = false,
  voiceAgentStatus,
  voiceAgentSpeaking = false,
  onStartVoiceSession,
  onEndVoiceSession,
  isVoicePlaying = false,
  onStopVoice,
  autoPlayVoice = true,
  onToggleAutoPlayVoice,
  models,
  selectedModel,
  onModelChange,
  contextPacks,
  selectedContextPackId,
  onContextPackChange,
  selectedLanguage,
  onLanguageChange,
  showOrchestration = false,
  onOpenBoard,
  onOpenCollabFeed,
  onStop,
  onRegenerate,
  hasMessages = false,
}: AcheevyChatInputProps) {
  const availableTools = useMemo<Tool[]>(() => [
    {
      id: 'working-notebook',
      name: 'Working Notebook',
      description: 'Use the current Working Notebook and active Context Packs as structured context.',
      icon: '📓',
    },
    {
      id: 'session-snapshot',
      name: 'Session Snapshot',
      description: 'Pull persisted session context, selections, and recent workflow state.',
      icon: '🧠',
    },
    {
      id: 'data-source-catalog',
      name: 'Data Source Catalog',
      description: 'Use the active Data Source Catalog selections in this response.',
      icon: '🗂️',
    },
    {
      id: 'technical-knowledge-index',
      name: 'Technical Knowledge Index',
      description: 'Map plain-language inputs to canonical technical terminology.',
      icon: '📚',
    },
    {
      id: 'sandbox-control-plane',
      name: 'Sandbox Control Plane',
      description: 'Reason about deployment, execution, and environment state.',
      icon: '🚀',
    },
    {
      id: 'speech-output',
      name: 'Speech Output',
      description: 'Optimize the response for read-aloud playback and interruption handling.',
      icon: '🔊',
    },
  ], []);

  const businessFunctions = useMemo<BusinessFunction[]>(() => [
    {
      id: 'build-intent-resolution',
      name: 'Build Intent Resolver',
      description: 'Clarify what the user is trying to build and route toward execution.',
      icon: '🧭',
      topic: 'Intent',
    },
    {
      id: 'prompt-reconstruction',
      name: 'Prompt Reconstruction',
      description: 'Rewrite user language into build-ready prompts and technical requirements.',
      icon: '✍️',
      topic: 'Prompting',
    },
    {
      id: 'deep-research',
      name: 'Deep Research',
      description: 'Run a broader discovery pass before execution.',
      icon: '🔎',
      topic: 'Research',
    },
    {
      id: 'service-deployment',
      name: 'Service Deployment',
      description: 'Plan or execute managed service deployment work.',
      icon: '⚙️',
      topic: 'Execution',
    },
    {
      id: 'workflow-automation',
      name: 'Workflow Automation',
      description: 'Design or execute workflow and orchestration changes.',
      icon: '🔁',
      topic: 'Automation',
    },
  ], []);

  const selectedModelLabel = models.find((entry) => entry.key === selectedModel)?.label || selectedModel;
  const selectedContextPackName = contextPacks.find((entry) => entry.id === selectedContextPackId)?.name || 'Context Pack';

  return (
    <div className="aims-agentic border-t border-wireframe-stroke bg-obsidian/90 px-4 py-4 backdrop-blur-xl">
      <div className="mx-auto max-w-4xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 px-1">
          <div className="flex items-center gap-2">
            <p className="font-label text-[11px] uppercase tracking-[0.28em] text-zinc-500">
              CHAT W/ ACHEEVY
            </p>
            <Badge variant="outline">{selectedContextPackName}</Badge>
            <Badge variant="outline">{selectedModelLabel}</Badge>
          </div>

          {hasMessages && !isStreaming && onRegenerate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRegenerate}
              className="gap-2 text-zinc-400 hover:text-zinc-100"
            >
              Regenerate response
            </Button>
          )}
        </div>

        <div className="aims-agentic-panel rounded-[28px] px-4 py-4">
          <div className="flex flex-wrap items-center gap-2 pb-3">
            <VoiceInputBtn
              isListening={voiceInput.isListening}
              isProcessing={voiceInput.isProcessing}
              stream={voiceInput.stream}
              onStart={voiceInput.startListening}
              onStop={voiceInput.stopListening}
            />

            <div className="flex items-center gap-1.5 rounded-full border border-wireframe-stroke bg-surface/80 px-3 py-2 text-xs font-label transition-colors hover:border-white/15">
              <BrainCircuit className="h-3.5 w-3.5 text-zinc-500" />
              <select
                value={selectedModel}
                onChange={(event) => onModelChange(event.target.value)}
                className="cursor-pointer appearance-none border-none bg-transparent pr-4 text-[11px] text-zinc-300 outline-none"
                title="Select AI Model"
              >
                {models.map((modelOption) => (
                  <option key={modelOption.key} value={modelOption.key} className="bg-[#18181B]">
                    {modelOption.label}{modelOption.tag ? ` (${modelOption.tag})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {contextPacks.length > 0 && (
              <div className="flex items-center gap-1.5 rounded-full border border-wireframe-stroke bg-surface/80 px-3 py-2 text-xs font-label transition-colors hover:border-white/15">
                <Database className="h-3.5 w-3.5 text-zinc-500" />
                <select
                  value={selectedContextPackId}
                  onChange={(event) => onContextPackChange(event.target.value)}
                  className="cursor-pointer appearance-none border-none bg-transparent pr-4 text-[11px] text-zinc-300 outline-none"
                  title="Select Data Source"
                >
                  {contextPacks.map((contextPack) => (
                    <option key={contextPack.id} value={contextPack.id} className="bg-[#18181B]">
                      {contextPack.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="button"
              onClick={onToggleAutoPlayVoice}
              disabled={!onToggleAutoPlayVoice}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-2 text-[11px] font-label transition-colors ${
                autoPlayVoice
                  ? 'border-gold/30 bg-gold/10 text-gold'
                  : 'border-wireframe-stroke bg-surface/80 text-zinc-400 hover:border-white/15'
              } ${!onToggleAutoPlayVoice ? 'cursor-default opacity-70' : ''}`}
              title={autoPlayVoice ? 'Disable speech output' : 'Enable speech output'}
            >
              {autoPlayVoice ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
              <span>{autoPlayVoice ? 'Speech On' : 'Speech Off'}</span>
            </button>

            <div className="flex items-center gap-1.5 rounded-full border border-wireframe-stroke bg-surface/80 px-3 py-2 text-xs font-label transition-colors hover:border-white/15">
              <Globe className="h-3.5 w-3.5 text-zinc-500" />
              <select
                value={selectedLanguage}
                onChange={(event) => onLanguageChange(event.target.value)}
                className="cursor-pointer appearance-none border-none bg-transparent text-[11px] text-zinc-300 outline-none"
                title="Select Language"
              >
                {LANGUAGES.map((language) => (
                  <option key={language.code} value={language.code} className="bg-[#18181B]">
                    {language.label}
                  </option>
                ))}
              </select>
            </div>

            {showOrchestration && onOpenCollabFeed && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onOpenCollabFeed}
                className="h-10 w-10 rounded-full border border-wireframe-stroke text-zinc-400 hover:text-zinc-100"
                title="Open Agent Viewport"
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}

            {showOrchestration && onOpenBoard && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onOpenBoard}
                className="h-10 w-10 rounded-full border border-wireframe-stroke text-zinc-400 hover:text-zinc-100"
                title="Open Department Board"
              >
                <LayoutDashboard className="h-4 w-4" />
              </Button>
            )}

            {hasVoiceAgent && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={voiceSessionActive ? onEndVoiceSession : onStartVoiceSession}
                className={`h-10 w-10 rounded-full border ${
                  voiceSessionActive
                    ? 'border-gold/30 bg-gold/10 text-gold'
                    : 'border-wireframe-stroke text-zinc-400 hover:text-zinc-100'
                }`}
                title={voiceSessionActive ? 'End voice session' : 'Start voice session'}
              >
                {voiceSessionActive ? <PhoneOff className="h-4 w-4" /> : <Phone className="h-4 w-4" />}
              </Button>
            )}
          </div>

          <AnimatePresence>
            {voiceSessionActive && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={transition.fast}
                className="overflow-hidden pb-3"
              >
                <div className="flex items-center gap-3 rounded-2xl border border-gold/20 bg-gold/5 px-3 py-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-gold" />
                  </span>
                  <span className="text-xs font-label text-gold/80">
                    {voiceAgentStatus === 'connected'
                      ? (voiceAgentSpeaking ? 'ACHEEVY SPEAKING' : 'ACHEEVY LISTENING')
                      : 'CONNECTING'}
                  </span>
                  <span className="text-xs text-zinc-500">Voice session remains available while the rest of chat stays interactive.</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {voiceTranscript && voiceTranscript.trim() && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={transition.fast}
                className="overflow-hidden pb-3"
              >
                <div className="rounded-2xl border border-gold/15 bg-gold/5 p-3">
                  <div className="mb-2 flex items-center gap-2 text-xs font-label text-gold/80">
                    <Mic className="h-3.5 w-3.5" />
                    Voice transcript ready for review
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-6 text-zinc-200">{voiceTranscript}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button type="button" size="sm" onClick={onSendVoiceTranscript}>
                      Send transcript
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={onClearTranscript}>
                      Clear
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {isStreaming && onStop && (
            <div className="pb-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onStop}
                className="gap-2 border-red-400/25 text-red-300 hover:bg-red-500/10 hover:text-red-200"
              >
                <Square className="h-3.5 w-3.5" />
                Stop response
              </Button>
            </div>
          )}

          <div className="rounded-[24px] border border-white/10 bg-black/10 p-2">
            <ChatInput
              onSendMessage={(message, files, tools, businessFunction, deepResearch) =>
                onSend({
                  message,
                  files,
                  tools,
                  businessFunction,
                  deepResearch,
                })
              }
              placeholder={placeholder}
              disabled={disabled || isLoading}
              showAttachment={true}
              showVoice={false}
              showTools={true}
              showDeepResearch={true}
              tools={availableTools}
              businessFunctions={businessFunctions}
              isStreaming={isStreaming}
              maxFiles={5}
              maxFileSize={10 * 1024 * 1024}
              enableSlashTools={true}
              toolsLabel="Tools"
              deepResearchLabel="Deep Research"
              attachmentTooltip="Attachment Trigger"
              className="w-full"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-3 text-[11px]">
            <div className="flex flex-wrap items-center gap-2 text-zinc-500">
              <Badge variant="outline">/ for tools</Badge>
              <Badge variant="outline">@ for business functions</Badge>
              {isVoicePlaying && (
                <button type="button" onClick={onStopVoice} className="text-gold hover:text-gold-light">
                  Stop read-aloud
                </button>
              )}
            </div>
            <p className="font-label tracking-[0.14em] text-zinc-600">
              ACHEEVY may produce inaccurate information. Voice powered by ElevenLabs.
            </p>
          </div>
        </div>
      </div>

      <Toaster />
    </div>
  );
}
