'use client';

/**
 * Per|Form Big Board — Ranked Prospect List
 *
 * The public-facing ranked list of prospects with P.A.I. grades and tiers.
 * Grade scores and tiers are visible. The formula is never exposed.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Search, Filter, TrendingUp } from 'lucide-react';
import type { Prospect } from '@/lib/perform/types';
import { TIER_STYLES, TREND_STYLES, getProspectSlug, getScoreColor } from '@/lib/perform/types';
import { staggerContainer, staggerItem } from '@/lib/motion/variants';

export default function BigBoardPage() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [posFilter, setPosFilter] = useState<string>('ALL');

  useEffect(() => {
    fetch('/api/perform/prospects')
      .then(res => res.json())
      .then(data => {
        setProspects(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const positions = ['ALL', ...new Set(prospects.map(p => p.position))];

  const filtered = prospects.filter(p => {
    const matchesSearch = !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.school.toLowerCase().includes(search.toLowerCase()) ||
      p.position.toLowerCase().includes(search.toLowerCase());
    const matchesPos = posFilter === 'ALL' || p.position === posFilter;
    return matchesSearch && matchesPos;
  });

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="max-w-6xl mx-auto px-6 py-10 space-y-8"
    >
      {/* Header */}
      <motion.div variants={staggerItem} className="space-y-4">
        <Link
          href="/sandbox/perform"
          className="inline-flex items-center gap-2 text-xs text-white/30 hover:text-gold transition-colors font-mono uppercase tracking-wider"
        >
          <ArrowLeft size={12} />
          Per|Form
        </Link>

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10 border border-gold/20">
            <TrendingUp size={20} className="text-gold" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-display text-white tracking-tight">
              Big Board
            </h1>
            <p className="text-xs text-white/40 font-mono">
              Class of &apos;26 &middot; {prospects.length} Prospects Graded
            </p>
          </div>
        </div>
      </motion.div>

      {/* Search + Filters */}
      <motion.div variants={staggerItem} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
          <input
            type="text"
            placeholder="Search by name, school, or position..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-white placeholder:text-white/20 outline-none focus:border-gold/30 transition-colors"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-white/20" />
          <div className="flex gap-1 overflow-x-auto">
            {positions.map(pos => (
              <button
                key={pos}
                onClick={() => setPosFilter(pos)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors whitespace-nowrap ${
                  posFilter === pos
                    ? 'bg-gold/15 text-gold border border-gold/30'
                    : 'bg-white/[0.03] text-white/40 border border-white/5 hover:text-white/60'
                }`}
              >
                {pos}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Rankings Table */}
      {loading ? (
        <div className="text-center py-20">
          <div className="inline-block h-6 w-6 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
          <p className="text-xs text-white/30 mt-3 font-mono">Loading prospects...</p>
        </div>
      ) : (
        <motion.div variants={staggerItem} className="wireframe-card rounded-2xl overflow-hidden">
          {/* Table Header */}
          <div className="hidden md:grid grid-cols-[60px_1fr_80px_80px_100px_80px_100px_80px] gap-2 px-5 py-3 border-b border-white/5 text-[0.6rem] font-mono uppercase tracking-widest text-white/25">
            <span>Rank</span>
            <span>Prospect</span>
            <span className="text-center">P.A.I.</span>
            <span className="text-center">Tier</span>
            <span className="text-center">Trend</span>
            <span className="text-center">Pos</span>
            <span className="text-center">NIL Est.</span>
            <span className="text-center">State</span>
          </div>

          {/* Rows */}
          {filtered.map((prospect, i) => {
            const tierStyle = TIER_STYLES[prospect.tier];
            const trendStyle = TREND_STYLES[prospect.trend];

            return (
              <Link
                key={prospect.id}
                href={`/sandbox/perform/prospects/${getProspectSlug(prospect)}`}
                className={`grid grid-cols-1 md:grid-cols-[60px_1fr_80px_80px_100px_80px_100px_80px] gap-2 px-5 py-4 items-center hover:bg-white/[0.02] transition-colors ${
                  i < filtered.length - 1 ? 'border-b border-white/[0.04]' : ''
                }`}
              >
                {/* Rank */}
                <div className="text-lg font-display text-white/60 md:text-center">
                  <span className="md:hidden text-[0.55rem] font-mono text-white/25 uppercase mr-2">Rank</span>
                  #{prospect.nationalRank}
                </div>

                {/* Prospect Info */}
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-xl ${tierStyle.bg} border ${tierStyle.border} flex items-center justify-center text-xs font-display ${tierStyle.text}`}>
                    {prospect.position}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{prospect.name}</p>
                    <p className="text-[0.6rem] text-white/30 font-mono">
                      {prospect.school}, {prospect.state} &middot; {prospect.classYear}
                    </p>
                  </div>
                </div>

                {/* P.A.I. Score */}
                <div className="text-center">
                  <span className="md:hidden text-[0.55rem] font-mono text-white/25 uppercase mr-2">P.A.I.</span>
                  <span className={`text-xl font-display ${getScoreColor(prospect.paiScore)}`}>
                    {prospect.paiScore}
                  </span>
                </div>

                {/* Tier Badge */}
                <div className="text-center">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[0.5rem] font-mono uppercase border ${tierStyle.bg} ${tierStyle.border} ${tierStyle.text}`}>
                    {tierStyle.label}
                  </span>
                </div>

                {/* Trend */}
                <div className="text-center">
                  <span className={`text-xs ${trendStyle.color}`}>
                    {trendStyle.icon}
                    {prospect.previousRank && prospect.trend !== 'STEADY' && prospect.trend !== 'NEW' && (
                      <span className="ml-1 text-[0.55rem] font-mono">
                        {prospect.trend === 'UP' ? '+' : ''}{(prospect.previousRank || 0) - prospect.nationalRank}
                      </span>
                    )}
                  </span>
                </div>

                {/* Position */}
                <div className="text-center text-xs text-white/50 font-mono">{prospect.position}</div>

                {/* NIL */}
                <div className="text-center text-xs text-gold/70 font-mono">{prospect.nilEstimate}</div>

                {/* State */}
                <div className="text-center text-xs text-white/30 font-mono">{prospect.state}</div>
              </Link>
            );
          })}

          {filtered.length === 0 && (
            <div className="text-center py-12 text-white/20 text-sm">
              No prospects match your search.
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
