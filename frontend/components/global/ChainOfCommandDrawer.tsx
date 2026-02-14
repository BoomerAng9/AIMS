// frontend/components/global/ChainOfCommandDrawer.tsx
'use client';

/**
 * ChainOfCommandDrawer — Right Drawer (Collaboration Feed)
 *
 * Slide-out panel showing ACHEEVY delegating to Boomer_Angs.
 * Provides "Glass Box" transparency per canon rules.
 *
 * Ref: aims-skills/skills/design/frontend-design-spec.md — 4.1 Right Drawer
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, Bot, ArrowRight, CheckCircle, Clock, Loader2 } from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

type DelegationStatus = 'assigned' | 'in-progress' | 'completed' | 'queued';

interface DelegationEvent {
  id: string;
  timestamp: string;
  from: string;
  to: string;
  task: string;
  status: DelegationStatus;
  model?: string;
}

// ─────────────────────────────────────────────────────────────
// Mock Data
// ─────────────────────────────────────────────────────────────

const MOCK_EVENTS: DelegationEvent[] = [
  {
    id: 'd1', timestamp: '2m ago',
    from: 'ACHEEVY', to: 'Engineer_Ang',
    task: 'Build SecureUpload component with drag-and-drop',
    status: 'in-progress', model: 'Claude Opus 4.6',
  },
  {
    id: 'd2', timestamp: '5m ago',
    from: 'ACHEEVY', to: 'Researcher_Ang',
    task: 'Analyze competitor pricing models',
    status: 'completed', model: 'Kimi K2.5',
  },
  {
    id: 'd3', timestamp: '12m ago',
    from: 'Manager_Ang', to: 'Coder_Ang',
    task: 'Implement TokenGenerator API endpoint',
    status: 'assigned', model: 'Claude Sonnet 4.5',
  },
  {
    id: 'd4', timestamp: '18m ago',
    from: 'ACHEEVY', to: 'Quality_Ang',
    task: 'Run ORACLE 8-gate verification on latest build',
    status: 'queued',
  },
  {
    id: 'd5', timestamp: '25m ago',
    from: 'ACHEEVY', to: 'Marketer_Ang',
    task: 'Generate social media content for launch',
    status: 'completed', model: 'Claude Sonnet 4.5',
  },
  {
    id: 'd6', timestamp: '32m ago',
    from: 'Manager_Ang', to: 'Seller_Ang',
    task: 'Optimize product listing for Plug Marketplace',
    status: 'completed', model: 'DeepSeek V3.2',
  },
];

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

const statusConfig: Record<DelegationStatus, { icon: React.ReactNode; color: string; label: string }> = {
  assigned: { icon: <ArrowRight className="w-3.5 h-3.5" />, color: 'text-gold', label: 'Assigned' },
  'in-progress': { icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />, color: 'text-cb-cyan', label: 'Working' },
  completed: { icon: <CheckCircle className="w-3.5 h-3.5" />, color: 'text-cb-green', label: 'Done' },
  queued: { icon: <Clock className="w-3.5 h-3.5" />, color: 'text-white/30', label: 'Queued' },
};

function DelegationCard({ event }: { event: DelegationEvent }) {
  const sc = statusConfig[event.status];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="p-3 rounded-xl bg-black/30 border border-wireframe-stroke hover:border-white/15 transition-colors"
    >
      {/* Delegation chain */}
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-xs font-bold text-gold">{event.from}</span>
        <ArrowRight className="w-3 h-3 text-white/20" />
        <span className="text-xs font-bold text-cb-cyan">{event.to}</span>
      </div>

      {/* Task */}
      <p className="text-[11px] text-white/60 mb-2 leading-relaxed">{event.task}</p>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className={sc.color}>{sc.icon}</span>
          <span className={`text-[10px] font-mono uppercase tracking-wider ${sc.color}`}>{sc.label}</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-white/20">
          {event.model && <span className="font-mono">{event.model}</span>}
          <span>{event.timestamp}</span>
        </div>
      </div>
    </motion.div>
  );
}

export function ChainOfCommandDrawer() {
  const [isOpen, setIsOpen] = useState(false);

  const activeCount = MOCK_EVENTS.filter((e) => e.status === 'in-progress').length;
  const completedCount = MOCK_EVENTS.filter((e) => e.status === 'completed').length;

  return (
    <>
      {/* Trigger Button (right edge) */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-40 p-2 rounded-l-xl bg-gold/10 border border-r-0 border-gold/20 text-gold hover:bg-gold/20 transition-all group"
        title="Chain of Command"
      >
        <div className="flex flex-col items-center gap-1">
          <Bot className="w-4 h-4" />
          {activeCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-cb-cyan text-[9px] font-bold text-black flex items-center justify-center">
              {activeCount}
            </span>
          )}
          <ChevronRight className="w-3 h-3 rotate-180 group-hover:-translate-x-0.5 transition-transform" />
        </div>
      </button>

      {/* Drawer Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-[380px] max-w-[90vw] bg-ink border-l border-wireframe-stroke overflow-y-auto"
            >
              {/* Header */}
              <div className="sticky top-0 bg-ink/95 backdrop-blur-xl z-10 p-4 border-b border-wireframe-stroke">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Bot className="w-5 h-5 text-gold" />
                    <h2 className="text-lg font-bold text-gold">Chain of Command</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <X className="w-4 h-4 text-white/30" />
                  </button>
                </div>
                <p className="text-xs text-white/30 mb-3">
                  ACHEEVY delegating to Boomer_Angs — Glass Box transparency
                </p>
                {/* Quick stats */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-cb-cyan/10 border border-cb-cyan/20">
                    <Loader2 className="w-3 h-3 text-cb-cyan animate-spin" />
                    <span className="text-[10px] font-mono text-cb-cyan">{activeCount} active</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-cb-green/10 border border-cb-green/20">
                    <CheckCircle className="w-3 h-3 text-cb-green" />
                    <span className="text-[10px] font-mono text-cb-green">{completedCount} done</span>
                  </div>
                </div>
              </div>

              {/* Events */}
              <div className="p-4 space-y-2">
                {MOCK_EVENTS.map((event) => (
                  <DelegationCard key={event.id} event={event} />
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export default ChainOfCommandDrawer;
