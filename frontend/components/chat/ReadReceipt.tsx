// frontend/components/chat/ReadReceipt.tsx
'use client';

/**
 * Read Receipt — Collapsible engagement chip below chat responses
 *
 * Per ACHEEVY Memo 2:
 * - Default: collapsed / hidden
 * - User control: toggle to view sanitized engagement breakdown
 * - Never exposes secrets, internal pricing, or orchestration details
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  ChevronRight,
  Check,
  Clock,
  Shield,
  AlertTriangle,
  FileText,
  User,
  Briefcase,
} from 'lucide-react';
import type { ReadReceipt as ReadReceiptType, EngagementStatus } from '@/lib/acheevy/read-receipt';

interface ReadReceiptProps {
  receipt: ReadReceiptType;
}

const STATUS_CONFIG: Record<EngagementStatus, { color: string; label: string }> = {
  queued: { color: 'text-white/40', label: 'Queued' },
  classifying: { color: 'text-blue-400', label: 'Classifying' },
  routing: { color: 'text-cyan-400', label: 'Routing' },
  in_progress: { color: 'text-gold', label: 'In Progress' },
  review: { color: 'text-amber-400', label: 'Review' },
  delivered: { color: 'text-emerald-400', label: 'Delivered' },
  closed: { color: 'text-white/30', label: 'Closed' },
};

export function ReadReceiptChip({ receipt }: ReadReceiptProps) {
  const [expanded, setExpanded] = useState(false);

  const latestStatus = receipt.timelinePublic[receipt.timelinePublic.length - 1];
  const statusConfig = STATUS_CONFIG[latestStatus?.status || 'queued'];
  const passedCheckpoints = receipt.checkpointsPublic.filter(c => c.status === 'passed').length;
  const totalCheckpoints = receipt.checkpointsPublic.length;

  return (
    <div className="mt-2">
      {/* Collapsed Chip */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-wireframe-stroke hover:border-gold/20 transition-all text-[10px] group"
      >
        <FileText size={10} className="text-gold/40 group-hover:text-gold/70 transition-colors" />
        <span className="text-white/30 group-hover:text-white/50 transition-colors font-mono">
          Read Receipt
        </span>
        <span className="text-white/15 font-mono">{receipt.engagementId}</span>
        <span className={`${statusConfig.color} font-mono uppercase tracking-wider`}>
          {statusConfig.label}
        </span>
        <span className="text-white/15 font-mono">
          {passedCheckpoints}/{totalCheckpoints}
        </span>
        {expanded ? (
          <ChevronDown size={10} className="text-white/20" />
        ) : (
          <ChevronRight size={10} className="text-white/20" />
        )}
      </button>

      {/* Expanded View */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-2 rounded-xl border border-wireframe-stroke bg-[#0A0A0A]/80 backdrop-blur-xl p-4 space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield size={12} className="text-gold/50" />
                  <span className="text-[10px] text-white/50 font-mono uppercase tracking-widest">
                    Engagement Record
                  </span>
                </div>
                <span className="text-[9px] text-white/20 font-mono">
                  {new Date(receipt.createdAt).toLocaleString()}
                </span>
              </div>

              {/* Grid */}
              <div className="grid grid-cols-2 gap-3">
                {/* Engagement ID */}
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-white/25 mb-0.5">Engagement ID</p>
                  <p className="text-xs text-white/70 font-mono">{receipt.engagementId}</p>
                </div>

                {/* Client Role */}
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-white/25 mb-0.5">Role</p>
                  <div className="flex items-center gap-1.5">
                    {receipt.userRole === 'principal' ? (
                      <Briefcase size={10} className="text-gold/60" />
                    ) : (
                      <User size={10} className="text-white/40" />
                    )}
                    <p className="text-xs text-white/70 capitalize">{receipt.userRole}</p>
                  </div>
                </div>

                {/* Intent Category */}
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-white/25 mb-0.5">Intent</p>
                  <p className="text-xs text-gold/80 font-medium">{receipt.intentCategory}</p>
                </div>

                {/* Audit Posture */}
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-white/25 mb-0.5">Audit</p>
                  <p className="text-xs text-white/50">{receipt.auditFlagsPublic.join(', ')}</p>
                </div>
              </div>

              {/* Summary */}
              <div>
                <p className="text-[9px] uppercase tracking-wider text-white/25 mb-1">Summary</p>
                <p className="text-xs text-white/50 leading-relaxed">{receipt.summaryPublic}</p>
              </div>

              {/* Checkpoints */}
              <div>
                <p className="text-[9px] uppercase tracking-wider text-white/25 mb-2">Decision Checkpoints</p>
                <div className="space-y-1.5">
                  {receipt.checkpointsPublic.map((cp, i) => (
                    <div key={i} className="flex items-center gap-2">
                      {cp.status === 'passed' ? (
                        <Check size={10} className="text-emerald-400" />
                      ) : cp.status === 'blocked' ? (
                        <AlertTriangle size={10} className="text-red-400" />
                      ) : (
                        <Clock size={10} className="text-white/20" />
                      )}
                      <span className={`text-[11px] ${
                        cp.status === 'passed' ? 'text-emerald-400/80' : cp.status === 'blocked' ? 'text-red-400/80' : 'text-white/30'
                      }`}>
                        {cp.label}
                      </span>
                      {cp.requiredApproval && (
                        <span className="text-[8px] text-amber-400/60 border border-amber-400/20 rounded px-1 py-0.5 font-mono uppercase">
                          approval
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Tools */}
              <div>
                <p className="text-[9px] uppercase tracking-wider text-white/25 mb-1.5">Tools Used</p>
                <div className="flex flex-wrap gap-1">
                  {receipt.toolsPublic.map((tool, i) => (
                    <span key={i} className="text-[9px] text-white/40 bg-white/[0.03] border border-wireframe-stroke rounded-full px-2 py-0.5">
                      {tool}
                    </span>
                  ))}
                </div>
              </div>

              {/* Timeline */}
              <div>
                <p className="text-[9px] uppercase tracking-wider text-white/25 mb-2">Status Timeline</p>
                <div className="flex items-center gap-1">
                  {receipt.timelinePublic.map((entry, i) => {
                    const config = STATUS_CONFIG[entry.status];
                    return (
                      <div key={i} className="flex items-center gap-1">
                        {i > 0 && <div className="w-4 h-px bg-white/10" />}
                        <div className="flex items-center gap-1" title={`${entry.label} — ${new Date(entry.timestamp).toLocaleTimeString()}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            entry.status === 'delivered' ? 'bg-emerald-400' :
                            entry.status === 'in_progress' ? 'bg-gold animate-pulse' :
                            'bg-white/20'
                          }`} />
                          <span className={`text-[9px] font-mono ${config.color}`}>
                            {config.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
