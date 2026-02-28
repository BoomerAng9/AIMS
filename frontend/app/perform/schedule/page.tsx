'use client';

/**
 * Per|Form — Schedule & Scores
 *
 * ESPN-style scoreboard with week-by-week game results,
 * conference standings, and playoff bracket tracking.
 * Light theme per AIMS design system.
 */

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Calendar, Trophy, ChevronDown, ChevronUp, Filter,
  Tv, MapPin, Star, ArrowRight, CheckCircle, Clock,
  Zap, Shield, BarChart3,
} from 'lucide-react';

interface Game {
  id: string;
  season: number;
  week: number;
  date: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  venue: string;
  completed: boolean;
  conferenceGame: boolean;
  neutralSite: boolean;
  tvNetwork?: string;
  headline?: string;
}

interface Standing {
  team: string;
  conference: string;
  wins: number;
  losses: number;
  confWins: number;
  confLosses: number;
  pointsFor: number;
  pointsAgainst: number;
  streak: string;
  apRank: number | null;
}

type ViewTab = 'scores' | 'standings';

const WEEK_LABELS: Record<number, string> = {
  1: 'Week 1', 2: 'Week 2', 3: 'Week 3', 4: 'Week 4', 5: 'Week 5',
  6: 'Week 6', 7: 'Week 7', 8: 'Week 8', 9: 'Week 9', 10: 'Week 10',
  11: 'Week 11', 12: 'Week 12', 13: 'Rivalry Week',
  14: 'Championship Week', 15: 'CFP First Round', 16: 'CFP Quarterfinals',
  17: 'CFP Semifinals', 18: 'National Championship',
};

