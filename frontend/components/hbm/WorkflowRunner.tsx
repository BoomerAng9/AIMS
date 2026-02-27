'use client';

/**
 * WorkflowRunner — Visual step-based workflow execution with real-time tracking
 *
 * Displays a vertical pipeline of workflow steps with:
 * - Step status (pending, running, completed, failed, skipped)
 * - Progress tracking with animated transitions
 * - Output/evidence per step
 * - Run/pause/retry controls
 * - Integration with ACHEEVY vertical chain_steps
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { staggerContainer, staggerItem, fadeUp } from '@/lib/motion';
import {
  Play, Pause, RotateCcw, CheckCircle2, AlertCircle,
  Clock, Loader2, ChevronDown, ChevronUp, SkipForward,
  FileText, Zap,
} from 'lucide-react';

export type StepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

export interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  status: StepStatus;
  output?: string;
  artifacts?: Array<{ name: string; type: 'file' | 'url' | 'code'; content: string }>;
  duration?: number; // ms
  agentAssigned?: string;
}

export type WorkflowStatus = 'idle' | 'running' | 'paused' | 'completed' | 'failed';

interface WorkflowRunnerProps {
  title: string;
  steps: WorkflowStep[];
  status: WorkflowStatus;
  onRun?: () => Promise<void>;
  onPause?: () => void;
  onRetry?: (stepId: string) => Promise<void>;
  onSkip?: (stepId: string) => void;
  accentColor?: string;
}

const STEP_STATUS_CONFIG: Record<StepStatus, { icon: typeof Clock; color: string; bg: string }> = {
  pending:   { icon: Clock,        color: 'text-zinc-500',    bg: 'border-zinc-500/20' },
  running:   { icon: Loader2,      color: 'text-blue-400',    bg: 'border-blue-500/30' },
  completed: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'border-emerald-500/30' },
  failed:    { icon: AlertCircle,  color: 'text-red-400',     bg: 'border-red-500/30' },
  skipped:   { icon: SkipForward,  color: 'text-zinc-600',    bg: 'border-zinc-700/30' },
};

const WORKFLOW_STATUS_CONFIG: Record<WorkflowStatus, { label: string; color: string }> = {
  idle:      { label: 'Ready',    color: 'text-zinc-500' },
  running:   { label: 'Running',  color: 'text-blue-400' },
  paused:    { label: 'Paused',   color: 'text-amber-400' },
  completed: { label: 'Complete', color: 'text-emerald-400' },
  failed:    { label: 'Failed',   color: 'text-red-400' },
};

export function WorkflowRunner({
  title, steps, status, onRun, onPause, onRetry, onSkip, accentColor = 'blue',
}: WorkflowRunnerProps) {
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  const completedCount = steps.filter(s => s.status === 'completed').length;
  const progress = steps.length > 0 ? (completedCount / steps.length) * 100 : 0;
  const wfStatus = WORKFLOW_STATUS_CONFIG[status];

  return (
    <div className="rounded-xl border border-wireframe-stroke bg-[#111113] overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 border-b border-wireframe-stroke">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap className={`w-4 h-4 text-${accentColor}-400`} />
            <span className="text-sm font-mono font-bold uppercase tracking-[0.15em] text-zinc-400">{title}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-[10px] font-mono uppercase tracking-wider ${wfStatus.color}`}>
              {wfStatus.label}
            </span>
            <span className="text-[10px] font-mono text-zinc-600">
              {completedCount}/{steps.length}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-2 h-1 rounded-full bg-[#0A0A0B] overflow-hidden">
          <motion.div
            className={`h-full rounded-full bg-${accentColor}-400`}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="p-4 space-y-1">
        {steps.map((step, i) => {
          const stepCfg = STEP_STATUS_CONFIG[step.status];
          const StepIcon = stepCfg.icon;
          const isExpanded = expandedStep === step.id;
          const isActive = step.status === 'running';

          return (
            <div key={step.id}>
              {/* Step row */}
              <button
                onClick={() => setExpandedStep(isExpanded ? null : step.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border ${stepCfg.bg} bg-[#0A0A0B]/50 hover:bg-[#18181B] transition-all text-left`}
              >
                {/* Step number + connector */}
                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                  <div className={`w-7 h-7 rounded-full border ${stepCfg.bg} flex items-center justify-center ${isActive ? 'ring-2 ring-blue-500/30' : ''}`}>
                    <StepIcon className={`w-3.5 h-3.5 ${stepCfg.color} ${isActive ? 'animate-spin' : ''}`} />
                  </div>
                </div>

                {/* Step info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-zinc-500">Step {i + 1}</span>
                    {step.agentAssigned && (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-zinc-600">
                        {step.agentAssigned}
                      </span>
                    )}
                    {step.duration && step.status === 'completed' && (
                      <span className="text-[9px] font-mono text-zinc-600">
                        {(step.duration / 1000).toFixed(1)}s
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-zinc-300 truncate">{step.name}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5">
                  {step.status === 'failed' && onRetry && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onRetry(step.id); }}
                      className="p-1 rounded hover:bg-amber-500/10"
                      title="Retry step"
                    >
                      <RotateCcw className="w-3 h-3 text-amber-400" />
                    </button>
                  )}
                  {step.status === 'pending' && onSkip && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onSkip(step.id); }}
                      className="p-1 rounded hover:bg-white/5"
                      title="Skip step"
                    >
                      <SkipForward className="w-3 h-3 text-zinc-600" />
                    </button>
                  )}
                  {(step.output || step.artifacts?.length) ? (
                    isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-zinc-600" /> : <ChevronDown className="w-3.5 h-3.5 text-zinc-600" />
                  ) : null}
                </div>
              </button>

              {/* Expanded output */}
              <AnimatePresence>
                {isExpanded && (step.output || step.artifacts?.length) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="ml-10 pl-4 border-l border-wireframe-stroke py-3 space-y-2">
                      <p className="text-xs text-zinc-500">{step.description}</p>
                      {step.output && (
                        <pre className="text-xs text-zinc-400 bg-[#0A0A0B] p-3 rounded-lg border border-wireframe-stroke overflow-x-auto whitespace-pre-wrap max-h-48">
                          {step.output}
                        </pre>
                      )}
                      {step.artifacts?.map((art) => (
                        <div key={art.name} className="flex items-center gap-2 text-xs text-zinc-500">
                          <FileText className="w-3.5 h-3.5" />
                          <span className="font-mono">{art.name}</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-zinc-600">{art.type}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Run Controls */}
      <div className="px-4 py-3 border-t border-wireframe-stroke flex items-center justify-between">
        <div className="text-[10px] font-mono text-zinc-600">
          {status === 'running' && 'Executing pipeline...'}
          {status === 'completed' && 'All steps complete — evidence sealed'}
          {status === 'failed' && 'Pipeline failed — review and retry'}
          {status === 'idle' && 'Ready to execute'}
        </div>
        <div className="flex items-center gap-2">
          {(status === 'idle' || status === 'failed') && onRun && (
            <button
              onClick={onRun}
              className={`px-3 py-1.5 rounded-lg bg-${accentColor}-500/10 border border-${accentColor}-500/20 text-${accentColor}-400 text-xs font-mono hover:bg-${accentColor}-500/20 transition-all flex items-center gap-1.5`}
            >
              <Play className="w-3.5 h-3.5" />
              Run Pipeline
            </button>
          )}
          {status === 'running' && onPause && (
            <button
              onClick={onPause}
              className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono hover:bg-amber-500/20 transition-all flex items-center gap-1.5"
            >
              <Pause className="w-3.5 h-3.5" />
              Pause
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
