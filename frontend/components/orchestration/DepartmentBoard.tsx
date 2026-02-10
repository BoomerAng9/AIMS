'use client';

/**
 * Department Board - Expanded Drawer View
 * Full visualization of all departments and Boomer_Angs
 *
 * Shows:
 * - All departments with managers
 * - Boomer_Ang status for each department
 * - Chain of command visualization
 * - Historical operations log
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type {
  OrchestrationState,
  Department,
  BoomerAng,
  BoomerAngStatus,
  HandoffEvent,
  AgentDialogue,
  Agent,
} from '@/lib/orchestration/types';
import { DEPARTMENTS, ACHEEVY } from '@/lib/orchestration/types';

// ─────────────────────────────────────────────────────────────
// Status Badge
// ─────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<BoomerAngStatus, string> = {
  idle: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  queued: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  working: 'bg-gold/10 text-gold border-gold/30 animate-pulse',
  blocked: 'bg-red-500/20 text-red-400 border-red-500/30',
  waiting_on_user: 'bg-orange-500/20 text-orange-400 border-orange-500/30 animate-pulse',
  complete: 'bg-green-500/20 text-green-400 border-green-500/30',
  error: 'bg-red-600/20 text-red-500 border-red-600/30',
};

function StatusBadge({ status }: { status: BoomerAngStatus }) {
  const labels: Record<BoomerAngStatus, string> = {
    idle: 'Idle',
    queued: 'Queued',
    working: 'Working',
    blocked: 'Blocked',
    waiting_on_user: 'Waiting',
    complete: 'Complete',
    error: 'Error',
  };

  return (
    <span className={`
      px-2 py-0.5 text-[10px] font-medium rounded-full border
      ${STATUS_STYLES[status]}
    `}>
      {labels[status]}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// Agent Node
// ─────────────────────────────────────────────────────────────

function AgentNode({ agent, isActive, onClick }: {
  agent: Agent | BoomerAng;
  isActive?: boolean;
  onClick?: () => void;
}) {
  const status = 'currentStatus' in agent ? agent.currentStatus : undefined;

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`
        w-full p-3 rounded-xl border text-left transition-all
        ${isActive
          ? 'bg-gold/10 border-gold/30'
          : 'bg-white/[0.02] border-wireframe-stroke hover:border-wireframe-stroke'
        }
      `}
    >
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className={`
          w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold
          ${agent.role === 'acheevy' ? 'bg-gradient-to-br from-gold to-amber-600 text-black' : ''}
          ${agent.role === 'manager' ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white' : ''}
          ${agent.role === 'boomerang' ? 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white' : ''}
        `}>
          {agent.name[0]}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white/50 truncate">
            {agent.name}
          </p>
          <p className="text-xs text-white/40 truncate">
            {agent.specialty || ('department' in agent ? agent.department : '')}
          </p>
        </div>

        {/* Status */}
        {status && <StatusBadge status={status} />}
      </div>

      {/* Capabilities (for Boomer_Angs) */}
      {'capabilities' in agent && agent.capabilities && (
        <div className="mt-2 flex flex-wrap gap-1">
          {agent.capabilities.slice(0, 3).map(cap => (
            <span
              key={cap}
              className="px-1.5 py-0.5 text-[9px] bg-white/5 text-white/30 rounded"
            >
              {cap}
            </span>
          ))}
          {agent.capabilities.length > 3 && (
            <span className="px-1.5 py-0.5 text-[9px] text-white/20">
              +{agent.capabilities.length - 3}
            </span>
          )}
        </div>
      )}
    </motion.button>
  );
}

// ─────────────────────────────────────────────────────────────
// Department Card
// ─────────────────────────────────────────────────────────────

