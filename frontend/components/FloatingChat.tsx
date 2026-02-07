'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { MessageSquare, X } from 'lucide-react';

const AcheevyChat = dynamic(() => import('./AcheevyChat'), { ssr: false });

export default function FloatingChat() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Floating chat panel */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-end p-4 sm:items-stretch sm:justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 sm:hidden"
            onClick={() => setOpen(false)}
          />
          {/* Chat window */}
          <div className="relative z-10 flex flex-col w-full sm:w-[480px] h-[85vh] sm:h-[700px] max-h-[85vh] rounded-2xl border border-amber-400/20 bg-[#0a0a0a] shadow-2xl shadow-amber-900/20 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-amber-400/10 bg-gradient-to-r from-amber-950/40 to-transparent">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-sm font-semibold text-amber-200 tracking-wide">ACHEEVY</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded-lg text-amber-200/60 hover:text-amber-200 hover:bg-amber-200/10 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            {/* Chat body */}
            <div className="flex-1 overflow-hidden">
              <AcheevyChat />
            </div>
          </div>
        </div>
      )}

      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-black shadow-lg shadow-amber-900/40 hover:shadow-amber-500/50 hover:scale-105 transition-all"
          aria-label="Open ACHEEVY Chat"
        >
          <MessageSquare size={24} />
        </button>
      )}
    </>
  );
}
