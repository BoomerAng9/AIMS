'use client';

/**
 * Per|Form — NCAA Football Database
 *
 * PFF-inspired premium sports analytics design. Dark theme, dense data,
 * sortable/filterable. Three tabs: Player Database | Team Database | Position Rankings
 *
 * All data sourced from /api/perform/prospects with seed data fallback.
 * Remixed with Per|Form branding: gold accent, P.A.I. grading system.
 */

import { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  Search, ChevronUp, ChevronDown, Database, Users, Shield, Filter,
  ArrowUpRight, ArrowDownRight, Minus, Star, Trophy, MapPin, Building2,
  SlidersHorizontal, X, ChevronRight, BarChart3, TrendingUp,
  CheckCircle, Zap, ListOrdered, Swords, ArrowRight,
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

const TICKER_HEADLINES = [
  'P.A.I. scores updated across all conferences',
  'Transfer Portal tracker: 200+ new entries this cycle',
  'NFL Combine Coverage: Per|Form analysts scoring every workout',
  '2026 class rankings shakeup after spring evaluations',
  'War Room debates: Bull vs Bear on top 10 QBs',
  'Per|Form Intelligence Engine processes 500+ games this season',
];

// ─────────────────────────────────────────────────────────────
// Dark-theme Tier Styles
// ─────────────────────────────────────────────────────────────

const DARK_TIER_STYLES: Record<string, { label: string; bg: string; text: string; border: string }> = {
  ELITE: { label: 'Elite', bg: 'bg-gold/20', text: 'text-gold', border: 'border-gold/40' },
  BLUE_CHIP: { label: 'Blue Chip', bg: 'bg-blue-400/20', text: 'text-blue-400', border: 'border-blue-400/40' },
  PROSPECT: { label: 'Prospect', bg: 'bg-emerald-400/20', text: 'text-emerald-400', border: 'border-emerald-400/40' },
  SLEEPER: { label: 'Sleeper', bg: 'bg-amber-400/20', text: 'text-amber-400', border: 'border-amber-400/40' },
  DEVELOPMENTAL: { label: 'Developmental', bg: 'bg-zinc-400/20', text: 'text-zinc-400', border: 'border-zinc-400/40' },
};

// ─────────────────────────────────────────────────────────────
// Trend Icon
// ─────────────────────────────────────────────────────────────

function TrendIcon({ trend }: { trend: string }) {
  if (trend === 'UP') return <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />;
  if (trend === 'DOWN') return <ArrowDownRight className="w-3.5 h-3.5 text-red-400" />;
  if (trend === 'NEW') return <Star className="w-3.5 h-3.5 text-gold" />;
  return <Minus className="w-3.5 h-3.5 text-slate-500" />;
}

// ─────────────────────────────────────────────────────────────
// Sortable Header (dark)
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
      className={`flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider hover:text-slate-200 transition-colors ${
        isActive ? 'text-gold' : 'text-slate-500'
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
// Tier Pill (dark)
// ─────────────────────────────────────────────────────────────

function TierPill({ tier }: { tier: string }) {
  const style = DARK_TIER_STYLES[tier];
  if (!style) return <span className="text-[10px] text-slate-500">{tier}</span>;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${style.bg} ${style.text} border ${style.border}`}>
      {style.label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// Filter Chip (dark)
// ─────────────────────────────────────────────────────────────

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all ${
        active
          ? 'bg-gold/20 text-gold border-gold/40'
          : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200 hover:bg-slate-700'
      }`}
    >
      {label}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// Grade Badge (gradient, PFF-style)
// ─────────────────────────────────────────────────────────────

function GradeBadge({ score }: { score: number }) {
  return (
    <span
      className="inline-flex items-center justify-center px-2.5 py-1 rounded text-xs font-black text-white tabular-nums bg-gold"
    >
      {score}
    </span>
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

  // ── Top prospects by position (for stats bar) ────────────
  const topByPosition = useMemo(() => {
    const positions = ['QB', 'EDGE', 'WR', 'OT'];
    return positions.map(pos => {
      const top = prospects
        .filter(p => p.position === pos)
        .sort((a, b) => b.paiScore - a.paiScore)[0];
      return { position: pos, player: top };
    }).filter(item => item.player);
  }, [prospects]);

  // ── Top 4 prospects overall (for player cards) ───────────
  const top4Prospects = useMemo(() => {
    return [...prospects].sort((a, b) => b.paiScore - a.paiScore).slice(0, 4);
  }, [prospects]);

  // ── Ticker derived from real data ────────────────────────
  const tickerItems = useMemo(() => {
    const items = [...TICKER_HEADLINES];
    if (top4Prospects.length > 0) {
      const p = top4Prospects[0];
      items.unshift(`${p.name} leads all prospects with ${p.paiScore} P.A.I. grade`);
    }
    if (top4Prospects.length > 1) {
      const p = top4Prospects[1];
      const tierLabel = DARK_TIER_STYLES[p.tier as string]?.label || p.tier;
      items.splice(2, 0, `${p.name} (${p.position}) earns ${tierLabel} tier rating`);
    }
    return items;
  }, [top4Prospects]);

  const activeFilters = [posFilter, tierFilter, poolFilter, confFilter].filter(Boolean).length;

  return (
    <div className="bg-slate-900 text-white min-h-screen">

      {/* ── Ticker Keyframes ───────────────────────────────── */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes perform-ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .perform-ticker-wrap {
          animation: perform-ticker 40s linear infinite;
        }
        .card-hover:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
        }
        .nav-link-underline {
          position: relative;
        }
        .nav-link-underline::after {
          content: '';
          position: absolute;
          bottom: -4px;
          left: 0;
          width: 0;
          height: 2px;
          background-color: var(--perform-accent, #8B5CF6);
          transition: width 0.3s;
        }
        .nav-link-underline:hover::after {
          width: 100%;
        }
      `}} />

      {/* ── Breaking News Ticker ──────────────────────────── */}
      <div className="bg-slate-950 border-b border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-10 flex items-center justify-between">
          <div className="flex items-center space-x-4 overflow-hidden">
            <span className="text-gold font-bold whitespace-nowrap uppercase tracking-wider text-[11px]">
              Live
            </span>
            <div className="overflow-hidden flex-1 relative">
              <div className="perform-ticker-wrap whitespace-nowrap inline-block">
                {tickerItems.map((item, i) => (
                  <span key={i} className="mx-4 text-slate-300">
                    {item} &bull;
                  </span>
                ))}
                {tickerItems.slice(0, 4).map((item, i) => (
                  <span key={`dup-${i}`} className="mx-4 text-slate-300">
                    {item} &bull;
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-4 text-slate-400">
            <Link href="/perform/pricing" className="hover:text-gold transition">
              Subscribe
            </Link>
            <span className="text-slate-700">|</span>
            <Link href="/perform" className="hover:text-gold transition">
              Hub
            </Link>
          </div>
        </div>
      </div>

      {/* ── Hero Section ─────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Background gradient with subtle radial accents */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 50%, rgba(139,92,246,0.4) 0%, transparent 50%), radial-gradient(circle at 80% 30%, rgba(139,92,246,0.2) 0%, transparent 50%)',
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
          <span className="inline-flex items-center gap-2 bg-gold/15 text-gold px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full border border-gold/30 mb-6">
            <Zap className="w-3.5 h-3.5" />
            Per|Form Intelligence Engine
          </span>
          <h1 className="text-4xl md:text-6xl font-black mb-4 max-w-4xl leading-[1.1] tracking-tight">
            NCAA Football{' '}
            <span className="text-gold">Database</span>
          </h1>
          <p className="text-slate-400 text-lg mb-10 max-w-2xl leading-relaxed">
            Every prospect. Every team. Every conference. P.A.I.-graded and AI-verified
            &mdash; the most comprehensive college football intelligence database.
          </p>
          <div className="flex flex-wrap items-center gap-6 text-sm">
            {[
              { value: dbStats.totalPlayers, label: 'Players' },
              { value: dbStats.teams, label: 'Teams' },
              { value: CONFERENCES.length, label: 'Conferences' },
              { value: dbStats.eliteCount, label: 'Elite Tier' },
            ].map((stat, i) => (
              <div key={stat.label} className="flex items-center gap-3">
                {i > 0 && <div className="w-px h-8 bg-slate-700 hidden sm:block" />}
                <div className="flex items-center gap-2">
                  <span className="text-gold font-black text-2xl tabular-nums">{stat.value}</span>
                  <span className="text-slate-500 uppercase text-xs tracking-wider font-medium">
                    {stat.label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats Bar: Top Graded by Position ────────────── */}
      {topByPosition.length > 0 && (
        <section className="bg-slate-800/80 border-y border-slate-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {topByPosition.map(({ position, player }, i) => (
                <div
                  key={position}
                  className={i < topByPosition.length - 1 ? 'md:border-r md:border-slate-700' : ''}
                >
                  <p className="text-slate-500 text-xs uppercase tracking-wider mb-1 font-medium">
                    Highest Graded {position}
                  </p>
                  <p className="text-xl font-black text-gold truncate">
                    {player.lastName || player.name?.split(' ').pop()}
                  </p>
                  <p className="text-2xl font-black tabular-nums text-white">{player.paiScore}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Main Content ─────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* ── Tab Navigation ──────────────────────────────── */}
        <div className="flex items-center gap-1 mb-8 border-b border-slate-700">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold border-b-2 transition-all uppercase tracking-wide ${
                  isActive
                    ? 'border-gold text-gold'
                    : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
          <div className="flex-1" />
          <span className="text-[11px] font-mono text-slate-600 uppercase tracking-widest pr-2 hidden md:block">
            Per|Form Intelligence
          </span>
        </div>

        {/* ════════════════════════════════════════════════════
             TAB: PLAYER DATABASE
           ════════════════════════════════════════════════════ */}
        {activeTab === 'players' && (
          <div>
            {/* Search + Filter Toggle */}
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search by name, school, state, or position..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-gold/40 focus:ring-1 focus:ring-gold/20"
                />
              </div>
              <button
                onClick={() => setShowFilters(f => !f)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                  showFilters || activeFilters > 0
                    ? 'bg-gold/15 text-gold border-gold/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
                {activeFilters > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-gold text-white text-[10px] font-bold">
                    {activeFilters}
                  </span>
                )}
              </button>
            </div>

            {/* Filter Panel */}
            {showFilters && (
              <div className="mb-6 p-4 rounded-xl bg-slate-800 border border-slate-700 space-y-4">
                {/* Position */}
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2 block">
                    Position
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    <FilterChip label="All" active={!posFilter} onClick={() => setPosFilter('')} />
                    {POSITIONS.map(p => (
                      <FilterChip
                        key={p}
                        label={p}
                        active={posFilter === p}
                        onClick={() => setPosFilter(posFilter === p ? '' : p)}
                      />
                    ))}
                  </div>
                </div>

                {/* Tier */}
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2 block">
                    Tier
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    <FilterChip label="All" active={!tierFilter} onClick={() => setTierFilter('')} />
                    {TIERS.map(t => (
                      <FilterChip
                        key={t}
                        label={TIER_STYLES[t].label}
                        active={tierFilter === t}
                        onClick={() => setTierFilter(tierFilter === t ? '' : t)}
                      />
                    ))}
                  </div>
                </div>

                {/* Pool + Conference */}
                <div className="flex flex-wrap gap-4">
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2 block">
                      Pool
                    </label>
                    <select
                      value={poolFilter}
                      onChange={e => setPoolFilter(e.target.value)}
                      className="px-3 py-2 rounded-lg border border-slate-700 text-sm text-slate-200 bg-slate-800 focus:outline-none focus:border-gold/40"
                    >
                      {POOLS.map(p => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2 block">
                      Conference
                    </label>
                    <select
                      value={confFilter}
                      onChange={e => setConfFilter(e.target.value)}
                      className="px-3 py-2 rounded-lg border border-slate-700 text-sm text-slate-200 bg-slate-800 focus:outline-none focus:border-gold/40"
                    >
                      {CONFERENCES_FILTER.map(c => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Clear All */}
                {activeFilters > 0 && (
                  <button
                    onClick={() => {
                      setPosFilter('');
                      setTierFilter('');
                      setPoolFilter('');
                      setConfFilter('');
                    }}
                    className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" /> Clear all filters
                  </button>
                )}
              </div>
            )}

            {/* Results count */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-mono text-slate-500 uppercase tracking-widest">
                {filteredProspects.length} player{filteredProspects.length !== 1 ? 's' : ''}
                {activeFilters > 0 && ' (filtered)'}
              </span>
              <span className="text-[11px] font-mono text-slate-600 uppercase tracking-widest">
                Sorted by {sortField} {sortDir === 'desc' ? '\u2193' : '\u2191'}
              </span>
            </div>

            {/* ── Data Table ──────────────────────────────── */}
            <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-700 bg-slate-800/80">
                      <th className="px-4 py-3 w-12">
                        <SortHeader label="Rank" field="nationalRank" currentSort={sortField} currentDir={sortDir} onSort={handleSort} />
                      </th>
                      <th className="px-4 py-3">
                        <SortHeader label="Player" field="name" currentSort={sortField} currentDir={sortDir} onSort={handleSort} />
                      </th>
                      <th className="px-3 py-3 w-16">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Pos</span>
                      </th>
                      <th className="px-4 py-3">
                        <SortHeader label="School" field="school" currentSort={sortField} currentDir={sortDir} onSort={handleSort} />
                      </th>
                      <th className="px-3 py-3 w-12 hidden md:table-cell">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">St</span>
                      </th>
                      <th className="px-3 py-3 w-16 hidden lg:table-cell">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Class</span>
                      </th>
                      <th className="px-3 py-3 w-20">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Tier</span>
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
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">&Delta;</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {loading ? (
                      <tr>
                        <td colSpan={12} className="px-4 py-16 text-center">
                          <div className="animate-pulse flex flex-col items-center gap-2">
                            <Database className="w-8 h-8 text-slate-600" />
                            <span className="text-sm text-slate-500">Loading database...</span>
                          </div>
                        </td>
                      </tr>
                    ) : filteredProspects.length === 0 ? (
                      <tr>
                        <td colSpan={12} className="px-4 py-16 text-center">
                          <Search className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                          <span className="text-sm text-slate-500">No players match your filters.</span>
                        </td>
                      </tr>
                    ) : (
                      filteredProspects.slice(0, 100).map((p, i) => (
                        <tr key={p.id} className="hover:bg-gold/[0.04] transition-colors group">
                          <td className="px-4 py-3">
                            <span className="text-sm font-bold text-slate-500 tabular-nums">
                              {p.nationalRank || i + 1}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <Link href={`/perform/prospects/${getProspectSlug(p)}`} className="group/link">
                              <span className="text-sm font-semibold text-white group-hover/link:text-gold transition-colors">
                                {p.name}
                              </span>
                            </Link>
                          </td>
                          <td className="px-3 py-3">
                            <span className="inline-flex items-center justify-center w-9 h-6 rounded bg-slate-700 text-[10px] font-bold text-slate-300">
                              {p.position}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-slate-400">{p.school}</span>
                          </td>
                          <td className="px-3 py-3 hidden md:table-cell">
                            <span className="text-xs text-slate-500">{p.state}</span>
                          </td>
                          <td className="px-3 py-3 hidden lg:table-cell">
                            <span className="text-xs text-slate-500">{p.classYear}</span>
                          </td>
                          <td className="px-3 py-3">
                            <TierPill tier={p.tier} />
                          </td>
                          <td className="px-3 py-3 text-center">
                            <ScoreBadge score={p.paiScore} />
                          </td>
                          <td className="px-3 py-3 text-center hidden lg:table-cell">
                            <span className="text-xs font-semibold text-slate-400 tabular-nums">{p.performance}</span>
                          </td>
                          <td className="px-3 py-3 text-center hidden lg:table-cell">
                            <span className="text-xs font-semibold text-slate-400 tabular-nums">{p.athleticism}</span>
                          </td>
                          <td className="px-3 py-3 text-center hidden lg:table-cell">
                            <span className="text-xs font-semibold text-slate-400 tabular-nums">{p.intangibles}</span>
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
                <div className="px-4 py-3 border-t border-slate-700 bg-slate-800/50 text-center">
                  <span className="text-[11px] font-mono text-slate-500 uppercase tracking-widest">
                    Showing 100 of {filteredProspects.length} &mdash; use filters to narrow results
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════
             TAB: TEAM DATABASE
           ════════════════════════════════════════════════════ */}
        {activeTab === 'teams' && (
          <div>
            {/* Search + Filter */}
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search teams, coaches, cities..."
                  value={teamSearch}
                  onChange={e => setTeamSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-gold/40 focus:ring-1 focus:ring-gold/20"
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
                          ? 'bg-gold/15 text-gold border-gold/40'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-mono text-slate-500 uppercase tracking-widest">
                {filteredTeams.length} team{filteredTeams.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Team Table */}
            <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-700 bg-slate-800/80">
                      <th className="px-4 py-3">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">School</span>
                      </th>
                      <th className="px-3 py-3 hidden md:table-cell">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Conference</span>
                      </th>
                      <th className="px-4 py-3">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Head Coach</span>
                      </th>
                      <th className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Stadium</span>
                      </th>
                      <th className="px-3 py-3 text-right hidden lg:table-cell">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Capacity</span>
                      </th>
                      <th className="px-3 py-3 hidden md:table-cell">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Location</span>
                      </th>
                      <th className="px-3 py-3 w-16">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Colors</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {filteredTeams.map(team => (
                      <tr key={team.id} className="hover:bg-gold/[0.04] transition-colors">
                        <td className="px-4 py-3">
                          <div>
                            <span className="text-sm font-semibold text-white">{team.schoolName}</span>
                            <span className="text-xs text-slate-500 ml-1.5">{team.mascot}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3 hidden md:table-cell">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-700 text-slate-300 border border-slate-600">
                            {team.conferenceAbbrev}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <span className="text-sm text-slate-300">{team.headCoach}</span>
                            <span className="text-[10px] text-slate-600 ml-1">({team.headCoachSince})</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <span className="text-xs text-slate-400">{team.stadium}</span>
                        </td>
                        <td className="px-3 py-3 text-right hidden lg:table-cell">
                          <span className="text-xs font-semibold text-slate-300 tabular-nums">
                            {team.stadiumCapacity.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-3 py-3 hidden md:table-cell">
                          <div className="flex items-center gap-1 text-xs text-slate-500">
                            <MapPin className="w-3 h-3" />
                            {team.city}, {team.state}
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-1">
                            {team.colors.slice(0, 3).map((c, ci) => (
                              <div
                                key={ci}
                                className="w-4 h-4 rounded-full border border-slate-600"
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

        {/* ════════════════════════════════════════════════════
             TAB: POSITION RANKINGS
           ════════════════════════════════════════════════════ */}
        {activeTab === 'positions' && (
          <div>
            {/* Position Selector */}
            <div className="mb-6">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-3 block">
                Select Position
              </label>
              <div className="flex flex-wrap gap-1.5">
                {POSITIONS.map(p => (
                  <button
                    key={p}
                    onClick={() => setPosRankPosition(p)}
                    className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all ${
                      posRankPosition === p
                        ? 'bg-gold/20 text-gold border-gold/40 shadow-[0_0_8px_rgba(139,92,246,0.2)]'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200 hover:bg-slate-700'
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
                <h2 className="text-xl font-black text-white">
                  Top {posRankPosition}s
                </h2>
                <p className="text-[11px] font-mono text-slate-500 uppercase tracking-widest mt-0.5">
                  {positionPlayers.length} player{positionPlayers.length !== 1 ? 's' : ''} &middot; Ranked by P.A.I. Score
                </p>
              </div>
            </div>

            {/* Position Rankings List */}
            {positionPlayers.length === 0 ? (
              <div className="text-center py-16 bg-slate-800 border border-slate-700 rounded-2xl">
                <BarChart3 className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No {posRankPosition} prospects in the database yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {positionPlayers.map((p, i) => (
                  <Link
                    key={p.id}
                    href={`/perform/prospects/${getProspectSlug(p)}`}
                    className="group flex items-center gap-4 p-4 rounded-xl bg-slate-800 border border-slate-700 hover:border-gold/30 hover:bg-gold/[0.04] transition-all"
                  >
                    {/* Rank */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0 ${
                      i < 3
                        ? 'bg-gold/20 text-gold border border-gold/40'
                        : 'bg-slate-700 text-slate-400 border border-slate-600'
                    }`}>
                      {i + 1}
                    </div>

                    {/* Player Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white group-hover:text-gold transition-colors">
                          {p.name}
                        </span>
                        <TierPill tier={p.tier} />
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-[11px] text-slate-500">{p.school}</span>
                        <span className="text-[11px] text-slate-600">&middot;</span>
                        <span className="text-[11px] text-slate-500">{p.state}</span>
                        <span className="text-[11px] text-slate-600">&middot;</span>
                        <span className="text-[11px] text-slate-500">{p.classYear}</span>
                        {p.height && (
                          <>
                            <span className="text-[11px] text-slate-600">&middot;</span>
                            <span className="text-[11px] text-slate-500">{p.height}</span>
                          </>
                        )}
                        {p.weight > 0 && (
                          <>
                            <span className="text-[11px] text-slate-600">&middot;</span>
                            <span className="text-[11px] text-slate-500">{p.weight} lbs</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Component Scores */}
                    <div className="hidden md:flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-xs font-semibold text-slate-400 tabular-nums">{p.performance}</div>
                        <div className="text-[9px] text-slate-600 uppercase">Perf</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs font-semibold text-slate-400 tabular-nums">{p.athleticism}</div>
                        <div className="text-[9px] text-slate-600 uppercase">Athl</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs font-semibold text-slate-400 tabular-nums">{p.intangibles}</div>
                        <div className="text-[9px] text-slate-600 uppercase">Intg</div>
                      </div>
                    </div>

                    {/* P.A.I. Score */}
                    <div className="text-right flex-shrink-0">
                      <ScoreBadge score={p.paiScore} size="lg" />
                      <div className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">P.A.I.</div>
                    </div>

                    {/* Trend */}
                    <TrendIcon trend={p.trend} />

                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-gold/50 flex-shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Top Graded Prospects (PFF-style cards) ──────── */}
        {top4Prospects.length > 0 && (
          <div className="mt-16 mb-12">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-black uppercase tracking-tight">
                Top Graded Prospects
              </h2>
              <Link
                href="/perform/big-board"
                className="text-gold hover:underline text-sm font-semibold flex items-center gap-1"
              >
                View Big Board <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {top4Prospects.map(p => (
                <Link
                  key={p.id}
                  href={`/perform/prospects/${getProspectSlug(p)}`}
                  className="bg-slate-800 p-5 rounded-xl border border-slate-700 hover:border-gold/40 transition-all duration-300 card-hover group cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                      {p.position}
                    </span>
                    <GradeBadge score={p.paiScore} />
                  </div>
                  <div className="w-16 h-16 rounded-full mx-auto mb-4 bg-slate-700 border-2 border-slate-600 flex items-center justify-center group-hover:border-gold/40 transition-colors">
                    <span className="text-xl font-black text-slate-400 group-hover:text-gold transition-colors">
                      {p.firstName?.[0]}{p.lastName?.[0]}
                    </span>
                  </div>
                  <h4 className="text-lg font-bold text-center text-white group-hover:text-gold transition-colors">
                    {p.name}
                  </h4>
                  <p className="text-slate-500 text-sm text-center mb-3">{p.school}</p>
                  <div className="flex justify-center space-x-4 text-xs text-slate-500">
                    <span>P: {p.performance}</span>
                    <span>A: {p.athleticism}</span>
                    <span>I: {p.intangibles}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── Tools Section ────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {[
            {
              icon: ListOrdered,
              title: 'Big Board',
              desc: 'Complete prospect rankings with P.A.I. grades and tier breakdowns.',
              href: '/perform/big-board',
            },
            {
              icon: Swords,
              title: 'War Room',
              desc: 'Bull vs Bear debates on every top prospect. AI-mediated verdicts.',
              href: '/perform/war-room',
            },
            {
              icon: Trophy,
              title: 'NFL Draft',
              desc: 'Mock drafts, simulators, and team needs analysis for 2025.',
              href: '/perform/draft',
            },
          ].map(tool => {
            const Icon = tool.icon;
            return (
              <Link
                key={tool.title}
                href={tool.href}
                className="bg-slate-800 p-6 rounded-xl border border-slate-700 hover:border-gold/40 transition-all duration-300 card-hover group cursor-pointer"
              >
                <div className="w-12 h-12 bg-slate-700 rounded-lg flex items-center justify-center mb-4 group-hover:bg-gold/20 transition-colors">
                  <Icon className="w-6 h-6 text-slate-400 group-hover:text-gold transition-colors" />
                </div>
                <h3 className="text-xl font-bold mb-2 group-hover:text-gold transition-colors uppercase tracking-wide">
                  {tool.title}
                </h3>
                <p className="text-slate-500 text-sm mb-4">{tool.desc}</p>
                <span className="text-gold text-sm font-semibold flex items-center gap-1">
                  Explore <ChevronRight className="w-4 h-4" />
                </span>
              </Link>
            );
          })}
        </div>

        {/* ── Premium CTA ──────────────────────────────────── */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-8 md:p-12 mb-12 border border-slate-700 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gold opacity-10 rounded-full blur-3xl transform translate-x-32 -translate-y-16" />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left">
              <h2 className="text-3xl md:text-4xl font-black mb-4 uppercase tracking-tight">
                Unlock Per|Form Premium
              </h2>
              <p className="text-slate-400 max-w-xl mb-6">
                Get access to exclusive P.A.I. grades, advanced scouting reports, War Room debates,
                and the full intelligence engine used by scouts and analysts.
              </p>
              <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                {['P.A.I. Grades', 'Scouting Reports', 'War Room Access'].map(feature => (
                  <div key={feature} className="flex items-center space-x-2 text-sm">
                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-3 w-full md:w-auto">
              <Link
                href="/perform/pricing"
                className="bg-gold hover:opacity-90 text-white px-8 py-3 rounded-lg font-bold transition whitespace-nowrap text-center uppercase tracking-wide"
              >
                Start Free Trial
              </Link>
              <Link
                href="/perform/pricing"
                className="border border-slate-600 hover:border-gold text-white px-8 py-3 rounded-lg font-semibold transition whitespace-nowrap text-center"
              >
                View Plans
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* ── Footer Note ──────────────────────────────────── */}
      <div className="border-t border-slate-800 py-8 text-center">
        <p className="text-[11px] font-mono text-slate-600 uppercase tracking-widest">
          Per|Form NCAA Football Database &middot; P.A.I. Graded &middot; Powered by A.I.M.S. Intelligence
        </p>
      </div>
    </div>
  );
}
