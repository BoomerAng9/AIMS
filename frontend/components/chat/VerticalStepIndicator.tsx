'use client';

/**
 * VerticalStepIndicator — Phase A Step Progression UI
 *
 * Shows the guided step-by-step vertical flow above the chat input:
 *   - Step dots with current/completed/pending states + tooltip labels
 *   - Animated connecting lines between steps
 *   - Step name and purpose for current step
 *   - Transition prompt when Phase A completes
 *   - Execute button for Phase B launch
 *   - Executing spinner with progress feedback
 *   - Full keyboard accessibility (focus, aria-labels)
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  X,
  Loader2,
  Rocket,
  Clock,
  ChevronRight,
  Zap,
  Info,
} from 'lucide-react';
import type { VerticalFlowState } from '@/hooks/useVerticalFlow';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface VerticalStepIndicatorProps {
  state: VerticalFlowState;
  transitionPrompt: string | null;
  onExecute: () => void;
  onDismiss: () => void;
}

// ─────────────────────────────────────────────────────────────
// Step Dot Component
// ─────────────────────────────────────────────────────────────

interface StepDotProps {
  stepNumber: number;
  stepName: string;
  isCompleted: boolean;
  isCurrent: boolean;
  isPending: boolean;
  index: number;
}

function StepDot({
  stepNumber,
  stepName,
  isCompleted,
  isCurrent,
  isPending,
  index,
}: StepDotProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onFocus={() => setShowTooltip(true)}
      onBlur={() => setShowTooltip(false)}
    >
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: index * 0.08, duration: 0.3, type: 'spring' }}
        tabIndex={0}
        role="listitem"
        aria-label={`Step ${stepNumber}: ${stepName} - ${
          isCompleted ? 'completed' : isCurrent ? 'current' : 'pending'
        }`}
        className={`
          w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 outline-none
          focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-1
          ${
            isCompleted
              ? 'bg-gold text-black shadow-[0_0_8px_rgba(212,175,55,0.3)]'
              : isCurrent
                ? 'bg-gold/15 text-gold border-2 border-gold/50 shadow-[0_0_12px_rgba(212,175,55,0.2)]'
                : 'bg-slate-50 text-slate-300 border border-slate-200'
          }
        `}
      >
        {isCompleted ? (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          >
            <Check size={14} strokeWidth={3} />
          </motion.div>
        ) : isCurrent ? (
          <motion.span
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            {stepNumber}
          </motion.span>
        ) : (
          stepNumber
        )}
      </motion.div>

      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-slate-800 text-white text-xs rounded-lg whitespace-nowrap shadow-lg z-20 pointer-events-none"
          >
            <span className="font-medium">{stepName}</span>
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-800" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Connecting Line Component
// ─────────────────────────────────────────────────────────────

function ConnectingLine({
  isCompleted,
  index,
}: {
  isCompleted: boolean;
  index: number;
}) {
  return (
    <div className="relative w-6 h-0.5 mx-0.5">
      {/* Background track */}
      <div className="absolute inset-0 bg-slate-100 rounded" />
      {/* Filled overlay */}
      <motion.div
        className="absolute inset-y-0 left-0 bg-gold/60 rounded"
        initial={{ width: 0 }}
        animate={{ width: isCompleted ? '100%' : '0%' }}
        transition={{ duration: 0.4, delay: index * 0.08 + 0.2, ease: 'easeOut' }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

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
    <AnimatePresence mode="wait">
      <motion.div
        key={vertical.id}
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.98 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="mb-3 rounded-xl border border-gold/20 bg-white shadow-sm overflow-hidden"
        role="region"
        aria-label={`Vertical flow: ${vertical.name}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 bg-[#F8FAFC]">
          <div className="flex items-center gap-2">
            <motion.div
              className="w-2 h-2 rounded-full bg-gold"
              animate={
                isExecuting
                  ? { scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }
                  : isComplete
                    ? { scale: 1, opacity: 1 }
                    : { scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }
              }
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            />
            <span className="text-xs font-semibold text-gold tracking-wide">
              {vertical.name}
            </span>

            {!isComplete && !isExecuting && (
              <span className="text-sm text-slate-400 flex items-center gap-1">
                <ChevronRight size={10} />
                Step {currentStep + 1} of {totalSteps}
              </span>
            )}
            {isComplete && (
              <motion.span
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-sm text-emerald-500 font-medium flex items-center gap-1"
              >
                <Check size={10} />
                Ready to execute
              </motion.span>
            )}
            {isExecuting && (
              <span className="text-sm text-blue-500 font-medium flex items-center gap-1">
                <Loader2 size={10} className="animate-spin" />
                Executing pipeline
              </span>
            )}
          </div>
          <button
            onClick={onDismiss}
            className="p-1 rounded-md text-slate-300 hover:text-slate-500 hover:bg-slate-100 transition-colors"
            title="Dismiss vertical flow"
            aria-label="Dismiss vertical flow"
          >
            <X size={14} />
          </button>
        </div>

        {/* Step Dots with Connecting Lines */}
        <div
          className="flex items-center gap-0 px-4 py-3 overflow-x-auto"
          role="list"
          aria-label="Step progression"
        >
          {vertical.chain_steps.map((step, i) => {
            const isStepCompleted = i < currentStep || isComplete || isExecuting;
            const isStepCurrent = i === currentStep && !isComplete && !isExecuting;
            const isStepPending = !isStepCompleted && !isStepCurrent;

            return (
              <div key={i} className="flex items-center">
                <StepDot
                  stepNumber={step.step}
                  stepName={step.name}
                  isCompleted={isStepCompleted}
                  isCurrent={isStepCurrent}
                  isPending={isStepPending}
                  index={i}
                />
                {i < totalSteps - 1 && (
                  <ConnectingLine isCompleted={isStepCompleted} index={i} />
                )}
              </div>
            );
          })}
        </div>

        {/* Current Step Info (Phase A) */}
        <AnimatePresence mode="wait">
          {!isComplete && !isExecuting && currentChainStep && (
            <motion.div
              key={`step-${currentStep}`}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="px-4 pb-3 overflow-hidden"
            >
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-[#F8FAFC] border border-slate-100">
                <Info size={12} className="text-gold mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-slate-700">
                    {currentChainStep.name}
                  </p>
                  <p className="text-sm text-slate-400 mt-0.5 leading-relaxed">
                    {currentChainStep.purpose}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Transition / Execute Prompt (Phase A Complete) */}
        <AnimatePresence>
          {isComplete && transitionPrompt && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="px-4 pb-4 overflow-hidden"
            >
              <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                {transitionPrompt}
              </p>
              <div className="flex gap-2">
                <motion.button
                  onClick={onExecute}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gold text-black text-xs font-semibold hover:bg-gold/90 transition-colors shadow-[0_0_10px_rgba(212,175,55,0.2)]"
                  aria-label="Execute Phase B"
                >
                  <Rocket size={14} />
                  Execute Phase B
                </motion.button>
                <button
                  onClick={onDismiss}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-50 text-slate-500 text-xs font-medium hover:bg-slate-100 border border-slate-200 transition-colors"
                  aria-label="Dismiss - not now"
                >
                  <Clock size={12} />
                  Not now
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Executing indicator (Phase B) */}
        <AnimatePresence>
          {isExecuting && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="px-4 pb-4 overflow-hidden"
            >
              <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50/50 border border-blue-100">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                >
                  <Zap size={16} className="text-blue-500" />
                </motion.div>
                <div>
                  <p className="text-xs font-medium text-blue-700">
                    Pipeline Running
                  </p>
                  <p className="text-xs text-blue-400">
                    Agents are executing your request. Updates will appear in
                    chat.
                  </p>
                </div>
              </div>

              {/* Progress bar animation */}
              <div className="mt-2 h-1 bg-blue-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-blue-400 rounded-full"
                  initial={{ width: '0%' }}
                  animate={{ width: ['0%', '70%', '85%', '90%'] }}
                  transition={{
                    duration: 15,
                    times: [0, 0.4, 0.7, 1],
                    ease: 'easeOut',
                  }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
