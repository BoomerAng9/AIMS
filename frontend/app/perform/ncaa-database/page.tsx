'use client';

/**
 * Per|Form — NCAA Football Database
 *
 * PFF-level college football database. Dense, sortable, filterable.
 * Three tabs: Player Database | Team Database | Position Rankings
 *
 * All data sourced from /api/perform/prospects and /api/perform/teams
 * with fallback to seed data. No mock data — real structure, real scores.
 */

import { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  Search, ChevronUp, ChevronDown, Database, Users, Shield, Filter,
  ArrowUpRight, ArrowDownRight, Minus, Star, Trophy, MapPin, Building2,
  SlidersHorizontal, X, ChevronRight, BarChart3, TrendingUp,
} from 'lucide-react';
import type { Prospect, Tier, Trend, Pool } from '@/lib/perform/types';
import { TIER_STYLES, TREND_STYLES, getScoreColor, getProspectSlug } from '@/lib/perform/types';
import { CONFERENCES, TIER_LABELS } from '@/lib/perform/conferences';
import type { Conference, ConferenceTier, Team } from '@/lib/perform/conferences';

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

type TabId = 'players' | 'teams' | 'positions';
type SortDir = 'asc' | 'desc';

const TABS: { id: TabId; label: string; icon: typeof Database }[] = [
  { id: 'players', label: 'Player Database', icon: Database },
  { id: 'teams', label: 'Team Database', icon: Building2 },
  { id: 'positions', label: 'Position Rankings', icon: BarChart3 },
];

const POSITIONS = [
  'QB', 'RB', 'WR', 'TE', 'OT', 'OG', 'C', 'IOL',
  'EDGE', 'DT', 'DL', 'LB', 'CB', 'S', 'DB', 'K', 'P', 'ATH',
];

const TIERS: Tier[] = ['ELITE', 'BLUE_CHIP', 'PROSPECT', 'SLEEPER', 'DEVELOPMENTAL'];
const POOLS: { value: Pool | ''; label: string }[] = [
  { value: '', label: 'All Pools' },
  { value: 'HIGH_SCHOOL', label: 'High School' },
  { value: 'COLLEGE', label: 'College' },
];

const CONFERENCES_FILTER = [
  { value: '', label: 'All Conferences' },
  ...CONFERENCES.map(c => ({ value: c.abbreviation, label: c.abbreviation })),
];

// ─────────────────────────────────────────────────────────────
// Trend Icon
// ─────────────────────────────────────────────────────────────

function TrendIcon({ trend }: { trend: string }) {
  if (trend === 'UP') return <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />;
  if (trend === 'DOWN') return <ArrowDownRight className="w-3.5 h-3.5 text-red-500" />;
  if (trend === 'NEW') return <Star className="w-3.5 h-3.5 text-gold" />;
  return <Minus className="w-3.5 h-3.5 text-slate-300" />;
}

// ─────────────────────────────────────────────────────────────
// Sortable Header
// ─────────────────────────────────────────────────────────────

