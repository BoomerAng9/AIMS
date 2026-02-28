'use client';

/**
 * Per|Form — Rankings
 *
 * AP Top 25, CFP Rankings, and Coaches Poll with movement indicators,
 * poll comparison, and historical context.
 * Light theme per AIMS design system.
 */

import { useState, useEffect, useMemo } from 'react';
import {
  Trophy, ArrowUp, ArrowDown, Minus, Star,
  ChevronRight, BarChart3, Shield, Zap,
} from 'lucide-react';

interface Ranking {
  rank: number;
  team: string;
  record: string;
  points: number;
  firstPlaceVotes?: number;
  previousRank: number | null;
  conference: string;
}

interface PollWeek {
  poll: string;
  season: number;
  week: number;
  label: string;
  released: string;
  rankings: Ranking[];
}

type PollType = 'AP' | 'CFP' | 'Coaches';

const POLL_INFO: Record<PollType, { label: string; color: string; bg: string; description: string }> = {
  AP: { label: 'AP Top 25', color: 'text-red-700', bg: 'bg-red-50', description: 'Associated Press poll — voted by sportswriters and broadcasters' },
  CFP: { label: 'CFP Rankings', color: 'text-emerald-700', bg: 'bg-emerald-50', description: 'College Football Playoff Selection Committee rankings' },
  Coaches: { label: 'Coaches Poll', color: 'text-blue-700', bg: 'bg-blue-50', description: 'AFCA Coaches Poll — voted by FBS head coaches' },
};

function MovementBadge({ current, previous }: { current: number; previous: number | null }) {
  if (previous === null) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
        NEW
      </span>
    );
  }
  const diff = previous - current;
  if (diff > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-600">
        <ArrowUp className="w-3 h-3" />
        {diff}
      </span>
    );
  }
  if (diff < 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-red-500">
        <ArrowDown className="w-3 h-3" />
        {Math.abs(diff)}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center text-[10px] font-bold text-slate-400">
      <Minus className="w-3 h-3" />
    </span>
  );
}