function GameCard({ game }: { game: Game }) {
  const homeWin = game.completed && game.homeScore !== null && game.awayScore !== null && game.homeScore > game.awayScore;
  const awayWin = game.completed && game.homeScore !== null && game.awayScore !== null && game.awayScore > game.homeScore;
  const isPlayoff = game.week >= 15;

  return (
    <div className={`rounded-xl border bg-white p-4 transition-all hover:shadow-md ${
      isPlayoff ? 'border-emerald-200 ring-1 ring-emerald-100' : 'border-slate-200'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {game.conferenceGame && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
              CONF
            </span>
          )}
          {game.neutralSite && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
              NEUTRAL
            </span>
          )}
          {isPlayoff && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
              CFP
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          {game.tvNetwork && (
            <span className="flex items-center gap-1">
              <Tv className="w-3 h-3" />
              {game.tvNetwork}
            </span>
          )}
          <span>{new Date(game.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
        </div>
      </div>

      {/* Matchup */}
      <div className="space-y-2">
        {/* Away Team */}
        <div className={`flex items-center justify-between ${awayWin ? 'font-black' : 'font-semibold'}`}>
          <span className={`text-sm ${awayWin ? 'text-slate-900' : 'text-slate-600'}`}>
            {game.awayTeam}
          </span>
          <span className={`text-lg tabular-nums ${awayWin ? 'text-emerald-700' : 'text-slate-500'}`}>
            {game.awayScore ?? '-'}
          </span>
        </div>
        {/* Home Team */}
        <div className={`flex items-center justify-between ${homeWin ? 'font-black' : 'font-semibold'}`}>
          <span className={`text-sm ${homeWin ? 'text-slate-900' : 'text-slate-600'}`}>
            {game.homeTeam}
          </span>
          <span className={`text-lg tabular-nums ${homeWin ? 'text-emerald-700' : 'text-slate-500'}`}>
            {game.homeScore ?? '-'}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center gap-2 text-[10px] text-slate-400 uppercase tracking-wider">
        <MapPin className="w-3 h-3" />
        <span className="truncate">{game.venue}</span>
      </div>

      {/* Headline */}
      {game.headline && (
        <p className="mt-2 text-xs text-slate-500 italic leading-relaxed">
          {game.headline}
        </p>
      )}
    </div>
  );
}

function StandingsTable({ standings, conference }: { standings: Standing[]; conference: string }) {
  const confStandings = standings
    .filter(s => s.conference === conference)
    .sort((a, b) => {
      if (b.confWins !== a.confWins) return b.confWins - a.confWins;
      if (a.confLosses !== b.confLosses) return a.confLosses - b.confLosses;
      return b.wins - a.wins;
    });

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
        <h3 className="font-black text-sm uppercase tracking-widest text-slate-800">{conference}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left px-4 py-2 font-bold text-slate-400 uppercase tracking-wider">Team</th>
              <th className="text-center px-2 py-2 font-bold text-slate-400 uppercase tracking-wider">Conf</th>
              <th className="text-center px-2 py-2 font-bold text-slate-400 uppercase tracking-wider">Overall</th>
              <th className="text-center px-2 py-2 font-bold text-slate-400 uppercase tracking-wider hidden md:table-cell">PF</th>
              <th className="text-center px-2 py-2 font-bold text-slate-400 uppercase tracking-wider hidden md:table-cell">PA</th>
              <th className="text-center px-2 py-2 font-bold text-slate-400 uppercase tracking-wider hidden sm:table-cell">Streak</th>
              <th className="text-center px-2 py-2 font-bold text-slate-400 uppercase tracking-wider">Rank</th>
            </tr>
          </thead>
          <tbody>
            {confStandings.map((s, i) => (
              <tr key={s.team} className={`border-b border-slate-50 ${i < 4 ? 'bg-emerald-50/30' : ''} hover:bg-slate-50 transition-colors`}>
                <td className="px-4 py-2.5 font-bold text-slate-800">{s.team}</td>
                <td className="text-center px-2 py-2.5 text-slate-600 tabular-nums">{s.confWins}-{s.confLosses}</td>
                <td className="text-center px-2 py-2.5 text-slate-600 tabular-nums">{s.wins}-{s.losses}</td>
                <td className="text-center px-2 py-2.5 text-slate-500 tabular-nums hidden md:table-cell">{s.pointsFor}</td>
                <td className="text-center px-2 py-2.5 text-slate-500 tabular-nums hidden md:table-cell">{s.pointsAgainst}</td>
                <td className="text-center px-2 py-2.5 hidden sm:table-cell">
                  <span className={`text-xs font-bold ${s.streak.startsWith('W') ? 'text-emerald-600' : 'text-red-500'}`}>
                    {s.streak}
                  </span>
                </td>
                <td className="text-center px-2 py-2.5">
                  {s.apRank ? (
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                      {s.apRank}
                    </span>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function SchedulePage() {
  const [games, setGames] = useState<Game[]>([]);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [weeks, setWeeks] = useState<number[]>([]);
  const [conferences, setConferences] = useState<string[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [selectedConf, setSelectedConf] = useState('');
  const [tab, setTab] = useState<ViewTab>('scores');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const params = new URLSearchParams();
        if (selectedWeek) params.set('week', String(selectedWeek));
        if (selectedConf && tab === 'standings') params.set('conference', selectedConf);

        const res = await fetch(`/api/perform/schedule?${params}`);
        const data = await res.json();
        setGames(data.games || []);
        setStandings(data.standings || []);
        setWeeks(data.weeks || []);
        setConferences(data.conferences || []);
      } catch (err) {
        console.error('[Schedule] Failed to load:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [selectedWeek, selectedConf, tab]);

  // Group games by week
  const gamesByWeek = useMemo(() => {
    const map = new Map<number, Game[]>();
    games.forEach(g => {
      if (!map.has(g.week)) map.set(g.week, []);
      map.get(g.week)!.push(g);
    });
    return map;
  }, [games]);

  const displayWeeks = selectedWeek ? [selectedWeek] : [...gamesByWeek.keys()].sort((a, b) => b - a);

  // Standings conferences
  const standingsConfs = useMemo(() => {
    const confs = [...new Set(standings.map(s => s.conference))];
    return selectedConf ? confs.filter(c => c === selectedConf) : confs;
  }, [standings, selectedConf]);

  // KPI stats
  const totalGames = games.length;
  const completedGames = games.filter(g => g.completed).length;
  const playoffGames = games.filter(g => g.week >= 15).length;
  const rankedTeams = standings.filter(s => s.apRank !== null).length;

  return (
    <div className="min-h-screen">
      {/* ── Hero Strip ─────────────────────────────────────────── */}
      <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-6 h-6 text-emerald-600" />
            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-slate-900">
              Schedule & Scores
            </h1>
          </div>
          <p className="text-sm text-slate-500 max-w-xl">
            2025 CFB Season — Complete results, conference standings, and College Football Playoff bracket.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-6 space-y-6">
        {/* ── KPI Strip ─────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total Games', value: totalGames, icon: <BarChart3 className="w-4 h-4" />, color: 'text-emerald-600 bg-emerald-50' },
            { label: 'Completed', value: completedGames, icon: <CheckCircle className="w-4 h-4" />, color: 'text-blue-600 bg-blue-50' },
            { label: 'Playoff Games', value: playoffGames, icon: <Trophy className="w-4 h-4" />, color: 'text-amber-600 bg-amber-50' },
            { label: 'Ranked Teams', value: rankedTeams, icon: <Star className="w-4 h-4" />, color: 'text-slate-600 bg-slate-100' },
          ].map(kpi => (
            <div key={kpi.label} className="rounded-xl border border-slate-200 bg-white p-4 flex items-center gap-3">
              <div className={`rounded-lg p-2 ${kpi.color}`}>{kpi.icon}</div>
              <div>
                <p className="text-xl font-black text-slate-800 tabular-nums">{kpi.value}</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">{kpi.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Tab Bar + Filters ──────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
            {(['scores', 'standings'] as ViewTab[]).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-md text-xs font-black uppercase tracking-widest transition-all ${
                  tab === t
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {t === 'scores' ? 'Scores' : 'Standings'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {tab === 'scores' && (
              <select
                value={selectedWeek ?? ''}
                onChange={e => setSelectedWeek(e.target.value ? Number(e.target.value) : null)}
                className="text-xs font-bold border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300"
              >
                <option value="">All Weeks</option>
                {weeks.map(w => (
                  <option key={w} value={w}>{WEEK_LABELS[w] || `Week ${w}`}</option>
                ))}
              </select>
            )}
            <select
              value={selectedConf}
              onChange={e => setSelectedConf(e.target.value)}
              className="text-xs font-bold border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300"
            >
              <option value="">All Conferences</option>
              {conferences.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Content ────────────────────────────────────────── */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : tab === 'scores' ? (
          /* ── Scores View ── */
          <div className="space-y-8">
            {displayWeeks.map(week => {
              const weekGames = gamesByWeek.get(week) || [];
              if (weekGames.length === 0) return null;
              return (
                <div key={week}>
                  <div className="flex items-center gap-3 mb-4">
                    <h2 className="text-lg font-black uppercase tracking-widest text-slate-800">
                      {WEEK_LABELS[week] || `Week ${week}`}
                    </h2>
                    <span className="text-xs text-slate-400 font-bold">
                      {weekGames.length} game{weekGames.length !== 1 ? 's' : ''}
                    </span>
                    {week >= 14 && (
                      <Trophy className="w-4 h-4 text-amber-500" />
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {weekGames.map(g => (
                      <GameCard key={g.id} game={g} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ── Standings View ── */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {standingsConfs.sort().map(conf => (
              <StandingsTable key={conf} standings={standings} conference={conf} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
