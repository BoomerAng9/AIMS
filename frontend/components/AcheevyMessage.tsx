'use client';

/**
 * AcheevyMessage Component
 *
 * Extracted from AcheevyChat to optimize rendering performance.
 * Memoized to prevent re-renders of the entire chat list during:
 * - Voice playback progress updates (60fps)
 * - Text streaming updates (only the last message should update)
 */

import React, { memo } from 'react';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { User, Play, Pause, RotateCcw } from 'lucide-react';
import type { Message } from 'ai';
import { motion } from 'framer-motion';
import { fadeInUp } from '@/lib/motion/tokens';
import { ReadReceiptChip } from '@/components/chat/ReadReceipt';
import type { ReadReceipt } from '@/lib/acheevy/read-receipt';

interface AcheevyMessageProps {
  message: Message;
  isSpeaking: boolean;
  isLoading: boolean;
  isLast: boolean;
  readReceipt?: ReadReceipt;
  onSpeak: (id: string, content: string) => void;
  onPause: () => void;
  onReplay: (id: string, content: string) => void;
}

/**
 * Custom areEqual comparator — prevents re-renders during streaming
 * unless something visible in this specific message changed.
 * Adapted from branches 4/6 bolt optimization analysis.
 */
function areEqual(prev: AcheevyMessageProps, next: AcheevyMessageProps): boolean {
  // 1. If "last message" status changed, re-render (cursor may appear/disappear)
  if (prev.isLast !== next.isLast) return false;
  // 2. If this IS the last message and loading state changed, re-render (streaming cursor)
  if (next.isLast && prev.isLoading !== next.isLoading) return false;
  // 3. Content changed (streaming chunks arriving)
  if (prev.message.content !== next.message.content) return false;
  // 4. Role changed (shouldn't happen, but be safe)
  if (prev.message.role !== next.message.role) return false;
  // 5. Speaking state changed (TTS highlight ring)
  if (prev.isSpeaking !== next.isSpeaking) return false;
  // 6. Read receipt changed
  if (prev.readReceipt !== next.readReceipt) return false;
  return true;
}

const AcheevyMessage = memo(function AcheevyMessage({
  message: m,
  isSpeaking,
  isLoading,
  isLast,
  readReceipt,
  onSpeak,
  onPause,
  onReplay,
}: AcheevyMessageProps) {
  return (
    <motion.div
      variants={fadeInUp}
      // Assuming a staggerContainer is wrapping these messages in AcheevyChat
      className="flex flex-col gap-1"
    >
      <div className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
        {m.role === 'assistant' && (
          <div className={`w-7 h-7 rounded-lg bg-gold/10 border border-gold/30 flex items-center justify-center flex-shrink-0 mt-0.5 overflow-hidden shadow-[inset_0_0_15px_rgba(214,175,55,0.05)] ${isSpeaking ? 'ring-2 ring-gold/40 animate-pulse' : ''
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
        <div className={`relative group px-4 py-3 rounded-2xl text-base leading-relaxed max-w-[85%] ${m.role === 'user'
            ? 'bg-white/5 text-white rounded-tr-sm border border-wireframe-stroke shadow-sm'
            : 'glass-card border border-gold/10 bg-[#0a0a0a]/60 text-white/90 rounded-tl-sm shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5)]'
          }`}>
          {m.role === 'user' ? (
            m.content
          ) : (
            <div className="prose prose-invert prose-base max-w-none prose-code:text-gold prose-code:bg-black/40 prose-code:px-1 prose-code:rounded prose-p:text-white/90 prose-strong:text-white prose-li:text-white/80">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
              {isLoading && isLast && (
                <span className="inline-block w-1.5 h-4 bg-gold ml-0.5 animate-pulse" />
              )}
            </div>
          )}
          {/* Per-message playback controls for assistant messages */}
          {m.role === 'assistant' && m.id !== 'welcome' && !isLoading && (
            <div className="flex items-center gap-1 mt-2 pt-2 border-t border-wireframe-stroke opacity-0 group-hover:opacity-100 transition-opacity">
              {isSpeaking ? (
                <button
                  type="button"
                  onClick={onPause}
                  title="Pause"
                  className="p-1 rounded text-gold/60 hover:text-gold hover:bg-gold/10 transition-colors"
                >
                  <Pause size={12} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onSpeak(m.id, m.content)}
                  title="Speak this message"
                  className="p-1 rounded text-white/30 hover:text-gold hover:bg-gold/10 transition-colors"
                >
                  <Play size={12} />
                </button>
              )}
              <button
                type="button"
                onClick={() => onReplay(m.id, m.content)}
                title="Replay"
                className="p-1 rounded text-white/30 hover:text-gold hover:bg-gold/10 transition-colors"
              >
                <RotateCcw size={12} />
              </button>
            </div>
          )}
        </div>
        {m.role === 'user' && (
          <div className="w-7 h-7 rounded-lg bg-white/5 border border-wireframe-stroke flex items-center justify-center flex-shrink-0 mt-0.5">
            <User className="w-3.5 h-3.5 text-white/50" />
          </div>
        )}
      </div>
      {/* Read Receipt — collapsible chip below assistant responses */}
      {m.role === 'assistant' && m.id !== 'welcome' && !isLoading && readReceipt && (
        <div className="ml-10">
          <ReadReceiptChip receipt={readReceipt} />
        </div>
      )}
    </motion.div>
  );
}, areEqual);

export default AcheevyMessage;
