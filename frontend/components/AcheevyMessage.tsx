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
    <div className="flex flex-col gap-1">
      <div className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
        {m.role === 'assistant' && (
          <div className={`w-7 h-7 rounded-lg bg-white/5 border border-gold/10 flex items-center justify-center flex-shrink-0 mt-0.5 overflow-hidden ${
            isSpeaking ? 'ring-2 ring-gold/40 animate-pulse' : ''
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
        <div className={`relative group px-4 py-3 rounded-2xl text-sm leading-relaxed max-w-[85%] ${
          m.role === 'user'
            ? 'bg-gold/10 text-white rounded-tr-sm border border-gold/20'
            : 'wireframe-card text-white/90 rounded-tl-sm'
        }`}>
          {m.role === 'user' ? (
            m.content
          ) : (
            <div className="prose prose-invert prose-sm max-w-none prose-code:text-gold prose-code:bg-black/40 prose-code:px-1 prose-code:rounded">
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
    </div>
  );
});

export default AcheevyMessage;
