'use client';

/**
 * Per|Form Big Board — Ranked Prospect List
 *
 * The public-facing ranked list of prospects with P.A.I. grades and tiers.
 * Styled accurately to the approved "AGI Engine" dark mode design.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Search, Download, Settings, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import type { Prospect } from '@/lib/perform/types';
import { TIER_STYLES, getProspectSlug } from '@/lib/perform/types';
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

  // Standard predefined positions matching the design
  const positions = ['ALL', 'QB', 'RB', 'WR', 'OT', 'EDGE', 'DL', 'LB', 'CB', 'S'];

  const filtered = prospects.filter(p => {
    const matchesSearch = !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.school.toLowerCase().includes(search.toLowerCase()) ||
      p.position.toLowerCase().includes(search.toLowerCase());

    // DL captures DT as well, for simplicity we just match exact or handle DL
    const matchesPos = posFilter === 'ALL' ||
      p.position === posFilter ||
      (posFilter === 'DL' && (p.position === 'DT' || p.position === 'DL')) ||
      (posFilter === 'OT' && (p.position === 'OT' || p.position === 'OG' || p.position === 'C'));

    return matchesSearch && matchesPos;
  }).sort((a, b) => a.nationalRank - b.nationalRank);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-gold/30">
      {/* Top Nav (simplified version of the design's nav) */}
      <nav className="border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/sandbox/perform" className="text-xl font-display font-black tracking-tight flex items-center gap-1">
              PER<span className="text-gold">|</span>FORM
            </Link>
            <div className="hidden md:flex items-center gap-6 text-xs font-mono font-semibold tracking-wider">
              <Link href="/sandbox/perform/big-board" className="text-gold border-b-2 border-gold pb-1">BIG BOARD</Link>
              <Link href="/sandbox/perform/content" className="text-white/50 hover:text-white transition-colors">PROSPECTS</Link>
              <Link href="#" className="text-white/50 hover:text-white transition-colors">ANALYTICS</Link>
              <Link href="#" className="text-white/50 hover:text-white transition-colors">TEAMS</Link>
              <Link href="/sandbox/perform/draft" className="text-white/50 hover:text-white transition-colors">MOCK DRAFT</Link>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-4 text-[0.6rem] font-mono tracking-widest text-gold/50">
            POWERED BY AGI — A.I.M.S. HIGH-LEVEL ANALYSIS
          </div>
        </div>
      </nav>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="max-w-[1400px] mx-auto px-6 py-12 space-y-8"
      >
        {/* Header Section */}
        <motion.div variants={staggerItem} className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4 max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-display font-black tracking-tighter uppercase text-white">
              2026 NFL DRAFT <span className="text-gold">BIG BOARD</span>
            </h1>
            <p className="text-sm text-white/50 leading-relaxed font-sans max-w-xl">
              Comprehensive performance artificial intelligence scouting for the 2026 class.
              Metrics calibrated for professional-grade evaluation.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2.5 bg-gold/10 hover:bg-gold/20 border border-gold/30 rounded-lg text-gold text-xs font-mono uppercase tracking-wider transition-colors">
              <Download size={14} /> Export Data
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/70 text-xs font-mono uppercase tracking-wider transition-colors">
              <Settings size={14} /> Custom Weights
            </button>
          </div>
        </motion.div>

        {/* Search & Filters */}
        <motion.div variants={staggerItem} className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative w-full md:w-80">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              placeholder="Search players, schools, or confer..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-full bg-white/[0.03] border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-gold/50 transition-colors"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto w-full pb-2 md:pb-0 hide-scrollbar">
            {positions.map(pos => (
              <button
                key={pos}
                onClick={() => setPosFilter(pos)}
                className={`px-5 py-2.5 rounded-full text-xs font-mono font-semibold tracking-wider transition-all whitespace-nowrap ${posFilter === pos
                    ? 'bg-gold text-black shadow-[0_0_15px_rgba(212,175,55,0.3)]'
                    : 'bg-white/[0.03] text-white/50 border border-white/5 hover:text-white border-transparent hover:border-white/10'
                  }`}
              >
                {pos}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Big Board Table */}
        <motion.div variants={staggerItem} className="bg-[#0f0f0f] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
          {/* Table Header */}
          <div className="hidden md:grid grid-cols-[80px_2fr_100px_1fr_1fr_120px_100px_100px_40px] gap-4 px-6 py-4 border-b border-white/5 text-[0.6rem] font-mono font-bold uppercase tracking-widest text-white/30 bg-white/[0.01]">
            <span>Rank</span>
            <span>Player Name</span>
            <span className="text-center">Pos</span>
            <span>School</span>
            <span>Conf</span>
            <span className="text-center text-gold/70">P.A.I. Score</span>
            <span className="text-center">Tier</span>
            <span className="text-center">Trend</span>
            <span></span>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-white/[0.02]">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <div className="h-8 w-8 rounded-full border-2 border-gold/20 border-t-gold animate-spin" />
                <span className="text-xs font-mono text-white/30 tracking-widest uppercase">Connecting to AGI...</span>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-24 text-white/30 text-sm font-mono">No prospects found.</div>
            ) : (
              filtered.map((prospect, index) => {
                const isPrime = prospect.tier === 'TOP_5' || prospect.paiScore >= 100;
                const isElite = prospect.tier === 'TOP_15' && !isPrime;

                // Color codes for positions
                const posColors: Record<string, string> = {
                  QB: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
                  EDGE: 'bg-red-500/20 text-red-400 border-red-500/30',
                  OT: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
                  S: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
                  WR: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
                  CB: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
                };
                const posStyle = posColors[prospect.position] || 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';

                return (
                  <Link
                    key={prospect.id}
                    href={`/sandbox/perform/prospects/${getProspectSlug(prospect)}`}
                    className={`group grid grid-cols-1 md:grid-cols-[80px_2fr_100px_1fr_1fr_120px_100px_100px_40px] gap-4 px-6 py-5 items-center hover:bg-white/[0.02] transition-all relative ${isPrime ? 'bg-gold/[0.02]' : ''
                      }`}
                  >
                    {/* Glow effect for prime */}
                    {isPrime && (
                      <div className="absolute inset-y-0 left-0 w-[2px] bg-gold shadow-[0_0_10px_rgba(212,175,55,0.8)]" />
                    )}

                    {/* Rank */}
                    <div className={`text-2xl font-display font-light ${isPrime ? 'text-gold' : 'text-white/40'}`}>
                      {String(index + 1).padStart(2, '0')}
                    </div>

                    {/* Player */}
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-zinc-800 rounded-md overflow-hidden relative border border-white/10 shrink-0 flex items-center justify-center">
                        <span className="text-white/20 text-xs font-display">{prospect.firstName[0]}{prospect.lastName[0]}</span>
                      </div>
                      <div>
                        <div className="text-base text-white font-semibold flex items-center gap-2">
                          {prospect.name}
                        </div>
                        <div className="text-[0.6rem] text-white/40 font-mono tracking-wider uppercase mt-1">
                          {prospect.classYear} &middot; {prospect.height || '--'} &middot; {prospect.weight ? `${prospect.weight} LBS` : '--'}
                        </div>
                      </div>
                    </div>

                    {/* Position */}
                    <div className="flex md:justify-center">
                      <div className={`px-2 py-0.5 rounded text-[0.65rem] font-black font-display font-mono border ${posStyle}`}>
                        {prospect.position}
                      </div>
                    </div>

                    {/* School */}
                    <div className="text-sm text-white/80 font-medium">
                      {prospect.school}
                    </div>

                    {/* Conference (Assuming state maps to Conf in old data, or using static for now) */}
                    <div className="text-xs text-white/40 font-mono uppercase tracking-wider">
                      {prospect.state || 'CONF'}
                    </div>

                    {/* P.A.I. */}
                    <div className={`text-2xl font-display font-black md:text-center ${isPrime ? 'text-gold drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]' : 'text-white/90'}`}>
                      {prospect.paiScore.toFixed(1)}
                    </div>

                    {/* Tier */}
                    <div className="md:text-center">
                      <span className={`inline-block px-3 py-1 text-[0.6rem] font-bold font-mono tracking-widest uppercase border rounded ${isPrime
                          ? 'bg-gold/10 text-gold border-gold/30'
                          : isElite
                            ? 'bg-white/5 text-white/70 border-white/10'
                            : 'bg-transparent text-white/40 border-transparent'
                        }`}>
                        {isPrime ? 'PRIME' : isElite ? 'ELITE' : 'HIGH'}
                      </span>
                    </div>

                    {/* Trend */}
                    <div className="md:text-center flex items-center md:justify-center">
                      {index % 3 === 0 ? (
                        <TrendingUp size={16} className="text-emerald-400" />
                      ) : index % 4 === 0 ? (
                        <TrendingUp size={16} className="text-red-400 rotate-180" />
                      ) : (
                        <span className="text-white/20">—</span>
                      )}
                    </div>

                    {/* Action */}
                    <div className="flex justify-end">
                      <div className="h-6 w-6 rounded-full bg-white/5 group-hover:bg-gold/20 flex items-center justify-center text-white/30 group-hover:text-gold transition-colors">
                        <ArrowLeft size={12} className="rotate-180" />
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>

          {/* Pagination Footer */}
          <div className="bg-[#0a0a0a] border-t border-white/5 p-4 flex items-center justify-between">
            <div className="text-[0.65rem] text-white/40 font-mono uppercase tracking-widest">
              Showing <span className="text-white">1-{Math.min(filtered.length, 50)}</span> of <span className="text-white">{filtered.length}</span> tracked prospects
            </div>
            <div className="flex gap-1">
              <button className="h-8 w-8 flex items-center justify-center bg-white/5 border border-white/10 rounded text-white/30 hover:bg-white/10 transition-colors"><ChevronLeft size={14} /></button>
              <button className="h-8 w-8 flex items-center justify-center bg-gold text-black font-mono text-xs font-bold rounded">1</button>
              <button className="h-8 w-8 flex items-center justify-center bg-white/5 border border-white/10 rounded text-white/50 hover:bg-white/10 font-mono text-xs transition-colors">2</button>
              <button className="h-8 w-8 flex items-center justify-center bg-white/5 border border-white/10 rounded text-white/50 hover:bg-white/10 font-mono text-xs transition-colors">3</button>
              <button className="h-8 w-8 flex items-center justify-center bg-white/5 border border-white/10 rounded text-white/30 hover:bg-white/10 transition-colors"><ChevronRight size={14} /></button>
            </div>
          </div>
        </motion.div>

        {/* Dashboard Widgets Row */}
        <motion.div variants={staggerItem} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-[#0f0f0f] border border-white/5 rounded-xl p-6 relative overflow-hidden">
            <h3 className="text-[0.65rem] font-bold font-mono text-gold uppercase tracking-widest mb-4">P.A.I. Scoring Guide</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-white/50">95 - 100+</span>
                <span className="text-gold font-bold italic">PRIME (Day 1 Immediate)</span>
              </div>
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-white/50">90 - 94</span>
                <span className="text-white/80 font-bold italic">ELITE (Year 1 Starter)</span>
              </div>
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-white/50">80 - 89</span>
                <span className="text-white/60 font-bold italic">HIGH (High Upside)</span>
              </div>
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-white/50">70 - 79</span>
                <span className="text-white/40 font-bold italic">CHOICE (Rotational)</span>
              </div>
            </div>
          </div>

          <div className="bg-[#0f0f0f] border border-gold/10 rounded-xl p-6 relative flex flex-col justify-center">
            <div className="absolute inset-0 bg-gold/5 opacity-50 pointer-events-none" />
            <div className="flex items-start gap-4 mb-4">
              <div className="h-10 w-10 rounded bg-gold/20 border border-gold/30 flex items-center justify-center shrink-0">
                <div className="h-4 w-4 border-[2px] border-gold border-b-transparent rounded-full animate-spin" />
              </div>
              <div>
                <h3 className="text-sm text-white font-bold font-display">AGI Engine v4.2</h3>
                <p className="text-[0.6rem] text-white/40 font-mono uppercase tracking-widest">Active Processing</p>
              </div>
            </div>
            <p className="text-xs text-white/50 italic leading-relaxed">
              &quot;Performance Artificial Intelligence scores are generated using thousands of data points including EPA+, positional leverage, and athletic profiles. Filtered through AGI matrices.&quot;
            </p>
          </div>

          <div className="bg-[#0f0f0f] border border-white/5 rounded-xl p-6 flex flex-col items-center justify-center text-center">
            <h3 className="text-[0.65rem] font-bold font-mono text-white/30 uppercase tracking-widest mb-2">Platform Stability</h3>
            <div className="text-4xl font-display font-black text-emerald-400 mb-1">99.9%</div>
            <div className="flex items-center gap-1.5 text-[0.6rem] text-emerald-400/50 font-mono uppercase tracking-widest">
              <CheckCircle2 size={10} /> Real-Time Data Sync
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <footer className="border-t border-white/5 pt-8 pb-4 flex flex-col md:flex-row items-center justify-between gap-4 text-[0.65rem] text-white/30 font-mono uppercase tracking-widest">
          <div>&copy; 2026 PER|FORM ANALYTICS. ALL RIGHTS RESERVED.</div>
          <div className="flex items-center gap-6">
            <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link href="#" className="hover:text-white transition-colors">Contact A.I.M.S.</Link>
          </div>
        </footer>
      </motion.div>
    </div>
  );
}
