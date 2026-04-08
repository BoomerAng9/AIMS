'use client';

/**
 * Per|Form Big Board — Ranked Prospect List
 *
 * The public-facing ranked list of prospects with P.A.I. grades and tiers.
 * Styled accurately to the approved "AGI Engine" dark mode design.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Download, Settings, ChevronLeft, ChevronRight, CheckCircle2, TrendingUp, ArrowLeft, Radio, Eye, EyeOff } from 'lucide-react';
import type { Prospect } from '@/lib/perform/types';
import { TIER_STYLES, getProspectSlug } from '@/lib/perform/types';
import { staggerContainer, staggerItem } from '@/lib/motion/variants';
import { BigBoardSet } from '@/components/perform/broadcast/shows/BigBoardSet';
import { NetworkBug } from '@/components/perform/broadcast/graphics';
import type { BroadcastSegment } from '@/components/perform/broadcast/engine';

export default function BigBoardPage() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [posFilter, setPosFilter] = useState<string>('ALL');
  const [showBroadcastSpotlight, setShowBroadcastSpotlight] = useState(false);

  // A synthetic segment for BigBoardSet to render in standalone preview mode
  const bigBoardSegment: BroadcastSegment = {
    id: 'big-board-spotlight',
    type: 'BIG_BOARD',
    title: 'Top Prospects',
    durationSeconds: 30,
    host: 'ACHEEVY',
    topic: `Breaking down the consensus Top 5 entering the ${new Date().getFullYear()} Draft`,
  };

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
    <div className="min-h-screen bg-white text-slate-800 selection:bg-gold/30">
      {/* Top Nav (simplified version of the design's nav) */}
      <nav className="border-b border-slate-100 bg-white/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/sandbox/perform" className="text-xl font-display font-black tracking-tight flex items-center gap-1">
              PER<span className="text-gold">|</span>FORM
            </Link>
            <div className="hidden md:flex items-center gap-6 text-xs font-mono font-semibold tracking-wider">
              <Link href="/sandbox/perform/big-board" className="text-gold border-b-2 border-gold pb-1">BIG BOARD</Link>
              <Link href="/sandbox/perform/content" className="text-slate-500 hover:text-slate-800 transition-colors">PROSPECTS</Link>
              <Link href="#" className="text-slate-500 hover:text-slate-800 transition-colors">ANALYTICS</Link>
              <Link href="#" className="text-slate-500 hover:text-slate-800 transition-colors">TEAMS</Link>
              <Link href="/sandbox/perform/draft" className="text-slate-500 hover:text-slate-800 transition-colors">MOCK DRAFT</Link>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={() => setShowBroadcastSpotlight(!showBroadcastSpotlight)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[0.6rem] font-bold tracking-[0.2em] uppercase transition-all ${showBroadcastSpotlight
                  ? 'bg-red-600/10 text-red-500 border-red-500/40 hover:bg-red-600/20'
                  : 'bg-gold/10 text-gold border-gold/30 hover:bg-gold/20'
                }`}
            >
              <Radio size={12} className={showBroadcastSpotlight ? 'animate-pulse text-red-500' : 'text-gold'} />
              {showBroadcastSpotlight ? 'Hide Spotlight' : 'Top 5 Spotlight'}
            </button>
            <span className="text-[0.6rem] font-mono tracking-widest text-gold/50">
              POWERED BY AGI — A.I.M.S. HIGH-LEVEL ANALYSIS
            </span>
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
            <h1 className="text-4xl md:text-5xl font-display font-black tracking-tighter uppercase text-slate-800">
              2026 NFL DRAFT <span className="text-gold">BIG BOARD</span>
            </h1>
            <p className="text-sm text-slate-500 leading-relaxed font-sans max-w-xl">
              Comprehensive performance artificial intelligence scouting for the 2026 class.
              Metrics calibrated for professional-grade evaluation.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowBroadcastSpotlight(!showBroadcastSpotlight)}
              className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg text-xs font-mono uppercase tracking-wider transition-all ${showBroadcastSpotlight
                  ? 'bg-red-500/10 text-red-500 border-red-500/30 hover:bg-red-500/20'
                  : 'bg-gold/10 text-gold border-gold/30 hover:bg-gold/20'
                }`}
            >
              {showBroadcastSpotlight ? <EyeOff size={14} /> : <Radio size={14} />}
              {showBroadcastSpotlight ? 'Exit Spotlight' : 'Broadcast Spotlight'}
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-gold/10 hover:bg-gold/20 border border-gold/30 rounded-lg text-gold text-xs font-mono uppercase tracking-wider transition-colors">
              <Download size={14} /> Export Data
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-600 text-xs font-mono uppercase tracking-wider transition-colors">
              <Settings size={14} /> Custom Weights
            </button>
          </div>
        </motion.div>

        {/* Broadcast Spotlight — BigBoardSet Preview */}
        <AnimatePresence>
          {showBroadcastSpotlight && (
            <motion.div
              variants={staggerItem}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div className="relative bg-white border border-gold/20 rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(218,165,32,0.08)]">
                {/* Network Bug overlay */}
                <div className="absolute top-4 right-4 z-20 scale-75 origin-top-right pointer-events-none">
                  <NetworkBug />
                </div>

                {/* Broadcast header bar */}
                <div className="flex items-center gap-2 px-5 py-2.5 bg-[#F8FAFC] border-b border-slate-100">
                  <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-[0.55rem] font-mono uppercase tracking-[0.25em] text-gold font-bold">Broadcast Preview</span>
                  <span className="text-[0.55rem] font-mono uppercase tracking-[0.2em] text-slate-400 ml-auto">Top 5 Spotlight</span>
                </div>

                {/* BigBoardSet in a contained preview */}
                <div className="h-[500px] bg-white">
                  <BigBoardSet segment={bigBoardSegment} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search & Filters */}
        <motion.div variants={staggerItem} className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative w-full md:w-80">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search players, schools, or confer..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-full bg-white border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-gold/50 transition-colors"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto w-full pb-2 md:pb-0 hide-scrollbar">
            {positions.map(pos => (
              <button
                key={pos}
                onClick={() => setPosFilter(pos)}
                className={`px-5 py-2.5 rounded-full text-xs font-mono font-semibold tracking-wider transition-all whitespace-nowrap ${posFilter === pos
                  ? 'bg-gold text-black shadow-[0_0_15px_rgba(212,175,55,0.3)]'
                  : 'bg-white text-slate-500 border border-slate-100 hover:text-slate-800 border-transparent hover:border-slate-200'
                  }`}
              >
                {pos}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Big Board Table */}
        <motion.div variants={staggerItem} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          {/* Table Header */}
          <div className="hidden md:grid grid-cols-[80px_2fr_100px_1fr_1fr_120px_100px_100px_40px] gap-4 px-6 py-4 border-b border-slate-100 text-[0.6rem] font-mono font-bold uppercase tracking-widest text-slate-400 bg-white">
            <span>Rank</span>
            <span>Player Name</span>
            <span className="text-center">Pos</span>
            <span>School</span>
            <span>Conf</span>
            <span className="text-center text-gold/70">AGI Score</span>
            <span className="text-center">Tier</span>
            <span className="text-center">Trend</span>
            <span></span>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-slate-200">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <div className="h-8 w-8 rounded-full border-2 border-gold/20 border-t-gold animate-spin" />
                <span className="text-xs font-mono text-slate-400 tracking-widest uppercase">Connecting to AGI...</span>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-24 text-slate-400 text-sm font-mono">No prospects found.</div>
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
                  WR: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
                  CB: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
                };
                const posStyle = posColors[prospect.position] || 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';

                return (
                  <Link
                    key={prospect.id}
                    href={`/sandbox/perform/prospects/${getProspectSlug(prospect)}`}
                    className={`group grid grid-cols-1 md:grid-cols-[80px_2fr_100px_1fr_1fr_120px_100px_100px_40px] gap-4 px-6 py-5 items-center hover:bg-white transition-all relative ${isPrime ? 'bg-gold/[0.02]' : ''
                      }`}
                  >
                    {/* Glow effect for prime */}
                    {isPrime && (
                      <div className="absolute inset-y-0 left-0 w-[2px] bg-gold shadow-[0_0_10px_rgba(212,175,55,0.8)]" />
                    )}

                    {/* Rank */}
                    <div className={`text-2xl font-display font-light ${isPrime ? 'text-gold' : 'text-slate-400'}`}>
                      {String(index + 1).padStart(2, '0')}
                    </div>

                    {/* Player */}
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-slate-100 rounded-md overflow-hidden relative border border-slate-200 shrink-0 flex items-center justify-center">
                        <span className="text-slate-500 text-xs font-display">{prospect.firstName[0]}{prospect.lastName[0]}</span>
                      </div>
                      <div>
                        <div className="text-base text-slate-800 font-semibold flex items-center gap-2">
                          {prospect.name}
                        </div>
                        <div className="text-[0.6rem] text-slate-400 font-mono tracking-wider uppercase mt-1">
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
                    <div className="text-sm text-slate-700 font-medium">
                      {prospect.school}
                    </div>

                    {/* Conference (Assuming state maps to Conf in old data, or using static for now) */}
                    <div className="text-xs text-slate-400 font-mono uppercase tracking-wider">
                      {prospect.state || 'CONF'}
                    </div>

                    {/* AGI */}
                    <div className={`text-2xl font-display font-black md:text-center ${isPrime ? 'text-gold drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]' : 'text-slate-800'}`}>
                      {prospect.paiScore.toFixed(1)}
                    </div>

                    {/* Tier */}
                    <div className="md:text-center">
                      <span className={`inline-block px-3 py-1 text-[0.6rem] font-bold font-mono tracking-widest uppercase border rounded ${isPrime
                        ? 'bg-gold/10 text-gold border-gold/30'
                        : isElite
                          ? 'bg-slate-50 text-slate-600 border-slate-200'
                          : 'bg-transparent text-slate-400 border-transparent'
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
                        <span className="text-slate-300">—</span>
                      )}
                    </div>

                    {/* Action */}
                    <div className="flex justify-end">
                      <div className="h-6 w-6 rounded-full bg-slate-50 group-hover:bg-gold/20 flex items-center justify-center text-slate-400 group-hover:text-gold transition-colors">
                        <ArrowLeft size={12} className="rotate-180" />
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>

          {/* Pagination Footer */}
          <div className="bg-white border-t border-slate-100 p-4 flex items-center justify-between">
            <div className="text-[0.65rem] text-slate-400 font-mono uppercase tracking-widest">
              Showing <span className="text-slate-800">1-{Math.min(filtered.length, 50)}</span> of <span className="text-slate-800">{filtered.length}</span> tracked prospects
            </div>
            <div className="flex gap-1">
              <button className="h-8 w-8 flex items-center justify-center bg-slate-50 border border-slate-200 rounded text-slate-400 hover:bg-slate-100 transition-colors"><ChevronLeft size={14} /></button>
              <button className="h-8 w-8 flex items-center justify-center bg-gold text-black font-mono text-xs font-bold rounded">1</button>
              <button className="h-8 w-8 flex items-center justify-center bg-slate-50 border border-slate-200 rounded text-slate-500 hover:bg-slate-100 font-mono text-xs transition-colors">2</button>
              <button className="h-8 w-8 flex items-center justify-center bg-slate-50 border border-slate-200 rounded text-slate-500 hover:bg-slate-100 font-mono text-xs transition-colors">3</button>
              <button className="h-8 w-8 flex items-center justify-center bg-slate-50 border border-slate-200 rounded text-slate-400 hover:bg-slate-100 transition-colors"><ChevronRight size={14} /></button>
            </div>
          </div>
        </motion.div>

        {/* Dashboard Widgets Row */}
        <motion.div variants={staggerItem} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 relative overflow-hidden">
            <h3 className="text-[0.65rem] font-bold font-mono text-gold uppercase tracking-widest mb-4">AGI Scoring Guide</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-slate-500">95 - 100+</span>
                <span className="text-gold font-bold italic">PRIME (Day 1 Immediate)</span>
              </div>
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-slate-500">90 - 94</span>
                <span className="text-slate-700 font-bold italic">ELITE (Year 1 Starter)</span>
              </div>
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-slate-500">80 - 89</span>
                <span className="text-slate-500 font-bold italic">HIGH (High Upside)</span>
              </div>
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-slate-500">70 - 79</span>
                <span className="text-slate-400 font-bold italic">CHOICE (Rotational)</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gold/10 rounded-xl p-6 relative flex flex-col justify-center">
            <div className="absolute inset-0 bg-gold/5 opacity-50 pointer-events-none" />
            <div className="flex items-start gap-4 mb-4">
              <div className="h-10 w-10 rounded bg-gold/20 border border-gold/30 flex items-center justify-center shrink-0">
                <div className="h-4 w-4 border-[2px] border-gold border-b-transparent rounded-full animate-spin" />
              </div>
              <div>
                <h3 className="text-sm text-slate-800 font-bold font-display">AGI Engine v4.2</h3>
                <p className="text-[0.6rem] text-slate-400 font-mono uppercase tracking-widest">Active Processing</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 italic leading-relaxed">
              &quot;Associated Grading Index scores are generated using thousands of data points including EPA+, positional leverage, and athletic profiles. Filtered through AGI matrices.&quot;
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-center">
            <h3 className="text-[0.65rem] font-bold font-mono text-slate-400 uppercase tracking-widest mb-2">Platform Stability</h3>
            <div className="text-4xl font-display font-black text-emerald-400 mb-1">99.9%</div>
            <div className="flex items-center gap-1.5 text-[0.6rem] text-emerald-400/50 font-mono uppercase tracking-widest">
              <CheckCircle2 size={10} /> Real-Time Data Sync
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <footer className="border-t border-slate-100 pt-8 pb-4 flex flex-col md:flex-row items-center justify-between gap-4 text-[0.65rem] text-slate-400 font-mono uppercase tracking-widest">
          <div>&copy; 2026 PER|FORM ANALYTICS. ALL RIGHTS RESERVED.</div>
          <div className="flex items-center gap-6">
            <Link href="#" className="hover:text-slate-800 transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-slate-800 transition-colors">Terms of Service</Link>
            <Link href="#" className="hover:text-slate-800 transition-colors">Contact A.I.M.S.</Link>
          </div>
        </footer>
      </motion.div>
    </div>
  );
}
