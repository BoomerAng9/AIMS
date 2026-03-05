'use client';

/**
 * ChatInterface Component — Agentic UI Edition
 *
 * Modern chat UI with streaming, voice I/O, markdown support,
 * and Glass Box orchestration visibility.
 *
 * Refactored to use agentic-ui wrapper components:
 * - AcheevyChatInput (input area with voice, model/persona selectors)
 * - AcheevyMessage (message bubble with markdown, copy/speak, file deliverables)
 * - AcheevyWelcomeHero (welcome screen with persona selector)
 *
 * Inspired by Claude, ChatGPT, and Kimi interfaces
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
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
import type { AIModel } from '@/components/chat/agentic';
import { formatCurrency } from '@/lib/change-order/types';
import { PERSONAS } from '@/lib/acheevy/persona';
import type { MagazineSlot } from '@/lib/magazines/types';

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
  const [inputValue, setInputValue] = useState('');
  const [showBoard, setShowBoard] = useState(false);
  const [showCollabFeed, setShowCollabFeed] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'viewport' | 'magazines'>('viewport');
  const [activeMagazineSlots, setActiveMagazineSlots] = useState<MagazineSlot[]>([]);
  const [showInputModal, setShowInputModal] = useState(false);
  const [voiceTranscriptReady, setVoiceTranscriptReady] = useState(false);

  // New State for Persona and Language
  const [selectedPersona, setSelectedPersona] = useState(PERSONAS[0].id);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [selectedModel, setSelectedModel] = useState('claude-opus');
  const [voiceSessionActive, setVoiceSessionActive] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    personaId: selectedPersona, // Pass selected persona
    model: selectedModel,
    onMessageStart: () => {
      // Start orchestration when streaming begins
      if (showOrchestration) {
        orchestration.updatePhase('execute');

        // Simulate agent assignment for demo
        const deptId = selectDepartment(inputValue);
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
              const angId = selectAng(inputValue, deptId);
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
    onMessageComplete: (message) => {
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
      // Populate textarea for user to review/edit before sending
      setInputValue(result.text);
      setVoiceTranscriptReady(true);
    },
    enableAudioLevelState: false,
  });

  // Voice output
  const voiceOutput = useVoiceOutput({
    config: {
      autoPlay: autoPlayVoice,
      provider: 'elevenlabs',
      voiceId: PERSONAS.find(p => p.id === selectedPersona)?.voiceId
    },
  });

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
  // Uses the gateway /acheevy/classify endpoint which returns { intent, confidence, requiresAgent }
  const classifyForVertical = useCallback(async (message: string) => {
    try {
      const res = await fetch('/api/acheevy/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      if (!res.ok) return;
      const data = await res.json();
      // The gateway returns intent as 'vertical:<id>' (e.g. 'vertical:idea-generator')
      if (data.requiresAgent && data.confidence > 0.6 && data.intent) {
        const intent = data.intent as string;
        if (intent.startsWith('vertical:')) {
          verticalFlow.startVertical(intent.replace('vertical:', ''));
        }
      }
    } catch {
      // Classification is non-blocking — silent fail
    }
  }, [verticalFlow]);

  const handleSend = useCallback(async (text?: string) => {
    const messageText = text || inputValue;
    if (!messageText.trim() || isStreaming || isLoading) return;

    // If in vertical flow Phase A, advance the step and enrich the message
    if (verticalFlow.isPhaseA) {
      verticalFlow.advanceStep(messageText);
      const stepContext = verticalFlow.getCurrentStepContext();
      // Send message with step context injected for the LLM
      const enrichedMessage = stepContext
        ? `${messageText}\n\n---\n[SYSTEM_CONTEXT: ${stepContext}]`
        : messageText;
      sendMessage(enrichedMessage);
    } else {
      // Start orchestration task
      if (showOrchestration) {
        orchestration.startTask(messageText);
        orchestration.addEvent('task_received', `{userName} sent a new request`);
        orchestration.updatePhase('route');
      }

      sendMessage(messageText);

      // Check if this message triggers a vertical (async, non-blocking)
      if (!verticalFlow.isActive) {
        classifyForVertical(messageText);
      }
    }

    setInputValue('');
    setVoiceTranscriptReady(false);
  }, [inputValue, isStreaming, isLoading, sendMessage, showOrchestration, orchestration, verticalFlow, classifyForVertical]);

  // ─────────────────────────────────────────────────────────
  // Keyboard Handling
  // ─────────────────────────────────────────────────────────

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Audio level for voice input visualization
  const audioLevel = useAudioLevel(voiceInput.stream, voiceInput.isListening);

  return (
    <div className="relative flex flex-col h-full bg-obsidian">
      {/* ── Messages Area ───────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Welcome Hero (shown when empty) */}
          {messages.length === 0 && (
            <AcheevyWelcomeHero
              welcomeMessage={welcomeMessage}
              personas={PERSONAS}
              selectedPersona={selectedPersona}
              onPersonaChange={setSelectedPersona}
            />
          )}

          {/* Message List */}
          <AnimatePresence>
            {messages.map((message, index) => (
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
              className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400 text-sm"
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
          <div className="max-w-3xl mx-auto">
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
        value={inputValue}
        onChange={setInputValue}
        onSend={handleSend}
        onKeyDown={handleKeyDown}
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
        voiceTranscriptReady={voiceTranscriptReady}
        onClearTranscript={() => { setInputValue(''); setVoiceTranscriptReady(false); }}
        audioLevel={audioLevel}
        hasVoiceAgent={hasAgent}
        voiceSessionActive={voiceSessionActive}
        voiceAgentStatus={conversation.status}
        voiceAgentSpeaking={conversation.isSpeaking}
        onStartVoiceSession={startVoiceSession}
        onEndVoiceSession={endVoiceSession}
        isVoicePlaying={voiceOutput.isPlaying}
        onStopVoice={voiceOutput.stop}
        models={AI_MODELS}
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
        personas={PERSONAS}
        selectedPersona={selectedPersona}
        onPersonaChange={setSelectedPersona}
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
