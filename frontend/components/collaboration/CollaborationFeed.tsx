'use client';

/**
 * CollaborationFeed — Real-Time Agent Viewport (G2)
 *
 * Shows agents reasoning, conversing, and handing off through the chain
 * of command. Each agent speaks in their persona voice with distinct
 * visual identity.
 *
 * Closes Gap G2: Real-Time Agent Viewport (competitor parity with Manus/GenSpark)
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Types ────────────────────────────────────────────────────────

type AgentRole = 'system' | 'acheevy' | 'boomer_ang' | 'chicken_hawk' | 'lil_hawk' | 'verifier' | 'receipt';

type FeedEntryType =
  | 'intake' | 'thinking' | 'classification' | 'directive' | 'handoff'
  | 'squad_assembly' | 'execution' | 'wave_summary' | 'verification'
  | 'nugget' | 'receipt' | 'debrief' | 'escalation' | 'coaching' | 'system';

interface AgentIdentity {
  displayName: string;
  kunya?: string;
  role: AgentRole;
  pmoOffice?: string;
  avatar?: string;
}

interface FeedEntry {
  id: string;
  timestamp: string;
  speaker: AgentIdentity;
  type: FeedEntryType;
  message: string;
  metadata?: Record<string, unknown>;
  group?: string;
  depth: number;
}

interface CollaborationSession {
  sessionId: string;
  userName: string;
  projectLabel: string;
  startedAt: string;
  completedAt?: string;
  feed: FeedEntry[];
  status: 'active' | 'completed' | 'failed';
  stats: {
    totalEntries: number;
    agentsSeen: string[];
    stepsCompleted: number;
    stepsFailed: number;
    totalDurationMs: number;
  };
}

// ── Agent Role Colors & Icons ──────────────────────────────────

const ROLE_CONFIG: Record<AgentRole, { color: string; bg: string; icon: string }> = {
  system:       { color: 'text-slate-400',  bg: 'bg-slate-50',     icon: 'SYS' },
  acheevy:      { color: 'text-gold',      bg: 'bg-gold/10',     icon: 'ACH' },
  boomer_ang:   { color: 'text-blue-400',  bg: 'bg-blue-500/10', icon: 'BMR' },
  chicken_hawk: { color: 'text-orange-400',bg: 'bg-orange-500/10',icon: 'CHK' },
  lil_hawk:     { color: 'text-green-400', bg: 'bg-green-500/10',icon: 'LIL' },
  verifier:     { color: 'text-purple-400',bg: 'bg-purple-500/10',icon: 'VRF' },
  receipt:      { color: 'text-cyan-400',  bg: 'bg-cyan-500/10', icon: 'RCT' },
};

const ENTRY_TYPE_ICONS: Partial<Record<FeedEntryType, string>> = {
  intake:          'IN',
  thinking:        '...',
  classification:  'CLS',
  directive:       'DIR',
  handoff:         '>>',
  squad_assembly:  'SQD',
  execution:       'EXE',
  wave_summary:    'WAV',
  verification:    'VER',
  nugget:          'TIP',
  receipt:         'RCT',
  debrief:         'SUM',
};

// ── Feed Entry Component ─────────────────────────────────────

function FeedEntryRow({ entry, isLast }: { entry: FeedEntry; isLast: boolean }) {
  const config = ROLE_CONFIG[entry.speaker.role] || ROLE_CONFIG.system;
  const typeIcon = ENTRY_TYPE_ICONS[entry.type] || '•';
  const isThinking = entry.type === 'thinking';
  const isNugget = entry.type === 'nugget';
  const isHandoff = entry.type === 'handoff';

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className={`
        flex gap-3 py-2 px-3 rounded-lg transition-colors
        ${entry.depth > 0 ? 'ml-6 border-l-2 border-slate-100' : ''}
        ${isThinking ? 'opacity-60' : ''}
        ${isNugget ? 'bg-gold/5 border border-gold/10' : ''}
        ${isHandoff ? 'bg-white' : ''}
        hover:bg-white
      `}
    >
      {/* Avatar Badge */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-md ${config.bg} flex items-center justify-center`}>
        <span className={`text-xs font-bold ${config.color}`}>{config.icon}</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header: Agent Name + Type Badge + Timestamp */}
        <div className="flex items-center gap-2 mb-0.5">
          <span className={`text-xs font-semibold ${config.color}`}>
            {entry.speaker.displayName}
          </span>
          {entry.speaker.kunya && (
            <span className="text-xs text-slate-300 italic">{entry.speaker.kunya}</span>
          )}
          <span className="text-xs px-1.5 py-0.5 rounded bg-slate-50 text-slate-400 font-mono">
            {typeIcon}
          </span>
          <span className="text-xs text-slate-300 ml-auto font-mono">
            {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>

        {/* Message */}
        <p className={`text-sm leading-relaxed ${isThinking ? 'text-slate-400 italic' : 'text-slate-600'}`}>
          {isNugget && <span className="text-gold mr-1">TIP:</span>}
          {entry.message}
        </p>

        {/* Metadata badges */}
        {entry.metadata && (
          <div className="flex flex-wrap gap-1 mt-1">
            {entry.metadata.passed !== undefined && (
              <span className={`text-xs px-1.5 py-0.5 rounded font-mono ${entry.metadata.passed ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                {entry.metadata.passed ? 'PASS' : 'FAIL'}
              </span>
            )}
            {entry.metadata.confidence !== undefined && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-slate-50 text-slate-400 font-mono">
                {Math.round((entry.metadata.confidence as number) * 100)}%
              </span>
            )}
            {entry.metadata.durationMs !== undefined && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-slate-50 text-slate-400 font-mono">
                {String(entry.metadata.durationMs)}ms
              </span>
            )}
          </div>
        )}
      </div>

      {/* Live indicator for last entry */}
      {isLast && (
        <div className="flex-shrink-0 self-center">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        </div>
      )}
    </motion.div>
  );
}

