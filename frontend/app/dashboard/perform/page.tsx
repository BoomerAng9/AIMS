'use client';

/**
 * Per|Form Lobby — Dashboard Entry Point for Sports Intelligence
 *
 * Hub page with LIVE gridiron data:
 * - Conference standings (PerformTeamSeason)
 * - Transfer portal feed (TransferPortalEntry)
 * - Coaching carousel (CoachingChange)
 * - Draft board (DraftProspect)
 * - Scoreboard (SportsPick)
 * - NIL leaderboard (NilTeamRanking)
 *
 * Plus navigation cards for Film Room, War Room, Big Board, etc.
 * All powered by ACHEEVY's autonomous agent pipeline.
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '@/lib/motion';
import {
  Film, Swords, Activity, LayoutGrid, ArrowRightLeft,
  DollarSign, Trophy, Newspaper, TrendingUp, Users,
  RefreshCw, ArrowRight, ChevronRight, Zap, Shield,
  MapPin, Clock, Circle,
} from 'lucide-react';

/* ── Types ─────────────────────────────────────────────────── */

interface LobbyCard {
  title: string;
  description: string;
  href: string;
  icon: typeof Film;
  status: 'live' | 'beta' | 'coming-soon';
  accentColor: string;
}

interface GridironData {
  standings: Standing[];
  portalMoves: PortalMove[];
  coachingChanges: CoachingMove[];
  scoreboard: Game[];
  draftBoard: DraftEntry[];
  nilLeaders: NilEntry[];
  portalSummary: { inPortal: number; committed: number; withdrawn: number; signed: number; total: number };
  updatedAt: string;
}

interface Standing {
  team: string; abbreviation: string; conference: string; conferenceName: string;
  wins: number; losses: number; confWins: number; confLosses: number;
  apRank: number | null; cfpRank: number | null; bowlGame: string | null; bowlResult: string | null;
  season: number;
}

interface PortalMove {
  playerName: string; position: string; status: string; stars: number | null;
  paiScore: number | null; tier: string | null; nilValuation: string | null;
  from: string; fromAbbr: string; to: string | null; toAbbr: string | null;
  enteredDate: string | null; committedDate: string | null;
}

interface CoachingMove {
  coachName: string; changeType: string; previousTeam: string | null;
  newTeam: string | null; contractValue: string | null;
  effectiveDate: string | null; record: string | null;
}

interface Game {
  sport: string; homeTeam: string; awayTeam: string;
  homeScore: number | null; awayScore: number | null; status: string;
  spread: number | null; overUnder: number | null; eventDate: string; result: string | null;
}

interface DraftEntry {
  name: string; position: string; college: string; paiScore: number;
  tier: string; overallRank: number; projectedRound: number | null;
  projectedPick: number | null; projectedTeam: string | null;
  trend: string; combineInvite: boolean;
}

interface NilEntry {
  team: string; abbreviation: string; rank: number;
  totalNilValue: number; avgPerPlayer: number; dealCount: number; trend: string;
}

interface PerFormStats {
  prospectsTracked: number;
  filmHoursAnalyzed: number;
  reportsGenerated: number;
  activeDebates: number;
}

/* ── Constants ─────────────────────────────────────────────── */

