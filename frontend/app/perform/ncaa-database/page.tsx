'use client';

/**
 * Per|Form — NCAA Football Database
 *
 * Luxury Industrial light theme inspired by 'The Athletic'. Premium sports analytics,
 * dense data, sortable/filterable. Three tabs: Player Database | Team Database | Position Rankings
 *
 * All data sourced from /api/perform/prospects with seed data fallback.
 * Powered by AGI — Associated Grading Index.
 */

import { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  Search, ChevronUp, ChevronDown, Database, Users, Shield, Filter,
  ArrowUpRight, ArrowDownRight, Minus, Star, Trophy, MapPin, Building2,
  SlidersHorizontal, X, ChevronRight, BarChart3, TrendingUp,
  CheckCircle, Zap, ListOrdered, Swords, ArrowRight,
} from 'lucide-react';
import type { Prospect, Tier, Trend, Pool, ContentArticle } from '@/lib/perform/types';
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
  'AGI scores updated across all conferences',
  'Transfer Portal tracker: 200+ new entries this cycle',
  'NFL Combine Coverage: Per|Form analysts scoring every workout with AGI',
  '2026 class rankings shakeup after spring evaluations',
  'War Room debates: Bull vs Bear on top 10 QBs',
  'AGI Intelligence Engine processes 500+ games this season',
];

// ─────────────────────────────────────────────────────────────
// Luxury Industrial Tier Styles (Light Theme)
// ─────────────────────────────────────────────────────────────

