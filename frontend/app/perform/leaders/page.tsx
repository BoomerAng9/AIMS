'use client';

/**
 * Per|Form — Stats Leaders
 *
 * Statistical leaderboards for the 2025 CFB season.
 * Passing, rushing, receiving, tackles, sacks, interceptions.
 * Light theme per AIMS design system.
 */

import { useState, useEffect, useMemo } from 'react';
import {
  BarChart3, TrendingUp, Filter, Award,
  Zap, Shield, Target, ChevronDown, Star,
} from 'lucide-react';

interface StatLeader {
  playerName: string;
  team: string;
  position: string;
  conference: string;
  statValue: number;
  statLabel: string;
  gamesPlayed: number;
  perGame?: number;
  classYear: string;
}

interface StatCategory {
  id: string;
  label: string;
  unit: string;
  leaders: StatLeader[];
}

const CATEGORY_ICONS: Record<string, { icon: typeof BarChart3; color: string; bg: string }> = {
  'passing-yards': { icon: Target, color: 'text-blue-700', bg: 'bg-blue-50' },
  'passing-touchdowns': { icon: Zap, color: 'text-blue-700', bg: 'bg-blue-50' },
  'rushing-yards': { icon: TrendingUp, color: 'text-emerald-700', bg: 'bg-emerald-50' },
  'receiving-yards': { icon: Award, color: 'text-amber-700', bg: 'bg-amber-50' },
  'receiving-touchdowns': { icon: Star, color: 'text-amber-700', bg: 'bg-amber-50' },
  'total-tackles': { icon: Shield, color: 'text-red-700', bg: 'bg-red-50' },
  'sacks': { icon: Shield, color: 'text-red-700', bg: 'bg-red-50' },
  'interceptions': { icon: Shield, color: 'text-purple-700', bg: 'bg-purple-50' },
};

const CONFERENCES_LIST = ['Big Ten', 'SEC', 'ACC', 'Big 12', 'MWC', 'AAC', 'Independent', 'MAC'];
const POSITIONS_LIST = ['QB', 'RB', 'WR', 'TE', 'EDGE', 'DT', 'DL', 'LB', 'CB', 'S'];

