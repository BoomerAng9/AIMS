'use client';

/**
 * VerticalStepIndicator — Phase A Step Progression UI
 *
 * Shows the guided step-by-step vertical flow above the chat input:
 *   - Step dots with current/completed/pending states
 *   - Step name and purpose
 *   - Transition prompt when Phase A completes
 *   - Execute button for Phase B launch
 */

import { motion, AnimatePresence } from 'framer-motion';
import type { VerticalFlowState } from '@/hooks/useVerticalFlow';

interface VerticalStepIndicatorProps {
  state: VerticalFlowState;
  transitionPrompt: string | null;
  onExecute: () => void;
  onDismiss: () => void;
}

export function VerticalStepIndicator({
  state,
  transitionPrompt,
  onExecute,
  onDismiss,
}: VerticalStepIndicatorProps) {
  const { vertical, currentStep, totalSteps, phase } = state;
  if (!vertical || phase === 'idle') return null;

  const currentChainStep = vertical.chain_steps[currentStep];
  const isComplete = phase === 'ready_to_execute';
  const isExecuting = phase === 'executing';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="mb-3 rounded-xl border border-gold/20 bg-gold/5 backdrop-blur-sm overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-gold/10">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-gold animate-pulse" />
            <span className="text-xs font-medium text-gold">
              {vertical.name}
            </span>
            {!isComplete && !isExecuting && (
              <span className="text-xs text-slate-400">
                Step {currentStep + 1} of {totalSteps}
              </span>
            )}
            {isComplete && (
              <span className="text-xs text-green-400">Ready to execute</span>
            )}
            {isExecuting && (
              <span className="text-xs text-blue-400 animate-pulse">Executing...</span>
            )}
          </div>
          <button
            onClick={onDismiss}
            className="text-slate-300 hover:text-slate-500 text-xs transition-colors"
            title="Dismiss vertical flow"
          >
            x
          </button>
        </div>

        {/* Step Dots */}
        <div className="flex items-center gap-1.5 px-4 py-2">
          {vertical.chain_steps.map((step, i) => {
            const isCompleted = i < currentStep || isComplete || isExecuting;
            const isCurrent = i === currentStep && !isComplete && !isExecuting;

            return (
              <div key={i} className="flex items-center gap-1.5">
                <div
                  className={`
                    w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all
                    ${isCompleted
                      ? 'bg-gold text-black'
                      : isCurrent
                        ? 'bg-gold/20 text-gold border border-gold/40'
                        : 'bg-slate-50 text-slate-300 border border-slate-200'
                    }
                  `}
                >
                  {isCompleted ? (
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    step.step
                  )}
                </div>
                {i < totalSteps - 1 && (
                  <div
                    className={`w-4 h-0.5 rounded ${
                      isCompleted ? 'bg-gold/60' : 'bg-slate-100'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Current Step Info */}
        {!isComplete && !isExecuting && currentChainStep && (
          <div className="px-4 pb-3">
            <p className="text-xs font-medium text-slate-600">{currentChainStep.name}</p>
            <p className="text-xs text-slate-400 mt-0.5">{currentChainStep.purpose}</p>
          </div>
        )}

        {/* Transition / Execute Prompt */}
        {isComplete && transitionPrompt && (
          <div className="px-4 pb-3">
            <p className="text-xs text-slate-500 mb-2">{transitionPrompt}</p>
            <div className="flex gap-2">
              <button
                onClick={onExecute}
                className="px-4 py-1.5 rounded-lg bg-gold text-black text-xs font-medium hover:bg-gold-light transition-colors"
              >
                Execute Phase B
              </button>
              <button
                onClick={onDismiss}
                className="px-4 py-1.5 rounded-lg bg-slate-50 text-slate-500 text-xs hover:bg-slate-100 transition-colors"
              >
                Not now
              </button>
            </div>
          </div>
        )}

        {/* Executing indicator */}
        {isExecuting && (
          <div className="px-4 pb-3 flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-gold border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-slate-400">Pipeline running — agents are working on your request...</span>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
