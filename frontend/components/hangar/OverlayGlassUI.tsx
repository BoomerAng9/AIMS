'use client';

/**
 * OverlayGlassUI — Glass-morphism overlay for Hangar telemetry
 *
 * Composites: TelemetryPanel, ActorCardPanel, TokenMeter, phase indicator.
 * Uses framer-motion for show/hide transitions.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { useHangarStore } from '@/lib/hangar/store';
import { getPhaseLabel, PHASE_ORDER } from '@/lib/hangar/eventSchema';
import TelemetryPanel from './TelemetryPanel';
import ActorCardPanel from './ActorCardPanel';
import TokenMeter from './TokenMeter';
import { Eye, EyeOff, RotateCcw } from 'lucide-react';

const GLASS =
  'bg-black/40 backdrop-blur-md border border-white/10 rounded-xl';

export default function OverlayGlassUI() {
  const overlayVisible = useHangarStore((s) => s.overlayVisible);
  const setOverlayVisible = useHangarStore((s) => s.setOverlayVisible);
  const currentPhase = useHangarStore((s) => s.currentPhase);
  const isAnimating = useHangarStore((s) => s.isAnimating);
  const resetHangar = useHangarStore((s) => s.resetHangar);

  // Phase progress (0–1)
  const phaseIndex = currentPhase ? PHASE_ORDER.indexOf(currentPhase) : -1;
  const progress = phaseIndex >= 0 ? (phaseIndex + 1) / PHASE_ORDER.length : 0;

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {/* Toggle button — always visible */}
      <div className="absolute top-4 right-4 pointer-events-auto flex gap-2">
        <button
          onClick={() => setOverlayVisible(!overlayVisible)}
          className={`${GLASS} p-2 text-white/70 hover:text-white transition-colors`}
          title={overlayVisible ? 'Hide overlay' : 'Show overlay'}
        >
          {overlayVisible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
        <button
          onClick={resetHangar}
          className={`${GLASS} p-2 text-white/70 hover:text-white transition-colors`}
          title="Reset hangar"
        >
          <RotateCcw size={18} />
        </button>
      </div>

      <AnimatePresence>
        {overlayVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 pointer-events-none"
          >
            {/* Phase indicator — top center */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-auto">
              <div className={`${GLASS} px-6 py-3 text-center min-w-[280px]`}>
                <div className="text-xs text-[#2BD4FF]/70 uppercase tracking-widest mb-1">
                  {isAnimating ? 'Animating' : 'Phase'}
                </div>
                <div className="text-sm font-medium text-white">
                  {currentPhase ? getPhaseLabel(currentPhase) : 'Awaiting Input'}
                </div>
                {/* Phase progress bar */}
                <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-[#C6A74E] to-[#2BD4FF] rounded-full"
                    animate={{ width: `${progress * 100}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                </div>
                {/* Phase dots */}
                <div className="flex justify-between mt-2 gap-1">
                  {PHASE_ORDER.map((phase, i) => (
                    <div
                      key={phase}
                      className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                        i <= phaseIndex
                          ? 'bg-[#C6A74E]'
                          : 'bg-white/15'
                      }`}
                      title={getPhaseLabel(phase)}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Left panel — telemetry */}
            <div className="absolute top-20 left-4 bottom-4 w-72 pointer-events-auto">
              <TelemetryPanel />
            </div>

            {/* Right panel — actor cards */}
            <div className="absolute top-20 right-4 bottom-4 w-64 pointer-events-auto">
              <ActorCardPanel />
            </div>

            {/* Bottom center — token meter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-auto">
              <TokenMeter />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