// ── Stats Bar ──────────────────────────────────────────────

function StatsBar({ stats, status }: { stats: CollaborationSession['stats']; status: string }) {
  return (
    <div className="flex items-center gap-4 px-4 py-2 border-b border-slate-100 text-sm font-mono text-slate-400">
      <span className={`flex items-center gap-1 ${status === 'active' ? 'text-green-400' : status === 'failed' ? 'text-red-400' : 'text-slate-400'}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${status === 'active' ? 'bg-green-400 animate-pulse' : status === 'failed' ? 'bg-red-400' : 'bg-slate-100'}`} />
        {status.toUpperCase()}
      </span>
      <span>{stats.totalEntries} events</span>
      <span>{stats.agentsSeen.length} agents</span>
      <span className="text-green-400/60">{stats.stepsCompleted} done</span>
      {stats.stepsFailed > 0 && <span className="text-red-400/60">{stats.stepsFailed} failed</span>}
      {stats.totalDurationMs > 0 && <span>{(stats.totalDurationMs / 1000).toFixed(1)}s</span>}
    </div>
  );
}

// ── Main Collaboration Feed Component ──────────────────────

interface CollaborationFeedProps {
  /** Session data from the backend or live polling */
  session?: CollaborationSession | null;
  /** If true, polls the gateway for live updates */
  livePolling?: boolean;
  /** Polling interval in ms */
  pollInterval?: number;
  /** Session ID to poll for */
  sessionId?: string;
  /** Show thinking entries */
  showThinking?: boolean;
  /** Max height (CSS value) */
  maxHeight?: string;
  /** Compact mode for sidebar use */
  compact?: boolean;
  /** Close handler */
  onClose?: () => void;
}