function LeaderCard({ category }: { category: StatCategory }) {
  const catStyle = CATEGORY_ICONS[category.id] || { icon: BarChart3, color: 'text-slate-700', bg: 'bg-slate-50' };
  const Icon = catStyle.icon;
  const top3 = category.leaders.slice(0, 3);
  const rest = category.leaders.slice(3);

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-all">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
        <div className={`rounded-lg p-1.5 ${catStyle.bg}`}>
          <Icon className={`w-4 h-4 ${catStyle.color}`} />
        </div>
        <div>
          <h3 className="font-black text-sm uppercase tracking-widest text-slate-800">{category.label}</h3>
          <p className="text-[10px] text-slate-400 uppercase tracking-wider">{category.unit}</p>
        </div>
      </div>

      {/* Top 3 Podium */}
      <div className="p-4 space-y-3">
        {top3.map((leader, i) => (
          <div key={leader.playerName} className={`flex items-center gap-3 ${i === 0 ? 'pb-3 border-b border-slate-100' : ''}`}>
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
              i === 0 ? 'bg-emerald-800 text-white' :
              i === 1 ? 'bg-slate-200 text-slate-700' :
              'bg-amber-100 text-amber-800'
            }`}>
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`font-black text-sm text-slate-900 ${i === 0 ? 'text-base' : ''}`}>
                  {leader.playerName}
                </span>
                <span className="text-[10px] font-bold text-slate-400">
                  {leader.classYear}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-slate-500">
                <span className="font-bold">{leader.team}</span>
                <span>·</span>
                <span>{leader.position}</span>
                <span>·</span>
                <span>{leader.conference}</span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className={`font-black tabular-nums ${i === 0 ? 'text-lg text-emerald-700' : 'text-sm text-slate-700'}`}>
                {typeof leader.statValue === 'number' && leader.statValue % 1 !== 0
                  ? leader.statValue.toFixed(1)
                  : leader.statValue.toLocaleString()}
              </p>
              {leader.perGame && (
                <p className="text-[10px] text-slate-400 tabular-nums">{leader.perGame.toFixed(1)}/game</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Rest of list */}
      {rest.length > 0 && (
        <div className="border-t border-slate-100">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <tbody>
                {rest.map((leader, i) => (
                  <tr key={leader.playerName} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="pl-4 pr-2 py-2 text-center text-slate-400 font-bold w-8">
                      {i + 4}
                    </td>
                    <td className="px-2 py-2 font-bold text-slate-700">{leader.playerName}</td>
                    <td className="px-2 py-2 text-slate-500">{leader.team}</td>
                    <td className="px-2 py-2 text-slate-400 hidden sm:table-cell">{leader.position}</td>
                    <td className="px-2 py-2 text-right font-bold text-slate-700 tabular-nums pr-4">
                      {typeof leader.statValue === 'number' && leader.statValue % 1 !== 0
                        ? leader.statValue.toFixed(1)
                        : leader.statValue.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LeadersPage() {
  const [categories, setCategories] = useState<StatCategory[]>([]);
  const [allCategories, setAllCategories] = useState<{ id: string; label: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedConf, setSelectedConf] = useState('');
  const [selectedPos, setSelectedPos] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const params = new URLSearchParams();
        if (selectedCategory) params.set('category', selectedCategory);
        if (selectedConf) params.set('conference', selectedConf);
        if (selectedPos) params.set('position', selectedPos);

        const res = await fetch(`/api/perform/leaders?${params}`);
        const data = await res.json();
        setCategories(data.categories || []);
        if (data.availableCategories) setAllCategories(data.availableCategories);
      } catch (err) {
        console.error('[Leaders] Failed to load:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [selectedCategory, selectedConf, selectedPos]);

  // Top performer across all categories
  const topPerformer = useMemo(() => {
    if (categories.length === 0) return null;
    // Find highest passing yards leader as the headline
    const passing = categories.find(c => c.id === 'passing-yards');
    return passing?.leaders[0] || categories[0]?.leaders[0] || null;
  }, [categories]);

  return (
    <div className="min-h-screen">
      {/* ── Hero Strip ─────────────────────────────────────────── */}
      <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="w-6 h-6 text-emerald-600" />
            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-slate-900">
              Stats Leaders
            </h1>
          </div>
          <p className="text-sm text-slate-500 max-w-xl">
            2025 CFB Season — Statistical leaderboards across all major categories.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-6 space-y-6">
        {/* ── Filters ────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="text-xs font-bold border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300"
          >
            <option value="">All Categories</option>
            {allCategories.map(c => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>

          <select
            value={selectedConf}
            onChange={e => setSelectedConf(e.target.value)}
            className="text-xs font-bold border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300"
          >
            <option value="">All Conferences</option>
            {CONFERENCES_LIST.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={selectedPos}
            onChange={e => setSelectedPos(e.target.value)}
            className="text-xs font-bold border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300"
          >
            <option value="">All Positions</option>
            {POSITIONS_LIST.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          {(selectedCategory || selectedConf || selectedPos) && (
            <button
              onClick={() => { setSelectedCategory(''); setSelectedConf(''); setSelectedPos(''); }}
              className="text-xs font-bold text-red-500 hover:text-red-700 px-2 py-2"
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* ── Headline Performer ─────────────────────────── */}
        {topPerformer && !selectedCategory && !selectedConf && !selectedPos && (
          <div className="rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50/50 to-white p-6 flex items-center gap-6">
            <div className="w-14 h-14 rounded-full bg-emerald-800 flex items-center justify-center text-white font-black text-lg shrink-0">
              #1
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 mb-1">
                Season Leader — Passing Yards
              </p>
              <p className="text-xl font-black text-slate-900">{topPerformer.playerName}</p>
              <p className="text-xs text-slate-500">
                {topPerformer.team} · {topPerformer.position} · {topPerformer.conference} · {topPerformer.classYear}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-3xl font-black text-emerald-700 tabular-nums">
                {topPerformer.statValue.toLocaleString()}
              </p>
              <p className="text-xs text-slate-400">
                {topPerformer.gamesPlayed} games · {topPerformer.perGame?.toFixed(1)}/game
              </p>
            </div>
          </div>
        )}

        {/* ── Leaderboard Cards ──────────────────────────── */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : categories.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {categories.map(cat => (
              <LeaderCard key={cat.id} category={cat} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-slate-400">
            <BarChart3 className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-bold">No leaders data matching filters</p>
            <p className="text-xs mt-1">Try adjusting your filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