const AGI_TIER_STYLES: Record<string, { label: string; bg: string; text: string; border: string }> = {
  ELITE: { label: 'Elite', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  BLUE_CHIP: { label: 'Blue Chip', bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' },
  PROSPECT: { label: 'Prospect', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  SLEEPER: { label: 'Sleeper', bg: 'bg-zinc-50', text: 'text-zinc-600', border: 'border-zinc-200' },
  DEVELOPMENTAL: { label: 'Dev', bg: 'bg-zinc-50', text: 'text-zinc-500', border: 'border-zinc-200' },
};

// ─────────────────────────────────────────────────────────────
// Trend Icon
// ─────────────────────────────────────────────────────────────

function TrendIcon({ trend }: { trend: string }) {
  if (trend === 'UP') return <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />;
  if (trend === 'DOWN') return <ArrowDownRight className="w-3.5 h-3.5 text-red-600" />;
  if (trend === 'NEW') return <Star className="w-3.5 h-3.5 text-amber-600" />;
  return <Minus className="w-3.5 h-3.5 text-slate-400" />;
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
      className={`flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider hover:text-slate-900 transition-colors ${isActive ? 'text-emerald-700' : 'text-slate-500'
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
  const style = AGI_TIER_STYLES[tier];
  if (!style) return <span className="text-[10px] text-slate-500">{tier}</span>;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${style.bg} ${style.text} border ${style.border}`}>
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
      className={`px-3 py-1 rounded border transition-all text-[11px] font-bold uppercase tracking-tight ${active
        ? 'bg-emerald-600 text-white border-emerald-700'
        : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700'
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
      className="inline-flex items-center justify-center px-2.5 py-1 rounded text-xs font-black text-white tabular-nums bg-amber-600"
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

  // Content state
  const [articles, setArticles] = useState<ContentArticle[]>([]);

  // Team filters
  const [teamSearch, setTeamSearch] = useState('');
  const [teamConfFilter, setTeamConfFilter] = useState<ConferenceTier | ''>('');

  // Position rankings
  const [posRankPosition, setPosRankPosition] = useState('QB');

  // ── Load data ────────────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [pRes, cRes] = await Promise.all([
          fetch('/api/perform/prospects?limit=500'),
          fetch('/api/perform/content')
        ]);

        if (pRes.ok) {
          const data = await pRes.json();
          if (Array.isArray(data)) setProspects(data);
        }
        if (cRes.ok) {
          const content = await cRes.json();
          if (Array.isArray(content)) setArticles(content);
        }
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
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

  // ── Ticker derived from live rankings + news ──────────────
  const tickerItems = useMemo(() => {
    const items = articles.length > 0
      ? articles.slice(0, 3).map(a => a.title.replace(/P\.A\.I\./g, 'AGI'))
      : [...TICKER_HEADLINES];

    if (top4Prospects.length > 0) {
      const p = top4Prospects[0];
      items.unshift(`${p.name} leads all prospects with a ${p.paiScore} AGI grade`);
    }
    if (top4Prospects.length > 1) {
      const p = top4Prospects[1];
      const style = AGI_TIER_STYLES[p.tier as string] || { label: p.tier };
      items.splice(2, 0, `${p.name} (${p.position}) earns a ${style.label} tier AGI rating`);
    }
    return items;
  }, [top4Prospects, articles]);

  const activeFilters = [posFilter, tierFilter, poolFilter, confFilter].filter(Boolean).length;

  return (
    <div className="bg-[#F8FAFC] text-slate-900 min-h-screen font-sans">

      {/* ── Ticker Keyframes ───────────────────────────────── */}
      <style dangerouslySetInnerHTML={{
        __html: `
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
      <div className="bg-white border-b border-slate-200 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-10 flex items-center justify-between">
          <div className="flex items-center space-x-4 overflow-hidden">
            <span className="text-emerald-600 font-bold whitespace-nowrap uppercase tracking-wider text-[11px]">
              Live
            </span>
            <div className="overflow-hidden flex-1 relative">
              <div className="perform-ticker-wrap whitespace-nowrap inline-block">
                {tickerItems.map((item, i) => (
                  <span key={i} className="mx-4 text-slate-600">
                    {item} &bull;
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-4 text-slate-400 font-bold uppercase tracking-tighter">
            <Link href="/perform/pricing" className="hover:text-emerald-600 transition">
              Subscribe
            </Link>
            <span className="text-slate-200">|</span>
            <Link href="/perform" className="hover:text-emerald-600 transition">
              Hub
            </Link>
          </div>
        </div>
      </div>

      {/* ── Hero Section ─────────────────────────────────── */}
      <section className="relative overflow-hidden bg-white border-b border-slate-200">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-24">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded border border-emerald-100 mb-6">
                <Zap className="w-3 h-3" />
                AGI — Associated Grading Index
              </span>
              <h1 className="text-4xl md:text-7xl font-serif font-bold mb-4 leading-[1.05] tracking-tight text-slate-950">
                NCAA Football <br />
                <span className="italic text-emerald-800">Database</span>
              </h1>
              <p className="text-slate-600 text-lg md:text-xl font-medium max-w-2xl leading-relaxed">
                The industry standard for grading, ranking, and deep analytics.
                Powered by our proprietary AGI engine for surgical precision.
              </p>
            </div>
          </div>

          <div className="mt-12 flex flex-wrap items-center gap-8 text-sm">
            {[
              { value: dbStats.totalPlayers, label: 'Prospects' },
              { value: dbStats.teams, label: 'Programs' },
              { value: CONFERENCES.length, label: 'Conferences' },
              { value: dbStats.eliteCount, label: 'Elite Tier' },
            ].map((stat, i) => (
              <div key={stat.label} className="flex flex-col">
                <span className="text-slate-950 font-black text-3xl tabular-nums tracking-tighter">
                  {stat.value}
                </span>
                <span className="text-slate-400 uppercase text-[10px] font-bold tracking-widest">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats Bar: Top Graded by Position ────────────── */}
      {topByPosition.length > 0 && (
        <section className="bg-slate-50 border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {topByPosition.map(({ position, player }, i) => (
                <div
                  key={position}
                  className={i < topByPosition.length - 1 ? 'md:border-r md:border-slate-200' : ''}
                >
                  <p className="text-slate-500 text-[10px] uppercase tracking-widest mb-1 font-bold">
                    AGI Leader: {position}
                  </p>
                  <p className="text-xl font-serif font-bold text-slate-900 truncate">
                    {player.lastName || player.name?.split(' ').pop()}
                  </p>
                  <p className="text-2xl font-black tabular-nums text-emerald-700">{player.paiScore}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Main Content ─────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* ── Tab Navigation ──────────────────────────────── */}
        <div className="flex items-center gap-1 mb-12 border-b border-slate-200">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-8 py-5 text-[11px] font-black border-b-2 transition-all uppercase tracking-[0.2em] relative ${isActive
                  ? 'border-emerald-600 text-slate-900 group'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-300'}`} />
                {tab.label}
                {isActive && (
                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                )}
              </button>
            );
          })}
          <div className="flex-1" />
          <div className="hidden lg:flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Platform Sync</span>
              <span className="text-[10px] font-bold text-emerald-600 uppercase">Live Database</span>
            </div>
            <div className="h-8 w-px bg-slate-200" />
          </div>
        </div>

        {/* ════════════════════════════════════════════════════
             TAB: PLAYER DATABASE
           ════════════════════════════════════════════════════ */}
        {activeTab === 'players' && (
          <div className="space-y-12">

            {/* ── News Grid (The Athletic style) ── */}
            {articles.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-12 border-b border-slate-100">
                {/* Main Feature */}
                <div className="lg:col-span-8 flex flex-col group cursor-pointer">
                  <div className="aspect-[16/9] bg-slate-50 border border-slate-200 mb-6 overflow-hidden rounded shadow-sm relative">
                    <div className="absolute inset-0 flex items-center justify-center p-8 opacity-40 group-hover:scale-105 transition-transform duration-700">
                      <Trophy className="w-32 h-32 text-slate-200" />
                    </div>
                    <div className="absolute top-6 left-6">
                      <span className="bg-slate-950 text-white text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 shadow-2xl">
                        Scouting Deep Dive
                      </span>
                    </div>
                  </div>
                  <h3 className="text-3xl md:text-4xl font-serif font-bold text-slate-950 group-hover:text-emerald-800 transition-colors mb-3 leading-[1.1] tracking-tight">
                    {articles[0].title.replace(/P\.A\.I\./g, 'AGI')}
                  </h3>
                  <p className="text-slate-500 text-base md:text-lg font-medium leading-relaxed mb-6 line-clamp-2 max-w-2xl">
                    {articles[0].excerpt.replace(/P\.A\.I\./g, 'AGI')}
                  </p>
                  <div className="mt-auto flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <span className="text-emerald-600">{articles[0].generatedBy}</span>
                    <span className="w-1.5 h-1.5 bg-slate-200 rounded-full" />
                    <span>{articles[0].readTimeMin} min read</span>
                    <span className="w-1.5 h-1.5 bg-slate-200 rounded-full" />
                    <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Verified Data</span>
                  </div>
                </div>

                {/* Vertical Sidebar Stories */}
                <div className="lg:col-span-4 space-y-8 border-l border-slate-100 pl-8 hidden lg:block">
                  <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Latest Updates</h4>
                  {articles.slice(1, 5).map(article => (
                    <div key={article.id} className="group cursor-pointer">
                      <span className="text-emerald-700 text-[9px] font-black uppercase tracking-widest mb-1.5 block">
                        {article.type.replace(/_/g, ' ')}
                      </span>
                      <h4 className="text-base font-bold text-slate-950 group-hover:text-emerald-800 transition-colors leading-snug mb-2">
                        {article.title.replace(/P\.A\.I\./g, 'AGI')}
                      </h4>
                      <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        <span>{article.readTimeMin} min</span>
                        <span>&middot;</span>
                        <span>{new Date(article.generatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Search + Filter UI */}
            <div className="flex flex-col md:flex-row items-center gap-4 py-8">
              <div className="relative flex-1 w-full group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                <input
                  type="text"
                  placeholder="Query AGI index by name, position, or school..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded border border-slate-200 text-base font-medium focus:outline-none focus:border-emerald-500 bg-white transition-all shadow-sm"
                />
              </div>
              <div className="flex gap-2 w-full md:w-auto overflow-x-auto no-scrollbar pb-1 md:pb-0">
                <button
                  onClick={() => setShowFilters(f => !f)}
                  className={`flex items-center gap-2 px-8 py-4 rounded border text-[11px] font-black uppercase tracking-widest transition-all ${showFilters || activeFilters > 0
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-lg'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                    }`}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  Advanced Selection
                  {activeFilters > 0 && (
                    <span className="ml-2 px-2 py-0.5 rounded-full bg-white text-emerald-600 text-[9px] font-black">
                      {activeFilters}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Filter Panel */}
            {showFilters && (
              <div className="mb-6 p-8 rounded border border-slate-200 bg-slate-50 space-y-8 shadow-sm">
                {/* Position */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 block">
                    Position Selection
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <FilterChip label="All Positions" active={!posFilter} onClick={() => setPosFilter('')} />
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
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 block">
                    Intelligence Tier
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
                <div className="flex flex-wrap gap-8 items-end">
                  <div className="w-full md:w-64">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 block">
                      Registry Pool
                    </label>
                    <select
                      value={poolFilter}
                      onChange={e => setPoolFilter(e.target.value)}
                      className="w-full px-4 py-3 rounded border border-slate-200 text-sm font-bold text-slate-900 bg-white focus:outline-none focus:border-emerald-500 transition-colors"
                    >
                      {POOLS.map(p => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-full md:w-64">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 block">
                      Conference Registry
                    </label>
                    <select
                      value={confFilter}
                      onChange={e => setConfFilter(e.target.value)}
                      className="w-full px-4 py-3 rounded border border-slate-200 text-sm font-bold text-slate-900 bg-white focus:outline-none focus:border-emerald-500 transition-colors"
                    >
                      {CONFERENCES_FILTER.map(c => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
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
                      className="flex items-center gap-2 px-6 py-3 rounded bg-white border border-red-100 text-[10px] font-black uppercase tracking-widest text-red-600 hover:bg-red-50 transition-all shadow-sm"
                    >
                      <X className="w-4 h-4" /> Reset Filters
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Results count */}
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {filteredProspects.length} player{filteredProspects.length !== 1 ? 's' : ''}
                {activeFilters > 0 && ' (filtered)'}
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Sorted by {sortField === 'paiScore' ? 'AGI Score' : sortField} {sortDir === 'desc' ? '\u2193' : '\u2191'}
              </span>
            </div>

            {/* ── Data Table ──────────────────────────────── */}
            <div className="bg-white border border-slate-200 rounded overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="px-4 py-4 w-12">
                        <SortHeader label="Rank" field="nationalRank" currentSort={sortField} currentDir={sortDir} onSort={handleSort} />
                      </th>
                      <th className="px-4 py-4">
                        <SortHeader label="Player" field="name" currentSort={sortField} currentDir={sortDir} onSort={handleSort} />
                      </th>
                      <th className="px-3 py-4 w-16">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Pos</span>
                      </th>
                      <th className="px-4 py-4">
                        <SortHeader label="School" field="school" currentSort={sortField} currentDir={sortDir} onSort={handleSort} />
                      </th>
                      <th className="px-3 py-4 w-12 hidden md:table-cell">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">St</span>
                      </th>
                      <th className="px-3 py-4 w-16 hidden lg:table-cell">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Class</span>
                      </th>
                      <th className="px-3 py-4 w-20">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Tier</span>
                      </th>
                      <th className="px-3 py-4 w-16 text-center">
                        <SortHeader label="AGI" field="paiScore" currentSort={sortField} currentDir={sortDir} onSort={handleSort} className="justify-center" />
                      </th>
                      <th className="px-3 py-4 w-12 text-center hidden lg:table-cell">
                        <SortHeader label="P" field="performance" currentSort={sortField} currentDir={sortDir} onSort={handleSort} className="justify-center" />
                      </th>
                      <th className="px-3 py-4 w-12 text-center hidden lg:table-cell">
                        <SortHeader label="A" field="athleticism" currentSort={sortField} currentDir={sortDir} onSort={handleSort} className="justify-center" />
                      </th>
                      <th className="px-3 py-4 w-12 text-center hidden lg:table-cell">
                        <SortHeader label="I" field="intangibles" currentSort={sortField} currentDir={sortDir} onSort={handleSort} className="justify-center" />
                      </th>
                      <th className="px-3 py-4 w-10 text-center">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">&Delta;</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
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
                        <tr key={p.id} className="hover:bg-emerald-50/50 transition-colors group">
                          <td className="px-4 py-4">
                            <span className="text-sm font-black text-slate-400 tabular-nums">
                              {p.nationalRank || i + 1}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <Link href={`/perform/prospects/${getProspectSlug(p)}`} className="group/link">
                              <span className="text-sm font-bold text-slate-900 group-hover/link:text-emerald-700 transition-colors">
                                {p.name}
                              </span>
                            </Link>
                          </td>
                          <td className="px-3 py-4">
                            <span className="inline-flex items-center justify-center w-10 h-7 rounded border border-slate-200 bg-white text-[10px] font-black text-slate-600">
                              {p.position}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-sm font-medium text-slate-600">{p.school}</span>
                          </td>
                          <td className="px-3 py-4 hidden md:table-cell">
                            <span className="text-xs font-bold text-slate-400">{p.state}</span>
                          </td>
                          <td className="px-3 py-4 hidden lg:table-cell">
                            <span className="text-xs font-bold text-slate-400">{p.classYear}</span>
                          </td>
                          <td className="px-3 py-4">
                            <TierPill tier={p.tier} />
                          </td>
                          <td className="px-3 py-4 text-center">
                            <ScoreBadge score={p.paiScore} />
                          </td>
                          <td className="px-3 py-4 text-center hidden lg:table-cell">
                            <span className="text-xs font-black text-slate-400 tabular-nums">{p.performance}</span>
                          </td>
                          <td className="px-3 py-4 text-center hidden lg:table-cell">
                            <span className="text-xs font-black text-slate-400 tabular-nums">{p.athleticism}</span>
                          </td>
                          <td className="px-3 py-4 text-center hidden lg:table-cell">
                            <span className="text-xs font-black text-slate-400 tabular-nums">{p.intangibles}</span>
                          </td>
                          <td className="px-3 py-4 text-center">
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
                <div className="px-4 py-4 border-t border-slate-200 bg-slate-50 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text">
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
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search programs..."
                  value={teamSearch}
                  onChange={e => setTeamSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded border border-slate-200 text-sm focus:outline-none focus:border-emerald-500 bg-white"
                />
              </div>
              <div className="flex gap-2">
                {(['', 'power4', 'group_of_5', 'independent'] as const).map(tier => {
                  const isActive = teamConfFilter === tier;
                  const label = tier === '' ? 'All Tiers' : TIER_LABELS[tier as ConferenceTier]?.label || tier;
                  return (
                    <button
                      key={tier}
                      onClick={() => setTeamConfFilter(tier)}
                      className={`text-[11px] font-black uppercase tracking-tight px-4 py-2 rounded border transition-all whitespace-nowrap ${isActive
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {filteredTeams.length} program{filteredTeams.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Team Table */}
            <div className="bg-white border border-slate-200 rounded overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="px-4 py-4">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">School</span>
                      </th>
                      <th className="px-3 py-4 hidden md:table-cell">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Conference</span>
                      </th>
                      <th className="px-4 py-4">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Head Coach</span>
                      </th>
                      <th className="px-4 py-4 hidden lg:table-cell">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Stadium</span>
                      </th>
                      <th className="px-3 py-4 text-right hidden lg:table-cell">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Capacity</span>
                      </th>
                      <th className="px-3 py-4 hidden md:table-cell">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Location</span>
                      </th>
                      <th className="px-3 py-4 w-16">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Colors</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTeams.map(team => (
                      <tr key={team.id} className="hover:bg-emerald-50/50 transition-colors">
                        <td className="px-4 py-4">
                          <div>
                            <span className="text-sm font-black text-slate-900">{team.schoolName}</span>
                            <span className="text-xs font-bold text-slate-400 ml-1.5">{team.mascot}</span>
                          </div>
                        </td>
                        <td className="px-3 py-4 hidden md:table-cell">
                          <span className="inline-flex items-center px-2 py-0.5 rounded border border-slate-200 bg-white text-[10px] font-black uppercase tracking-wider text-slate-600">
                            {team.conferenceAbbrev}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div>
                            <span className="text-sm font-bold text-slate-700">{team.headCoach}</span>
                            <span className="text-[10px] font-black text-slate-400 ml-1 uppercase">({team.headCoachSince})</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 hidden lg:table-cell">
                          <span className="text-xs font-bold text-slate-500">{team.stadium}</span>
                        </td>
                        <td className="px-3 py-4 text-right hidden lg:table-cell">
                          <span className="text-xs font-black text-slate-800 tabular-nums">
                            {team.stadiumCapacity.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-3 py-4 hidden md:table-cell">
                          <div className="flex items-center gap-1 text-xs font-bold text-slate-400">
                            <MapPin className="w-3 h-3" />
                            {team.city}, {team.state}
                          </div>
                        </td>
                        <td className="px-3 py-4">
                          <div className="flex items-center gap-1">
                            {team.colors.slice(0, 3).map((c, ci) => (
                              <div
                                key={ci}
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
              <div className="flex flex-wrap gap-2">
                {POSITIONS.map(p => (
                  <button
                    key={p}
                    onClick={() => setPosRankPosition(p)}
                    className={`px-4 py-2 rounded text-[11px] font-black border uppercase tracking-tighter transition-all ${posRankPosition === p
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                      : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                      }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Position Header */}
            <div className="flex items-center justify-between mb-4 px-1">
              <div>
                <h2 className="text-2xl font-serif font-bold text-slate-950">
                  Top {posRankPosition}s
                </h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                  {positionPlayers.length} player{positionPlayers.length !== 1 ? 's' : ''} &middot; Ranked by AGI Score
                </p>
              </div>
            </div>

            {/* Position Rankings List */}
            {positionPlayers.length === 0 ? (
              <div className="text-center py-16 bg-white border border-slate-200 rounded shadow-sm">
                <BarChart3 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-400">No {posRankPosition} prospects in the database yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {positionPlayers.map((p, i) => (
                  <Link
                    key={p.id}
                    href={`/perform/prospects/${getProspectSlug(p)}`}
                    className="group flex items-center gap-4 p-5 rounded border border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/30 transition-all shadow-sm"
                  >
                    {/* Rank */}
                    <div className={`w-10 h-10 rounded flex items-center justify-center text-sm font-black flex-shrink-0 ${i < 3
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-100 text-slate-400'
                      }`}>
                      {i + 1}
                    </div>

                    {/* Player Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                          {p.name}
                        </span>
                        <TierPill tier={p.tier} />
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-[11px] font-bold text-slate-500">{p.school}</span>
                        <span className="text-[11px] text-slate-200">&middot;</span>
                        <span className="text-[11px] font-bold text-slate-400">{p.state}</span>
                        <span className="text-[11px] text-slate-200">&middot;</span>
                        <span className="text-[11px] font-bold text-slate-400">{p.classYear}</span>
                        {p.height && (
                          <>
                            <span className="text-[11px] text-slate-200">&middot;</span>
                            <span className="text-[11px] font-bold text-slate-400">{p.height}</span>
                          </>
                        )}
                        {p.weight > 0 && (
                          <>
                            <span className="text-[11px] text-slate-200">&middot;</span>
                            <span className="text-[11px] font-bold text-slate-400">{p.weight} lbs</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Component Scores */}
                    <div className="hidden md:flex items-center gap-6">
                      <div className="text-center">
                        <div className="text-xs font-black text-slate-400 tabular-nums">{p.performance}</div>
                        <div className="text-[9px] font-bold text-slate-300 uppercase">Perf</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs font-black text-slate-400 tabular-nums">{p.athleticism}</div>
                        <div className="text-[9px] font-bold text-slate-300 uppercase">Athl</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs font-black text-slate-400 tabular-nums">{p.intangibles}</div>
                        <div className="text-[9px] font-bold text-slate-300 uppercase">Intg</div>
                      </div>
                    </div>

                    {/* AGI Score */}
                    <div className="text-right flex-shrink-0 pr-2">
                      <ScoreBadge score={p.paiScore} size="lg" />
                      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">AGI</div>
                    </div>

                    {/* Trend */}
                    <TrendIcon trend={p.trend} />

                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-400 flex-shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Top Graded Prospects (The Athletic Style Cards) ──────── */}
        {top4Prospects.length > 0 && (
          <div className="mt-24 mb-20">
            <div className="flex justify-between items-end mb-10 border-b border-slate-200 pb-5">
              <div>
                <h2 className="text-4xl font-serif font-bold tracking-tight text-slate-950">
                  Top Graded <span className="italic text-emerald-800">Prospects</span>
                </h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">
                  Live AGI analysis &middot; Class of '25 & '26
                </p>
              </div>
              <Link
                href="/perform/big-board"
                className="text-emerald-700 hover:text-emerald-800 text-[11px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-transform hover:translate-x-1"
              >
                View Big Board <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {top4Prospects.map(p => (
                <Link
                  key={p.id}
                  href={`/perform/prospects/${getProspectSlug(p)}`}
                  className="bg-white p-8 rounded border border-slate-200 hover:border-emerald-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)] transition-all duration-500 group cursor-pointer relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                    <Trophy className="w-24 h-24" />
                  </div>
                  <div className="flex items-start justify-between mb-8">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-1">
                        {p.position}
                      </span>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">{p.school}</span>
                    </div>
                    <GradeBadge score={p.paiScore} />
                  </div>

                  <h4 className="text-2xl font-serif font-bold text-slate-950 group-hover:text-emerald-800 transition-colors mb-4 leading-tight">
                    {p.name}
                  </h4>

                  <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-50">
                    <div className="flex flex-col">
                      <span className="text-lg font-black text-slate-900 tabular-nums">{p.performance}</span>
                      <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Perf</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-lg font-black text-slate-900 tabular-nums">{p.athleticism}</span>
                      <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Athl</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-lg font-black text-slate-900 tabular-nums">{p.intangibles}</span>
                      <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Intg</span>
                    </div>
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
              desc: 'Complete prospect rankings with AGI grades and tier breakdowns.',
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
              desc: 'Mock drafts, simulators, and team needs analysis for 2026.',
              href: '/perform/draft',
            },
          ].map(tool => {
            const Icon = tool.icon;
            return (
              <Link
                key={tool.title}
                href={tool.href}
                className="bg-white p-8 rounded border border-slate-200 hover:border-emerald-300 transition-all duration-300 shadow-sm group cursor-pointer"
              >
                <div className="w-14 h-14 bg-slate-50 rounded flex items-center justify-center mb-6 group-hover:bg-emerald-50 transition-colors">
                  <Icon className="w-7 h-7 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                </div>
                <h3 className="text-xl font-serif font-bold mb-2 group-hover:text-emerald-800 transition-colors leading-tight">
                  {tool.title}
                </h3>
                <p className="text-slate-500 text-sm font-medium leading-relaxed mb-6">{tool.desc}</p>
                <span className="text-emerald-700 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-transform group-hover:translate-x-1">
                  Explore <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </Link>
            );
          })}
        </div>

        {/* ── Premium CTA ──────────────────────────────────── */}
        <div className="bg-slate-950 rounded py-16 px-10 md:px-20 mb-24 border border-slate-800 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-emerald-600/5 rounded-full blur-[120px] transform translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-900/10 rounded-full blur-[100px] transform -translate-x-1/2 translate-y-1/2" />

          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-16">
            <div className="max-w-3xl text-center lg:text-left">
              <span className="text-emerald-500 text-[10px] font-black uppercase tracking-[0.3em] mb-6 block">
                Exclusive Intelligence
              </span>
              <h2 className="text-4xl md:text-6xl font-serif font-bold mb-8 tracking-tight text-white leading-tight">
                Master the Game with <br />
                <span className="italic text-emerald-500 underline decoration-slate-800 underline-offset-8">AGI Premium</span>
              </h2>
              <p className="text-slate-400 text-lg md:text-xl font-medium leading-relaxed mb-10 max-w-xl">
                Unrestricted access to our depth indexes, daily scouting pulse,
                and the full Associated Grading Index analytics suite.
              </p>
              <div className="flex flex-wrap gap-x-10 gap-y-6 justify-center lg:justify-start">
                {['Live AGI Pulse', 'Intangibles Data', 'War Room access'].map(feature => (
                  <div key={feature} className="flex items-center space-x-3 text-[10px] font-black uppercase tracking-widest text-slate-300">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-5 w-full md:w-80 group">
              <Link
                href="/perform/pricing"
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-10 py-5 rounded text-xs font-black uppercase tracking-[0.2em] transition-all transform hover:-translate-y-1 shadow-xl shadow-emerald-900/40 text-center"
              >
                Start Free Trial
              </Link>
              <Link
                href="/perform/pricing"
                className="bg-transparent border border-slate-800 hover:border-slate-500 text-slate-400 hover:text-white px-10 py-5 rounded text-xs font-bold uppercase tracking-[0.2em] transition-all text-center"
              >
                Platform Plans
              </Link>
              <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest text-center mt-2 group-hover:text-slate-500 transition-colors">
                Trusted by 500+ Programs
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* ── Footer Note ──────────────────────────────────── */}
      <div className="border-t border-slate-200 py-12 text-center bg-white">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest scale-90 opacity-75">
          Per|Form NCAA Football Database &middot; AGI Graded &middot; Official Platform of A.I.M.S.
        </p>
      </div>
    </div>
  );
}