export function CollaborationFeed({
  session: externalSession,
  livePolling = false,
  pollInterval = 2000,
  sessionId,
  showThinking = true,
  maxHeight = '500px',
  compact = false,
  onClose,
}: CollaborationFeedProps) {
  const [session, setSession] = useState<CollaborationSession | null>(externalSession || null);
  const [filter, setFilter] = useState<AgentRole | 'all'>('all');
  const feedEndRef = useRef<HTMLDivElement>(null);

  // Live polling
  useEffect(() => {
    if (!livePolling || !sessionId) return;

    const gatewayUrl = process.env.NEXT_PUBLIC_UEF_GATEWAY_URL || '';
    if (!gatewayUrl) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${gatewayUrl}/collaboration/${sessionId}`);
        if (res.ok) {
          const data = await res.json();
          setSession(data);
        }
      } catch {
        // Silently continue polling
      }
    }, pollInterval);

    return () => clearInterval(interval);
  }, [livePolling, sessionId, pollInterval]);

  // Sync external session
  useEffect(() => {
    if (externalSession) setSession(externalSession);
  }, [externalSession]);

  // Auto-scroll
  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session?.feed.length]);

  // Filter feed
  const filteredFeed = session?.feed.filter(e => {
    if (!showThinking && e.type === 'thinking') return false;
    if (filter !== 'all' && e.speaker.role !== filter) return false;
    return true;
  }) || [];

  // Empty state
  if (!session) {
    return (
      <div className={`wireframe-card rounded-xl ${compact ? 'p-3' : 'p-6'}`}>
        <div className="text-center py-8">
          <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-slate-50 flex items-center justify-center">
            <span className="text-slate-300 text-lg">{'{ }'}</span>
          </div>
          <p className="text-sm text-slate-400">No active collaboration session</p>
          <p className="text-xs text-slate-300 mt-1">Agent activity will appear here when tasks are executing</p>
        </div>
      </div>
    );
  }

  return (
    <div className="wireframe-card rounded-xl overflow-hidden flex flex-col" style={{ maxHeight }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gold/10 flex items-center justify-center">
            <span className="text-gold text-xs font-bold">CF</span>
          </div>
          <div>
            <h3 className="text-sm font-medium text-slate-700">Agent Viewport</h3>
            <p className="text-xs text-slate-400">{session.projectLabel}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Role filter */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as AgentRole | 'all')}
            className="text-xs bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-slate-500 outline-none"
          >
            <option value="all">All Agents</option>
            <option value="acheevy">ACHEEVY</option>
            <option value="boomer_ang">Boomer_Angs</option>
            <option value="chicken_hawk">Chicken Hawk</option>
            <option value="lil_hawk">Lil_Hawks</option>
            <option value="verifier">Verifiers</option>
          </select>
          {onClose && (
            <button onClick={onClose} className="text-slate-400 hover:text-slate-500 transition-colors text-lg leading-none">&times;</button>
          )}
        </div>
      </div>

      {/* Stats Bar */}
      <StatsBar stats={session.stats} status={session.status} />

      {/* Feed */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
        <AnimatePresence>
          {filteredFeed.map((entry, i) => (
            <FeedEntryRow
              key={entry.id}
              entry={entry}
              isLast={i === filteredFeed.length - 1 && session.status === 'active'}
            />
          ))}
        </AnimatePresence>
        <div ref={feedEndRef} />
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-slate-100 text-xs text-slate-300 flex justify-between">
        <span>{filteredFeed.length} / {session.feed.length} entries</span>
        <span>Session: {session.sessionId}</span>
      </div>
    </div>
  );
}

// ── Sidebar Compact Feed ─────────────────────────────────────

export function CollaborationSidebar({
  session,
  isOpen,
  onClose,
}: {
  session?: CollaborationSession | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 400, opacity: 0 }}
          transition={{ type: 'spring', damping: 25 }}
          className="fixed right-0 top-0 h-full w-[380px] z-50 bg-white/95 backdrop-blur-xl border-l border-slate-100 shadow-2xl"
        >
          <CollaborationFeed
            session={session}
            maxHeight="100vh"
            compact
            onClose={onClose}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