function DepartmentCard({
  department,
  isActive,
  activeAngIds,
}: {
  department: Department;
  isActive: boolean;
  activeAngIds: string[];
}) {
  const [isExpanded, setIsExpanded] = useState(isActive);
  const activeAngsCount = department.angs.filter(a =>
    activeAngIds.includes(a.id)
  ).length;

  return (
    <div className={`
      rounded-2xl border overflow-hidden transition-all
      ${isActive
        ? 'bg-white/[0.03] border-gold/20'
        : 'bg-white/[0.01] border-wireframe-stroke'
      }
    `}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`
            w-8 h-8 rounded-lg flex items-center justify-center text-sm
            ${isActive ? 'bg-gold/10' : 'bg-white/5'}
          `}>
            {department.name[0]}
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-white/50">
              {department.name}
            </p>
            <p className="text-xs text-white/30">
              {department.angs.length} agents • {activeAngsCount} active
            </p>
          </div>
        </div>
        <motion.span
          animate={{ rotate: isExpanded ? 180 : 0 }}
          className="text-white/30"
        >
          ▼
        </motion.span>
      </button>

      {/* Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              {/* Manager */}
              <div>
                <p className="text-[10px] uppercase tracking-wider text-white/20 mb-2">
                  Department Lead
                </p>
                <AgentNode agent={department.manager} isActive={isActive} />
              </div>

              {/* Boomer_Angs */}
              <div>
                <p className="text-[10px] uppercase tracking-wider text-white/20 mb-2">
                  Team Members
                </p>
                <div className="space-y-2">
                  {department.angs.map(ang => (
                    <AgentNode
                      key={ang.id}
                      agent={ang}
                      isActive={activeAngIds.includes(ang.id)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Chain of Command Visualization
// ─────────────────────────────────────────────────────────────

function ChainOfCommand({ state }: { state: OrchestrationState }) {
  return (
    <div className="space-y-3">
      <p className="text-[10px] uppercase tracking-wider text-white/20">
        Chain of Command
      </p>

      <div className="flex items-center justify-center gap-2">
        {/* User */}
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center">
            <span className="text-green-400 font-medium">
              {state.userName?.[0] || 'U'}
            </span>
          </div>
          <span className="text-[9px] text-white/30 mt-1">
            {state.userName || 'User'}
          </span>
        </div>

        {/* Arrow */}
        <div className="flex items-center">
          <div className="w-6 h-0.5 bg-gradient-to-r from-green-500/50 to-amber-400/50" />
          <div className="w-0 h-0 border-t-[4px] border-t-transparent border-l-[6px] border-l-amber-400/50 border-b-[4px] border-b-transparent" />
        </div>

        {/* ACHEEVY */}
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold to-amber-600 flex items-center justify-center">
            <span className="text-black font-bold">A</span>
          </div>
          <span className="text-[9px] text-white/30 mt-1">ACHEEVY</span>
        </div>

        {state.activeManager && (
          <>
            {/* Arrow */}
            <div className="flex items-center">
              <div className="w-6 h-0.5 bg-gradient-to-r from-gold/100 to-cyan-500/50" />
              <div className="w-0 h-0 border-t-[4px] border-t-transparent border-l-[6px] border-l-cyan-500/50 border-b-[4px] border-b-transparent" />
            </div>

            {/* Manager */}
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                <span className="text-white font-medium text-sm">
                  {state.activeManager.name[0]}
                </span>
              </div>
              <span className="text-[9px] text-white/30 mt-1 truncate max-w-[60px]">
                {state.activeManager.name}
              </span>
            </div>

            {state.activeAngs.length > 0 && (
              <>
                {/* Arrow */}
                <div className="flex items-center">
                  <div className="w-6 h-0.5 bg-gradient-to-r from-cyan-500/50 to-purple-500/50" />
                  <div className="w-0 h-0 border-t-[4px] border-t-transparent border-l-[6px] border-l-purple-500/50 border-b-[4px] border-b-transparent" />
                </div>

                {/* Angs */}
                <div className="flex -space-x-2">
                  {state.activeAngs.slice(0, 3).map((ang, i) => (
                    <div
                      key={ang.id}
                      className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center border-2 border-black"
                      style={{ zIndex: 3 - i }}
                    >
                      <span className="text-white font-medium text-xs">
                        {ang.name[0]}
                      </span>
                    </div>
                  ))}
                  {state.activeAngs.length > 3 && (
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border-2 border-black">
                      <span className="text-white/60 text-xs">
                        +{state.activeAngs.length - 3}
                      </span>
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Operations Log
// ─────────────────────────────────────────────────────────────

function OperationsLog({ events }: { events: HandoffEvent[] }) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] uppercase tracking-wider text-white/20">
        Operations Log
      </p>

      <div className="space-y-1 max-h-60 overflow-y-auto">
        {events.slice().reverse().map(event => (
          <div
            key={event.id}
            className="flex items-start gap-2 p-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
          >
            <span className="text-[10px] text-white/20 whitespace-nowrap">
              {new Date(event.timestamp).toLocaleTimeString()}
            </span>
            <p className="text-xs text-white/50 flex-1">
              {event.message}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Department Board
// ─────────────────────────────────────────────────────────────

interface DepartmentBoardProps {
  state: OrchestrationState;
  isOpen: boolean;
  onClose: () => void;
}

export function DepartmentBoard({ state, isOpen, onClose }: DepartmentBoardProps) {
  const activeDepartmentId = state.activeManager?.department;
  const activeAngIds = state.activeAngs.map(a => a.id);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-[#0A0A0A] border-l border-wireframe-stroke z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-wireframe-stroke flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Department Board
                </h2>
                <p className="text-xs text-white/40">
                  Full orchestration visibility
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/10 text-white/40 hover:text-white/50 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 overflow-y-auto h-[calc(100vh-80px)]">
              {/* User Context */}
              {state.userName && (
                <div className="p-4 rounded-xl bg-gold/10 border border-gold/20">
                  <p className="text-sm text-white/50">
                    Working for: <span className="font-medium text-gold">{state.userName}</span>
                  </p>
                  {state.projectTitle && (
                    <p className="text-xs text-white/50 mt-1">
                      Project: {state.projectTitle}
                    </p>
                  )}
                  {state.projectObjective && (
                    <p className="text-xs text-white/40 mt-1">
                      {state.projectObjective}
                    </p>
                  )}
                </div>
              )}

              {/* Chain of Command */}
              <ChainOfCommand state={state} />

              {/* Departments */}
              <div className="space-y-3">
                <p className="text-[10px] uppercase tracking-wider text-white/20">
                  Departments
                </p>
                {DEPARTMENTS.map(dept => (
                  <DepartmentCard
                    key={dept.id}
                    department={dept}
                    isActive={dept.id === activeDepartmentId}
                    activeAngIds={activeAngIds}
                  />
                ))}
              </div>

              {/* Operations Log */}
              {state.events.length > 0 && (
                <OperationsLog events={state.events} />
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default DepartmentBoard;
