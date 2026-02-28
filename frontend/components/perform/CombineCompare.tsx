'use client';

/**
 * CombineCompare -- Broadcast-Style Side-by-Side Comparison
 *
 * ESPN "Players Compared" graphic. 2-4 prospects shown side-by-side
 * with measurables bars, stock badges, and best/worst highlighting.
 *
 * Reusable: can be embedded in the Combine page, Big Board, or Draft page.
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  X, ArrowUpRight, ArrowDownRight, Minus, AlertCircle,
  Trophy,
} from 'lucide-react';
import type { SeedDraftProspect } from '@/lib/perform/seed-draft-data';
import { spring, transition, stagger, duration } from '@/lib/motion/tokens';
import { scaleFade, staggerContainer, staggerItem } from '@/lib/motion/variants';

// ────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────

export interface CombineCompareProps {
  prospects: SeedDraftProspect[];
  onClose: () => void;
}

// ────────────────────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────────────────────

interface Metric {
  key: keyof SeedDraftProspect;
  label: string;
  unit: string;
  lowerIsBetter?: boolean;
  /** Max value for bar width scaling */
  max: number;
}

const METRICS: Metric[] = [
  { key: 'fortyYard',    label: '40-Yard Dash',  unit: 's',  lowerIsBetter: true,  max: 5.5 },
  { key: 'tenYardSplit', label: '10-Yd Split',   unit: 's',  lowerIsBetter: true,  max: 2.0 },
  { key: 'verticalJump', label: 'Vertical Jump', unit: '"',  lowerIsBetter: false, max: 50 },
  { key: 'broadJump',    label: 'Broad Jump',    unit: '"',  lowerIsBetter: false, max: 145 },
  { key: 'benchPress',   label: 'Bench Press',   unit: ' reps', lowerIsBetter: false, max: 40 },
  { key: 'threeCone',    label: '3-Cone Drill',  unit: 's',  lowerIsBetter: true,  max: 8.5 },
  { key: 'shuttle',      label: '20-Yd Shuttle', unit: 's',  lowerIsBetter: true,  max: 5.0 },
];

