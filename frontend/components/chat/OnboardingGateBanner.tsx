'use client';

/**
 * OnboardingGateBanner — Progressive onboarding notice for ACHEEVY chat
 *
 * Features:
 * - Shows onboarding progress with step indicators
 * - Tells users which steps remain (profile, mission, integrations)
 * - CTA button to continue onboarding
 * - Dismissible with localStorage persistence
 * - Animated entrance/exit via Framer Motion
 * - Collapsed "reminder" state after dismissal (can re-expand)
 */

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  X,
  CheckCircle2,
  Circle,
  User,
  Target,
  Plug,
  Shield,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// Onboarding step definitions
// ─────────────────────────────────────────────────────────────

interface OnboardingStep {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  href: string;
  storageKey: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'profile',
    label: 'Create Profile',
    description: 'Set up your account and business info',
    icon: User,
    href: '/onboarding/profile',
    storageKey: 'aims_onboarding_profile',
  },
  {
    id: 'mission',
    label: 'Define Mission',
    description: 'Tell ACHEEVY your primary business objective',
    icon: Target,
    href: '/onboarding/mission',
    storageKey: 'aims_onboarding_mission',
  },
  {
    id: 'integrations',
    label: 'Connect Tools',
    description: 'Link your existing services and APIs',
    icon: Plug,
    href: '/onboarding/integrations',
    storageKey: 'aims_onboarding_integrations',
  },
  {
    id: 'security',
    label: 'Security Setup',
    description: 'Configure auth preferences and access controls',
    icon: Shield,
    href: '/onboarding/security',
    storageKey: 'aims_onboarding_security',
  },
];

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export function OnboardingGateBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  // Read onboarding state from localStorage on mount
  useEffect(() => {
    const isComplete =
      localStorage.getItem('aims_onboarding_complete') === 'true';
    const wasDismissed =
      localStorage.getItem('aims_onboarding_banner_dismissed') === 'true';

    if (isComplete) {
      setIsVisible(false);
      return;
    }

    // Check each step's completion status
    const completed = new Set<string>();
    for (const step of ONBOARDING_STEPS) {
      if (localStorage.getItem(step.storageKey) === 'true') {
        completed.add(step.id);
      }
    }
    setCompletedSteps(completed);

    // If all steps complete, mark onboarding as done
    if (completed.size === ONBOARDING_STEPS.length) {
      localStorage.setItem('aims_onboarding_complete', 'true');
      setIsVisible(false);
      return;
    }

    setIsDismissed(wasDismissed);
    setIsVisible(true);
  }, []);

  const handleDismiss = useCallback(() => {
    setIsDismissed(true);
    localStorage.setItem('aims_onboarding_banner_dismissed', 'true');
  }, []);

  const handleExpand = useCallback(() => {
    setIsDismissed(false);
    localStorage.removeItem('aims_onboarding_banner_dismissed');
  }, []);

  if (!isVisible) return null;

  const completedCount = completedSteps.size;
  const totalSteps = ONBOARDING_STEPS.length;
  const progressPercent = (completedCount / totalSteps) * 100;
  const nextIncompleteStep = ONBOARDING_STEPS.find(
    (s) => !completedSteps.has(s.id)
  );

  // Collapsed reminder pill (shown after dismiss)
  if (isDismissed) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mb-4 mx-6 md:mx-8"
      >
        <button
          onClick={handleExpand}
          className="flex items-center gap-2 px-4 py-2 rounded-full border border-gold/20 bg-gold/5 text-xs text-slate-500 hover:border-gold/40 hover:bg-gold/10 transition-all"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
          <span>
            Onboarding: {completedCount}/{totalSteps} complete
          </span>
          <ArrowRight size={12} className="text-gold" />
        </button>
      </motion.div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="mb-6 mx-6 md:mx-8"
      >
        <div className="relative overflow-hidden rounded-2xl border border-gold/20 bg-white shadow-sm">
          {/* Dismiss button */}
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 p-1 rounded-md text-slate-300 hover:text-slate-500 hover:bg-slate-50 transition-colors z-10"
            title="Dismiss (you can re-open this)"
          >
            <X size={16} />
          </button>

          {/* Header */}
          <div className="px-5 pt-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5 pr-8">
              <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center">
                <Target size={16} className="text-gold" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-800">
                  Strategic Onboarding
                </h3>
                <p className="text-[11px] text-slate-400 leading-tight">
                  ACHEEVY needs your mission profile before full execution
                  capability unlocks.
                </p>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="px-5 pt-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                Progress
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                {completedCount}/{totalSteps} steps
              </span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gold rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
              />
            </div>
          </div>

          {/* Step list */}
          <div className="px-5 py-3 space-y-1.5">
            {ONBOARDING_STEPS.map((step, index) => {
              const isCompleted = completedSteps.has(step.id);
              const isNext = step.id === nextIncompleteStep?.id;
              const StepIcon = step.icon;

              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                >
                  <Link
                    href={step.href}
                    className={`
                      flex items-center gap-3 px-3 py-2 rounded-lg transition-all group
                      ${
                        isCompleted
                          ? 'bg-slate-50/50'
                          : isNext
                            ? 'bg-gold/5 border border-gold/15 hover:border-gold/30'
                            : 'hover:bg-slate-50'
                      }
                    `}
                  >
                    {/* Step status icon */}
                    <div className="flex-shrink-0">
                      {isCompleted ? (
                        <CheckCircle2
                          size={18}
                          className="text-emerald-400"
                        />
                      ) : isNext ? (
                        <div className="w-[18px] h-[18px] rounded-full border-2 border-gold flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-gold" />
                        </div>
                      ) : (
                        <Circle size={18} className="text-slate-200" />
                      )}
                    </div>

                    {/* Step icon */}
                    <StepIcon
                      size={14}
                      className={
                        isCompleted
                          ? 'text-slate-300'
                          : isNext
                            ? 'text-gold'
                            : 'text-slate-300'
                      }
                    />

                    {/* Step text */}
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-xs font-medium ${
                          isCompleted
                            ? 'text-slate-400 line-through'
                            : isNext
                              ? 'text-slate-700'
                              : 'text-slate-500'
                        }`}
                      >
                        {step.label}
                      </p>
                      {isNext && (
                        <p className="text-[10px] text-slate-400 truncate">
                          {step.description}
                        </p>
                      )}
                    </div>

                    {/* Arrow for next step */}
                    {isNext && (
                      <ArrowRight
                        size={14}
                        className="text-gold opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                    )}
                  </Link>
                </motion.div>
              );
            })}
          </div>

          {/* CTA */}
          {nextIncompleteStep && (
            <div className="px-5 pb-4 pt-1">
              <Link
                href={nextIncompleteStep.href}
                className="flex items-center justify-center gap-2 w-full rounded-xl bg-gold px-5 py-2.5 text-[11px] font-bold text-black uppercase tracking-widest transition-all hover:bg-gold/90 active:scale-[0.98] shadow-[0_0_15px_rgba(251,191,36,0.2)]"
              >
                Continue: {nextIncompleteStep.label}{' '}
                <ArrowRight size={14} />
              </Link>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
