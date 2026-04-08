'use client';

/**
 * ChatInterface Component — Agentic UI Edition
 *
 * Modern chat UI with streaming, voice I/O, markdown support,
 * and Glass Box orchestration visibility.
 *
 * Refactored to use agentic-ui wrapper components:
 * - AcheevyChatInput (input area with voice, model/Data Source selectors)
 * - AcheevyMessage (message bubble with markdown, copy/speak, file deliverables)
 * - AcheevyWelcomeHero (welcome screen with Context Pack selector)
 *
 * Inspired by Claude, ChatGPT, and Kimi interfaces
 */

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useConversation } from '@elevenlabs/react';
import { useStreamingChat } from '@/hooks/useStreamingChat';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { useVoiceOutput } from '@/hooks/useVoiceOutput';
import { useAudioLevel } from '@/hooks/useAudioLevel';
import { useOrchestration } from '@/hooks/useOrchestration';
import { useChangeOrder } from '@/hooks/useChangeOrder';
import { useVerticalFlow } from '@/hooks/useVerticalFlow';
import { OperationsOverlay, OperationsPulse } from '@/components/orchestration/OperationsOverlay';
import { DepartmentBoard } from '@/components/orchestration/DepartmentBoard';
import { UserInputModal } from '@/components/change-order/UserInputModal';
import { ChatSidebar, MagazineBadge } from '@/components/chat/ChatSidebar';
import { VerticalStepIndicator } from '@/components/chat/VerticalStepIndicator';
import { AcheevyChatInput, AcheevyMessage, AcheevyWelcomeHero } from '@/components/chat/agentic';
import type { AIModel, AgenticComposerPayload } from '@/components/chat/agentic';
import { formatCurrency } from '@/lib/change-order/types';
import { PERSONAS } from '@/lib/acheevy/persona';
import type { ChatMessage } from '@/lib/chat/types';
import {
  buildCompatibilityContextPackDefinitions,
  buildCompatibilityContextPacks,
  buildMagazineContextPackDefinitions,
  buildMagazineContextPacks,
  composeWorkingNotebook,
  mergeContextPackOptions,
  resolveCompatibilityPersonaId,
  resolveContextPackVoiceId,
} from '@/lib/context-packs/contracts';
import {
  loadSessionSnapshot,
  resolveSessionSnapshotScope,
  saveSessionSnapshot,
} from '@/lib/context-packs/session-snapshot';
import type { MagazineSlot } from '@/lib/magazines/types';
import { getActiveMagazines } from '@/lib/magazines/client';

// ─────────────────────────────────────────────────────────────
// Priority Model Roster (mirrors /api/chat PRIORITY_MODELS)
// ─────────────────────────────────────────────────────────────

const AI_MODELS: AIModel[] = [
  { key: 'claude-opus', label: 'Claude Opus 4.6', tag: '' },
  { key: 'claude-sonnet', label: 'Claude Sonnet 4.5', tag: '' },
  { key: 'qwen', label: 'Qwen 2.5 Coder 32B', tag: 'code' },
  { key: 'qwen-max', label: 'Qwen Max', tag: '' },
  { key: 'minimax', label: 'MiniMax-01', tag: '' },
  { key: 'glm', label: 'GLM-4 Plus', tag: '' },
  { key: 'kimi', label: 'Kimi K2.5', tag: 'fast' },
  { key: 'nano-banana', label: 'Nano Banana Pro', tag: 'fast' },
  { key: 'gemini-flash', label: 'Gemini 2.5 Flash', tag: 'default' },
  { key: 'gemini-pro', label: 'Gemini 2.5 Pro', tag: '' },
];

const ELEVENLABS_AGENT_ID = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID || '';
const COMPATIBILITY_CONTEXT_PACK_OPTIONS = buildCompatibilityContextPacks(PERSONAS);
const COMPATIBILITY_CONTEXT_PACK_DEFINITIONS = buildCompatibilityContextPackDefinitions(PERSONAS);

// ─────────────────────────────────────────────────────────────
// Main Chat Interface
// ─────────────────────────────────────────────────────────────

