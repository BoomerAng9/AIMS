'use client';

/**
 * ChatInterface Component
 * Modern chat UI with streaming, voice I/O, and markdown support
 * Inspired by Claude, ChatGPT, and Kimi interfaces
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useStreamingChat } from '@/hooks/useStreamingChat';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { useVoiceOutput } from '@/hooks/useVoiceOutput';
import type { ChatMessage } from '@/lib/chat/types';

// ─────────────────────────────────────────────────────────────
// Icons (inline SVG for simplicity)
// ─────────────────────────────────────────────────────────────

const MicIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);

const SendIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const StopIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="6" width="12" height="12" rx="2" />
  </svg>
);

const SpeakerIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
  </svg>
);

const CopyIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const RegenerateIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
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
  model?: string;
  placeholder?: string;
  welcomeMessage?: string;
  autoPlayVoice?: boolean;
}

export function ChatInterface({
  sessionId,
  model = 'gemini-3-flash',
  placeholder = 'Message ACHEEVY...',
  welcomeMessage,
  autoPlayVoice = true,
}: ChatInterfaceProps) {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
    onMessageComplete: (message) => {
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

    sendMessage(messageText);
    setInputValue('');

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [inputValue, isStreaming, isLoading, sendMessage]);

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
    <div className="flex flex-col h-full bg-gradient-to-b from-[#0A0A0A] to-[#111]">
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
    </div>
  );
}
