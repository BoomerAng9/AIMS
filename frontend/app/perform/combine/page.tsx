'use client';

/**
 * Per|Form -- 2026 NFL Scouting Combine Results
 *
 * ESPN/NFL Network-style combine tracker. Dark luxury-industrial theme
 * matching the Per|Form NCAA Database page. Position-group tabs by workout
 * day, sortable measurables table, stock indicators, expandable notes,
 * and prospect comparison selection.
 *
 * Data: SEED_DRAFT_PROSPECTS, COMBINE_POSITION_GROUPS from seed-draft-data.
 * Animations: framer-motion with tokens from @/lib/motion/tokens.
 */

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowUpRight, ArrowDownRight, Minus, AlertCircle,
  ChevronUp, ChevronDown, ChevronRight,
  Trophy, Zap, Timer, Ruler, Dumbbell, Search, X,
  GitCompareArrows,
} from 'lucide-react';
import {
  SEED_DRAFT_PROSPECTS,
  COMBINE_POSITION_GROUPS,
} from '@/lib/perform/seed-draft-data';
import type { SeedDraftProspect, CombinePositionGroup } from '@/lib/perform/seed-draft-data';
import { transition, stagger, spring, duration } from '@/lib/motion/tokens';
import { staggerContainer, staggerItem, fadeUp, scaleFade } from '@/lib/motion/variants';
import CombineCompare from '@/components/perform/CombineCompare';

// ────────────────────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────────────────────

type SortField =
  | 'name' | 'position' | 'college' | 'height' | 'weight'
  | 'fortyYard' | 'tenYardSplit' | 'verticalJump' | 'broadJump'
  | 'benchPress' | 'threeCone' | 'shuttle' | 'combineGrade' | 'paiScore';
type SortDir = 'asc' | 'desc';

const TAB_KEYS: CombinePositionGroup[] = ['DL_EDGE_LB', 'DB_TE', 'QB_RB_WR', 'OL'];