const STOCK_CONFIG: Record<string, { label: string; icon: typeof ArrowUpRight; color: string; bg: string; border: string }> = {
  STOCK_UP:            { label: 'Stock Up',    icon: ArrowUpRight,  color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30' },
  STOCK_DOWN:          { label: 'Stock Down',  icon: ArrowDownRight, color: 'text-red-400',     bg: 'bg-red-500/15',     border: 'border-red-500/30' },
  AS_EXPECTED:         { label: 'As Expected', icon: Minus,         color: 'text-zinc-400',    bg: 'bg-zinc-500/15',    border: 'border-zinc-500/30' },
  DID_NOT_PARTICIPATE: { label: 'DNP',         icon: AlertCircle,   color: 'text-zinc-600',    bg: 'bg-zinc-700/15',    border: 'border-zinc-700/30' },
};

// Card accent colors per slot (gold for first, emerald, blue, amber)
const CARD_ACCENTS = [
  { border: 'border-gold/30', glow: 'shadow-[0_0_20px_rgba(212,175,55,0.08)]', text: 'text-gold' },
  { border: 'border-emerald-400/30', glow: 'shadow-[0_0_20px_rgba(52,211,153,0.08)]', text: 'text-emerald-400' },
  { border: 'border-blue-400/30', glow: 'shadow-[0_0_20px_rgba(96,165,250,0.08)]', text: 'text-blue-400' },
  { border: 'border-amber-400/30', glow: 'shadow-[0_0_20px_rgba(251,191,36,0.08)]', text: 'text-amber-400' },
];

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

function getNumericVal(p: SeedDraftProspect, key: keyof SeedDraftProspect): number | null {
  const v = p[key];
  if (typeof v === 'number') return v;
  return null;
}

/**
 * For a given metric, find the best and worst prospect indices.
 * Returns { bestIdx, worstIdx } or nulls if fewer than 2 have data.
 */
function findBestWorst(
  prospects: SeedDraftProspect[],
  metric: Metric,
): { bestIdx: number | null; worstIdx: number | null } {
  const values = prospects.map(p => getNumericVal(p, metric.key));
  const withData = values.map((v, i) => ({ v, i })).filter(x => x.v !== null) as { v: number; i: number }[];

  if (withData.length < 2) return { bestIdx: null, worstIdx: null };

  let bestIdx = withData[0].i;
  let worstIdx = withData[0].i;

  for (const { v, i } of withData) {
    const bestVal = values[bestIdx]!;
    const worstVal = values[worstIdx]!;
    if (metric.lowerIsBetter) {
      if (v < bestVal) bestIdx = i;
      if (v > worstVal) worstIdx = i;
    } else {
      if (v > bestVal) bestIdx = i;
      if (v < worstVal) worstIdx = i;
    }
  }

  // Don't mark best/worst if they are the same
  if (bestIdx === worstIdx) return { bestIdx: null, worstIdx: null };

  return { bestIdx, worstIdx };
}

/** Get bar width percentage for a metric value */
function getBarWidth(value: number | null, metric: Metric): number {
  if (value === null) return 0;
  if (metric.lowerIsBetter) {
    // Invert: lower value = wider bar
    return Math.max(5, Math.min(100, ((metric.max - value) / metric.max) * 120));
  }
  return Math.max(5, Math.min(100, (value / metric.max) * 100));
}

// ────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────

export default function CombineCompare({ prospects, onClose }: CombineCompareProps) {
  const prospectCount = prospects.length;
  const gridCols = prospectCount <= 2 ? 'grid-cols-2' : prospectCount === 3 ? 'grid-cols-3' : 'grid-cols-2 lg:grid-cols-4';

  // Pre-compute best/worst for each metric
  const metricAnalysis = useMemo(() =>
    METRICS.map(m => ({ metric: m, ...findBestWorst(prospects, m) })),
    [prospects]
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={transition.normal}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/80 backdrop-blur-sm p-4 md:p-8"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 10 }}
        transition={spring.gentle}
        className="relative w-full max-w-5xl bg-slate-950 border border-white/10 rounded-xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ───────────────────────────────────── */}
        <div className="relative px-6 py-5 border-b border-white/5">
          <div className="absolute inset-0 bg-gradient-to-r from-gold/5 via-transparent to-emerald-500/5" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center">
                <Trophy className="w-4 h-4 text-gold" />
              </div>
              <div>
                <h2 className="text-lg font-black uppercase tracking-wider text-white">
                  Combine Comparison
                </h2>
                <p className="text-[11px] text-zinc-500 font-mono tracking-wider">
                  Per|Form Scouting -- {prospectCount} Prospects
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Prospect Cards ───────────────────────────── */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className={`grid ${gridCols} gap-3 p-4 md:p-6`}
        >
          {prospects.map((p, idx) => {
            const accent = CARD_ACCENTS[idx % CARD_ACCENTS.length];
            const stock = STOCK_CONFIG[p.combineGrade ?? ''];

            return (
              <motion.div
                key={`${p.firstName}-${p.lastName}`}
                variants={staggerItem}
                className={`bg-white/[0.03] border ${accent.border} rounded-lg p-4 ${accent.glow}`}
              >
                {/* Name + Position */}
                <div className="mb-3">
                  <h3 className={`text-base md:text-lg font-black uppercase tracking-tight ${accent.text}`}>
                    {p.firstName} {p.lastName}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded">
                      {p.position}
                    </span>
                    <span className="text-[10px] text-zinc-500">{p.college}</span>
                  </div>
                </div>

                {/* Physical */}
                <div className="flex items-center gap-3 mb-3 text-[11px] text-zinc-400 font-mono">
                  {p.height && <span>{p.height}</span>}
                  {p.weight && <span>{p.weight} lbs</span>}
                </div>

                {/* Stock Badge */}
                {stock && (
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded border text-[10px] font-bold uppercase tracking-wider ${stock.color} ${stock.bg} ${stock.border}`}>
                    <stock.icon className="w-3 h-3" />
                    {stock.label}
                  </div>
                )}

                {/* P.A.I. Score */}
                <div className="mt-3 pt-3 border-t border-white/5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">P.A.I. Grade</span>
                    <span className={`text-xl font-black tabular-nums ${
                      p.paiScore >= 95 ? 'text-gold' :
                      p.paiScore >= 90 ? 'text-emerald-400' :
                      p.paiScore >= 85 ? 'text-blue-400' :
                      'text-zinc-400'
                    }`}>
                      {p.paiScore}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* ── Measurables Bars ─────────────────────────── */}
        <div className="px-4 md:px-6 pb-6">
          <div className="border-t border-white/5 pt-5">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-4">
              Athletic Measurables
            </h3>

            <div className="space-y-4">
              {metricAnalysis.map(({ metric, bestIdx, worstIdx }) => (
                <div key={metric.key as string}>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">
                    {metric.label}
                  </p>
                  <div className="space-y-1.5">
                    {prospects.map((p, idx) => {
                      const val = getNumericVal(p, metric.key);
                      const barWidth = getBarWidth(val, metric);
                      const isBest = bestIdx === idx;
                      const isWorst = worstIdx === idx;
                      const accent = CARD_ACCENTS[idx % CARD_ACCENTS.length];

                      return (
                        <div key={`${p.firstName}-${p.lastName}-${metric.key as string}`} className="flex items-center gap-3">
                          {/* Name label */}
                          <span className={`w-20 md:w-28 text-[10px] font-bold uppercase tracking-wider truncate shrink-0 ${accent.text}`}>
                            {p.lastName}
                          </span>

                          {/* Bar */}
                          <div className="flex-1 h-5 bg-white/[0.03] rounded overflow-hidden relative">
                            {val !== null ? (
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${barWidth}%` }}
                                transition={{ duration: duration.emphasis, ease: [0.2, 0, 0, 1] }}
                                className={`h-full rounded relative ${
                                  isBest
                                    ? 'bg-gradient-to-r from-gold/40 to-gold/20'
                                    : isWorst
                                      ? 'bg-gradient-to-r from-red-500/30 to-red-500/10'
                                      : 'bg-gradient-to-r from-zinc-500/30 to-zinc-500/10'
                                }`}
                              />
                            ) : (
                              <div className="h-full flex items-center justify-center">
                                <span className="text-[9px] text-zinc-600 font-mono">N/A</span>
                              </div>
                            )}
                          </div>

                          {/* Value */}
                          <span className={`w-16 text-right text-xs font-mono tabular-nums shrink-0 ${
                            val === null
                              ? 'text-zinc-600'
                              : isBest
                                ? 'text-gold font-black'
                                : isWorst
                                  ? 'text-red-400/70'
                                  : 'text-zinc-300'
                          }`}>
                            {val !== null ? `${val}${metric.unit}` : '--'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Footer ───────────────────────────────────── */}
        <div className="px-6 py-3 border-t border-white/5 bg-white/[0.02] flex items-center justify-between">
          <span className="text-[10px] text-zinc-600 font-mono">
            Per|Form Scouting -- 2026 NFL Combine
          </span>
          <span className="text-[10px] text-zinc-600 font-mono flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-gold/50" /> Best in group
            <span className="inline-block w-2 h-2 rounded-full bg-red-500/50 ml-2" /> Worst in group
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}
