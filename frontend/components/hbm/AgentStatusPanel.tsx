'use client';

/**
 * AgentStatusPanel — Live Boomer_Ang + Lil_Hawk status with dispatch controls
 *
 * Displays the agent hierarchy for a given HBM role with:
 * - Real-time status indicators (idle, running, completed, failed)
 * - Dispatch button to trigger agent execution via ACHEEVY
 * - Task queue visualization
 * - Agent health badges
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeUp, staggerContainer, staggerItem } from '@/lib/motion';
import {
  Cpu, ChevronRight, Play, Square, RefreshCw,
  CheckCircle2, AlertCircle, Clock, Loader2,
  Shield, Zap,
} from 'lucide-react';

export type AgentStatus = 'idle' | 'running' | 'completed' | 'failed' | 'queued';

export interface AgentNode {
  id: string;
  name: string;
  role: string;
  tier: 'orchestrator' | 'coordinator' | 'boomer_ang' | 'lil_hawk';
  status: AgentStatus;
  currentTask?: string;
  tasksCompleted?: number;
}

interface AgentStatusPanelProps {
  agents: AgentNode[];
  onDispatch?: (agentId: string, task: string) => Promise<void>;
  onCancel?: (agentId: string) => Promise<void>;
  accentColor?: string;
  verticalId: string;
}

const STATUS_CONFIG: Record<AgentStatus, { icon: typeof Cpu; color: string; bg: string; label: string; pulse?: boolean }> = {
  idle:      { icon: Clock,        color: 'text-zinc-500',    bg: 'bg-zinc-500/10 border-zinc-500/20',    label: 'Idle' },
  running:   { icon: Loader2,      color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/20',    label: 'Running', pulse: true },
  completed: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', label: 'Done' },
  failed:    { icon: AlertCircle,  color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/20',      label: 'Failed' },
  queued:    { icon: Clock,        color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20',  label: 'Queued' },
};

const TIER_CONFIG: Record<string, { color: string; badge: string }> = {
  orchestrator: { color: 'text-amber-400', badge: 'ORCH' },
  coordinator:  { color: 'text-zinc-400',  badge: 'COORD' },
  boomer_ang:   { color: 'text-blue-400',  badge: 'ANG' },
  lil_hawk:     { color: 'text-cyan-400',  badge: 'HAWK' },
};

export function AgentStatusPanel({ agents, onDispatch, onCancel, accentColor = 'blue', verticalId }: AgentStatusPanelProps) {
  const [dispatching, setDispatching] = useState<string | null>(null);
  const [dispatchTask, setDispatchTask] = useState('');

  const handleDispatch = useCallback(async (agentId: string) => {
    if (!onDispatch || !dispatchTask.trim()) return;
    setDispatching(agentId);
    try {
      await onDispatch(agentId, dispatchTask);
      setDispatchTask('');
    } finally {
      setDispatching(null);
    }
  }, [onDispatch, dispatchTask]);

  const runningCount = agents.filter(a => a.status === 'running').length;
  const completedCount = agents.filter(a => a.status === 'completed').length;

  return (
    <div className="rounded-xl border border-wireframe-stroke bg-[#111113] overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 border-b border-wireframe-stroke flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Cpu className={`w-4 h-4 text-${accentColor}-400`} />
          <span className="text-sm font-mono font-bold uppercase tracking-[0.15em] text-zinc-400">Agent Chain</span>
        </div>
        <div className="flex items-center gap-3">
          {runningCount > 0 && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400">
              {runningCount} running
            </span>
          )}
          <span className="text-[10px] font-mono text-zinc-600">
            {completedCount}/{agents.length} complete
          </span>
        </div>
      </div>

      {/* Agent Pipeline */}
      <div className="p-4">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="space-y-2"
        >
          {agents.map((agent, i) => {
            const statusCfg = STATUS_CONFIG[agent.status];
            const tierCfg = TIER_CONFIG[agent.tier];
            const StatusIcon = statusCfg.icon;

            return (
              <motion.div key={agent.id} variants={staggerItem}>
                <div className="flex items-center gap-2">
                  {/* Connection line */}
                  {i > 0 && (
                    <div className="w-4 flex justify-center -mt-2 -mb-1">
                      <div className="w-px h-3 bg-wireframe-stroke" />
                    </div>
                  )}
                </div>
                <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${statusCfg.bg} transition-all`}>
                  {/* Status indicator */}
                  <div className="relative flex-shrink-0">
                    <StatusIcon className={`w-4 h-4 ${statusCfg.color} ${agent.status === 'running' ? 'animate-spin' : ''}`} />
                    {statusCfg.pulse && (
                      <div className="absolute -inset-1 rounded-full bg-blue-400/20 animate-ping" />
                    )}
                  </div>

                  {/* Agent info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-mono font-bold ${tierCfg.color}`}>
                        {agent.name}
                      </span>
                      <span className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/5 text-zinc-600">
                        {tierCfg.badge}
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-600 truncate">
                      {agent.currentTask || agent.role}
                    </p>
                  </div>

                  {/* Status badge */}
                  <span className={`text-[10px] font-mono uppercase tracking-wider ${statusCfg.color}`}>
                    {statusCfg.label}
                  </span>

                  {/* Task count */}
                  {agent.tasksCompleted !== undefined && agent.tasksCompleted > 0 && (
                    <span className="text-[10px] font-mono text-zinc-600">
                      {agent.tasksCompleted} tasks
                    </span>
                  )}

                  {/* Cancel button for running agents */}
                  {agent.status === 'running' && onCancel && (
                    <button
                      onClick={() => onCancel(agent.id)}
                      className="p-1 rounded hover:bg-red-500/10 transition-colors"
                    >
                      <Square className="w-3 h-3 text-red-400" />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* Dispatch Controls */}
      {onDispatch && (
        <div className="px-4 py-3 border-t border-wireframe-stroke">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={dispatchTask}
              onChange={(e) => setDispatchTask(e.target.value)}
              placeholder="Describe the task to dispatch..."
              className="flex-1 px-3 py-2 text-xs bg-[#0A0A0B] border border-wireframe-stroke rounded-lg text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/30"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && agents.length > 0) {
                  const primary = agents.find(a => a.tier === 'boomer_ang') || agents[0];
                  handleDispatch(primary.id);
                }
              }}
            />
            <button
              onClick={() => {
                const primary = agents.find(a => a.tier === 'boomer_ang') || agents[0];
                handleDispatch(primary.id);
              }}
              disabled={!dispatchTask.trim() || dispatching !== null}
              className="px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono hover:bg-blue-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
            >
              {dispatching ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5" />
              )}
              Dispatch
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