const LOBBY_CARDS: LobbyCard[] = [
  {
    title: 'Film Room',
    description: 'AI-powered game film analysis with Twelve Labs Marengo.',
    href: '/dashboard/film-room',
    icon: Film,
    status: 'live',
    accentColor: 'from-blue-500/20 to-blue-600/10',
  },
  {
    title: 'War Room',
    description: 'Autonomous analytics. Lil_Hawk debates and Per|Form rankings.',
    href: '/dashboard/war-room',
    icon: Swords,
    status: 'live',
    accentColor: 'from-red-500/20 to-red-600/10',
  },
  {
    title: 'Sports Tracker',
    description: 'Track player careers, stats, and injuries in real-time.',
    href: '/dashboard/sports-tracker',
    icon: Activity,
    status: 'live',
    accentColor: 'from-emerald-500/20 to-emerald-600/10',
  },
  {
    title: 'Big Board',
    description: 'Prospect rankings. ELITE through DEVELOPMENTAL tiers.',
    href: '/sandbox/perform/big-board',
    icon: LayoutGrid,
    status: 'live',
    accentColor: 'from-gold/20 to-gold/10',
  },
  {
    title: 'Transfer Portal',
    description: 'Portal entries, commitments, and decommitments.',
    href: '/sandbox/perform/transfer-portal',
    icon: ArrowRightLeft,
    status: 'live',
    accentColor: 'from-purple-500/20 to-purple-600/10',
  },
  {
    title: 'NIL Tracker',
    description: 'Name, Image, and Likeness valuations and deals.',
    href: '/dashboard/nil',
    icon: DollarSign,
    status: 'live',
    accentColor: 'from-green-500/20 to-green-600/10',
  },
  {
    title: 'Draft Simulator',
    description: 'AI-powered mock drafts with trade scenarios.',
    href: '/sandbox/perform/draft/simulator',
    icon: Trophy,
    status: 'beta',
    accentColor: 'from-amber-500/20 to-amber-600/10',
  },
  {
    title: "Editor's Desk",
    description: 'Content production pipeline. Assign, review, publish.',
    href: '/dashboard/editors-desk',
    icon: Newspaper,
    status: 'live',
    accentColor: 'from-cyan-500/20 to-cyan-600/10',
  },
];

