'use client';

/**
 * Floating ACHEEVY Launcher
 *
 * Persistent center-bottom pill that launches the full
 * Chat w/ACHEEVY interface. Positioned with sticky scroll
 * and proper spacing so it never interferes with the main UI.
 *
 * - Click the pill → navigates to /chat
 * - Type + Enter  → navigates to /chat?q=<message>
 * - Cmd/Ctrl + J  → focuses the input
 * - Escape        → blurs focus
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

// ─────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────

const SendIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
  </svg>
);

const SparkleIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
  </svg>
);

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

export function FloatingACHEEVY() {
  const router = useRouter();
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Navigate to the full chat interface
  const openChat = useCallback((prefill?: string) => {
    if (prefill?.trim()) {
      router.push(`/chat?q=${encodeURIComponent(prefill.trim())}`);
    } else {
      router.push('/chat');
    }
    setInputValue('');
    setIsFocused(false);
    inputRef.current?.blur();
  }, [router]);

  // Keyboard shortcut: Cmd/Ctrl + J to focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        inputRef.current?.blur();
        setIsFocused(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle enter key → open chat with text
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      openChat(inputValue);
    }
  };

  return (
    <div className="fixed left-1/2 -translate-x-1/2 z-50 pointer-events-none" style={{ bottom: 'calc(var(--frame-inset, 12px) + 16px)' }}>
      <motion.div
        layout
        className="pointer-events-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
      >
        <motion.div
          animate={{ width: isFocused || inputValue ? 360 : 220 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center gap-2.5 bg-[#111111]/90 border border-wireframe-stroke rounded-full px-4 py-2.5 shadow-[0_4px_24px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur-xl hover:border-gold/30 hover:shadow-[0_4px_24px_rgba(0,0,0,0.5),0_0_20px_rgba(212,175,55,0.08)] transition-all duration-300"
        >
          {/* ACHEEVY avatar — click to open chat */}
          <button
            onClick={() => openChat()}
            className="w-6 h-6 rounded-lg bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center flex-shrink-0 transition-transform hover:scale-110 active:scale-95"
            title="Open Chat w/ACHEEVY"
          >
            <span className="text-[10px] font-bold text-black">A</span>
          </button>

          {/* Input */}
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 150)}
            onKeyDown={handleKeyDown}
            placeholder="Chat w/ACHEEVY..."
            className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 outline-none min-w-0"
          />

          {/* Send button */}
          <AnimatePresence>
            {inputValue ? (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => openChat(inputValue)}
                className="p-1.5 rounded-full bg-gold text-black hover:bg-gold-light transition-colors flex-shrink-0"
                title="Send & open chat"
              >
                <SendIcon className="w-3.5 h-3.5" />
              </motion.button>
            ) : isFocused ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <SparkleIcon className="w-3.5 h-3.5 text-gold/40 flex-shrink-0" />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </motion.div>

        {/* Keyboard hint */}
        <AnimatePresence>
          {!isFocused && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center mt-1.5"
            >
              <span className="text-[10px] text-white/20 font-mono">
                <kbd className="px-1 py-0.5 rounded border border-white/10 bg-white/5 text-white/30 text-[9px]">&#8984;J</kbd>
                {' '}to focus
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

export default FloatingACHEEVY;