function SortHeader({
  label,
  field,
  currentSort,
  currentDir,
  onSort,
  className = '',
}: {
  label: string;
  field: string;
  currentSort: string;
  currentDir: SortDir;
  onSort: (field: string) => void;
  className?: string;
}) {
  const isActive = currentSort === field;
  return (
    <button
      onClick={() => onSort(field)}
      className={`flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider hover:text-slate-700 transition-colors ${
        isActive ? 'text-gold' : 'text-slate-400'
      } ${className}`}
    >
      {label}
      {isActive && (currentDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// Score Badge
// ─────────────────────────────────────────────────────────────

function ScoreBadge({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' | 'lg' }) {
  const color = getScoreColor(score);
  const sizeClass = size === 'lg' ? 'text-2xl' : size === 'md' ? 'text-lg' : 'text-sm';
  return <span className={`font-black tabular-nums ${color} ${sizeClass}`}>{score}</span>;
}

// ─────────────────────────────────────────────────────────────
// Tier Pill
// ─────────────────────────────────────────────────────────────

function TierPill({ tier }: { tier: string }) {
  const style = TIER_STYLES[tier as Tier];
  if (!style) return <span className="text-[10px] text-slate-400">{tier}</span>;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${style.bg} ${style.text} border ${style.border}`}>
      {style.label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// Filter Chip
// ─────────────────────────────────────────────────────────────

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all ${
        active
          ? 'bg-gold/15 text-gold border-gold/30'
          : 'bg-white text-slate-500 border-slate-200 hover:text-slate-700 hover:bg-slate-50'
      }`}
    >
      {label}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────

export default function NCAADatabasePage() {
  const [activeTab, setActiveTab] = useState<TabId>('players');
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);

  // Player filters
  const [search, setSearch] = useState('');
  const [posFilter, setPosFilter] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [poolFilter, setPoolFilter] = useState('');
  const [confFilter, setConfFilter] = useState('');
  const [sortField, setSortField] = useState('paiScore');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [showFilters, setShowFilters] = useState(false);

  // Team filters
  const [teamSearch, setTeamSearch] = useState('');
  const [teamConfFilter, setTeamConfFilter] = useState<ConferenceTier | ''>('');

  // Position rankings
  const [posRankPosition, setPosRankPosition] = useState('QB');

  // ── Load data ────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/perform/prospects?limit=500')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setProspects(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // ── Sort handler ─────────────────────────────────────────
  const handleSort = useCallback((field: string) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir(field === 'name' || field === 'school' ? 'asc' : 'desc');
    }
  }, [sortField]);

  // ── Filtered & sorted prospects ──────────────────────────
  const filteredProspects = useMemo(() => {
    let data = [...prospects];

    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.school?.toLowerCase().includes(q) ||
        p.state?.toLowerCase().includes(q) ||
        p.position?.toLowerCase().includes(q)
      );
    }
    if (posFilter) data = data.filter(p => p.position === posFilter);
    if (tierFilter) data = data.filter(p => p.tier === tierFilter);
    if (poolFilter) data = data.filter(p => p.pool === poolFilter);
    if (confFilter) {
      data = data.filter(p => {
        const conf = CONFERENCES.find(c => c.abbreviation === confFilter);
        if (!conf) return false;
        return conf.teams.some(t =>
          t.schoolName.toLowerCase() === p.school?.toLowerCase() ||
          t.commonName.toLowerCase() === p.school?.toLowerCase()
        );
      });
    }

    data.sort((a, b) => {
      const valA = (a as any)[sortField];
      const valB = (b as any)[sortField];
      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      const numA = Number(valA) || 0;
      const numB = Number(valB) || 0;
      return sortDir === 'asc' ? numA - numB : numB - numA;
    });

    return data;
  }, [prospects, search, posFilter, tierFilter, poolFilter, confFilter, sortField, sortDir]);

  // ── Filtered teams ───────────────────────────────────────
  const allTeams = useMemo(() => {
    return CONFERENCES.flatMap(c =>
      c.teams.map(t => ({ ...t, conferenceName: c.name, conferenceAbbrev: c.abbreviation, conferenceTier: c.tier }))
    );
  }, []);

  const filteredTeams = useMemo(() => {
    let teams = [...allTeams];
    if (teamConfFilter) {
      teams = teams.filter(t => t.conferenceTier === teamConfFilter);
    }
    if (teamSearch.trim()) {
      const q = teamSearch.toLowerCase();
      teams = teams.filter(t =>
        t.schoolName.toLowerCase().includes(q) ||
        t.commonName.toLowerCase().includes(q) ||
        t.headCoach.toLowerCase().includes(q) ||
        t.mascot.toLowerCase().includes(q) ||
        t.city.toLowerCase().includes(q) ||
        t.state.toLowerCase().includes(q)
      );
    }
    return teams.sort((a, b) => a.schoolName.localeCompare(b.schoolName));
  }, [allTeams, teamConfFilter, teamSearch]);

  // ── Position rankings ────────────────────────────────────
  const positionPlayers = useMemo(() => {
    return prospects
      .filter(p => p.position === posRankPosition)
      .sort((a, b) => b.paiScore - a.paiScore);
  }, [prospects, posRankPosition]);

  // ── Stats ────────────────────────────────────────────────
  const dbStats = useMemo(() => {
    const uniquePositions = new Set(prospects.map(p => p.position));
    const uniqueSchools = new Set(prospects.map(p => p.school));
    const avgScore = prospects.length > 0
      ? (prospects.reduce((s, p) => s + p.paiScore, 0) / prospects.length).toFixed(1)
      : '0';
    const eliteCount = prospects.filter(p => p.tier === 'ELITE').length;
    return {
      totalPlayers: prospects.length,
      positions: uniquePositions.size,
      schools: uniqueSchools.size,
      avgScore,
      eliteCount,
      teams: allTeams.length,
    };
  }, [prospects, allTeams]);

  const activeFilters = [posFilter, tierFilter, poolFilter, confFilter].filter(Boolean).length;

  return (
    <div className="mx-auto max-w-[1400px] px-4 md:px-6 lg:px-8 py-8 md:py-10">

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Database className="w-7 h-7 text-gold" />
          <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight">
            NCAA Football Database
          </h1>
        </div>
        <p className="text-sm text-slate-500 max-w-2xl">
          Every prospect. Every team. Every conference. P.A.I.-graded and AI-verified.
          The most comprehensive college football intelligence database powered by A.I.M.S.
        </p>
      </div>

      {/* ── KPI Strip ───────────────────────────────────────── */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-8">
        {[
          { label: 'Players', value: dbStats.totalPlayers.toLocaleString() },
          { label: 'Teams', value: dbStats.teams },
          { label: 'Conferences', value: CONFERENCES.length },
          { label: 'Positions', value: dbStats.positions },
          { label: 'Avg P.A.I.', value: dbStats.avgScore },
          { label: 'Elite Tier', value: dbStats.eliteCount },
        ].map(kpi => (
          <div key={kpi.label} className="flex flex-col items-center gap-0.5 px-3 py-3 rounded-xl bg-white border border-slate-200">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">{kpi.label}</span>
            <span className="text-xl font-bold text-gold tabular-nums">{kpi.value}</span>
          </div>
        ))}
      </div>

      {/* ── Tab Navigation ──────────────────────────────────── */}
      <div className="flex items-center gap-1 mb-6 border-b border-slate-200">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${
                isActive
                  ? 'border-gold text-gold'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
        <div className="flex-1" />
        <span className="text-[11px] font-mono text-slate-300 uppercase tracking-widest pr-2">
          Per|Form Intelligence
        </span>
      </div>

      {/* ════════════════════════════════════════════════════════
           TAB: PLAYER DATABASE
         ════════════════════════════════════════════════════════ */}
      {activeTab === 'players' && (
        <div>
          {/* Search + Filter Toggle */}
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, school, state, or position..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-gold/40 focus:ring-1 focus:ring-gold/20"
              />
            </div>
            <button
              onClick={() => setShowFilters(f => !f)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                showFilters || activeFilters > 0
                  ? 'bg-gold/10 text-gold border-gold/30'
                  : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              {activeFilters > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-gold text-black text-[10px] font-bold">
                  {activeFilters}
                </span>
              )}
            </button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mb-6 p-4 rounded-xl bg-white border border-slate-200 space-y-4">
              {/* Position */}
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 block">Position</label>
                <div className="flex flex-wrap gap-1.5">
                  <FilterChip label="All" active={!posFilter} onClick={() => setPosFilter('')} />
                  {POSITIONS.map(p => (
                    <FilterChip key={p} label={p} active={posFilter === p} onClick={() => setPosFilter(posFilter === p ? '' : p)} />
                  ))}
                </div>
              </div>

              {/* Tier */}
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 block">Tier</label>
                <div className="flex flex-wrap gap-1.5">
                  <FilterChip label="All" active={!tierFilter} onClick={() => setTierFilter('')} />
                  {TIERS.map(t => (
                    <FilterChip key={t} label={TIER_STYLES[t].label} active={tierFilter === t} onClick={() => setTierFilter(tierFilter === t ? '' : t)} />
                  ))}
                </div>
              </div>

              {/* Pool + Conference */}
              <div className="flex flex-wrap gap-4">
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 block">Pool</label>
                  <select
                    value={poolFilter}
                    onChange={e => setPoolFilter(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 bg-white focus:outline-none focus:border-gold/40"
                  >
                    {POOLS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 block">Conference</label>
                  <select
                    value={confFilter}
                    onChange={e => setConfFilter(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 bg-white focus:outline-none focus:border-gold/40"
                  >
                    {CONFERENCES_FILTER.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Clear All */}
              {activeFilters > 0 && (
                <button
                  onClick={() => { setPosFilter(''); setTierFilter(''); setPoolFilter(''); setConfFilter(''); }}
                  className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600 transition-colors"
                >
                  <X className="w-3.5 h-3.5" /> Clear all filters
                </button>
              )}
            </div>
          )}

          {/* Results count */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-widest">
              {filteredProspects.length} player{filteredProspects.length !== 1 ? 's' : ''}
              {activeFilters > 0 && ' (filtered)'}
            </span>
            <span className="text-[11px] font-mono text-slate-300 uppercase tracking-widest">
              Sorted by {sortField} {sortDir === 'desc' ? '↓' : '↑'}
            </span>
          </div>

          {/* ── Data Table ──────────────────────────────────── */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="px-4 py-3 w-12">
                      <SortHeader label="Rank" field="nationalRank" currentSort={sortField} currentDir={sortDir} onSort={handleSort} />
                    </th>
                    <th className="px-4 py-3">
                      <SortHeader label="Player" field="name" currentSort={sortField} currentDir={sortDir} onSort={handleSort} />
                    </th>
                    <th className="px-3 py-3 w-16">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Pos</span>
                    </th>
                    <th className="px-4 py-3">
                      <SortHeader label="School" field="school" currentSort={sortField} currentDir={sortDir} onSort={handleSort} />
                    </th>
                    <th className="px-3 py-3 w-12 hidden md:table-cell">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">St</span>
                    </th>
                    <th className="px-3 py-3 w-16 hidden lg:table-cell">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Class</span>
                    </th>
                    <th className="px-3 py-3 w-20">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Tier</span>
                    </th>
                    <th className="px-3 py-3 w-16 text-center">
                      <SortHeader label="P.A.I." field="paiScore" currentSort={sortField} currentDir={sortDir} onSort={handleSort} className="justify-center" />
                    </th>
                    <th className="px-3 py-3 w-12 text-center hidden lg:table-cell">
                      <SortHeader label="P" field="performance" currentSort={sortField} currentDir={sortDir} onSort={handleSort} className="justify-center" />
                    </th>
                    <th className="px-3 py-3 w-12 text-center hidden lg:table-cell">
                      <SortHeader label="A" field="athleticism" currentSort={sortField} currentDir={sortDir} onSort={handleSort} className="justify-center" />
                    </th>
                    <th className="px-3 py-3 w-12 text-center hidden lg:table-cell">
                      <SortHeader label="I" field="intangibles" currentSort={sortField} currentDir={sortDir} onSort={handleSort} className="justify-center" />
                    </th>
                    <th className="px-3 py-3 w-10 text-center">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Δ</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    <tr>
                      <td colSpan={12} className="px-4 py-16 text-center">
                        <div className="animate-pulse flex flex-col items-center gap-2">
                          <Database className="w-8 h-8 text-slate-200" />
                          <span className="text-sm text-slate-400">Loading database...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredProspects.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="px-4 py-16 text-center">
                        <Search className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                        <span className="text-sm text-slate-400">No players match your filters.</span>
                      </td>
                    </tr>
                  ) : (
                    filteredProspects.slice(0, 100).map((p, i) => (
                      <tr key={p.id} className="hover:bg-gold/[0.02] transition-colors group">
                        <td className="px-4 py-3">
                          <span className="text-sm font-bold text-slate-300 tabular-nums">{p.nationalRank || i + 1}</span>
                        </td>
                        <td className="px-4 py-3">
                          <Link href={`/perform/prospects/${getProspectSlug(p)}`} className="group/link">
                            <span className="text-sm font-semibold text-slate-800 group-hover/link:text-gold transition-colors">
                              {p.name}
                            </span>
                          </Link>
                        </td>
                        <td className="px-3 py-3">
                          <span className="inline-flex items-center justify-center w-9 h-6 rounded bg-slate-100 text-[10px] font-bold text-slate-600">
                            {p.position}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-slate-600">{p.school}</span>
                        </td>
                        <td className="px-3 py-3 hidden md:table-cell">
                          <span className="text-xs text-slate-400">{p.state}</span>
                        </td>
                        <td className="px-3 py-3 hidden lg:table-cell">
                          <span className="text-xs text-slate-400">{p.classYear}</span>
                        </td>
                        <td className="px-3 py-3">
                          <TierPill tier={p.tier} />
                        </td>
                        <td className="px-3 py-3 text-center">
                          <ScoreBadge score={p.paiScore} />
                        </td>
                        <td className="px-3 py-3 text-center hidden lg:table-cell">
                          <span className="text-xs font-semibold text-slate-500 tabular-nums">{p.performance}</span>
                        </td>
                        <td className="px-3 py-3 text-center hidden lg:table-cell">
                          <span className="text-xs font-semibold text-slate-500 tabular-nums">{p.athleticism}</span>
                        </td>
                        <td className="px-3 py-3 text-center hidden lg:table-cell">
                          <span className="text-xs font-semibold text-slate-500 tabular-nums">{p.intangibles}</span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <TrendIcon trend={p.trend} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Table footer */}
            {filteredProspects.length > 100 && (
              <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50 text-center">
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-widest">
                  Showing 100 of {filteredProspects.length} — use filters to narrow results
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
           TAB: TEAM DATABASE
         ════════════════════════════════════════════════════════ */}
      {activeTab === 'teams' && (
        <div>
          {/* Search + Filter */}
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search teams, coaches, cities..."
                value={teamSearch}
                onChange={e => setTeamSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-gold/40 focus:ring-1 focus:ring-gold/20"
              />
            </div>
            <div className="flex gap-1.5">
              {(['', 'power4', 'group_of_5', 'independent'] as const).map(tier => {
                const isActive = teamConfFilter === tier;
                const label = tier === '' ? 'All' : TIER_LABELS[tier as ConferenceTier]?.label || tier;
                return (
                  <button
                    key={tier}
                    onClick={() => setTeamConfFilter(tier)}
                    className={`text-xs px-3 py-2 rounded-lg border transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-gold/15 text-gold border-gold/30'
                        : 'bg-white text-slate-500 border-slate-200 hover:text-slate-700'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-widest">
              {filteredTeams.length} team{filteredTeams.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Team Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="px-4 py-3">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">School</span>
                    </th>
                    <th className="px-3 py-3 hidden md:table-cell">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Conference</span>
                    </th>
                    <th className="px-4 py-3">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Head Coach</span>
                    </th>
                    <th className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Stadium</span>
                    </th>
                    <th className="px-3 py-3 text-right hidden lg:table-cell">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Capacity</span>
                    </th>
                    <th className="px-3 py-3 hidden md:table-cell">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Location</span>
                    </th>
                    <th className="px-3 py-3 w-16">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Colors</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredTeams.map(team => (
                    <tr key={team.id} className="hover:bg-gold/[0.02] transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <span className="text-sm font-semibold text-slate-800">{team.schoolName}</span>
                          <span className="text-xs text-slate-400 ml-1.5">{team.mascot}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 hidden md:table-cell">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 border border-slate-200">
                          {team.conferenceAbbrev}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <span className="text-sm text-slate-700">{team.headCoach}</span>
                          <span className="text-[10px] text-slate-400 ml-1">({team.headCoachSince})</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-xs text-slate-500">{team.stadium}</span>
                      </td>
                      <td className="px-3 py-3 text-right hidden lg:table-cell">
                        <span className="text-xs font-semibold text-slate-600 tabular-nums">
                          {team.stadiumCapacity.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-3 py-3 hidden md:table-cell">
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          <MapPin className="w-3 h-3" />
                          {team.city}, {team.state}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1">
                          {team.colors.slice(0, 3).map((c, i) => (
                            <div
                              key={i}
                              className="w-4 h-4 rounded-full border border-slate-200"
                              style={{ backgroundColor: c.hex }}
                              title={c.name}
                            />
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
           TAB: POSITION RANKINGS
         ════════════════════════════════════════════════════════ */}
      {activeTab === 'positions' && (
        <div>
          {/* Position Selector */}
          <div className="mb-6">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3 block">Select Position</label>
            <div className="flex flex-wrap gap-1.5">
              {POSITIONS.map(p => (
                <button
                  key={p}
                  onClick={() => setPosRankPosition(p)}
                  className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all ${
                    posRankPosition === p
                      ? 'bg-gold/15 text-gold border-gold/30 shadow-[0_0_8px_rgba(212,175,55,0.15)]'
                      : 'bg-white text-slate-500 border-slate-200 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Position Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-black text-slate-800">
                Top {posRankPosition}s
              </h2>
              <p className="text-[11px] font-mono text-slate-400 uppercase tracking-widest mt-0.5">
                {positionPlayers.length} player{positionPlayers.length !== 1 ? 's' : ''} · Ranked by P.A.I. Score
              </p>
            </div>
          </div>

          {/* Position Rankings List */}
          {positionPlayers.length === 0 ? (
            <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl">
              <BarChart3 className="w-8 h-8 text-slate-200 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No {posRankPosition} prospects in the database yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {positionPlayers.map((p, i) => {
                const tierStyle = TIER_STYLES[p.tier as Tier];
                return (
                  <Link
                    key={p.id}
                    href={`/perform/prospects/${getProspectSlug(p)}`}
                    className="group flex items-center gap-4 p-4 rounded-xl bg-white border border-slate-200 hover:border-gold/20 hover:bg-gold/[0.02] transition-all"
                  >
                    {/* Rank */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0 ${
                      i < 3 ? 'bg-gold/15 text-gold border border-gold/30' : 'bg-slate-100 text-slate-400 border border-slate-200'
                    }`}>
                      {i + 1}
                    </div>

                    {/* Player Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-800 group-hover:text-gold transition-colors">
                          {p.name}
                        </span>
                        <TierPill tier={p.tier} />
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-[11px] text-slate-400">{p.school}</span>
                        <span className="text-[11px] text-slate-300">·</span>
                        <span className="text-[11px] text-slate-400">{p.state}</span>
                        <span className="text-[11px] text-slate-300">·</span>
                        <span className="text-[11px] text-slate-400">{p.classYear}</span>
                        {p.height && (
                          <>
                            <span className="text-[11px] text-slate-300">·</span>
                            <span className="text-[11px] text-slate-400">{p.height}</span>
                          </>
                        )}
                        {p.weight > 0 && (
                          <>
                            <span className="text-[11px] text-slate-300">·</span>
                            <span className="text-[11px] text-slate-400">{p.weight} lbs</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Component Scores */}
                    <div className="hidden md:flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-xs font-semibold text-slate-500 tabular-nums">{p.performance}</div>
                        <div className="text-[9px] text-slate-300 uppercase">Perf</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs font-semibold text-slate-500 tabular-nums">{p.athleticism}</div>
                        <div className="text-[9px] text-slate-300 uppercase">Athl</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs font-semibold text-slate-500 tabular-nums">{p.intangibles}</div>
                        <div className="text-[9px] text-slate-300 uppercase">Intg</div>
                      </div>
                    </div>

                    {/* P.A.I. Score */}
                    <div className="text-right flex-shrink-0">
                      <ScoreBadge score={p.paiScore} size="lg" />
                      <div className="text-[9px] font-mono text-slate-300 uppercase tracking-widest">P.A.I.</div>
                    </div>

                    {/* Trend */}
                    <TrendIcon trend={p.trend} />

                    <ChevronRight className="w-4 h-4 text-slate-200 group-hover:text-gold/40 flex-shrink-0" />
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Footer Note ─────────────────────────────────────── */}
      <div className="mt-12 text-center">
        <p className="text-[11px] font-mono text-slate-300 uppercase tracking-widest">
          Per|Form NCAA Football Database · P.A.I. Graded · A.I.M.S. Intelligence
        </p>
      </div>
    </div>
  );
}
