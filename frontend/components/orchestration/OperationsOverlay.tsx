'use client';

/**
 * Operations Overlay - Glass Box View
 * Picture-in-picture panel showing Boomer_Ang delegation and collaboration
 *
 * Appears based on task complexity:
 * - Quick (0-20): Hidden
 * - Medium (21-60): Periodic pulses
 * - Large (61-100): Persistent with check-ins
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type {
  OrchestrationState,
  HandoffEvent,
  AgentDialogue,
  OrchestrationPhase,
  BoomerAngStatus,
  Agent,
} from '@/lib/orchestration/types';

// ─────────────────────────────────────────────────────────────
// Phase Display Configuration
// ─────────────────────────────────────────────────────────────

const PHASE_CONFIG: Record<OrchestrationPhase, {
  label: string;
  icon: string;
  color: string;
}> = {
  ingest: { label: 'Receiving', icon: '📥', color: 'text-blue-400' },
  route: { label: 'Routing', icon: '🔀', color: 'text-purple-400' },
  delegate: { label: 'Delegating', icon: '👥', color: 'text-cyan-400' },
  execute: { label: 'Working', icon: '⚙️', color: 'text-gold' },
  verify: { label: 'Verifying', icon: '✓', color: 'text-green-400' },
  consolidate: { label: 'Consolidating', icon: '📋', color: 'text-indigo-400' },
  deliver: { label: 'Delivering', icon: '📤', color: 'text-emerald-400' },
  blocked: { label: 'Waiting on You', icon: '⏸️', color: 'text-orange-400' },
  idle: { label: 'Ready', icon: '💤', color: 'text-gray-400' },
};

const STATUS_CONFIG: Record<BoomerAngStatus, {
  label: string;
  color: string;
  bgColor: string;
}> = {
  idle: { label: 'Idle', color: 'text-gray-400', bgColor: 'bg-gray-400/20' },
  queued: { label: 'Queued', color: 'text-blue-400', bgColor: 'bg-blue-400/20' },
  working: { label: 'Working', color: 'text-gold', bgColor: 'bg-gold/20' },
  blocked: { label: 'Blocked', color: 'text-red-400', bgColor: 'bg-red-400/20' },
  waiting_on_user: { label: 'Waiting', color: 'text-orange-400', bgColor: 'bg-orange-400/20' },
  complete: { label: 'Complete', color: 'text-green-400', bgColor: 'bg-green-400/20' },
  error: { label: 'Error', color: 'text-red-500', bgColor: 'bg-red-500/20' },
};

// ─────────────────────────────────────────────────────────────
// Agent Avatar Component
// ─────────────────────────────────────────────────────────────

function AgentAvatar({ agent, size = 'sm', status }: {
  agent: Agent;
  size?: 'sm' | 'md' | 'lg';
  status?: BoomerAngStatus;
}) {
  const sizeClasses = {
    sm: 'w-6 h-6 text-[10px]',
    md: 'w-8 h-8 text-xs',
    lg: 'w-10 h-10 text-sm',
  };

  const roleColors = {
    acheevy: 'bg-gradient-to-br from-gold to-gold/60',
    manager: 'bg-gradient-to-br from-cyan-500 to-blue-600',
    boomerang: 'bg-gradient-to-br from-purple-500 to-indigo-600',
  };

  return (
    <div className="relative">
      <div className={`
        ${sizeClasses[size]} ${roleColors[agent.role]}
        rounded-full flex items-center justify-center font-bold text-white
      `}>
        {agent.avatar || agent.name[0]}
      </div>
      {status && status !== 'idle' && (
        <div className={`
          absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-black
          ${STATUS_CONFIG[status].bgColor}
        `} />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Handoff Event Item
// ─────────────────────────────────────────────────────────────

function HandoffEventItem({ event, isLatest }: { event: HandoffEvent; isLatest: boolean }) {
  const timeAgo = getTimeAgo(event.timestamp);

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`
        flex items-start gap-2 py-2 px-3 rounded-lg
        ${isLatest ? 'bg-gold/10' : 'bg-white/[0.02]'}
      `}
    >
      <AgentAvatar agent={event.fromAgent} size="sm" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-white/70 truncate">
          {event.message}
        </p>
        {event.userContext && (
          <p className="text-[10px] text-gold/50 mt-0.5 truncate">
            {event.userContext}
          </p>
        )}
      </div>
      <span className="text-[10px] text-white/20 whitespace-nowrap">
        {timeAgo}
      </span>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// Agent Dialogue Bubble
// ─────────────────────────────────────────────────────────────

function DialogueBubble({ dialogue }: { dialogue: AgentDialogue }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-2 py-1.5"
    >
      <AgentAvatar agent={dialogue.speaker} size="sm" />
      <div className="flex-1">
        <span className="text-[10px] text-gold font-medium">
          {dialogue.speaker.name}
        </span>
        <p className="text-xs text-white/70 mt-0.5">
          {highlightUserName(dialogue.content, dialogue.userNameMention)}
        </p>
      </div>
    </motion.div>
  );
}

function highlightUserName(text: string, userName?: string): React.ReactNode {
  if (!userName) return text;

  const parts = text.split(new RegExp(`(${userName})`, 'gi'));
  return parts.map((part, i) =>
    part.toLowerCase() === userName.toLowerCase() ? (
      <span key={i} className="text-gold font-medium">{part}</span>
    ) : (
      part
    )
  );
}

// ─────────────────────────────────────────────────────────────
// Phase Progress Indicator
// ─────────────────────────────────────────────────────────────

function PhaseProgress({ currentPhase }: { currentPhase: OrchestrationPhase }) {
  const phases: OrchestrationPhase[] = ['ingest', 'route', 'delegate', 'execute', 'verify', 'deliver'];
  const currentIndex = phases.indexOf(currentPhase);

  return (
    <div className="flex items-center gap-1">
      {phases.map((phase, i) => {
        const config = PHASE_CONFIG[phase];
        const isActive = i === currentIndex;
        const isComplete = i < currentIndex;
        const isBlocked = currentPhase === 'blocked';

        return (
          <div key={phase} className="flex items-center">
            <div
              className={`
                w-2 h-2 rounded-full transition-all
                ${isActive && !isBlocked ? 'bg-gold animate-pulse' : ''}
                ${isComplete ? 'bg-green-400' : ''}
                ${!isActive && !isComplete ? 'bg-white/20' : ''}
                ${isBlocked && isActive ? 'bg-orange-400 animate-pulse' : ''}
              `}
              title={config.label}
            />
            {i < phases.length - 1 && (
              <div className={`
                w-3 h-0.5 mx-0.5
                ${isComplete ? 'bg-green-400/50' : 'bg-white/10'}
              `} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Active Agents List
// ─────────────────────────────────────────────────────────────

function ActiveAgentsList({ state }: { state: OrchestrationState }) {
  return (
    <div className="space-y-2">
      {/* Manager */}
      {state.activeManager && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-cyan-500/10">
          <AgentAvatar agent={state.activeManager} size="md" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-cyan-300 truncate">
              {state.activeManager.name}
            </p>
            <p className="text-[10px] text-cyan-300/60">
              {state.activeManager.department} Lead
            </p>
          </div>
          <span className="text-[10px] text-cyan-300/40">Managing</span>
        </div>
      )}

      {/* Boomer_Angs */}
      <div className="grid grid-cols-2 gap-2">
        {state.activeAngs.map(ang => {
          const statusConfig = STATUS_CONFIG[ang.currentStatus];
          return (
            <div
              key={ang.id}
              className={`
                flex items-center gap-2 p-2 rounded-lg
                ${statusConfig.bgColor}
              `}
            >
              <AgentAvatar agent={ang} size="sm" status={ang.currentStatus} />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-medium text-white truncate">
                  {ang.name}
                </p>
                <p className={`text-[9px] ${statusConfig.color}`}>
                  {statusConfig.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Operations Overlay Component
// ─────────────────────────────────────────────────────────────

interface OperationsOverlayProps {
  state: OrchestrationState;
  onClose?: () => void;
  onExpand?: () => void;
  onMinimize?: () => void;
}

export function OperationsOverlay({ state, onClose, onExpand, onMinimize }: OperationsOverlayProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest event
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [state.events.length, state.dialogues.length]);

  const phaseConfig = PHASE_CONFIG[state.phase];
  const latestEvents = state.events.slice(-5);
  const latestDialogues = state.dialogues.slice(-3);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      className={`
        fixed bottom-24 right-4 z-50
        ${isExpanded ? 'w-96' : 'w-72'}
        bg-black/90 backdrop-blur-xl border border-wireframe-stroke rounded-2xl
        shadow-2xl shadow-black/50
        overflow-hidden transition-all duration-300
      `}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-wireframe-stroke flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`text-lg ${phaseConfig.color}`}>
            {phaseConfig.icon}
          </div>
          <div>
            <p className={`text-sm font-medium ${phaseConfig.color}`}>
              {phaseConfig.label}
            </p>
            <PhaseProgress currentPhase={state.phase} />
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors"
          >
            {isExpanded ? '⊖' : '⊕'}
          </button>
          <button
            onClick={onExpand}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors"
          >
            ⊡
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>
      </div>

      {/* User Context Bar */}
      {state.userName && (
        <div className="px-4 py-2 bg-gold/5 border-b border-wireframe-stroke">
          <p className="text-[10px] text-gold/80">
            Working on: <span className="font-medium text-gold">{state.userName}</span>
            {state.projectTitle && ` • ${state.projectTitle}`}
          </p>
        </div>
      )}

      {/* Content */}
      <div
        ref={scrollRef}
        className={`overflow-y-auto ${isExpanded ? 'max-h-80' : 'max-h-48'}`}
      >
        {/* Active Agents (expanded view) */}
        {isExpanded && state.activeAngs.length > 0 && (
          <div className="p-3 border-b border-wireframe-stroke">
            <p className="text-[10px] uppercase tracking-wider text-white/30 mb-2">
              Active Agents
            </p>
            <ActiveAgentsList state={state} />
          </div>
        )}

        {/* Event Feed */}
        <div className="p-3 space-y-1">
          <p className="text-[10px] uppercase tracking-wider text-white/30 mb-2">
            Operations
          </p>
          <AnimatePresence mode="popLayout">
            {latestEvents.map((event, i) => (
              <HandoffEventItem
                key={event.id}
                event={event}
                isLatest={i === latestEvents.length - 1}
              />
            ))}
          </AnimatePresence>
        </div>

        {/* Agent Dialogue (expanded view) */}
        {isExpanded && latestDialogues.length > 0 && (
          <div className="p-3 border-t border-wireframe-stroke">
            <p className="text-[10px] uppercase tracking-wider text-white/30 mb-2">
              Team Discussion
            </p>
            <div className="space-y-1">
              {latestDialogues.map(dialogue => (
                <DialogueBubble key={dialogue.id} dialogue={dialogue} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Blocked State - Waiting on User */}
      {state.isBlocked && (
        <div className="p-3 bg-orange-500/10 border-t border-orange-500/20">
          <div className="flex items-center gap-2 text-orange-400">
            <span className="animate-pulse">⏸️</span>
            <p className="text-xs font-medium">Waiting on your input</p>
          </div>
          {state.blockingQuestion && (
            <p className="text-[11px] text-orange-300/70 mt-1">
              {state.blockingQuestion}
            </p>
          )}
        </div>
      )}

      {/* Working Animation */}
      {state.phase === 'execute' && (
        <div className="h-1 bg-white/5 overflow-hidden">
          <motion.div
            className="h-full bg-gold"
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          />
        </div>
      )}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// Minimal Pulse Indicator (for quick tasks)
// ─────────────────────────────────────────────────────────────

export function OperationsPulse({ phase, onClick }: {
  phase: OrchestrationPhase;
  onClick?: () => void;
}) {
  const config = PHASE_CONFIG[phase];

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0 }}
      onClick={onClick}
      className={`
        fixed bottom-24 right-4 z-50
        flex items-center gap-2 px-3 py-2
        bg-black/80 backdrop-blur-xl border border-wireframe-stroke rounded-full
        hover:bg-black/90 transition-colors
      `}
    >
      <span className="text-sm">{config.icon}</span>
      <span className={`text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
      <motion.span
        className="w-2 h-2 rounded-full bg-gold"
        animate={{ opacity: [1, 0.5, 1] }}
        transition={{ duration: 1, repeat: Infinity }}
      />
    </motion.button>
  );
}

// ─────────────────────────────────────────────────────────────
// Utility Functions
// ─────────────────────────────────────────────────────────────

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);

  if (seconds < 5) return 'now';
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  return `${Math.floor(seconds / 3600)}h`;
}

export default OperationsOverlay;
