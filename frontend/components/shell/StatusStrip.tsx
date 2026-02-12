'use client';

/**
 * StatusStrip - Persistent Status Bar
 *
 * A persistent status strip that surfaces:
 * - Active Boomer_Angs count
 * - Current LUC usage % + projected overage
 * - Deep link to /dashboard/luc
 *
 * This component should be rendered in the shell/layout.
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { AIMS_CIRCUIT_COLORS } from '@/components/ui/CircuitBoard';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface BoomerAngStatus {
  id: string;
  name: string;
  status: 'running' | 'waiting' | 'completed' | 'error';
  department: string;
  progress?: number;
}

interface LUCStatus {
  overallPercent: number;
  totalOverage: number;
  warnings: number;
  planName: string;
}

interface StatusStripProps {
  className?: string;
  position?: 'top' | 'bottom';
}

// ─────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────

const BotIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="10" rx="2" />
    <circle cx="12" cy="5" r="2" />
    <path d="M12 7v4" />
    <line x1="8" y1="16" x2="8" y2="16" />
    <line x1="16" y1="16" x2="16" y2="16" />
  </svg>
);

const ChartIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

const AlertIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const ChevronRightIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const SpinnerIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

// ─────────────────────────────────────────────────────────────
// Mock Data (replace with real API calls)
// ─────────────────────────────────────────────────────────────

const MOCK_BOOMER_ANGS: BoomerAngStatus[] = [
  { id: '1', name: 'Code Generator', status: 'running', department: 'Engineering', progress: 65 },
  { id: '2', name: 'Data Analyzer', status: 'waiting', department: 'Analytics' },
];

// ─────────────────────────────────────────────────────────────
// StatusStrip Component
// ─────────────────────────────────────────────────────────────

export function StatusStrip({ className = '', position = 'bottom' }: StatusStripProps) {
  const [boomerAngs, setBoomerAngs] = useState<BoomerAngStatus[]>(MOCK_BOOMER_ANGS);
  const [lucStatus, setLucStatus] = useState<LUCStatus | null>(null);
  const [expanded, setExpanded] = useState(false);

  // Fetch LUC status
  useEffect(() => {
    const fetchLUC = async () => {
      try {
        const res = await fetch('/api/luc?userId=default-user');
        const data = await res.json();
        if (data.success && data.summary) {
          setLucStatus({
            overallPercent: data.summary.overallPercentUsed,
            totalOverage: data.summary.totalOverageCost,
            warnings: data.summary.warnings.length,
            planName: data.summary.planName,
          });
        }
      } catch (error) {
        console.error('Failed to fetch LUC status:', error);
      }
    };

    fetchLUC();
    const interval = setInterval(fetchLUC, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const activeAgents = boomerAngs.filter(a => a.status === 'running' || a.status === 'waiting');
  const hasWarnings = lucStatus && lucStatus.warnings > 0;

  const positionClasses = {
    top: 'top-0',
    bottom: 'bottom-0',
  };

  return (
    <div
      className={`fixed left-0 right-0 z-40 ${positionClasses[position]} ${className}`}
      style={{
        backgroundColor: AIMS_CIRCUIT_COLORS.background + 'f5',
        backdropFilter: 'blur(12px)',
        borderTop: position === 'bottom' ? `1px solid ${AIMS_CIRCUIT_COLORS.dimLine}` : 'none',
        borderBottom: position === 'top' ? `1px solid ${AIMS_CIRCUIT_COLORS.dimLine}` : 'none',
      }}
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-10">
          {/* Left: Boomer_Angs Status */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-2 px-3 py-1 rounded-lg transition-colors hover:bg-white/5"
            >
              <BotIcon className="w-4 h-4" style={{ color: AIMS_CIRCUIT_COLORS.primary }} />
              <span className="text-xs font-medium" style={{ color: AIMS_CIRCUIT_COLORS.secondary }}>
                Boomer_Angs
              </span>
              <span
                className={`px-1.5 py-0.5 rounded text-xs font-bold ${
                  activeAgents.length > 0 ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                }`}
              >
                {activeAgents.length} active
              </span>
              {activeAgents.some(a => a.status === 'running') && (
                <SpinnerIcon className="w-3 h-3 text-green-400 animate-spin" />
              )}
            </button>
          </div>

          {/* Center: Quick Status Indicators */}
          <div className="flex items-center gap-6">
            {activeAgents.slice(0, 3).map((agent) => (
              <div key={agent.id} className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    agent.status === 'running'
                      ? 'bg-green-500 animate-pulse'
                      : agent.status === 'waiting'
                      ? 'bg-yellow-500'
                      : 'bg-gray-500'
                  }`}
                />
                <span className="text-xs text-gray-400 truncate max-w-[100px]">
                  {agent.name}
                </span>
                {agent.progress !== undefined && (
                  <span className="text-xs text-gray-500">{agent.progress}%</span>
                )}
              </div>
            ))}
          </div>

          {/* Right: LUC Status & Link */}
          <Link
            href="/dashboard/luc"
            className="flex items-center gap-3 px-3 py-1 rounded-lg transition-colors hover:bg-white/5 group"
          >
            <ChartIcon className="w-4 h-4" style={{ color: AIMS_CIRCUIT_COLORS.primary }} />

            {lucStatus ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">Usage:</span>
                  <span
                    className={`text-xs font-mono font-bold ${
                      lucStatus.overallPercent >= 80
                        ? 'text-red-400'
                        : lucStatus.overallPercent >= 60
                        ? 'text-yellow-400'
                        : 'text-green-400'
                    }`}
                  >
                    {lucStatus.overallPercent.toFixed(0)}%
                  </span>
                </div>

                {lucStatus.totalOverage > 0 && (
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-red-500/20">
                    <span className="text-xs text-red-400">
                      +${lucStatus.totalOverage.toFixed(2)}
                    </span>
                  </div>
                )}

                {hasWarnings && (
                  <div className="flex items-center gap-1">
                    <AlertIcon className="w-3 h-3 text-yellow-500" />
                    <span className="text-xs text-yellow-500">{lucStatus.warnings}</span>
                  </div>
                )}
              </>
            ) : (
              <span className="text-xs text-gray-500">Loading...</span>
            )}

            <ChevronRightIcon className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
          </Link>
        </div>
      </div>

      {/* Expanded Panel */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
            style={{
              borderTop: `1px solid ${AIMS_CIRCUIT_COLORS.dimLine}`,
            }}
          >
            <div className="max-w-7xl mx-auto px-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {boomerAngs.map((agent) => (
                  <div
                    key={agent.id}
                    className="p-3 rounded-lg bg-white/[0.03]"
                    style={{
                      border: `1px solid ${
                        agent.status === 'running'
                          ? '#22c55e40'
                          : agent.status === 'error'
                          ? '#ef444440'
                          : '#2d3a4d'
                      }`,
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            agent.status === 'running'
                              ? 'bg-green-500 animate-pulse'
                              : agent.status === 'waiting'
                              ? 'bg-yellow-500'
                              : agent.status === 'error'
                              ? 'bg-red-500'
                              : 'bg-gray-500'
                          }`}
                        />
                        <span className="text-sm font-medium text-white">{agent.name}</span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-xs ${
                          agent.status === 'running'
                            ? 'bg-green-500/20 text-green-400'
                            : agent.status === 'waiting'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : agent.status === 'error'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-gray-500/20 text-gray-400'
                        }`}
                      >
                        {agent.status}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400">{agent.department}</div>
                    {agent.progress !== undefined && (
                      <div className="mt-2">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-500">Progress</span>
                          <span className="text-gray-400">{agent.progress}%</span>
                        </div>
                        <div className="w-full h-1 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 rounded-full transition-all"
                            style={{ width: `${agent.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Compact StatusStrip (for embedding in headers)
// ─────────────────────────────────────────────────────────────

export function StatusStripCompact({ className = '' }: { className?: string }) {
  const [lucStatus, setLucStatus] = useState<LUCStatus | null>(null);

  useEffect(() => {
    const fetchLUC = async () => {
      try {
        const res = await fetch('/api/luc?userId=default-user');
        const data = await res.json();
        if (data.success && data.summary) {
          setLucStatus({
            overallPercent: data.summary.overallPercentUsed,
            totalOverage: data.summary.totalOverageCost,
            warnings: data.summary.warnings.length,
            planName: data.summary.planName,
          });
        }
      } catch (error) {
        console.error('Failed to fetch LUC status:', error);
      }
    };

    fetchLUC();
  }, []);

  return (
    <Link
      href="/dashboard/luc"
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors hover:bg-white/5 ${className}`}
      style={{
        backgroundColor: AIMS_CIRCUIT_COLORS.background,
        border: `1px solid ${AIMS_CIRCUIT_COLORS.dimLine}`,
      }}
    >
      <ChartIcon className="w-4 h-4" style={{ color: AIMS_CIRCUIT_COLORS.primary }} />
      {lucStatus ? (
        <span
          className={`text-xs font-mono font-bold ${
            lucStatus.overallPercent >= 80
              ? 'text-red-400'
              : lucStatus.overallPercent >= 60
              ? 'text-yellow-400'
              : 'text-green-400'
          }`}
        >
          {lucStatus.overallPercent.toFixed(0)}% used
        </span>
      ) : (
        <span className="text-xs text-gray-500">--</span>
      )}
    </Link>
  );
}

export default StatusStrip;
