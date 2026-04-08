'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import type { GenerativeBlock } from '@/lib/bridge/types';

interface SandboxExecutionData {
  executionId: string;
  command: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'timeout';
  output?: string;
  exitCode?: number;
  duration?: number;
  progress?: number;
  sandboxId?: string;
}

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'destructive' | 'info' }> = {
  queued: { label: 'Queued', variant: 'default' },
  running: { label: 'Running', variant: 'info' },
  completed: { label: 'Completed', variant: 'success' },
  failed: { label: 'Failed', variant: 'destructive' },
  timeout: { label: 'Timeout', variant: 'warning' },
};

interface Props {
  block: GenerativeBlock;
  onAction?: (action: string, data?: Record<string, unknown>) => void;
}

export default function SandboxExecutionCard({ block, onAction }: Props) {
  const data = block.data as unknown as SandboxExecutionData;
  const statusInfo = STATUS_CONFIG[data.status] || STATUS_CONFIG.queued;

  return (
    <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-zinc-100">
            🔲 Sandbox Execution
          </CardTitle>
          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-lg bg-slate-900 p-3 font-mono text-xs text-green-400 overflow-x-auto">
          <span className="text-slate-500">$</span> {data.command}
        </div>

        {data.status === 'running' && data.progress !== undefined && (
          <Progress value={data.progress} className="h-1.5" />
        )}

        {data.output && (
          <div className="rounded-lg bg-white/5 p-3 font-mono text-xs text-zinc-300 max-h-40 overflow-y-auto whitespace-pre-wrap">
            {data.output}
          </div>
        )}

        <div className="flex items-center gap-4 text-xs text-slate-500">
          {data.exitCode !== undefined && (
            <span>
              Exit: <span className={data.exitCode === 0 ? 'text-emerald-600' : 'text-red-600'}>{data.exitCode}</span>
            </span>
          )}
          {data.duration !== undefined && (
            <span>{(data.duration / 1000).toFixed(1)}s</span>
          )}
          {data.sandboxId && (
            <span className="font-mono">{data.sandboxId}</span>
          )}
        </div>
      </CardContent>
      {block.interactive && data.status === 'running' && (
        <CardFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAction?.('cancel_execution', { executionId: data.executionId })}
          >
            Cancel
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