interface ChatInterfaceProps {
  sessionId?: string;
  userId?: string;
  userName?: string;
  projectTitle?: string;
  projectObjective?: string;
  model?: string;
  placeholder?: string;
  welcomeMessage?: string;
  autoPlayVoice?: boolean;
  showOrchestration?: boolean;
}

export function ChatInterface({
  sessionId,
  userId = 'user-1',
  userName = 'User',
  projectTitle,
  projectObjective,
  model = 'claude-opus',
  placeholder = 'Message ACHEEVY...',
  welcomeMessage,
  autoPlayVoice = true,
  showOrchestration = true,
}: ChatInterfaceProps) {
  const pathname = usePathname();
  const [showBoard, setShowBoard] = useState(false);
  const [showCollabFeed, setShowCollabFeed] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'viewport' | 'magazines'>('viewport');
  const [activeMagazineSlots, setActiveMagazineSlots] = useState<MagazineSlot[]>([]);
  const [showInputModal, setShowInputModal] = useState(false);
  const [pendingVoiceTranscript, setPendingVoiceTranscript] = useState('');
  const [sessionSnapshotHydrated, setSessionSnapshotHydrated] = useState(false);

  const [selectedContextPackIds, setSelectedContextPackIds] = useState<string[]>(
    COMPATIBILITY_CONTEXT_PACK_OPTIONS[0] ? [COMPATIBILITY_CONTEXT_PACK_OPTIONS[0].id] : []
  );
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [selectedModel, setSelectedModel] = useState(model);
  const [voiceSessionActive, setVoiceSessionActive] = useState(false);

  const sessionSnapshotScope = useMemo(
    () => resolveSessionSnapshotScope(sessionId, pathname),
    [pathname, sessionId],
  );

  const activeMagazineContextPacks = buildMagazineContextPacks(activeMagazineSlots);
  const activeMagazineContextPackDefinitions = buildMagazineContextPackDefinitions(activeMagazineSlots);
  const contextPackOptions = mergeContextPackOptions(
    COMPATIBILITY_CONTEXT_PACK_OPTIONS,
    activeMagazineContextPacks,
  );
  const workingNotebookSessionId = sessionId || sessionSnapshotScope;
  const workingNotebook = useMemo(
    () => composeWorkingNotebook(
      `${sessionSnapshotScope}:working-notebook`,
      workingNotebookSessionId,
      selectedContextPackIds,
      [
        ...COMPATIBILITY_CONTEXT_PACK_DEFINITIONS,
        ...activeMagazineContextPackDefinitions,
      ],
    ),
    [
      activeMagazineContextPackDefinitions,
      selectedContextPackIds,
      sessionSnapshotScope,
      workingNotebookSessionId,
    ],
  );

  const selectedContextPackId = selectedContextPackIds[0] || '';
  const compatibilityPersonaId =
    resolveCompatibilityPersonaId(selectedContextPackIds, contextPackOptions) || PERSONAS[0]?.id;

  useEffect(() => {
    if (selectedContextPackIds.length === 0 && contextPackOptions.length > 0) {
      setSelectedContextPackIds([contextPackOptions[0].id]);
      return;
    }

    const validIds = new Set(contextPackOptions.map((option) => option.id));
    const nextIds = selectedContextPackIds.filter((contextPackId) => validIds.has(contextPackId));

    if (nextIds.length !== selectedContextPackIds.length) {
      setSelectedContextPackIds(nextIds.length > 0 ? nextIds : (contextPackOptions[0] ? [contextPackOptions[0].id] : []));
    }
  }, [contextPackOptions, selectedContextPackIds]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastSubmittedPromptRef = useRef('');

  // Orchestration
  const orchestration = useOrchestration({
    userId,
    userName,
    projectTitle,
    projectObjective,
    onBlockingQuestion: () => {
      // Automatically show input modal when blocked
      setShowInputModal(true);
    },
  });

  // Change Order management
  const changeOrder = useChangeOrder({
    sessionId: sessionId || 'default-session',
    userId,
    onChangeOrderSubmitted: (order) => {
      // Resume orchestration after change order submitted
      orchestration.unblock();
      orchestration.addEvent(
        'user_input_received',
        `{userName} submitted change order with ${order.inputs.length} input(s)`
      );
    },
    onCostUpdated: (totalCost, tokenUsage) => {
      console.log(`[Change Order] Total cost: ${formatCurrency(totalCost)}, Tokens: ${tokenUsage}`);
    },
  });

  // Vertical flow — Phase A step progression
  const verticalFlow = useVerticalFlow({
    userId,
    onPhaseAComplete: (verticalId, data) => {
      console.log(`[Phase A] Complete: vertical=${verticalId}`, data);
    },
    onExecuteRequested: (verticalId, data) => {
      console.log(`[Phase B] Execution requested: vertical=${verticalId}`, data);
      // Dispatch to orchestrator via chat message
      sendMessage(
        `[EXECUTE VERTICAL: ${verticalId}] Collected data: ${JSON.stringify(data)}`
      );
    },
  });

  // Streaming chat
  const {
    messages,
    isStreaming,
    isLoading,
    error,
    sendMessage,
    regenerate,
    stopGeneration,
  } = useStreamingChat({
    sessionId,
    contextPackIds: selectedContextPackIds,
    compatibilityPersonaId,
    model: selectedModel,
    onMessageStart: () => {
      // Start orchestration when streaming begins
      if (showOrchestration) {
        orchestration.updatePhase('execute');

        // Simulate agent assignment for demo
        const activePrompt = lastSubmittedPromptRef.current;
        const deptId = selectDepartment(activePrompt);
        if (deptId) {
          const manager = orchestration.assignManager(deptId);
          if (manager) {
            orchestration.addEvent(
              'manager_assigned',
              `Routing to ${manager.name} for {userName}`,
              manager
            );

            // Assign an ang
            setTimeout(() => {
              const angId = selectAng(activePrompt, deptId);
              if (angId) {
                const ang = orchestration.assignAng(angId);
                if (ang) {
                  orchestration.addEvent('ang_assigned', `${ang.name} assigned to task`, ang);
                  orchestration.updateAngStatus(angId, 'working');
                  orchestration.addDialogue(
                    manager,
                    `${ang.name}, please help {userName} with this request.`,
                    'coordination',
                    ang
                  );
                }
              }
            }, 500);
          }
        }
      }
    },
    onMessageComplete: (message: ChatMessage) => {
      // Complete orchestration
      if (showOrchestration) {
        orchestration.updatePhase('deliver');
        orchestration.addEvent('delivering', `Presenting results to {userName}`);

        setTimeout(() => {
          orchestration.completeTask();
        }, 1000);
      }

      // Auto-play voice for assistant messages
      if (autoPlayVoice && message.role === 'assistant' && voiceOutput.autoPlayEnabled) {
        voiceOutput.speak(message.content);
      }
    },
  });

  // Voice input
  const voiceInput = useVoiceInput({
    config: {
      provider: 'groq',
      language: selectedLanguage,
    },
    onTranscript: (result) => {
      setPendingVoiceTranscript(result.text);
    },
    enableAudioLevelState: false,
  });

  // Voice output
  const voiceOutput = useVoiceOutput({
    config: {
      autoPlay: autoPlayVoice,
      provider: 'elevenlabs',
      voiceId: resolveContextPackVoiceId(selectedContextPackIds, contextPackOptions)
    },
  });
  const { autoPlayEnabled, setAutoPlay: setVoiceAutoPlay } = voiceOutput;

  useEffect(() => {
    let cancelled = false;

    async function hydrateSessionSnapshot() {
      const snapshot = await loadSessionSnapshot(sessionSnapshotScope);
      const restoredContext = snapshot?.context;
      const restoredActiveMagazineIds = new Set(restoredContext?.activeMagazineIds || []);

      if (restoredContext?.selectedContextPackIds?.length) {
        setSelectedContextPackIds(restoredContext.selectedContextPackIds);
      } else if (snapshot?.workingNotebook?.contextPackIds?.length) {
        setSelectedContextPackIds(snapshot.workingNotebook.contextPackIds);
      }

      if (restoredContext?.selectedModel) {
        setSelectedModel(restoredContext.selectedModel);
      }

      if (restoredContext?.selectedLanguage) {
        setSelectedLanguage(restoredContext.selectedLanguage);
      }

      if (typeof restoredContext?.speechOutputEnabled === 'boolean') {
        setVoiceAutoPlay(restoredContext.speechOutputEnabled);
      }

      try {
        const { slots } = await getActiveMagazines();
        if (!cancelled) {
          setActiveMagazineSlots(
            restoredActiveMagazineIds.size > 0
              ? slots.filter((slot) => restoredActiveMagazineIds.has(slot.magazineId))
              : slots,
          );
        }
      } catch {
        // Magazine state hydration is best-effort.
      } finally {
        if (!cancelled) {
          setSessionSnapshotHydrated(true);
        }
      }
    }

    hydrateSessionSnapshot();

    return () => {
      cancelled = true;
    };
  }, [sessionSnapshotScope, setVoiceAutoPlay]);

  useEffect(() => {
    if (!sessionSnapshotHydrated) {
      return;
    }

    void saveSessionSnapshot(sessionSnapshotScope, {
      sessionId: sessionId || sessionSnapshotScope,
      selectedContextPackIds,
      activeMagazineIds: activeMagazineSlots.map((slot) => slot.magazineId),
      selectedModel,
      selectedLanguage,
      speechOutputEnabled: autoPlayEnabled,
      workingNotebookId: workingNotebook.id,
    }, [], workingNotebook);
  }, [
    activeMagazineSlots,
    autoPlayEnabled,
    selectedContextPackIds,
    selectedLanguage,
    selectedModel,
    sessionId,
    sessionSnapshotHydrated,
    sessionSnapshotScope,
    workingNotebook,
  ]);

  // Memoize handleSpeak to prevent re-renders of MessageBubble
  const { speak } = voiceOutput;
  const handleSpeak = useCallback((text: string) => {
    speak(text);
  }, [speak]);

  // ElevenLabs Agent SDK — conversational voice agent
  const hasAgent = Boolean(ELEVENLABS_AGENT_ID);
  const conversation = useConversation({});

  const startVoiceSession = useCallback(async () => {
    if (!ELEVENLABS_AGENT_ID) return;
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      await conversation.startSession({ agentId: ELEVENLABS_AGENT_ID, connectionType: 'webrtc' });
      setVoiceSessionActive(true);
    } catch (err) {
      console.error('[Voice Agent] Failed to start session:', err);
    }
  }, [conversation]);

  const endVoiceSession = useCallback(async () => {
    try {
      if (conversation.status === 'connected') await conversation.endSession();
    } catch { /* ignore */ }
    setVoiceSessionActive(false);
  }, [conversation]);

  // ─────────────────────────────────────────────────────────
  // Department/Ang Selection Helpers
  // ─────────────────────────────────────────────────────────

  function selectDepartment(prompt: string): string | null {
    const lower = prompt.toLowerCase();
    if (lower.includes('research') || lower.includes('analyze') || lower.includes('market')) return 'research';
    if (lower.includes('code') || lower.includes('build') || lower.includes('develop')) return 'development';
    if (lower.includes('write') || lower.includes('design') || lower.includes('content')) return 'content';
    if (lower.includes('automate') || lower.includes('workflow') || lower.includes('integrate')) return 'automation';
    if (lower.includes('test') || lower.includes('review') || lower.includes('quality')) return 'quality';
    // Default to development
    return 'development';
  }

  function selectAng(prompt: string, deptId: string): string | null {
    const angMap: Record<string, string> = {
      research: 'researcher_ang',
      development: 'coder_ang',
      content: 'writer_ang',
      automation: 'workflow_ang',
      quality: 'quality_ang',
    };
    return angMap[deptId] || null;
  }

  // ─────────────────────────────────────────────────────────
  // Auto-scroll to bottom
  // ─────────────────────────────────────────────────────────

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ─────────────────────────────────────────────────────────
  // Send Message Handler
  // ─────────────────────────────────────────────────────────

  // Classify message for vertical match (non-blocking)
  // Uses the gateway /acheevy/classify endpoint which now returns a routing decision.
  const classifyForVertical = useCallback(async (message: string) => {
    try {
      const res = await fetch('/api/acheevy/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      if (!res.ok) return;
      const data = await res.json();
      const routingDecision = data.routingDecision;
      // The gateway returns intent as 'vertical:<id>' (e.g. 'vertical:idea-generator')
      if (routingDecision?.intent_type === 'vertical' && data.confidence > 0.6 && data.intent) {
        const intent = data.intent as string;
        if (intent.startsWith('vertical:')) {
          verticalFlow.startVertical(intent.replace('vertical:', ''));
        }
      }
    } catch {
      // Classification is non-blocking — silent fail
    }
  }, [verticalFlow]);

  const handleSend = useCallback(async (payload: AgenticComposerPayload | string) => {
    const normalizedPayload = typeof payload === 'string'
      ? { message: payload }
      : payload;
    const messageText = normalizedPayload.message;
    if (!messageText.trim() || isStreaming || isLoading) return;

    lastSubmittedPromptRef.current = messageText;

    // If in vertical flow Phase A, advance the step and enrich the message
    if (verticalFlow.isPhaseA) {
      verticalFlow.advanceStep(messageText);
      const stepContext = verticalFlow.getCurrentStepContext();
      // Send message with step context injected for the LLM
      const enrichedPayload = stepContext
        ? { ...normalizedPayload, message: `${messageText}\n\n---\n[SYSTEM_CONTEXT: ${stepContext}]` }
        : normalizedPayload;
      sendMessage({
        content: enrichedPayload.message,
        files: enrichedPayload.files,
        tools: enrichedPayload.tools,
        businessFunction: enrichedPayload.businessFunction,
        deepResearch: enrichedPayload.deepResearch,
      });
    } else {
      // Start orchestration task
      if (showOrchestration) {
        orchestration.startTask(messageText);
        orchestration.addEvent('task_received', `{userName} sent a new request`);
        orchestration.updatePhase('route');
      }

      sendMessage({
        content: messageText,
        files: normalizedPayload.files,
        tools: normalizedPayload.tools,
        businessFunction: normalizedPayload.businessFunction,
        deepResearch: normalizedPayload.deepResearch,
      });

      // Check if this message triggers a vertical (async, non-blocking)
      if (!verticalFlow.isActive) {
        classifyForVertical(messageText);
      }
    }

    setPendingVoiceTranscript('');
  }, [isLoading, isStreaming, sendMessage, showOrchestration, orchestration, verticalFlow, classifyForVertical]);

  // Audio level for voice input visualization
  const audioLevel = useAudioLevel(voiceInput.stream, voiceInput.isListening);

  return (
    <div className="relative flex h-full flex-col bg-transparent overflow-x-hidden">
      {/* ── Messages Area ───────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 sm:px-4 sm:py-6 md:px-6">
        <div className="mx-auto max-w-4xl space-y-6 w-full">
          {/* Welcome Hero (shown when empty) */}
          {messages.length === 0 && (
            <AcheevyWelcomeHero
              welcomeMessage={welcomeMessage}
              contextPacks={contextPackOptions}
              selectedContextPackId={selectedContextPackId}
              onContextPackChange={(contextPackId) => setSelectedContextPackIds([contextPackId])}
            />
          )}

          {/* Message List */}
          <AnimatePresence>
            {messages.map((message: ChatMessage, index: number) => (
              <AcheevyMessage
                key={message.id}
                message={message}
                isLast={index === messages.length - 1}
                onSpeak={handleSpeak}
              />
            ))}
          </AnimatePresence>

          {/* Error Display */}
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="aims-agentic-panel rounded-[24px] border border-red-500/25 bg-red-500/10 p-4 text-sm text-red-300"
            >
              {error}
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ── Vertical Step Indicator (above input) ───────────── */}
      {verticalFlow.isActive && (
        <div className="px-4">
          <div className="mx-auto max-w-4xl">
            <VerticalStepIndicator
              state={verticalFlow.state}
              transitionPrompt={verticalFlow.getTransitionPrompt()}
              onExecute={verticalFlow.confirmExecution}
              onDismiss={verticalFlow.reset}
            />
          </div>
        </div>
      )}

      {/* ── Input Area (AcheevyChatInput) ───────────────────── */}
      <AcheevyChatInput
        onSend={handleSend}
        placeholder={placeholder}
        isStreaming={isStreaming}
        isLoading={isLoading}
        voiceInput={{
          isListening: voiceInput.isListening,
          isProcessing: voiceInput.isProcessing,
          stream: voiceInput.stream,
          startListening: voiceInput.startListening,
          stopListening: () => voiceInput.stopListening(),
        }}
        voiceTranscript={pendingVoiceTranscript}
        onSendVoiceTranscript={() => {
          if (!pendingVoiceTranscript.trim()) {
            return;
          }

          void handleSend({ message: pendingVoiceTranscript });
        }}
        onClearTranscript={() => { setPendingVoiceTranscript(''); }}
        audioLevel={audioLevel}
        hasVoiceAgent={hasAgent}
        voiceSessionActive={voiceSessionActive}
        voiceAgentStatus={conversation.status}
        voiceAgentSpeaking={conversation.isSpeaking}
        onStartVoiceSession={startVoiceSession}
        onEndVoiceSession={endVoiceSession}
        isVoicePlaying={voiceOutput.isPlaying}
        onStopVoice={voiceOutput.stop}
        autoPlayVoice={voiceOutput.autoPlayEnabled}
        onToggleAutoPlayVoice={() => voiceOutput.setAutoPlay(!voiceOutput.autoPlayEnabled)}
        models={AI_MODELS}
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
        contextPacks={contextPackOptions}
        selectedContextPackId={selectedContextPackId}
        onContextPackChange={(contextPackId) => setSelectedContextPackIds([contextPackId])}
        selectedLanguage={selectedLanguage}
        onLanguageChange={setSelectedLanguage}
        showOrchestration={showOrchestration}
        onOpenBoard={() => setShowBoard(true)}
        onOpenCollabFeed={() => setShowCollabFeed(true)}
        onStop={stopGeneration}
        onRegenerate={regenerate}
        hasMessages={messages.length > 0}
      />

      {/* ── Orchestration Overlay (Glass Box) ───────────────── */}
      {showOrchestration && orchestration.shouldShowOverlay && (
        <OperationsOverlay
          state={orchestration.state}
          onExpand={() => setShowBoard(true)}
          onMinimize={() => orchestration.setOverlayMode('minimal')}
        />
      )}

      {/* Operations Pulse (for quick tasks) */}
      {showOrchestration &&
        orchestration.state.phase !== 'idle' &&
        !orchestration.shouldShowOverlay && (
          <OperationsPulse
            phase={orchestration.state.phase}
            onClick={() => orchestration.setOverlayMode('minimal')}
          />
        )}

      {/* Department Board Drawer */}
      <DepartmentBoard
        state={orchestration.state}
        isOpen={showBoard}
        onClose={() => setShowBoard(false)}
      />

      {/* Change Order Input Modal */}
      <UserInputModal
        isOpen={showInputModal && orchestration.state.isBlocked}
        onClose={() => setShowInputModal(false)}
        onSubmit={(orderData) => {
          if (orderData.inputs && orderData.inputs.length > 0) {
            changeOrder.createChangeOrder({
              triggerQuestion: orchestration.state.blockingQuestion || 'Input required',
              requestingAgent: orchestration.state.blockingAgent || 'ACHEEVY',
              department: orchestration.state.blockingDepartment || 'development',
            });
            changeOrder.submitChangeOrder(orderData.inputs);
          }
          setShowInputModal(false);
        }}
        triggerQuestion={orchestration.state.blockingQuestion || 'Additional information needed'}
        requestingAgent={orchestration.state.blockingAgent || 'ACHEEVY'}
        department={orchestration.state.blockingDepartment || 'Development'}
      />

      {/* Tabbed Sidebar (Agent Viewport + Magazines) */}
      <ChatSidebar
        isOpen={showCollabFeed}
        onClose={() => setShowCollabFeed(false)}
        initialTab={sidebarTab}
        activeMagazineCount={activeMagazineSlots.length}
        activeMagazineSlots={activeMagazineSlots}
        onActiveMagazineSlotsChange={setActiveMagazineSlots}
      />

      {/* Change Order Cost Tracker (bottom-left) */}
      {changeOrder.totalCost > 0 && (
        <div className="fixed bottom-4 left-4 px-3 py-2 wireframe-card text-xs z-40">
          <p className="text-zinc-400">Change Orders</p>
          <p className="text-gold font-mono font-medium">
            {formatCurrency(changeOrder.totalCost)} ({changeOrder.totalTokensUsed.toLocaleString()} tokens)
          </p>
        </div>
      )}
    </div>
  );
}
