'use client';

import type { ToolExecutionEvent } from '@/lib/chat/types';

const STATUS_INDICATOR: Record<string, { color: string; label: string }> = {
  dispatched: { color: 'bg-gold animate-pulse', label: 'Dispatched' },
  running: { color: 'bg-gold animate-pulse', label: 'Running' },
  completed: { color: 'bg-signal-green', label: 'Complete' },
  failed: { color: 'bg-signal-red', label: 'Failed' },
};

export function ToolExecutionCard({ event }: { event: ToolExecutionEvent }) {
  const status = STATUS_INDICATOR[event.status] || STATUS_INDICATOR.dispatched;

  return (
    <div className="bg-surface-raised border border-gold/15 rounded-xl p-3 my-2 max-w-[85%]">
      <div className="flex items-center gap-2">
        {/* Status dot */}
        <span className={`w-2 h-2 rounded-full ${status.color}`} />

        {/* Intent badge */}
        <span className="px-2 py-0.5 rounded-md bg-gold/10 text-gold text-xs font-mono">
          {event.intent.replace(/_/g, ' ')}
        </span>

        {/* Status label */}
        <span className="text-xs text-zinc-500">{status.label}</span>
      </div>

      {/* Details row */}
      {(event.taskId || event.steps || event.lucUsage) && (
        <div className="flex items-center gap-3 mt-1.5 text-[11px] text-zinc-500 font-mono">
          {event.taskId && <span>ID: {event.taskId.slice(0, 8)}</span>}
          {event.steps && <span>{event.steps} steps</span>}
          {event.lucUsage && (
            <span className="text-gold/70">
              LUC: {event.lucUsage.amount} {event.lucUsage.service}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
