'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Mic, X } from 'lucide-react';
import { scaleFade, fade } from '@/lib/motion';

const AcheevyChat = dynamic(() => import('./AcheevyChat'), { ssr: false });
const AcheevyAgent = dynamic(() => import('./AcheevyAgent'), { ssr: false });

export default function FloatingChat() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'chat' | 'voice'>('chat');

  return (
    <>
      {/* Floating chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="chat-overlay"
            variants={fade}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-50 flex items-end justify-end p-4 sm:items-stretch sm:justify-end"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 sm:hidden"
              onClick={() => setOpen(false)}
            />
            {/* Chat window */}
            <motion.div
              variants={scaleFade}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="relative z-10 flex flex-col w-full sm:w-[480px] h-[85vh] sm:h-[700px] max-h-[85vh] rounded-2xl border border-amber-400/20 bg-[#0a0a0a] shadow-2xl shadow-amber-900/20 overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-amber-400/10 bg-gradient-to-r from-amber-950/40 to-transparent">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-sm font-semibold text-amber-200 tracking-wide">
                    {mode === 'chat' ? 'Chat w/ACHEEVY' : 'ACHEEVY Agent'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {/* Mode toggle */}
                  <button
                    type="button"
                    onClick={() => setMode(mode === 'chat' ? 'voice' : 'chat')}
                    title={mode === 'chat' ? 'Switch to voice agent' : 'Switch to text chat'}
                    className={`p-1.5 rounded-lg transition-colors ${
                      mode === 'voice'
                        ? 'text-amber-300 bg-amber-500/10'
                        : 'text-amber-200/40 hover:text-amber-200/70'
                    }`}
                  >
                    <Mic size={16} />
                  </button>
                  <button
                    onClick={() => setOpen(false)}
                    aria-label="Close Chat"
                    className="p-1 rounded-lg text-amber-200/60 hover:text-amber-200 hover:bg-amber-200/10 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
              {/* Body */}
              <div className="flex-1 overflow-hidden">
                {mode === 'chat' ? <AcheevyChat /> : <AcheevyAgent />}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            key="chat-fab"
            type="button"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 z-40 flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-black shadow-lg shadow-amber-900/40 hover:shadow-amber-500/50 transition-shadow"
            aria-label="Open ACHEEVY Chat"
          >
            <MessageSquare size={24} />
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}
