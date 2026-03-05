'use client';

/**
 * AcheevyMessage — Agentic-UI-styled message bubble for ACHEEVY chat
 *
 * Replaces the hand-rolled MessageBubble with a component that uses
 * agentic-ui primitives (Badge, Button) and follows the agentic design
 * system patterns (CVA-style role variants, consistent spacing).
 *
 * Preserves all A.I.M.S.-specific features:
 * - ACHEEVY helmet avatar (assistant) / gold-accent user avatar
 * - ReactMarkdown with remarkGfm + custom code styling
 * - Tool execution card rendering
 * - File deliverable groups
 * - Copy / speak actions
 * - Streaming cursor animation
 */

import { useState, memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Image from 'next/image';
import { Button } from 'agentic-ui';
import { Copy, Check, Volume2 } from 'lucide-react';
import { spring } from '@/lib/motion/tokens';
import { FileDownloadGroup } from '@/components/chat/FileDownload';
import { ToolExecutionCard } from '@/components/chat/ToolExecutionCard';
import { GenerativeRenderer } from '@/components/chat/generative';
import type { ChatMessage } from '@/lib/chat/types';
import type { ToolExecutionEvent } from '@/lib/chat/types';

// ─────────────────────────────────────────────────────────────
// Stable module-level constants (prevent re-render from referential inequality)
// ─────────────────────────────────────────────────────────────

const REMARK_PLUGINS = [remarkGfm];

const MARKDOWN_COMPONENTS = {
  code({ node, className, children, ...props }: any) {
    const isInline = !className;
    if (isInline) {
      return (
        <code className="bg-white/8 px-1.5 py-0.5 rounded text-gold/80 text-[13px]" {...props}>
          {children}
        </code>
      );
    }
    return (
      <div className="relative group my-3">
        <pre className="bg-white/5 rounded-lg p-4 overflow-x-auto border border-white/8">
          <code className={`${className} text-[13px]`} {...props}>
            {children}
          </code>
        </pre>
        <button
          onClick={() => navigator.clipboard.writeText(String(children))}
          title="Copy code"
          className="absolute top-2 right-2 p-1.5 rounded bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Copy className="w-4 h-4" />
        </button>
      </div>
    );
  },
  a({ href, children }: any) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="text-gold hover:text-gold-light underline">
        {children}
      </a>
    );
  },
};

// ─────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────

export interface AcheevyMessageProps {
  message: ChatMessage;
  onSpeak?: (text: string) => void;
  onCopy?: (text: string) => void;
  isLast?: boolean;
}

// ─────────────────────────────────────────────────────────────
// AcheevyMessage Component
// ─────────────────────────────────────────────────────────────

export const AcheevyMessage = memo(function AcheevyMessage({
  message,
  onSpeak,
  onCopy,
  isLast,
}: AcheevyMessageProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';
  const isStreaming = message.isStreaming;

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onCopy?.(message.content);
  }, [message.content, onCopy]);

  const handleSpeak = useCallback(() => {
    onSpeak?.(message.content);
  }, [message.content, onSpeak]);

  // Tool execution cards render without avatar/bubble
  const toolExecution = message.metadata?.toolExecution as ToolExecutionEvent | undefined;
  if (toolExecution && !message.content) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <ToolExecutionCard event={toolExecution} />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring.snappy}
      className={`group flex gap-4 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      {/* ── Avatar ─────────────────────────────────────────── */}
      {isUser ? (
        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold bg-gold/15 border border-gold/25 text-gold shadow-[0_0_8px_rgba(217,119,6,0.1)]">
          U
        </div>
      ) : (
        <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden bg-gold/10 border border-gold/20 shadow-[0_0_10px_rgba(217,119,6,0.08)]">
          <Image
            src="/images/acheevy/acheevy-helmet.png"
            alt="ACHEEVY"
            width={32}
            height={32}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* ── Message Body ───────────────────────────────────── */}
      <div className={`flex-1 max-w-[85%] ${isUser ? 'text-right' : ''}`}>
        {/* Bubble */}
        <div
          className={`
            inline-block rounded-2xl px-4 py-3 text-[15px] leading-relaxed
            ${isUser
              ? 'bg-gold/10 text-zinc-100 rounded-tr-sm border border-gold/20'
              : 'bg-surface-raised/60 text-zinc-100 rounded-tl-sm border border-wireframe-stroke backdrop-blur-sm'
            }
          `}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose prose-invert prose-sm max-w-none">
              <ReactMarkdown
                remarkPlugins={REMARK_PLUGINS}
                components={MARKDOWN_COMPONENTS}
              >
                {message.content}
              </ReactMarkdown>

              {/* Streaming cursor */}
              {isStreaming && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ repeat: Infinity, duration: 0.8 }}
                  className="inline-block w-2 h-5 bg-gold ml-1 rounded-sm"
                />
              )}
            </div>
          )}
        </div>

        {/* ── Generative Blocks ──────────────────────────── */}
        {!isUser && Array.isArray(message.blocks) && message.blocks.length > 0 && (
          <div className="mt-3">
            <GenerativeRenderer
              blocks={message.blocks}
              onAction={(blockId, action, data) => {
                // Dispatch to bridge or event bus
                console.log('[GenerativeBlock Action]', { blockId, action, data });
              }}
            />
          </div>
        )}

        {/* ── File Deliverables ────────────────────────────── */}
        {!isUser && !isStreaming && Array.isArray(message.metadata?.files) && (
          <div className="mt-2">
            <FileDownloadGroup
              files={
                message.metadata.files as Array<{
                  content: string;
                  filename?: string;
                  format?: 'md' | 'json' | 'csv' | 'txt' | 'html';
                  label?: string;
                }>
              }
            />
          </div>
        )}

        {/* ── Message Actions ──────────────────────────────── */}
        {!isUser && !isStreaming && message.content && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCopy}
              className="h-7 w-7 text-zinc-500 hover:text-zinc-300"
              title="Copy"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-green-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSpeak}
              className="h-7 w-7 text-zinc-500 hover:text-zinc-300"
              title="Read aloud"
            >
              <Volume2 className="w-3.5 h-3.5" />
            </Button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
});
