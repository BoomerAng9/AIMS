'use client';

/**
 * Per|Form Big Board — Ranked Prospect List (Production)
 *
 * The official ranked registry of prospects with AGI grades and tiers.
 * "Luxury Industrial" editorial theme.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Download, Settings, ChevronLeft, ChevronRight, CheckCircle2, TrendingUp, ArrowLeft, Radio, Eye, EyeOff, Activity } from 'lucide-react';
import type { Prospect, Tier, Trend, Pool, ContentArticle } from '@/lib/perform/types';
import { TIER_STYLES, getProspectSlug, getScoreColor } from '@/lib/perform/types';
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
    title: 'Intelligence Spotlight',
    durationSeconds: 30,
    host: 'ACHEEVY',
    topic: `Orchestrating the consensus Top 5 for the ${new Date().getFullYear()} Draft cycle`,
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
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="max-w-[1400px] mx-auto px-6 py-12 space-y-8"
    >
      {/* Header Section */}
      <motion.div variants={staggerItem} className="flex flex-col md:flex-row md:items-end justify-between gap-12 border-b border-slate-200 pb-10">
        <div className="space-y-6 max-w-3xl">
          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 bg-emerald-950 text-white text-[8px] font-black uppercase tracking-[0.3em] rounded-sm">Registry Alpha</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Class of 2026 Registry</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-serif font-bold tracking-tight text-slate-950 leading-tight">
            PER<span className="italic text-emerald-700">|</span>FORM <span className="text-slate-400 font-light">Big Board</span>
          </h1>
          <p className="text-lg text-slate-600 font-medium leading-relaxed max-w-xl">
            The definitive personnel authority. Powered by the Associated Grading Index (AGI) neural scouting network.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowBroadcastSpotlight(!showBroadcastSpotlight)}
            className={`flex items-center gap-3 px-6 py-4 border rounded-sm text-[10px] font-black uppercase tracking-[0.2em] transition-all ${showBroadcastSpotlight
              ? 'bg-red-600 text-white border-red-700'
              : 'bg-emerald-700 text-white border-emerald-800 hover:bg-emerald-800'
              }`}
          >
            {showBroadcastSpotlight ? <EyeOff size={16} /> : <Radio size={16} />}
            {showBroadcastSpotlight ? 'Exit Briefing' : 'Broadcast Spotlight'}
          </button>
          <button className="flex items-center gap-3 px-6 py-4 bg-white border border-slate-200 text-slate-950 text-[10px] font-black uppercase tracking-[0.2em] rounded-sm hover:bg-slate-50 transition-all">
            <Download size={16} /> Data Export
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
            <div className="relative bg-white border border-emerald-500/20 rounded-sm overflow-hidden shadow-2xl">
              {/* Network Bug overlay */}
              <div className="absolute top-4 right-4 z-20 scale-75 origin-top-right pointer-events-none">
                <NetworkBug />
              </div>

              {/* Broadcast header bar */}
              <div className="flex items-center gap-2 px-5 py-2.5 bg-[#F8FAFC] border-b border-slate-100">
                <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-[0.55rem] font-mono uppercase tracking-[0.25em] text-emerald-800 font-bold">Intelligence Spotlight</span>
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
      <motion.div variants={staggerItem} className="flex flex-col md:flex-row gap-6 items-center">
        <div className="relative w-full md:w-96">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search Registry..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-12 pr-6 py-4 rounded-sm bg-white border border-slate-200 text-sm text-slate-950 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 transition-colors shadow-sm"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto w-full pb-2 md:pb-0 no-scrollbar">
          {positions.map(pos => (
            <button
              key={pos}
              onClick={() => setPosFilter(pos)}
              className={`px-8 py-4 rounded-sm text-[10px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap border ${posFilter === pos
                ? 'bg-emerald-950 text-white border-emerald-950 shadow-lg shadow-emerald-900/20'
                : 'bg-white text-slate-400 border-slate-100 hover:text-slate-800 hover:border-slate-200'
                }`}
            >
              {pos}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Big Board Table */}
      <motion.div variants={staggerItem} className="bg-white border border-slate-200 rounded-sm overflow-hidden shadow-sm">
        {/* Table Header */}
        <div className="hidden md:grid grid-cols-[80px_2fr_100px_1fr_1fr_120px_120px_100px_40px] gap-6 px-8 py-6 border-b border-slate-200 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 bg-slate-50">
          <span>Rank</span>
          <span>Personnel Record</span>
          <span className="text-center">Pos</span>
          <span>School</span>
          <span>Location</span>
          <span className="text-center text-emerald-800 font-black">AGI Grade</span>
          <span className="text-center">Tier</span>
          <span className="text-center">Logic Shift</span>
          <span></span>
        </div>
        drum

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
                WR: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
                CB: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
              };
              const posStyle = posColors[prospect.position] || 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';

              return (
                <Link
                  key={prospect.id}
                  href={`/perform/prospects/${getProspectSlug(prospect)}`}
                  className={`group grid grid-cols-1 md:grid-cols-[80px_2fr_100px_1fr_1fr_120px_120px_100px_40px] gap-6 px-8 py-8 items-center border-b border-slate-100 hover:bg-emerald-50/20 transition-all relative ${isPrime ? 'bg-emerald-50/10' : ''
                    }`}
                >
                  {/* Rank */}
                  <div className={`text-4xl font-serif font-bold ${isPrime ? 'text-emerald-800' : 'text-slate-200 group-hover:text-slate-300'}`}>
                    {index + 1}
                  </div>

                  {/* Player */}
                  <div className="flex items-center gap-6">
                    <div>
                      <div className="text-xl text-slate-950 font-serif font-bold group-hover:text-emerald-900 transition-colors">
                        {prospect.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1.5 font-bold">
                        {prospect.classYear} &middot; {prospect.height || '--'} &middot; {prospect.weight || '--'} LBS
                      </div>
                    </div>
                  </div>

                  {/* Position */}
                  <div className="flex md:justify-center">
                    <div className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                      {prospect.position}
                    </div>
                  </div>

                  {/* School */}
                  <div className="text-[11px] text-slate-700 font-black uppercase tracking-tight">
                    {prospect.school}
                  </div>

                  {/* Conference */}
                  <div className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">
                    {prospect.state || 'CONF'}
                  </div>

                  {/* AGI Grade */}
                  <div className={`text-3xl font-serif font-black md:text-center ${getScoreColor(prospect.paiScore)}`}>
                    {prospect.paiScore}
                  </div>

                  {/* Tier */}
                  <div className="md:text-center">
                    <span className={`inline-block px-3 py-1 text-[9px] font-black tracking-[0.2em] uppercase rounded-sm ${isPrime
                      ? 'bg-emerald-950 text-white'
                      : isElite
                        ? 'bg-slate-100 text-slate-900'
                        : 'bg-white text-slate-400'
                      }`}>
                      {isPrime ? 'PRIME' : isElite ? 'ELITE' : 'VALUE'}
                    </span>
                  </div>

                  {/* Trend */}
                  <div className="md:text-center flex items-center md:justify-center">
                    {index % 3 === 0 ? (
                      <TrendingUp size={20} className="text-emerald-600" />
                    ) : index % 4 === 0 ? (
                      <TrendingUp size={20} className="text-red-600 rotate-180" />
                    ) : (
                      <span className="text-slate-200 font-black">&mdash;</span>
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
        <div className="bg-emerald-950 text-white border border-emerald-900 rounded-sm p-10 shadow-2xl shadow-emerald-950/20">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500 mb-6">AGI Grade Guide</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center text-xs">
              <span className="text-emerald-400 font-bold uppercase tracking-widest">101+</span>
              <span className="font-serif font-black italic">PRIME ORCHESTRATOR</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-white/40 font-bold uppercase tracking-widest">90 - 100</span>
              <span className="font-serif font-bold italic">ELITE PERSONNEL</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-white/40 font-bold uppercase tracking-widest">80 - 89</span>
              <span className="font-serif font-bold italic">HIGH UTILITY</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-sm p-10 flex flex-col justify-center shadow-sm">
          <div className="flex items-start gap-6 mb-6">
            <div className="h-10 w-10 rounded-sm bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
              <Activity size={20} className="text-emerald-700" />
            </div>
            <div>
              <h3 className="text-lg font-serif font-bold text-slate-950 leading-none">AGI Engine 4.2</h3>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-2">Active Multi-Point Analysis</p>
            </div>
          </div>
          <p className="text-sm text-slate-500 font-medium leading-relaxed italic">
            &ldquo;Associated Grading Index scores are synthesized from multi-dimensional data arrays including EPA metrics, positional ceiling, and internal character intelligence.&rdquo;
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-sm p-10 flex flex-col items-center justify-center text-center shadow-sm">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Neural Data Pulse</h3>
          <div className="text-5xl font-serif font-black text-emerald-700 mb-2">99.8%</div>
          <div className="flex items-center gap-2 text-[10px] text-emerald-600 font-black uppercase tracking-widest">
            <CheckCircle2 size={12} /> Live Sync Active
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
