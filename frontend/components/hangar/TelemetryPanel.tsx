'use client';

/**
 * TelemetryPanel — Scrolling event log on the left side
 */

import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHangarStore } from '@/lib/hangar/store';
import type { TelemetryEntry } from '@/lib/hangar/store';

const TYPE_COLORS: Record<TelemetryEntry['type'], string> = {
  info: 'text-white/50',
  action: 'text-[#2BD4FF]',
  complete: 'text-[#C6A74E]',
  error: 'text-red-400',
};

const TYPE_DOTS: Record<TelemetryEntry['type'], string> = {
  info: 'bg-white/30',
  action: 'bg-[#2BD4FF]',
  complete: 'bg-[#C6A74E]',
  error: 'bg-red-400',
};

export default function TelemetryPanel() {
  const telemetry = useHangarStore((s) => s.telemetry);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new entries
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [telemetry.length]);

  return (
    <div className="h-full bg-black/40 backdrop-blur-md border border-white/10 rounded-xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 shrink-0">
        <div className="text-xs text-[#C6A74E] uppercase tracking-widest font-medium">
          Telemetry
        </div>
        <div className="text-[10px] text-white/30 mt-0.5">
          {telemetry.length} events
        </div>
      </div>

      {/* Scrollable log */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        <AnimatePresence initial={false}>
          {telemetry.map((entry) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-start gap-2 py-1"
            >
              <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${TYPE_DOTS[entry.type]}`} />
              <div className="min-w-0">
                <div className={`text-xs font-medium ${TYPE_COLORS[entry.type]}`}>
                  {entry.label}
                </div>
                <div className="text-[10px] text-white/25 truncate">
                  {entry.detail}
                </div>
              </div>
              <div className="text-[9px] text-white/20 ml-auto shrink-0">
                {new Date(entry.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {telemetry.length === 0 && (
          <div className="text-xs text-white/20 text-center py-8">
            Waiting for events...
          </div>
        )}
      </div>
    </div>
  );
}
