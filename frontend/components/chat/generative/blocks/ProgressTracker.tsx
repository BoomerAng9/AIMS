'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { GenerativeBlock } from '@/lib/bridge/types';

interface ProgressStep {
  label: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  detail?: string;
}

interface ProgressTrackerData {
  title: string;
  steps: ProgressStep[];
  overallProgress: number;
  currentStep?: number;
}

const STEP_ICON: Record<string, string> = {
  pending: '○',
  running: '◉',
  completed: '●',
  failed: '✕',
  skipped: '⊘',
};

const STEP_COLOR: Record<string, string> = {
  pending: 'text-slate-400',
  running: 'text-blue-400',
  completed: 'text-emerald-600',
  failed: 'text-red-600',
  skipped: 'text-slate-300',
};

interface Props {
  block: GenerativeBlock;
  onAction?: (action: string, data?: Record<string, unknown>) => void;
}

export default function ProgressTracker({ block }: Props) {
  const data = block.data as unknown as ProgressTrackerData;

  return (
    <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-zinc-100">
            📋 {data.title}
          </CardTitle>
          <Badge variant="info">{data.overallProgress}%</Badge>
        </div>
        <Progress value={data.overallProgress} className="mt-2" />
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {data.steps.map((step, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-2 rounded-md px-2 py-1.5 text-sm ${
                step.status === 'running' ? 'bg-blue-500/10' : ''
              }`}
            >
              <span className={`mt-0.5 font-mono text-xs ${STEP_COLOR[step.status]}`}>
                {STEP_ICON[step.status]}
              </span>
              <div className="flex-1 min-w-0">
                <span
                  className={`${
                    step.status === 'completed'
                      ? 'text-slate-500 line-through'
                      : step.status === 'running'
                      ? 'text-blue-400 font-medium'
                      : 'text-zinc-400'
                  }`}
                >
                  {step.label}
                </span>
                {step.detail && (
                  <p className="text-xs text-slate-400 mt-0.5 truncate">{step.detail}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
