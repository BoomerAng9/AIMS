'use client';

/**
 * Arena Leaderboard — Global Rankings
 *
 * ESPN-quality leaderboard with period switching, player tiers,
 * and detailed stats. The crown jewel of competitive engagement.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Crown, Trophy, TrendingUp, Target, Medal, Flame,
  ArrowLeft, ChevronUp, ChevronDown,
} from 'lucide-react';
import type { LeaderboardEntry, ArenaPlayer, LeaderboardPeriod } from '@/lib/arena/types';
import { TIER_CONFIG, formatCurrency } from '@/lib/arena/types';

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

const PERIOD_OPTIONS: { value: LeaderboardPeriod; label: string }[] = [
  { value: 'ALL_TIME', label: 'All Time' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'WEEKLY', label: 'Weekly' },
];

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<LeaderboardPeriod>('ALL_TIME');
  const [entries, setEntries] = useState<(LeaderboardEntry & { player: ArenaPlayer })[]>([]);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/arena/leaderboard?period=${period}`)
      .then(r => r.json())
      .then(data => {
        setEntries(data.entries || []);
        setTotalPlayers(data.totalPlayers || 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [period]);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
      className="max-w-5xl mx-auto px-4 md:px-6 py-8 space-y-8"
    >
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10 border border-gold/20">
            <Crown size={20} className="text-gold" />
          </div>
          <div>
            <h1 className="text-2xl font-display text-white tracking-tight">Leaderboard</h1>
            <p className="text-[0.55rem] font-mono text-white/30 uppercase tracking-widest">
              {totalPlayers} active players
            </p>
          </div>
        </div>
        <Link href="/arena" className="flex items-center gap-2 text-sm text-white/40 hover:text-gold transition-colors">
          <ArrowLeft size={14} />
          <span className="font-mono text-[0.6rem] uppercase tracking-widest">Lobby</span>
        </Link>
      </motion.div>

      {/* Period Tabs */}
      <motion.div variants={fadeUp} className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/5 w-fit">
        {PERIOD_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => setPeriod(opt.value)}
            className={`px-4 py-2 rounded-lg text-[0.6rem] font-mono uppercase tracking-wider transition-all ${
              period === opt.value
                ? 'bg-gold/10 text-gold border border-gold/20'
                : 'text-white/30 hover:text-white/50 hover:bg-white/5'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </motion.div>

      {/* Top 3 Podium */}
      {entries.length >= 3 && (
        <motion.div variants={fadeUp} className="grid grid-cols-3 gap-4">
          {/* 2nd Place */}
          <div className="wireframe-card rounded-2xl p-6 pt-8 flex flex-col items-center text-center mt-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-300/10 border-2 border-zinc-300/20 mb-3">
              <Medal size={24} className="text-zinc-300" />
            </div>
            <span className="text-2xl font-display text-zinc-300">2nd</span>
            <p className="text-sm font-medium text-white mt-2">{entries[1]?.player?.displayName}</p>
            <div className={`mt-2 px-2 py-0.5 rounded-md text-[0.5rem] font-mono ${TIER_CONFIG[entries[1]?.player?.tier]?.bg} ${TIER_CONFIG[entries[1]?.player?.tier]?.color}`}>
              {TIER_CONFIG[entries[1]?.player?.tier]?.label}
            </div>
            <p className="text-lg font-display text-emerald-400 mt-3">{formatCurrency(entries[1]?.earnings || 0)}</p>
            <p className="text-[0.5rem] font-mono text-white/20 uppercase">Earnings</p>
          </div>

          {/* 1st Place */}
          <div className="wireframe-card rounded-2xl p-6 pt-4 flex flex-col items-center text-center border-gold/20 shadow-[0_0_30px_rgba(212,175,55,0.08)]">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gold/10 border-2 border-gold/30 mb-3">
              <Crown size={28} className="text-gold" />
            </div>
            <span className="text-3xl font-display text-gold">1st</span>
            <p className="text-base font-medium text-white mt-2">{entries[0]?.player?.displayName}</p>
            <div className={`mt-2 px-2 py-0.5 rounded-md text-[0.5rem] font-mono ${TIER_CONFIG[entries[0]?.player?.tier]?.bg} ${TIER_CONFIG[entries[0]?.player?.tier]?.color}`}>
              {TIER_CONFIG[entries[0]?.player?.tier]?.label}
            </div>
            <p className="text-xl font-display text-emerald-400 mt-3">{formatCurrency(entries[0]?.earnings || 0)}</p>
            <p className="text-[0.5rem] font-mono text-white/20 uppercase">Earnings</p>
          </div>

          {/* 3rd Place */}
          <div className="wireframe-card rounded-2xl p-6 pt-10 flex flex-col items-center text-center mt-12">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-600/10 border-2 border-amber-600/20 mb-3">
              <Medal size={20} className="text-amber-600" />
            </div>
            <span className="text-xl font-display text-amber-600">3rd</span>
            <p className="text-sm font-medium text-white mt-2">{entries[2]?.player?.displayName}</p>
            <div className={`mt-2 px-2 py-0.5 rounded-md text-[0.5rem] font-mono ${TIER_CONFIG[entries[2]?.player?.tier]?.bg} ${TIER_CONFIG[entries[2]?.player?.tier]?.color}`}>
              {TIER_CONFIG[entries[2]?.player?.tier]?.label}
            </div>
            <p className="text-lg font-display text-emerald-400 mt-3">{formatCurrency(entries[2]?.earnings || 0)}</p>
            <p className="text-[0.5rem] font-mono text-white/20 uppercase">Earnings</p>
          </div>
        </motion.div>
      )}

      {/* Full Table */}
      <motion.div variants={fadeUp} className="wireframe-card rounded-2xl overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-2 px-5 py-3 border-b border-white/[0.06] text-[0.5rem] font-mono uppercase tracking-widest text-white/25">
          <div className="col-span-1 text-center">Rank</div>
          <div className="col-span-3">Player</div>
          <div className="col-span-1 text-center hidden md:block">Tier</div>
          <div className="col-span-1 text-center">Wins</div>
          <div className="col-span-2 text-center hidden md:block">Contests</div>
          <div className="col-span-1 text-center">Acc %</div>
          <div className="col-span-1 text-center hidden md:block">Streak</div>
          <div className="col-span-2 text-right">Earnings</div>
        </div>

        {/* Table Rows */}
        {entries.map((entry, i) => {
          const player = entry.player;
          if (!player) return null;
          const tierConfig = TIER_CONFIG[player.tier];

          return (
            <div
              key={entry.id}
              className={`grid grid-cols-12 gap-2 px-5 py-3.5 items-center transition-colors hover:bg-white/[0.02] ${
                i < entries.length - 1 ? 'border-b border-white/[0.04]' : ''
              }`}
            >
              {/* Rank */}
              <div className="col-span-1 text-center">
                {entry.rank <= 3 ? (
                  <span className={`text-lg font-display ${entry.rank === 1 ? 'text-gold' : entry.rank === 2 ? 'text-zinc-300' : 'text-amber-600'}`}>
                    {entry.rank}
                  </span>
                ) : (
                  <span className="text-sm font-display text-white/30">{entry.rank}</span>
                )}
              </div>

              {/* Player */}
              <div className="col-span-3 flex items-center gap-2">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${tierConfig.bg} ${tierConfig.border} border text-xs font-display ${tierConfig.color}`}>
                  {tierConfig.icon}
                </div>
                <div>
                  <p className="text-sm text-white font-medium">{player.displayName}</p>
                  <p className="text-[0.5rem] font-mono text-white/20">Lvl {player.level}</p>
                </div>
              </div>

              {/* Tier */}
              <div className="col-span-1 text-center hidden md:flex justify-center">
                <span className={`px-2 py-0.5 rounded text-[0.45rem] font-mono ${tierConfig.bg} ${tierConfig.color}`}>
                  {tierConfig.label}
                </span>
              </div>

              {/* Wins */}
              <div className="col-span-1 text-center">
                <span className="text-sm font-display text-gold">{entry.wins}</span>
              </div>

              {/* Contests */}
              <div className="col-span-2 text-center hidden md:block">
                <span className="text-sm font-mono text-white/40">{entry.entries}</span>
              </div>

              {/* Accuracy */}
              <div className="col-span-1 text-center">
                <span className={`text-sm font-display ${entry.accuracy >= 50 ? 'text-emerald-400' : 'text-white/40'}`}>
                  {entry.accuracy.toFixed(1)}%
                </span>
              </div>

              {/* Streak */}
              <div className="col-span-1 text-center hidden md:flex items-center justify-center gap-1">
                {player.streak > 0 ? (
                  <>
                    <Flame size={12} className="text-amber-400" />
                    <span className="text-sm font-display text-amber-400">{player.streak}</span>
                  </>
                ) : (
                  <span className="text-sm text-white/15">—</span>
                )}
              </div>

              {/* Earnings */}
              <div className="col-span-2 text-right">
                <span className="text-sm font-display text-emerald-400">{formatCurrency(entry.earnings)}</span>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="text-center py-12">
            <div className="inline-block h-6 w-6 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
            <p className="text-xs text-white/30 mt-3 font-mono">Loading rankings...</p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
