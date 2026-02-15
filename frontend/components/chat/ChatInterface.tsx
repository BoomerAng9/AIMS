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
import Image from 'next/image';
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
import { PERSONAS } from '@/lib/acheevy/persona';

// ─────────────────────────────────────────────────────────────
// Priority Model Roster (mirrors /api/chat PRIORITY_MODELS)
// ─────────────────────────────────────────────────────────────

const AI_MODELS = [
  { key: 'claude-opus',   label: 'Claude Opus 4.6',     tag: '' },
  { key: 'claude-sonnet', label: 'Claude Sonnet 4.6',   tag: '' },
  { key: 'qwen',          label: 'Qwen 2.5 Coder 32B', tag: 'code' },
  { key: 'qwen-max',      label: 'Qwen Max',            tag: '' },
  { key: 'minimax',       label: 'MiniMax-01',          tag: '' },
  { key: 'glm',           label: 'GLM-5',                tag: '' },
  { key: 'kimi',          label: 'Kimi K2.5',           tag: 'fast' },
  { key: 'nano-banana',   label: 'Nano Banana Pro',     tag: 'fast' },
  { key: 'gemini-pro',    label: 'Gemini 2.5 Pro',      tag: '' },
];

// ─────────────────────────────────────────────────────────────
// Icons (inline SVG for simplicity)
// ─────────────────────────────────────────────────────────────

const GlobeIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const UserIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

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

const BrainCircuitIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="4" r="2" />
    <circle cx="4" cy="12" r="2" />
    <circle cx="20" cy="12" r="2" />
    <circle cx="12" cy="20" r="2" />
    <path d="M12 6v4m0 4v4M6 12h4m4 0h4" />
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
      {isUser ? (
        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium bg-gold/20 border border-gold/30 text-gold">
          U
        </div>
      ) : (
        <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden bg-gold/10 border border-gold/20">
          <Image
            src="/images/acheevy/acheevy-helmet.png"
            alt="ACHEEVY"
            width={32}
            height={32}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Message Content */}
      <div className={`flex-1 max-w-[85%] ${isUser ? 'text-right' : ''}`}>
        <div
          className={`
            inline-block rounded-2xl px-4 py-3 text-[15px] leading-relaxed
            ${isUser
              ? 'bg-gold/10 text-white rounded-tr-sm border border-gold/20'
              : 'wireframe-card text-white/90 rounded-tl-sm'
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
                        <code className="bg-black/40 px-1.5 py-0.5 rounded text-gold text-[13px]" {...props}>
                          {children}
                        </code>
                      );
                    }
                    return (
                      <div className="relative group my-3">
                        <pre className="bg-black/60 rounded-lg p-4 overflow-x-auto border border-wireframe-stroke">
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
                      <a href={href} target="_blank" rel="noopener noreferrer" className="text-gold hover:text-gold underline">
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
                <span className="inline-block w-2 h-5 bg-gold ml-1 animate-pulse" />
              )}
            </div>
          )}
        </div>

        {/* Message Actions (for assistant messages) */}
        {!isUser && !isStreaming && message.content && (
          <div className="flex items-center gap-2 mt-2 opacity-0 hover:opacity-100 transition-opacity">
            <button
              onClick={handleCopy}
              className="p-1.5 rounded hover:bg-white/10 text-white/30 hover:text-white/70 transition-colors"
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
              className="p-1.5 rounded hover:bg-white/10 text-white/30 hover:text-white/70 transition-colors"
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
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!isListening) { setElapsed(0); return; }
    const t = setInterval(() => setElapsed(s => s + 1), 1000);
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
            : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'
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
          <div className="w-5 h-5 border-2 border-gold border-t-transparent rounded-full animate-spin" />
        ) : (
          <MicIcon className="w-5 h-5" />
        )}
      </button>

      {/* Recording timer + level indicator */}
      {isListening && (
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs font-mono text-red-400">{fmt(elapsed)}</span>
          <div className="flex gap-0.5 items-end h-4">
            {[0.3, 0.6, 1, 0.7, 0.4].map((scale, i) => (
              <div
                key={i}
                className="w-0.5 bg-red-400/60 rounded-full transition-all duration-75"
                style={{ height: `${Math.max(4, audioLevel * scale * 16)}px` }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Processing indicator */}
      {isProcessing && (
        <span className="text-xs text-gold/60 animate-pulse">Transcribing...</span>
      )}
    </div>
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
  const [voiceTranscriptReady, setVoiceTranscriptReady] = useState(false);
  
  // New State for Persona and Language
  const [selectedPersona, setSelectedPersona] = useState(PERSONAS[0].id);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [selectedModel, setSelectedModel] = useState('claude-opus');

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
      // Focus the textarea so user can edit immediately
      setTimeout(() => textareaRef.current?.focus(), 100);
    },
  });

  // Voice output
  const voiceOutput = useVoiceOutput({
    config: { 
      autoPlay: autoPlayVoice, 
      provider: 'elevenlabs',
      voiceId: PERSONAS.find(p => p.id === selectedPersona)?.voiceId
    },
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
    setVoiceTranscriptReady(false);

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
    <div className="relative flex flex-col h-full bg-[#0A0A0A] aims-page-bg">
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
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gold/10 border border-gold/20 overflow-hidden">
                <Image
                  src="/images/acheevy/acheevy-helmet.png"
                  alt="ACHEEVY"
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Persona Selector (Main View) — only show when multiple personas exist */}
              {PERSONAS.length > 1 && (
              <div className="flex justify-center mb-4">
                <div className="flex items-center gap-2 bg-white/5 rounded-full px-1 py-1 border border-white/10">
                  {PERSONAS.map(p => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPersona(p.id)}
                      className={`
                        px-3 py-1.5 rounded-full text-xs font-medium transition-all
                        ${selectedPersona === p.id
                          ? 'bg-gold text-black shadow-lg shadow-gold/20'
                          : 'text-white/50 hover:text-white hover:bg-white/5'}
                      `}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
              )}

              <h2 className="text-xl font-medium text-white mb-2">Chat w/ACHEEVY</h2>
              <p className="text-white/40 max-w-md mx-auto">{welcomeMessage}</p>
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
      <div className="border-t border-wireframe-stroke bg-[#0A0A0A]/80 backdrop-blur-xl px-4 py-4">
        <div className="max-w-3xl mx-auto">
          {/* Regenerate button (when there are messages) */}
          {messages.length > 0 && !isStreaming && (
            <div className="flex justify-center mb-3">
              <button
                onClick={regenerate}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-white/40 hover:text-white hover:bg-white/5 transition-colors"
              >
                <RegenerateIcon className="w-4 h-4" />
                Regenerate response
              </button>
            </div>
          )}

          {/* Input Container */}
          <div className="flex justify-end mb-2 gap-2">
             {/* Model Selector */}
             <div className="flex items-center gap-1 bg-white/5 rounded-lg px-2 py-1 text-xs text-white/50 hover:bg-white/10 transition-colors">
               <BrainCircuitIcon className="w-3 h-3" />
               <select 
                 value={selectedModel}
                 onChange={(e) => setSelectedModel(e.target.value)}
                 className="bg-transparent border-none outline-none text-white/70 text-xs cursor-pointer appearance-none pr-4"
                 title="Select AI Model"
               >
                 {AI_MODELS.map(m => (
                   <option key={m.key} value={m.key} className="bg-[#0A0A0A]">
                     {m.label}{m.tag ? ` (${m.tag})` : ''}
                   </option>
                 ))}
               </select>
             </div>

             {/* Voice/Persona Selector — only show when multiple personas exist */}
             {PERSONAS.length > 1 && (
             <div className="flex items-center gap-1 bg-white/5 rounded-lg px-2 py-1 text-xs text-white/50 hover:bg-white/10 transition-colors">
               <SpeakerIcon className="w-3 h-3" />
               <select
                 value={selectedPersona}
                 onChange={(e) => setSelectedPersona(e.target.value)}
                 className="bg-transparent border-none outline-none text-white/70 text-xs cursor-pointer appearance-none pr-4"
                 title="Select Voice Persona"
               >
                 {PERSONAS.map(p => (
                   <option key={p.id} value={p.id} className="bg-[#0A0A0A]">
                     {p.name}
                   </option>
                 ))}
               </select>
             </div>
             )}

             {/* Language Selector */}
             <div className="flex items-center gap-1 bg-white/5 rounded-lg px-2 py-1 text-xs text-white/50 hover:bg-white/10 transition-colors">
               <GlobeIcon className="w-3 h-3" />
               <select 
                 value={selectedLanguage}
                 onChange={(e) => setSelectedLanguage(e.target.value)}
                 className="bg-transparent border-none outline-none text-white/70 text-xs cursor-pointer appearance-none"
               >
                 <option value="en" className="bg-[#0A0A0A]">EN</option>
                 <option value="es" className="bg-[#0A0A0A]">ES</option>
                 <option value="fr" className="bg-[#0A0A0A]">FR</option>
                 <option value="de" className="bg-[#0A0A0A]">DE</option>
                 <option value="zh" className="bg-[#0A0A0A]">ZH</option>
                 <option value="ja" className="bg-[#0A0A0A]">JA</option>
               </select>
             </div>
          </div>

          {/* Voice transcript ready indicator */}
          {voiceTranscriptReady && inputValue.trim() && (
            <div className="flex items-center gap-2 px-3 py-1.5 mb-2 rounded-lg bg-gold/5 border border-gold/15 text-xs text-gold/70">
              <MicIcon className="w-3 h-3" style={{}} />
              <span>Voice transcript ready — review and press Enter to send</span>
              <button
                onClick={() => { setInputValue(''); setVoiceTranscriptReady(false); }}
                className="ml-auto text-white/30 hover:text-white/60 transition-colors"
              >
                Clear
              </button>
            </div>
          )}

          <div className={`relative flex items-end gap-3 wireframe-card rounded-2xl p-3 focus-within:border-gold/30 transition-colors ${voiceTranscriptReady ? 'border-gold/20' : ''}`}>
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
              className="flex-1 bg-transparent text-white placeholder:text-white/20 resize-none outline-none text-[15px] leading-relaxed max-h-[200px] py-2"
            />

            {/* Department Board Toggle */}
            {showOrchestration && (
              <button
                onClick={() => setShowBoard(true)}
                className="p-3 rounded-xl bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-colors"
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
                    ? 'bg-gold text-black hover:bg-gold-light'
                    : 'bg-white/5 text-white/20 cursor-not-allowed'
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
            <div className="flex items-center justify-center gap-2 mt-3 text-sm text-white/40">
              <div className="flex gap-1">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 h-3 bg-gold rounded-full animate-pulse"
                    style={{ animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </div>
              <span>Speaking...</span>
              <button
                onClick={voiceOutput.stop}
                className="text-gold hover:text-gold"
              >
                Stop
              </button>
            </div>
          )}

          {/* Footer */}
          <p className="text-center text-xs text-white/20 mt-3">
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
        <div className="fixed bottom-4 left-4 px-3 py-2 wireframe-card text-xs z-40">
          <p className="text-white/40">Change Orders</p>
          <p className="text-gold font-mono font-medium">
            {formatCurrency(changeOrder.totalCost)} ({changeOrder.totalTokensUsed.toLocaleString()} tokens)
          </p>
        </div>
      )}
    </div>
  );
}
