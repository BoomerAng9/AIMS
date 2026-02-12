'use client';

/**
 * Floating Chat w/ACHEEVY — Command Console Interface
 *
 * Not a generic chat bubble. This is:
 * - A command console
 * - A summon interface
 * - A persistent assistant presence
 *
 * Minimal, intelligent, integrated into the layout.
 */

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, X, ChevronUp, Zap } from 'lucide-react';
import { scaleFade, fade } from '@/lib/motion';

const AcheevyChat = dynamic(() => import('./AcheevyChat'), { ssr: false });
const AcheevyAgent = dynamic(() => import('./AcheevyAgent'), { ssr: false });

export default function FloatingChat() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'chat' | 'voice'>('chat');

  return (
    <>
      {/* ── Chat Panel ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="chat-overlay"
            variants={fade}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-50 flex items-end justify-end p-0 sm:p-4"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm sm:bg-black/50"
              onClick={() => setOpen(false)}
            />

            {/* Console Panel */}
            <motion.div
              variants={scaleFade}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="relative z-10 flex flex-col w-full sm:w-[480px] h-full sm:h-[700px] sm:max-h-[85vh] sm:rounded-2xl overflow-hidden border-0 sm:border border-wireframe-stroke bg-[#0A0A0A] shadow-2xl shadow-black/60"
            >
              {/* Console Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-wireframe-stroke bg-black/80 backdrop-blur-xl">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-gold/20 flex items-center justify-center overflow-hidden">
                      <Image
                        src="/images/acheevy/acheevy-helmet.png"
                        alt="ACHEEVY"
                        width={22}
                        height={22}
                        className="object-contain"
                      />
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-[#0A0A0A] animate-pulse" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-white tracking-wide">
                      {mode === 'chat' ? 'Chat w/ACHEEVY' : 'ACHEEVY Voice'}
                    </span>
                    <div className="flex items-center gap-1 text-[9px] text-emerald-400/80 font-mono uppercase tracking-widest">
                      <Zap className="w-2 h-2" /> Active
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {/* Mode toggle — text/voice */}
                  <button
                    type="button"
                    onClick={() => setMode(mode === 'chat' ? 'voice' : 'chat')}
                    title={mode === 'chat' ? 'Switch to voice agent' : 'Switch to text chat'}
                    className={`p-2 rounded-lg transition-all ${
                      mode === 'voice'
                        ? 'text-gold bg-gold/10 border border-gold/20'
                        : 'text-white/40 hover:text-white/70 border border-transparent hover:border-wireframe-stroke'
                    }`}
                  >
                    <Mic size={16} />
                  </button>
                  <button
                    onClick={() => setOpen(false)}
                    aria-label="Close Console"
                    className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all border border-transparent hover:border-wireframe-stroke"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Console Body */}
              <div className="flex-1 overflow-hidden">
                {mode === 'chat' ? <AcheevyChat /> : <AcheevyAgent />}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Summon Bar — Command Console Trigger ── */}
      <AnimatePresence>
        {!open && (
          <motion.div
            key="summon-bar"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40"
          >
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="group flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#0A0A0A]/95 border border-wireframe-stroke hover:border-gold/30 backdrop-blur-xl shadow-2xl shadow-black/40 transition-all hover:shadow-[0_0_30px_rgba(212,175,55,0.1)]"
              aria-label="Open ACHEEVY Console"
            >
              {/* ACHEEVY Avatar */}
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center overflow-hidden group-hover:bg-gold/15 transition-colors">
                  <Image
                    src="/images/acheevy/acheevy-helmet.png"
                    alt="ACHEEVY"
                    width={24}
                    height={24}
                    className="object-contain"
                  />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#0A0A0A]">
                  <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-40" />
                </div>
              </div>

              {/* Label */}
              <div className="hidden sm:block">
                <div className="text-xs font-semibold text-white/80 group-hover:text-gold transition-colors">
                  Chat w/ACHEEVY
                </div>
                <div className="text-[9px] text-white/25 font-mono uppercase tracking-wider">
                  Command Console
                </div>
              </div>

              {/* Expand indicator */}
              <ChevronUp className="w-4 h-4 text-white/20 group-hover:text-gold/60 transition-colors" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