const STATUS_BADGE = {
  'live': { label: 'LIVE', className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  'beta': { label: 'BETA', className: 'bg-gold/20 text-gold border-gold/30' },
  'coming-soon': { label: 'SOON', className: 'bg-slate-100 text-slate-400 border-slate-200' },
} as const;

const CHANGE_TYPE_COLORS: Record<string, string> = {
  HIRED: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  FIRED: 'text-red-400 bg-red-500/10 border-red-500/20',
  RESIGNED: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  RETIRED: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  INTERIM: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
};

const PORTAL_STATUS_COLORS: Record<string, string> = {
  IN_PORTAL: 'text-amber-400',
  COMMITTED: 'text-emerald-400',
  WITHDRAWN: 'text-slate-400',
  SIGNED: 'text-gold',
};

const TREND_ARROW: Record<string, string> = {
  UP: '↑', DOWN: '↓', STEADY: '→', NEW: '★',
};

/* ── Helpers ───────────────────────────────────────────────── */

function formatNumber(n: number): string {
  return n >= 1000 ? n.toLocaleString() : String(n);
}

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

function formatDate(d: string | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/* ── Component ─────────────────────────────────────────────── */

export default function PerFormLobbyPage() {
  const [stats, setStats] = useState<PerFormStats>({
    prospectsTracked: 0, filmHoursAnalyzed: 0, reportsGenerated: 0, activeDebates: 0,
  });
  const [gridiron, setGridiron] = useState<GridironData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/perform/stats').then(r => r.ok ? r.json() : null).catch(() => null),
      fetch('/api/perform/gridiron').then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(([s, g]) => {
      if (s) setStats(s);
      if (g) setGridiron(g);
      setLoading(false);
    });
  }, []);

  const hasStandings = (gridiron?.standings?.length ?? 0) > 0;
  const hasPortal = (gridiron?.portalMoves?.length ?? 0) > 0;
  const hasCoaching = (gridiron?.coachingChanges?.length ?? 0) > 0;
  const hasScoreboard = (gridiron?.scoreboard?.length ?? 0) > 0;
  const hasDraft = (gridiron?.draftBoard?.length ?? 0) > 0;
  const hasNil = (gridiron?.nilLeaders?.length ?? 0) > 0;
  const hasLiveData = hasStandings || hasPortal || hasCoaching || hasScoreboard || hasDraft || hasNil;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* ── Hero ──────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/30 flex items-center justify-center">
            <Trophy className="w-7 h-7 text-gold" />
          </div>
          <div>
            <h1 className="text-3xl font-display text-slate-800">Per|Form</h1>
            <p className="text-sm text-slate-400 font-mono uppercase tracking-widest">
              Autonomous Sports Intelligence Platform
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 pt-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs text-emerald-400 font-medium">Pipeline Active</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-wireframe-stroke">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-400 font-medium">5 Agent Roles Assigned</span>
          </div>
          {gridiron?.updatedAt && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-wireframe-stroke ml-auto">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[10px] text-slate-400 font-mono">
                {new Date(gridiron.updatedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Quick Stats Strip ─────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
      >
        {[
          { label: 'Prospects Tracked', value: formatNumber(stats.prospectsTracked), color: 'text-gold' },
          { label: 'Film Hours', value: formatNumber(stats.filmHoursAnalyzed), color: 'text-blue-400' },
          { label: 'Reports Generated', value: formatNumber(stats.reportsGenerated), color: 'text-emerald-400' },
          { label: 'Active Debates', value: formatNumber(stats.activeDebates), color: 'text-red-400' },
        ].map((stat) => (
          <div key={stat.label} className="px-4 py-3 rounded-xl bg-white border border-wireframe-stroke">
            <p className={`text-xl font-display ${stat.color}`}>{stat.value}</p>
            <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">{stat.label}</p>
          </div>
        ))}
      </motion.div>

      {/* ── Live Gridiron Data ─────────────────────────────────── */}
      {hasLiveData && (
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="space-y-6"
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ repeat: Infinity, duration: 1.2 }}
                className="w-2 h-2 rounded-full bg-red-500"
              />
              <span className="text-[11px] font-mono font-bold uppercase tracking-[0.3em] text-slate-500">Live Gridiron Data</span>
            </div>
            <div className="flex-1 h-px bg-wireframe-stroke" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {/* ── Scoreboard ────────────────────────────────── */}
            {hasScoreboard && (
              <div className="rounded-xl border border-wireframe-stroke bg-slate-100/40 overflow-hidden">
                <div className="px-4 py-3 border-b border-wireframe-stroke flex items-center justify-between">
                  <span className="text-xs font-mono font-bold uppercase tracking-widest text-slate-500">Scoreboard</span>
                  <span className="text-[10px] font-mono text-slate-400">{gridiron!.scoreboard.length} games</span>
                </div>
                <div className="divide-y divide-wireframe-stroke max-h-[300px] overflow-y-auto">
                  {gridiron!.scoreboard.map((game, i) => (
                    <div key={i} className="px-4 py-2.5 flex items-center gap-3 hover:bg-white transition-colors">
                      <span className={`text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded ${
                        game.status === 'LIVE' ? 'bg-red-500/20 text-red-400' :
                        game.status === 'FINAL' ? 'bg-slate-50 text-slate-400' :
                        'bg-blue-500/10 text-blue-400'
                      }`}>
                        {game.status}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-slate-800 truncate">{game.awayTeam}</span>
                          <span className={`text-sm font-bold ${game.result === 'AWAY' ? 'text-gold' : 'text-slate-500'}`}>
                            {game.awayScore ?? '—'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-slate-800 truncate">{game.homeTeam}</span>
                          <span className={`text-sm font-bold ${game.result === 'HOME' ? 'text-gold' : 'text-slate-500'}`}>
                            {game.homeScore ?? '—'}
                          </span>
                        </div>
                      </div>
                      <span className="text-[9px] font-mono text-slate-300 flex-shrink-0">{game.sport}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Conference Standings ──────────────────────── */}
            {hasStandings && (
              <div className="rounded-xl border border-wireframe-stroke bg-slate-100/40 overflow-hidden">
                <div className="px-4 py-3 border-b border-wireframe-stroke flex items-center justify-between">
                  <span className="text-xs font-mono font-bold uppercase tracking-widest text-slate-500">Standings</span>
                  <span className="text-[10px] font-mono text-slate-400">Top 25</span>
                </div>
                <div className="divide-y divide-wireframe-stroke max-h-[300px] overflow-y-auto">
                  {gridiron!.standings.map((team, i) => (
                    <div key={i} className="px-4 py-2 flex items-center gap-3 hover:bg-white transition-colors">
                      <span className="text-[10px] font-bold text-slate-300 w-5 text-right">
                        {team.apRank || team.cfpRank || i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-medium text-slate-800 truncate block">{team.team}</span>
                        <span className="text-[10px] font-mono text-slate-400">{team.conference}</span>
                      </div>
                      <span className="text-xs font-mono text-slate-500">{team.wins}-{team.losses}</span>
                      <span className="text-[10px] font-mono text-slate-400">({team.confWins}-{team.confLosses})</span>
                      {team.bowlGame && (
                        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                          team.bowlResult === 'W' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                        }`}>
                          {team.bowlResult}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Transfer Portal Feed ─────────────────────── */}
            {hasPortal && (
              <div className="rounded-xl border border-wireframe-stroke bg-slate-100/40 overflow-hidden">
                <div className="px-4 py-3 border-b border-wireframe-stroke flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold uppercase tracking-widest text-slate-500">Portal Feed</span>
                    {gridiron!.portalSummary.total > 0 && (
                      <span className="text-[10px] font-mono text-amber-400/70 bg-amber-500/10 px-2 py-0.5 rounded-full">
                        {gridiron!.portalSummary.inPortal} active
                      </span>
                    )}
                  </div>
                  <Link href="/sandbox/perform/transfer-portal" className="text-[10px] font-mono text-gold/50 hover:text-gold transition-colors">
                    View All →
                  </Link>
                </div>
                <div className="divide-y divide-wireframe-stroke max-h-[300px] overflow-y-auto">
                  {gridiron!.portalMoves.map((move, i) => (
                    <div key={i} className="px-4 py-2.5 hover:bg-white transition-colors">
                      <div className="flex items-center gap-2">
                        <Circle className={`w-2 h-2 flex-shrink-0 ${PORTAL_STATUS_COLORS[move.status] || 'text-slate-300'}`} fill="currentColor" />
                        <span className="text-xs font-medium text-slate-800 truncate">{move.playerName}</span>
                        <span className="text-[10px] font-mono text-slate-400 flex-shrink-0">{move.position}</span>
                        {move.paiScore && (
                          <span className="text-[10px] font-mono text-gold/50 ml-auto flex-shrink-0">P.A.I. {move.paiScore}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 text-[10px] font-mono text-slate-400">
                        <span>{move.fromAbbr}</span>
                        <ArrowRight className="w-2.5 h-2.5" />
                        <span className={move.to ? 'text-emerald-400/70' : 'text-amber-400/50'}>
                          {move.toAbbr || 'TBD'}
                        </span>
                        {move.nilValuation && (
                          <span className="ml-auto text-green-400/50">{move.nilValuation}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Coaching Carousel ────────────────────────── */}
            {hasCoaching && (
              <div className="rounded-xl border border-wireframe-stroke bg-slate-100/40 overflow-hidden">
                <div className="px-4 py-3 border-b border-wireframe-stroke flex items-center justify-between">
                  <span className="text-xs font-mono font-bold uppercase tracking-widest text-slate-500">Coaching Carousel</span>
                  <Link href="/perform/coaching-carousel" className="text-[10px] font-mono text-gold/50 hover:text-gold transition-colors">
                    Full List →
                  </Link>
                </div>
                <div className="divide-y divide-wireframe-stroke max-h-[300px] overflow-y-auto">
                  {gridiron!.coachingChanges.map((change, i) => (
                    <div key={i} className="px-4 py-2.5 hover:bg-white transition-colors">
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border ${
                          CHANGE_TYPE_COLORS[change.changeType] || 'text-slate-400 bg-slate-50 border-slate-200'
                        }`}>
                          {change.changeType}
                        </span>
                        <span className="text-xs font-medium text-slate-800 truncate">{change.coachName}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[10px] font-mono text-slate-400">
                        {change.previousTeam && <span>{change.previousTeam}</span>}
                        {change.previousTeam && change.newTeam && <ArrowRight className="w-2.5 h-2.5" />}
                        {change.newTeam && <span className="text-emerald-400/70">{change.newTeam}</span>}
                        {change.contractValue && <span className="ml-auto text-green-400/50">{change.contractValue}</span>}
                        {change.record && <span className="text-slate-300">({change.record})</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Draft Board ──────────────────────────────── */}
            {hasDraft && (
              <div className="rounded-xl border border-wireframe-stroke bg-slate-100/40 overflow-hidden">
                <div className="px-4 py-3 border-b border-wireframe-stroke flex items-center justify-between">
                  <span className="text-xs font-mono font-bold uppercase tracking-widest text-slate-500">Draft Board</span>
                  <Link href="/sandbox/perform/draft" className="text-[10px] font-mono text-gold/50 hover:text-gold transition-colors">
                    Full Board →
                  </Link>
                </div>
                <div className="divide-y divide-wireframe-stroke max-h-[300px] overflow-y-auto">
                  {gridiron!.draftBoard.map((prospect, i) => (
                    <div key={i} className="px-4 py-2.5 flex items-center gap-3 hover:bg-white transition-colors">
                      <span className="text-lg font-bold text-slate-300 w-6 text-right flex-shrink-0">{prospect.overallRank}</span>
                      <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center text-[10px] font-bold text-gold flex-shrink-0">
                        {prospect.position}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-800 truncate">{prospect.name}</p>
                        <p className="text-[10px] font-mono text-slate-400">{prospect.college}</p>
                      </div>
                      <span className="text-[10px] text-slate-300">{TREND_ARROW[prospect.trend] || '—'}</span>
                      {prospect.combineInvite && (
                        <span className="text-[9px] font-mono bg-cyan-500/10 text-cyan-400/60 px-1.5 py-0.5 rounded">CMB</span>
                      )}
                      <span className="text-sm font-bold text-gold flex-shrink-0">{prospect.paiScore}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── NIL Leaderboard ──────────────────────────── */}
            {hasNil && (
              <div className="rounded-xl border border-wireframe-stroke bg-slate-100/40 overflow-hidden">
                <div className="px-4 py-3 border-b border-wireframe-stroke flex items-center justify-between">
                  <span className="text-xs font-mono font-bold uppercase tracking-widest text-slate-500">NIL Leaderboard</span>
                  <Link href="/dashboard/nil" className="text-[10px] font-mono text-gold/50 hover:text-gold transition-colors">
                    Full Rankings →
                  </Link>
                </div>
                <div className="divide-y divide-wireframe-stroke max-h-[300px] overflow-y-auto">
                  {gridiron!.nilLeaders.map((entry, i) => (
                    <div key={i} className="px-4 py-2.5 flex items-center gap-3 hover:bg-white transition-colors">
                      <span className="text-[10px] font-bold text-slate-300 w-5 text-right">#{entry.rank}</span>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-medium text-slate-800 truncate block">{entry.team}</span>
                        <span className="text-[10px] font-mono text-slate-300">{entry.dealCount} deals</span>
                      </div>
                      <span className="text-[10px] text-slate-300">{TREND_ARROW[entry.trend] || '—'}</span>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-bold text-green-400">{formatCurrency(entry.totalNilValue)}</p>
                        <p className="text-[9px] font-mono text-slate-300">{formatCurrency(entry.avgPerPlayer)}/player</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Portal Summary Bar ─────────────────────────── */}
          {gridiron && gridiron.portalSummary.total > 0 && (
            <div className="flex items-center gap-4 px-4 py-3 rounded-xl bg-white border border-wireframe-stroke">
              <ArrowRightLeft className="w-4 h-4 text-purple-400/50 flex-shrink-0" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">Portal Summary</span>
              <div className="flex items-center gap-4 ml-auto text-[11px] font-mono">
                <span className="text-amber-400">{gridiron.portalSummary.inPortal} <span className="text-slate-300">active</span></span>
                <span className="text-emerald-400">{gridiron.portalSummary.committed} <span className="text-slate-300">committed</span></span>
                <span className="text-gold">{gridiron.portalSummary.signed} <span className="text-slate-300">signed</span></span>
                <span className="text-slate-400">{gridiron.portalSummary.total} total</span>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* ── Navigation Cards Grid ─────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-mono font-bold uppercase tracking-[0.3em] text-slate-400">Platform</span>
          <div className="flex-1 h-px bg-wireframe-stroke" />
        </div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
          {LOBBY_CARDS.map((card) => {
            const Icon = card.icon;
            const badge = STATUS_BADGE[card.status];

            return (
              <motion.div key={card.title} variants={staggerItem}>
                <Link href={card.href}>
                  <div className="group rounded-xl border border-wireframe-stroke bg-slate-100/60 hover:bg-slate-50/70 hover:border-gold/20 transition-all p-5 h-full flex flex-col gap-3 cursor-pointer">
                    <div className="flex items-start justify-between">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${card.accentColor} border border-slate-200 flex items-center justify-center group-hover:border-gold/20 transition-colors`}>
                        <Icon className="w-5 h-5 text-slate-600 group-hover:text-gold transition-colors" />
                      </div>
                      <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border ${badge.className}`}>
                        {badge.label}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-slate-800 group-hover:text-gold transition-colors">{card.title}</h3>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">{card.description}</p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}