const STOCK_BADGE: Record<string, { label: string; icon: typeof ArrowUpRight; color: string; bg: string }> = {
  STOCK_UP:            { label: 'Stock Up',   icon: ArrowUpRight,  color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  STOCK_DOWN:          { label: 'Stock Down', icon: ArrowDownRight, color: 'text-red-400',     bg: 'bg-red-400/10' },
  AS_EXPECTED:         { label: 'As Expected', icon: Minus,         color: 'text-zinc-400',    bg: 'bg-zinc-400/10' },
  DID_NOT_PARTICIPATE: { label: 'DNP',        icon: AlertCircle,   color: 'text-zinc-500',    bg: 'bg-zinc-500/10' },
};

/** Columns for the measurables table */
const COLUMNS: { key: SortField; label: string; shortLabel: string; numeric: boolean; lowerIsBetter?: boolean }[] = [
  { key: 'name',          label: 'Name',         shortLabel: 'Name',    numeric: false },
  { key: 'position',      label: 'Pos',          shortLabel: 'Pos',     numeric: false },
  { key: 'college',       label: 'College',       shortLabel: 'College', numeric: false },
  { key: 'height',        label: 'Ht',           shortLabel: 'Ht',     numeric: false },
  { key: 'weight',        label: 'Wt',           shortLabel: 'Wt',     numeric: true },
  { key: 'fortyYard',     label: '40-Yard',      shortLabel: '40',     numeric: true, lowerIsBetter: true },
  { key: 'tenYardSplit',  label: '10-Split',     shortLabel: '10s',    numeric: true, lowerIsBetter: true },
  { key: 'verticalJump',  label: 'Vert',         shortLabel: 'Vert',   numeric: true },
  { key: 'broadJump',     label: 'Broad',        shortLabel: 'Broad',  numeric: true },
  { key: 'benchPress',    label: 'Bench',        shortLabel: 'BP',     numeric: true },
  { key: 'threeCone',     label: '3-Cone',       shortLabel: '3C',     numeric: true, lowerIsBetter: true },
  { key: 'shuttle',       label: 'Shuttle',      shortLabel: 'Shtt',   numeric: true, lowerIsBetter: true },
  { key: 'combineGrade',  label: 'Stock',        shortLabel: 'Stock',  numeric: false },
  { key: 'paiScore',      label: 'Grade',        shortLabel: 'Grade',  numeric: true },
];

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

function heightToInches(h?: string): number {
  if (!h) return 0;
  const parts = h.replace(/['"]/g, '').split('-');
  const feet = parseInt(parts[0] || '0', 10);
  const inches = parseFloat(parts[1] || '0');
  return feet * 12 + inches;
}

function getValue(p: SeedDraftProspect, key: SortField): string | number {
  switch (key) {
    case 'name': return `${p.lastName}, ${p.firstName}`;
    case 'position': return p.position;
    case 'college': return p.college;
    case 'height': return heightToInches(p.height);
    case 'weight': return p.weight ?? 0;
    case 'fortyYard': return p.fortyYard ?? 99;
    case 'tenYardSplit': return p.tenYardSplit ?? 99;
    case 'verticalJump': return p.verticalJump ?? 0;
    case 'broadJump': return p.broadJump ?? 0;
    case 'benchPress': return p.benchPress ?? 0;
    case 'threeCone': return p.threeCone ?? 99;
    case 'shuttle': return p.shuttle ?? 99;
    case 'combineGrade': return p.combineGrade ?? '';
    case 'paiScore': return p.paiScore;
    default: return '';
  }
}

/** Determine if a value is the best in a group for a numeric column */
function isBestInGroup(
  prospect: SeedDraftProspect,
  field: SortField,
  group: SeedDraftProspect[],
  lowerIsBetter?: boolean,
): boolean {
  const col = COLUMNS.find(c => c.key === field);
  if (!col?.numeric) return false;
  const val = getValue(prospect, field) as number;
  if (val === 0 || val === 99) return false;
  const values = group
    .map(p => getValue(p, field) as number)
    .filter(v => v !== 0 && v !== 99);
  if (values.length === 0) return false;
  const best = lowerIsBetter
    ? Math.min(...values)
    : Math.max(...values);
  return val === best;
}

// ────────────────────────────────────────────────────────────
// Sub-Components
// ────────────────────────────────────────────────────────────

function SortHeader({
  label,
  shortLabel,
  field,
  currentSort,
  currentDir,
  onSort,
}: {
  label: string;
  shortLabel: string;
  field: SortField;
  currentSort: SortField;
  currentDir: SortDir;
  onSort: (f: SortField) => void;
}) {
  const active = currentSort === field;
  return (
    <button
      onClick={() => onSort(field)}
      className={`flex items-center gap-0.5 text-[10px] uppercase tracking-wider font-bold whitespace-nowrap transition-colors ${
        active ? 'text-gold' : 'text-zinc-500 hover:text-zinc-300'
      }`}
    >
      <span className="hidden md:inline">{label}</span>
      <span className="md:hidden">{shortLabel}</span>
      {active && (currentDir === 'asc'
        ? <ChevronUp className="w-3 h-3" />
        : <ChevronDown className="w-3 h-3" />
      )}
    </button>
  );
}

function StockBadge({ grade }: { grade?: string }) {
  const cfg = STOCK_BADGE[grade ?? ''];
  if (!cfg) return <span className="text-zinc-600">--</span>;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${cfg.color} ${cfg.bg}`}>
      <Icon className="w-3 h-3" />
      <span className="hidden lg:inline">{cfg.label}</span>
    </span>
  );
}

function MeasurableCell({
  value,
  isBest,
  unit,
  lowerIsBetter,
}: {
  value?: number;
  isBest: boolean;
  unit?: string;
  lowerIsBetter?: boolean;
}) {
  if (value === undefined || value === null) return <span className="text-zinc-600">--</span>;
  const displayVal = unit ? `${value}${unit}` : value;
  return (
    <span className={`font-mono text-xs tabular-nums ${
      isBest ? 'text-gold font-black' : 'text-zinc-300'
    }`}>
      {displayVal}
      {isBest && <span className="ml-0.5 text-[8px] text-gold/60 align-super">*</span>}
    </span>
  );
}

// ────────────────────────────────────────────────────────────
// Main Page Component
// ────────────────────────────────────────────────────────────

export default function CombinePage() {
  const [activeTab, setActiveTab] = useState<CombinePositionGroup>('QB_RB_WR');
  const [sortField, setSortField] = useState<SortField>('paiScore');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [compareList, setCompareList] = useState<SeedDraftProspect[]>([]);
  const [showCompare, setShowCompare] = useState(false);

  // Filter prospects for the active position group
  const groupPositions = COMBINE_POSITION_GROUPS[activeTab].positions;
  const combineProspects = useMemo(() =>
    SEED_DRAFT_PROSPECTS.filter(p =>
      p.combineInvite &&
      groupPositions.some(pos =>
        p.position.toUpperCase() === pos.toUpperCase()
      )
    ),
    [activeTab, groupPositions]
  );

  // Apply search filter
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return combineProspects;
    const q = searchQuery.toLowerCase();
    return combineProspects.filter(p =>
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) ||
      p.college.toLowerCase().includes(q) ||
      p.position.toLowerCase().includes(q)
    );
  }, [combineProspects, searchQuery]);

  // Sort
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aVal = getValue(a, sortField);
      const bVal = getValue(b, sortField);
      const mult = sortDir === 'asc' ? 1 : -1;
      if (typeof aVal === 'number' && typeof bVal === 'number') return (aVal - bVal) * mult;
      return String(aVal).localeCompare(String(bVal)) * mult;
    });
  }, [filtered, sortField, sortDir]);

  const handleSort = useCallback((field: SortField) => {
    if (field === sortField) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      const col = COLUMNS.find(c => c.key === field);
      setSortDir(col?.lowerIsBetter ? 'asc' : 'desc');
    }
  }, [sortField]);

  const toggleExpand = useCallback((key: string) => {
    setExpandedRow(prev => prev === key ? null : key);
  }, []);

  const toggleCompare = useCallback((p: SeedDraftProspect) => {
    setCompareList(prev => {
      const key = `${p.firstName}-${p.lastName}`;
      const exists = prev.some(x => `${x.firstName}-${x.lastName}` === key);
      if (exists) return prev.filter(x => `${x.firstName}-${x.lastName}` !== key);
      if (prev.length >= 4) return prev;
      return [...prev, p];
    });
  }, []);

  const isInCompare = useCallback((p: SeedDraftProspect) => {
    const key = `${p.firstName}-${p.lastName}`;
    return compareList.some(x => `${x.firstName}-${x.lastName}` === key);
  }, [compareList]);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* ── Hero / Headline ──────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.08),transparent_60%)]" />

        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="relative mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-10 md:py-16"
        >
          <motion.div variants={staggerItem} className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-2 px-3 py-1 rounded bg-emerald-500/10 border border-emerald-500/20">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-400">
                Live -- Combine Week
              </span>
            </div>
            <span className="text-[11px] font-mono text-zinc-500 tracking-wider">
              Feb 26 -- Mar 1, 2026
            </span>
          </motion.div>

          <motion.h1
            variants={staggerItem}
            className="text-3xl md:text-5xl font-black uppercase tracking-tight leading-none mb-3"
          >
            2026 NFL Scouting Combine
          </motion.h1>

          <motion.p variants={staggerItem} className="text-zinc-400 text-sm md:text-base max-w-2xl mb-2">
            Lucas Oil Stadium -- Indianapolis, IN
          </motion.p>

          <motion.div variants={staggerItem} className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <Timer className="w-3.5 h-3.5" />
              <span>{SEED_DRAFT_PROSPECTS.filter(p => p.combineInvite).length} prospects invited</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <Trophy className="w-3.5 h-3.5" />
              <span>{SEED_DRAFT_PROSPECTS.filter(p => p.combineGrade === 'STOCK_UP').length} stock risers</span>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Position Group Tabs ──────────────────────────────── */}
      <div className="sticky top-[88px] z-30 bg-slate-950/95 backdrop-blur-sm border-b border-white/5">
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
          <nav className="flex items-center gap-1 py-2 overflow-x-auto scrollbar-hide no-scrollbar">
            {TAB_KEYS.map(key => {
              const grp = COMBINE_POSITION_GROUPS[key];
              const isActive = activeTab === key;
              return (
                <button
                  key={key}
                  onClick={() => { setActiveTab(key); setExpandedRow(null); }}
                  className={`relative flex flex-col items-start px-4 py-2 rounded transition-all whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-white/5 border border-gold/30'
                      : 'border border-transparent hover:bg-white/[0.03] hover:border-white/10'
                  }`}
                >
                  <span className={`text-xs md:text-sm font-black uppercase tracking-wider ${
                    isActive ? 'text-gold' : 'text-zinc-400'
                  }`}>
                    {grp.label}
                  </span>
                  <span className={`text-[10px] font-mono ${isActive ? 'text-gold/60' : 'text-zinc-600'}`}>
                    {grp.date}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="combine-tab-indicator"
                      className="absolute bottom-0 left-2 right-2 h-0.5 bg-gold rounded-full"
                      transition={spring.snappy}
                    />
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* ── Toolbar: Search + Compare ────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search prospects..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-gold/40 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Compare bar */}
          <div className="flex items-center gap-3">
            {compareList.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={spring.snappy}
                className="flex items-center gap-2"
              >
                <span className="text-[11px] text-zinc-400 font-mono">
                  {compareList.length}/4 selected
                </span>
                <button
                  onClick={() => setCompareList([])}
                  className="text-[11px] text-red-400 hover:text-red-300 font-bold uppercase tracking-wider"
                >
                  Clear
                </button>
              </motion.div>
            )}
            <button
              onClick={() => { if (compareList.length >= 2) setShowCompare(true); }}
              disabled={compareList.length < 2}
              className={`flex items-center gap-2 px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-all ${
                compareList.length >= 2
                  ? 'bg-gold/15 text-gold border border-gold/30 hover:bg-gold/25'
                  : 'bg-white/5 text-zinc-600 border border-white/5 cursor-not-allowed'
              }`}
            >
              <GitCompareArrows className="w-3.5 h-3.5" />
              Compare
            </button>
          </div>
        </div>

        <p className="text-[11px] text-zinc-600 mt-2 font-mono">
          Showing {sorted.length} prospect{sorted.length !== 1 ? 's' : ''} --{' '}
          {COMBINE_POSITION_GROUPS[activeTab].label} ({COMBINE_POSITION_GROUPS[activeTab].date})
          {' '}-- <span className="text-gold/60">* = best in group</span>
        </p>
      </div>

      {/* ── Table ────────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 pb-16">
        <div className="overflow-x-auto rounded-lg border border-white/5 bg-white/[0.02]">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                {/* Compare checkbox col */}
                <th className="w-8 px-2 py-3" />
                {COLUMNS.map(col => (
                  <th key={col.key} className="px-2 py-3 text-left">
                    <SortHeader
                      label={col.label}
                      shortLabel={col.shortLabel}
                      field={col.key}
                      currentSort={sortField}
                      currentDir={sortDir}
                      onSort={handleSort}
                    />
                  </th>
                ))}
                {/* Expand col */}
                <th className="w-8 px-2 py-3" />
              </tr>
            </thead>

            <AnimatePresence mode="popLayout">
              <motion.tbody
                key={activeTab}
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: { staggerChildren: stagger.fast },
                  },
                }}
              >
                {sorted.map((p, idx) => {
                  const rowKey = `${p.firstName}-${p.lastName}`;
                  const isExpanded = expandedRow === rowKey;
                  const selected = isInCompare(p);
                  const isRecordBreaker = p.combineGrade === 'STOCK_UP' && (
                    p.combineNotes?.toUpperCase().includes('RECORD') ||
                    p.combineNotes?.toUpperCase().includes('FASTEST') ||
                    p.combineNotes?.toUpperCase().includes('BEST COMBINE') ||
                    p.combineNotes?.toUpperCase().includes('HISTORIC')
                  );

                  return (
                    <motion.tr
                      key={rowKey}
                      variants={{
                        hidden: { opacity: 0, y: 6 },
                        visible: { opacity: 1, y: 0, transition: transition.enter },
                      }}
                      className={`border-b border-white/[0.03] transition-colors group ${
                        isRecordBreaker
                          ? 'bg-gold/[0.04] hover:bg-gold/[0.07]'
                          : selected
                            ? 'bg-emerald-400/[0.04] hover:bg-emerald-400/[0.07]'
                            : 'hover:bg-white/[0.03]'
                      }`}
                    >
                      {/* Compare checkbox */}
                      <td className="px-2 py-2.5">
                        <button
                          onClick={() => toggleCompare(p)}
                          className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                            selected
                              ? 'bg-emerald-500 border-emerald-400 text-white'
                              : 'border-zinc-700 hover:border-zinc-500 text-transparent hover:text-zinc-600'
                          }`}
                        >
                          {selected && (
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      </td>

                      {/* Name */}
                      <td className="px-2 py-2.5">
                        <div className="flex flex-col">
                          <span className={`text-sm font-bold ${isRecordBreaker ? 'text-gold' : 'text-white'}`}>
                            {p.firstName} {p.lastName}
                          </span>
                          {isRecordBreaker && (
                            <span className="text-[9px] font-bold uppercase tracking-widest text-gold/70 mt-0.5">
                              Record Breaker
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Position */}
                      <td className="px-2 py-2.5">
                        <span className="text-xs font-mono text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded">
                          {p.position}
                        </span>
                      </td>

                      {/* College */}
                      <td className="px-2 py-2.5 text-xs text-zinc-400">{p.college}</td>

                      {/* Height */}
                      <td className="px-2 py-2.5 text-xs text-zinc-300 font-mono">{p.height ?? '--'}</td>

                      {/* Weight */}
                      <td className="px-2 py-2.5 text-xs text-zinc-300 font-mono">{p.weight ?? '--'}</td>

                      {/* 40-Yard */}
                      <td className="px-2 py-2.5">
                        <MeasurableCell
                          value={p.fortyYard}
                          isBest={isBestInGroup(p, 'fortyYard', sorted, true)}
                          lowerIsBetter
                        />
                      </td>

                      {/* 10-Split */}
                      <td className="px-2 py-2.5">
                        <MeasurableCell
                          value={p.tenYardSplit}
                          isBest={isBestInGroup(p, 'tenYardSplit', sorted, true)}
                          lowerIsBetter
                        />
                      </td>

                      {/* Vertical */}
                      <td className="px-2 py-2.5">
                        <MeasurableCell
                          value={p.verticalJump}
                          isBest={isBestInGroup(p, 'verticalJump', sorted)}
                          unit='"'
                        />
                      </td>

                      {/* Broad Jump */}
                      <td className="px-2 py-2.5">
                        <MeasurableCell
                          value={p.broadJump}
                          isBest={isBestInGroup(p, 'broadJump', sorted)}
                          unit='"'
                        />
                      </td>

                      {/* Bench */}
                      <td className="px-2 py-2.5">
                        <MeasurableCell
                          value={p.benchPress}
                          isBest={isBestInGroup(p, 'benchPress', sorted)}
                        />
                      </td>

                      {/* 3-Cone */}
                      <td className="px-2 py-2.5">
                        <MeasurableCell
                          value={p.threeCone}
                          isBest={isBestInGroup(p, 'threeCone', sorted, true)}
                          lowerIsBetter
                        />
                      </td>

                      {/* Shuttle */}
                      <td className="px-2 py-2.5">
                        <MeasurableCell
                          value={p.shuttle}
                          isBest={isBestInGroup(p, 'shuttle', sorted, true)}
                          lowerIsBetter
                        />
                      </td>

                      {/* Stock */}
                      <td className="px-2 py-2.5">
                        <StockBadge grade={p.combineGrade} />
                      </td>

                      {/* Grade */}
                      <td className="px-2 py-2.5">
                        <span className={`text-sm font-black tabular-nums ${
                          p.paiScore >= 95 ? 'text-gold' :
                          p.paiScore >= 90 ? 'text-emerald-400' :
                          p.paiScore >= 85 ? 'text-blue-400' :
                          'text-zinc-400'
                        }`}>
                          {p.paiScore}
                        </span>
                      </td>

                      {/* Expand */}
                      <td className="px-2 py-2.5">
                        {p.combineNotes && (
                          <button
                            onClick={() => toggleExpand(rowKey)}
                            className="text-zinc-600 hover:text-zinc-300 transition-colors"
                          >
                            <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} style={{ transitionDuration: `${duration.fast * 1000}ms` }} />
                          </button>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
              </motion.tbody>
            </AnimatePresence>
          </table>

          {sorted.length === 0 && (
            <div className="py-16 text-center text-zinc-500 text-sm">
              No prospects found for this group.
            </div>
          )}
        </div>

        {/* ── Expanded Notes (renders below table for mobile friendliness) */}
        <AnimatePresence>
          {expandedRow && (() => {
            const p = sorted.find(x => `${x.firstName}-${x.lastName}` === expandedRow);
            if (!p?.combineNotes) return null;
            return (
              <motion.div
                key={`notes-${expandedRow}`}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: duration.normal, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="mt-3 p-4 bg-white/[0.03] border border-white/5 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-gold">
                      Combine Notes
                    </span>
                    <span className="text-xs text-zinc-500">
                      {p.firstName} {p.lastName} -- {p.position}, {p.college}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-300 leading-relaxed">{p.combineNotes}</p>
                  <div className="flex items-center gap-4 mt-3">
                    {p.armLength && (
                      <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                        <Ruler className="w-3 h-3" />
                        <span>Arms: {p.armLength}</span>
                      </div>
                    )}
                    {p.handSize && (
                      <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                        <Dumbbell className="w-3 h-3" />
                        <span>Hands: {p.handSize}</span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })()}
        </AnimatePresence>
      </div>

      {/* ── Compare Overlay ──────────────────────────────────── */}
      <AnimatePresence>
        {showCompare && compareList.length >= 2 && (
          <CombineCompare
            prospects={compareList}
            onClose={() => setShowCompare(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
