'use client';

/**
 * TokenMeter — Bottom-center token/phase progress indicator
 */

import { useHangarStore } from '@/lib/hangar/store';
import { PHASE_ORDER, getPhaseLabel } from '@/lib/hangar/eventSchema';
import { motion } from 'framer-motion';

export default function TokenMeter() {
  const currentPhase = useHangarStore((s) => s.currentPhase);
  const events = useHangarStore((s) => s.events);
  const animationProgress = useHangarStore((s) => s.animationProgress);

  const phaseIndex = currentPhase ? PHASE_ORDER.indexOf(currentPhase) : -1;

  return (
    <div className="bg-slate-100/60 backdrop-blur-md border border-slate-200 rounded-xl px-6 py-3 min-w-[400px]">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs text-slate-400 uppercase tracking-widest">
          Orchestration Pipeline
        </div>
        <div className="text-xs text-slate-400">
          {events.length} events processed
        </div>
      </div>

      {/* Pipeline visualization */}
      <div className="flex items-center gap-1">
        {PHASE_ORDER.map((phase, i) => {
          const isActive = i === phaseIndex;
          const isComplete = i < phaseIndex;
          const label = getPhaseLabel(phase);

          return (
            <div key={phase} className="flex items-center flex-1">
              <motion.div
                className={`relative flex-1 h-2 rounded-full overflow-hidden ${
                  isComplete
                    ? 'bg-[#C6A74E]'
                    : isActive
                    ? 'bg-slate-100'
                    : 'bg-slate-50'
                }`}
                title={label}
              >
                {isActive && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-[#C6A74E] to-[#2BD4FF] rounded-full"
                    animate={{ width: `${animationProgress * 100}%` }}
                    transition={{ duration: 0.1 }}
                  />
                )}
              </motion.div>
              {i < PHASE_ORDER.length - 1 && (
                <div className={`w-1 h-1 rounded-full mx-0.5 ${
                  isComplete ? 'bg-[#C6A74E]' : 'bg-slate-100'
                }`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Labels */}
      <div className="flex justify-between mt-1.5">
        <div className="text-[9px] text-slate-300">Prompt</div>
        <div className="text-[9px] text-slate-300">Deploy</div>
      </div>
    </div>
  );
}
