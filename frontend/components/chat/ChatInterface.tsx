'use client';

/**
 * ChatInterface Component
 * Modern chat UI with streaming, voice I/O, markdown support,
 * and Glass Box orchestration visibility
 *
 * Inspired by Claude, ChatGPT, and Kimi interfaces
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useStreamingChat } from '@/hooks/useStreamingChat';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { useVoiceOutput } from '@/hooks/useVoiceOutput';
import { useOrchestration } from '@/hooks/useOrchestration';
import { useChangeOrder } from '@/hooks/useChangeOrder';
import { OperationsOverlay, OperationsPulse } from '@/components/orchestration/OperationsOverlay';
import { DepartmentBoard } from '@/components/orchestration/DepartmentBoard';
import { UserInputModal } from '@/components/change-order/UserInputModal';
import type { ChatMessage } from '@/lib/chat/types';
import type { ChangeOrder } from '@/lib/change-order/types';
import { formatCurrency } from '@/lib/change-order/types';

// ─────────────────────────────────────────────────────────────
// Icons (inline SVG for simplicity)
// ─────────────────────────────────────────────────────────────

const MicIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);

const SendIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const StopIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="6" width="12" height="12" rx="2" />
  </svg>
);

const SpeakerIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
  </svg>
);

const CopyIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const RegenerateIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
);

const BoardIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M3 9h18" />
    <path d="M9 21V9" />
  </svg>
);

// ─────────────────────────────────────────────────────────────
// Message Bubble Component
// ─────────────────────────────────────────────────────────────

interface MessageBubbleProps {
  message: ChatMessage;
  onSpeak?: (text: string) => void;
  onCopy?: (text: string) => void;
  isLast?: boolean;
}

function MessageBubble({ message, onSpeak, onCopy, isLast }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';
  const isStreaming = message.isStreaming;

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onCopy?.(message.content);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex gap-4 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      {/* Avatar */}
      <div
        className={`
          flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
          ${isUser ? 'bg-amber-400 text-black' : 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white'}
        `}
      >
        {isUser ? 'U' : 'A'}
      </div>

      {/* Message Content */}
      <div className={`flex-1 max-w-[85%] ${isUser ? 'text-right' : ''}`}>
        <div
          className={`
            inline-block rounded-2xl px-4 py-3 text-[15px] leading-relaxed
            ${isUser
              ? 'bg-amber-400/20 text-amber-50 rounded-tr-sm'
              : 'bg-white/[0.03] text-amber-100/90 rounded-tl-sm border border-white/5'
            }
          `}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose prose-invert prose-sm max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  // Custom code block styling
                  code({ node, className, children, ...props }) {
                    const isInline = !className;
                    if (isInline) {
                      return (
                        <code className="bg-black/40 px-1.5 py-0.5 rounded text-amber-300 text-[13px]" {...props}>
                          {children}
                        </code>
                      );
                    }
                    return (
                      <div className="relative group my-3">
                        <pre className="bg-black/60 rounded-lg p-4 overflow-x-auto border border-white/5">
                          <code className={`${className} text-[13px]`} {...props}>
                            {children}
                          </code>
                        </pre>
                        <button
                          onClick={() => navigator.clipboard.writeText(String(children))}
                          className="absolute top-2 right-2 p-1.5 rounded bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <CopyIcon className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  },
                  // Links
                  a({ href, children }) {
                    return (
                      <a href={href} target="_blank" rel="noopener noreferrer" className="text-amber-300 hover:text-amber-200 underline">
                        {children}
                      </a>
                    );
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>

              {/* Streaming cursor */}
              {isStreaming && (
                <span className="inline-block w-2 h-5 bg-amber-400 ml-1 animate-pulse" />
              )}
            </div>
          )}
        </div>

        {/* Message Actions (for assistant messages) */}
        {!isUser && !isStreaming && message.content && (
          <div className="flex items-center gap-2 mt-2 opacity-0 hover:opacity-100 transition-opacity">
            <button
              onClick={handleCopy}
              className="p-1.5 rounded hover:bg-white/10 text-amber-100/40 hover:text-amber-100/80 transition-colors"
              title="Copy"
            >
              {copied ? (
                <span className="text-green-400 text-xs">Copied!</span>
              ) : (
                <CopyIcon className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={() => onSpeak?.(message.content)}
              className="p-1.5 rounded hover:bg-white/10 text-amber-100/40 hover:text-amber-100/80 transition-colors"
              title="Read aloud"
            >
              <SpeakerIcon className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// Voice Input Button Component
// ─────────────────────────────────────────────────────────────

interface VoiceInputButtonProps {
  isListening: boolean;
  isProcessing: boolean;
  audioLevel: number;
  onStart: () => void;
  onStop: () => void;
}

function VoiceInputButton({ isListening, isProcessing, audioLevel, onStart, onStop }: VoiceInputButtonProps) {
  return (
    <button
      onClick={isListening ? onStop : onStart}
      disabled={isProcessing}
      className={`
        relative p-3 rounded-xl transition-all
        ${isListening
          ? 'bg-red-500/20 text-red-400'
          : 'bg-white/5 text-amber-100/60 hover:bg-white/10 hover:text-amber-100'
        }
        ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      {/* Audio level ring */}
      {isListening && (
        <div
          className="absolute inset-0 rounded-xl border-2 border-red-400 animate-ping"
          style={{ opacity: audioLevel * 0.5 }}
        />
      )}

      {isProcessing ? (
        <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
      ) : (
        <MicIcon className="w-5 h-5" />
      )}
    </button>
  );
}

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
  model = 'gemini-3-flash',
  placeholder = 'Message ACHEEVY...',
  welcomeMessage,
  autoPlayVoice = true,
  showOrchestration = true,
}: ChatInterfaceProps) {
  const [inputValue, setInputValue] = useState('');
  const [showBoard, setShowBoard] = useState(false);
  const [showInputModal, setShowInputModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
    model,
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
    onTranscript: (result) => {
      setInputValue(result.text);
      // Auto-send after voice input
      if (result.text.trim()) {
        handleSend(result.text);
      }
    },
  });

  // Voice output
  const voiceOutput = useVoiceOutput({
    config: { autoPlay: autoPlayVoice, provider: 'elevenlabs' },
  });

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
  // Auto-resize textarea
  // ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [inputValue]);

  // ─────────────────────────────────────────────────────────
  // Send Message Handler
  // ─────────────────────────────────────────────────────────

  const handleSend = useCallback((text?: string) => {
    const messageText = text || inputValue;
    if (!messageText.trim() || isStreaming || isLoading) return;

    // Start orchestration task
    if (showOrchestration) {
      orchestration.startTask(messageText);
      orchestration.addEvent('task_received', `{userName} sent a new request`);
      orchestration.updatePhase('route');
    }

    sendMessage(messageText);
    setInputValue('');

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [inputValue, isStreaming, isLoading, sendMessage, showOrchestration, orchestration]);

  // ─────────────────────────────────────────────────────────
  // Keyboard Handling
  // ─────────────────────────────────────────────────────────

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="relative flex flex-col h-full bg-gradient-to-b from-[#0A0A0A] to-[#111]">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Welcome Message */}
          {messages.length === 0 && welcomeMessage && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                <span className="text-2xl font-bold text-black">A</span>
              </div>
              <h2 className="text-xl font-medium text-amber-50 mb-2">ACHEEVY</h2>
              <p className="text-amber-100/50 max-w-md mx-auto">{welcomeMessage}</p>
            </motion.div>
          )}

          {/* Message List */}
          <AnimatePresence>
            {messages.map((message, index) => (
              <MessageBubble
                key={message.id}
                message={message}
                isLast={index === messages.length - 1}
                onSpeak={(text) => voiceOutput.speak(text)}
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

      {/* Input Area */}
      <div className="border-t border-white/5 bg-black/40 backdrop-blur-sm px-4 py-4">
        <div className="max-w-3xl mx-auto">
          {/* Regenerate button (when there are messages) */}
          {messages.length > 0 && !isStreaming && (
            <div className="flex justify-center mb-3">
              <button
                onClick={regenerate}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-amber-100/50 hover:text-amber-100 hover:bg-white/5 transition-colors"
              >
                <RegenerateIcon className="w-4 h-4" />
                Regenerate response
              </button>
            </div>
          )}

          {/* Input Container */}
          <div className="relative flex items-end gap-3 bg-white/[0.03] border border-white/10 rounded-2xl p-3 focus-within:border-amber-300/30 transition-colors">
            {/* Voice Input */}
            <VoiceInputButton
              isListening={voiceInput.isListening}
              isProcessing={voiceInput.isProcessing}
              audioLevel={voiceInput.audioLevel}
              onStart={voiceInput.startListening}
              onStop={() => voiceInput.stopListening()}
            />

            {/* Text Input */}
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={isStreaming}
              rows={1}
              className="flex-1 bg-transparent text-amber-50 placeholder:text-white/20 resize-none outline-none text-[15px] leading-relaxed max-h-[200px] py-2"
            />

            {/* Department Board Toggle */}
            {showOrchestration && (
              <button
                onClick={() => setShowBoard(true)}
                className="p-3 rounded-xl bg-white/5 text-amber-100/60 hover:bg-white/10 hover:text-amber-100 transition-colors"
                title="View Department Board"
              >
                <BoardIcon className="w-5 h-5" />
              </button>
            )}

            {/* Send / Stop Button */}
            {isStreaming ? (
              <button
                onClick={stopGeneration}
                className="p-3 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
              >
                <StopIcon className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={() => handleSend()}
                disabled={!inputValue.trim() || isLoading}
                className={`
                  p-3 rounded-xl transition-all
                  ${inputValue.trim()
                    ? 'bg-amber-400 text-black hover:bg-amber-300'
                    : 'bg-white/5 text-amber-100/30 cursor-not-allowed'
                  }
                `}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <SendIcon className="w-5 h-5" />
                )}
              </button>
            )}
          </div>

          {/* Voice Output Status */}
          {voiceOutput.isPlaying && (
            <div className="flex items-center justify-center gap-2 mt-3 text-sm text-amber-100/50">
              <div className="flex gap-1">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 h-3 bg-amber-400 rounded-full animate-pulse"
                    style={{ animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </div>
              <span>Speaking...</span>
              <button
                onClick={voiceOutput.stop}
                className="text-amber-300 hover:text-amber-200"
              >
                Stop
              </button>
            </div>
          )}

          {/* Footer */}
          <p className="text-center text-xs text-amber-100/30 mt-3">
            ACHEEVY may produce inaccurate information. Voice powered by ElevenLabs.
          </p>
        </div>
      </div>

      {/* Orchestration Overlay (Glass Box) */}
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
          // Create and submit the change order
          if (orderData.inputs && orderData.inputs.length > 0) {
            const order = changeOrder.createChangeOrder({
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

      {/* Change Order Cost Tracker (bottom-left) */}
      {changeOrder.totalCost > 0 && (
        <div className="fixed bottom-4 left-4 px-3 py-2 bg-black/80 border border-white/10 rounded-lg text-xs z-40">
          <p className="text-amber-100/50">Change Orders</p>
          <p className="text-amber-300 font-medium">
            {formatCurrency(changeOrder.totalCost)} ({changeOrder.totalTokensUsed.toLocaleString()} tokens)
          </p>
        </div>
      )}
    </div>
  );
}