function RankingRow({ ranking, index }: { ranking: Ranking; index: number }) {
  const isTop5 = ranking.rank <= 5;
  const isTop10 = ranking.rank <= 10;

  return (
    <tr className={`border-b border-slate-50 hover:bg-slate-50/80 transition-colors ${
      isTop5 ? 'bg-emerald-50/20' : ''
    }`}>
      <td className="px-4 py-3 text-center">
        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-black ${
          isTop5
            ? 'bg-emerald-800 text-white'
            : isTop10
            ? 'bg-emerald-100 text-emerald-900'
            : 'bg-slate-100 text-slate-700'
        }`}>
          {ranking.rank}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <MovementBadge current={ranking.rank} previous={ranking.previousRank} />
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="font-black text-sm text-slate-900">{ranking.team}</span>
      </td>
      <td className="px-4 py-3 text-center">
        <span className="text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded font-mono">
          {ranking.conference}
        </span>
      </td>
      <td className="px-4 py-3 text-center font-bold text-slate-700 tabular-nums text-sm">
        {ranking.record}
      </td>
      <td className="px-4 py-3 text-center text-slate-500 tabular-nums text-xs hidden md:table-cell">
        {ranking.points > 0 ? ranking.points.toLocaleString() : '—'}
      </td>
      <td className="px-4 py-3 text-center text-slate-400 tabular-nums text-xs hidden lg:table-cell">
        {ranking.firstPlaceVotes ?? '—'}
      </td>
    </tr>
  );
}

export default function RankingsPage() {
  const [polls, setPolls] = useState<PollWeek[]>([]);
  const [selectedPoll, setSelectedPoll] = useState<PollType>('AP');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/perform/rankings');
        const data = await res.json();
        setPolls(data.polls || []);
      } catch (err) {
        console.error('[Rankings] Failed to load:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Get the selected poll data (use latest week available)
  const activePoll = useMemo(() => {
    const matching = polls
      .filter(p => p.poll === selectedPoll)
      .sort((a, b) => b.week - a.week);
    return matching[0] || null;
  }, [polls, selectedPoll]);

  // Conference breakdown
  const confBreakdown = useMemo(() => {
    if (!activePoll) return [];
    const map = new Map<string, number>();
    activePoll.rankings.forEach(r => {
      map.set(r.conference, (map.get(r.conference) || 0) + 1);
    });
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([conf, count]) => ({ conf, count }));
  }, [activePoll]);

  const info = POLL_INFO[selectedPoll];

  return (
    <div className="min-h-screen">
      {/* ── Hero Strip ─────────────────────────────────────────── */}
      <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="w-6 h-6 text-emerald-600" />
            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-slate-900">
              Rankings
            </h1>
          </div>
          <p className="text-sm text-slate-500 max-w-xl">
            2025 CFB Season — AP Top 25, College Football Playoff Rankings, and Coaches Poll.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-6 space-y-6">
        {/* ── Poll Selector ─────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {(Object.keys(POLL_INFO) as PollType[]).map(p => {
            const pi = POLL_INFO[p];
            const isActive = selectedPoll === p;
            const pollData = polls.find(pw => pw.poll === p);
            return (
              <button
                key={p}
                onClick={() => setSelectedPoll(p)}
                className={`rounded-xl border p-4 text-left transition-all ${
                  isActive
                    ? `border-emerald-300 ring-2 ring-emerald-100 bg-white shadow-sm`
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-sm font-black uppercase tracking-widest ${isActive ? 'text-emerald-800' : 'text-slate-700'}`}>
                    {pi.label}
                  </span>
                  {pollData && (
                    <span className="text-[10px] text-slate-400 font-bold">
                      {pollData.label}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">{pi.description}</p>
              </button>
            );
          })}
        </div>

        {/* ── Conference Breakdown Strip ───────────────────── */}
        {confBreakdown.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {confBreakdown.map(({ conf, count }) => (
              <span
                key={conf}
                className="text-xs font-bold px-3 py-1.5 rounded-full border border-slate-200 bg-white text-slate-600"
              >
                {conf}: <span className="text-emerald-700">{count}</span>
              </span>
            ))}
          </div>
        )}

        {/* ── Rankings Table ──────────────────────────────── */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : activePoll ? (
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="font-black text-sm uppercase tracking-widest text-slate-800">
                  {info.label}
                </h2>
                <span className="text-xs text-slate-400">
                  {activePoll.label} — Released {new Date(activePoll.released).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                {activePoll.rankings.length} teams
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-25">
                    <th className="px-4 py-2 text-center font-bold text-slate-400 uppercase tracking-wider w-14">Rank</th>
                    <th className="px-4 py-2 text-center font-bold text-slate-400 uppercase tracking-wider w-16">Move</th>
                    <th className="px-4 py-2 text-left font-bold text-slate-400 uppercase tracking-wider">Team</th>
                    <th className="px-4 py-2 text-center font-bold text-slate-400 uppercase tracking-wider">Conf</th>
                    <th className="px-4 py-2 text-center font-bold text-slate-400 uppercase tracking-wider">Record</th>
                    <th className="px-4 py-2 text-center font-bold text-slate-400 uppercase tracking-wider hidden md:table-cell">Points</th>
                    <th className="px-4 py-2 text-center font-bold text-slate-400 uppercase tracking-wider hidden lg:table-cell">#1 Votes</th>
                  </tr>
                </thead>
                <tbody>
                  {activePoll.rankings.map((r, i) => (
                    <RankingRow key={r.rank} ranking={r} index={i} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-20 text-slate-400">
            <Trophy className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-bold">No ranking data available</p>
          </div>
        )}

        {/* ── Poll Comparison Summary ────────────────────── */}
        {polls.length > 1 && (
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="font-black text-sm uppercase tracking-widest text-slate-800 mb-4">
              Poll Comparison — Top 5
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(Object.keys(POLL_INFO) as PollType[]).map(p => {
                const pi = POLL_INFO[p];
                const pollData = polls
                  .filter(pw => pw.poll === p)
                  .sort((a, b) => b.week - a.week)[0];
                if (!pollData) return null;
                return (
                  <div key={p} className="space-y-2">
                    <h4 className={`text-xs font-black uppercase tracking-widest ${pi.color}`}>{pi.label}</h4>
                    {pollData.rankings.slice(0, 5).map(r => (
                      <div key={r.rank} className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-600">
                            {r.rank}
                          </span>
                          <span className="font-bold text-slate-800">{r.team}</span>
                        </span>
                        <span className="text-slate-400 tabular-nums">{r.record}</span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
