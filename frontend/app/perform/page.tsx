'use client';

/**
 * Per|Form — A.I.M.S. Sports Intelligence Platform (Production Hub)
 *
 * A proof-of-concept vertical built entirely with A.I.M.S. technology:
 * the P.A.I. grading system, Boomer_Ang analyst agents, ACHEEVY orchestration,
 * and the three-tier intelligence engine.
 *
 * This is the first page users see when entering Per|Form.
 */

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight, TrendingUp, FileText, Swords, Mic, Users, ListOrdered,
  Shuffle, MapPin, Radio, Flame, BarChart3, Activity, ChevronRight,
  Zap, Shield, Target, Star, Search, Building2, Database,
  Trophy, RotateCcw, ArrowRightLeft,
} from 'lucide-react';
import type { Prospect, ContentArticle, Tier } from '@/lib/perform/types';
import { TIER_STYLES, getScoreColor, getProspectSlug } from '@/lib/perform/types';
import { CONFERENCES, TIER_LABELS } from '@/lib/perform/conferences';
import type { Conference, ConferenceTier } from '@/lib/perform/conferences';

const CURRENT_YEAR = new Date().getFullYear();

// ── Analyst roster for the "Meet the Analysts" section ─────────
const ANALYSTS = [
  {
    id: 'acheevy',
    name: 'ACHEEVY',
    role: 'Lead Intelligence Orchestrator',
    bio: 'The central brain of the A.I.M.S. platform. Orchestrates depth indexes, grading logic, and platform deployment.',
    color: 'from-emerald-50/50 to-white',
    border: 'border-emerald-100',
    accent: 'text-emerald-700',
    dot: 'bg-emerald-500',
    catchphrase: '"Calculated. Orchestrated. Delivered."',
  },
  {
    id: 'primetime',
    name: 'PrimeTime Jr.',
    role: 'Personnel & Entertainment',
    bio: 'Specialist in player intangibles and market value. If it moves the needle, PrimeTime is on the transcript.',
    color: 'from-amber-50/50 to-white',
    border: 'border-amber-100',
    accent: 'text-amber-700',
    dot: 'bg-amber-500',
    catchphrase: '"The AGI doesn\'t lie, but the tape tells the story."',
  },
  {
    id: 'professor',
    name: 'The Professor',
    role: 'Senior Film & Mechanics',
    bio: 'A Film_First_Ang dedicated to mechanical efficiency. Every touchdown is a sequence of perfect variables.',
    color: 'from-slate-50/50 to-white',
    border: 'border-slate-200',
    accent: 'text-slate-700',
    dot: 'bg-slate-400',
    catchphrase: '"Data is the film, film is the data."',
  },
  {
    id: 'uncle-blaze',
    name: 'Uncle Blaze',
    role: 'Heat & Velocity Analyst',
    bio: 'Monitoring the pulse of the sport. High-velocity takes backed by real-time AGI grade shifts.',
    color: 'from-red-50/50 to-white',
    border: 'border-red-100',
    accent: 'text-red-700',
    dot: 'bg-red-500',
    catchphrase: '"I predicted the shift before the index moved."',
  },
];

// ── Platform navigation tiles ───────────────────────────────────
const NAV_TILES = [
  { href: '/perform/ncaa-database', label: 'NCAA Database', sub: 'Depth Indexes · AGI Grades', icon: Database, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'hover:border-emerald-200' },
  { href: '/perform/big-board', label: 'Big Board', sub: 'Complete 2026 Rankings', icon: ListOrdered, color: 'text-slate-800', bg: 'bg-slate-50', border: 'hover:border-slate-300' },
  { href: '/perform/draft', label: 'NFL Draft Center', sub: 'Mock Cycles · Simulators', icon: Trophy, color: 'text-emerald-950', bg: 'bg-slate-100', border: 'hover:border-emerald-300' },
  { href: '/perform/war-room', label: 'War Room', sub: 'Bull vs Bear Verdicts', icon: Swords, color: 'text-red-700', bg: 'bg-red-50', border: 'hover:border-red-200' },
  { href: '/perform/redraft', label: 'Redraft Logic', sub: 'Accountability Audit', icon: RotateCcw, color: 'text-amber-700', bg: 'bg-amber-50', border: 'hover:border-amber-200' },
  { href: '/perform/transfer-portal', label: 'Transfer Portal', sub: 'Portal Flow · NIL Value', icon: ArrowRightLeft, color: 'text-blue-700', bg: 'bg-blue-50', border: 'hover:border-blue-200' },
  { href: '/perform/state-boards', label: 'State Boards', sub: 'Local Scouting Reports', icon: MapPin, color: 'text-purple-700', bg: 'bg-purple-50', border: 'hover:border-purple-200' },
  { href: '/perform/analysts', label: 'Analyst Roster', sub: 'Meet the Boomer_Angs', icon: Users, color: 'text-slate-500', bg: 'bg-slate-50', border: 'hover:border-slate-300' },
];

const TIER_PILL: Record<string, string> = {
  PRIME: 'bg-emerald-950 text-white font-black',
  'A+': 'bg-emerald-100 text-emerald-900 border border-emerald-200',
  A: 'bg-slate-800 text-white border border-slate-700',
  'B+': 'bg-slate-100 text-slate-700 border border-slate-200',
  B: 'bg-amber-50 text-amber-800 border border-amber-200',
};

// ── Conference Card (light theme) ────────────────────────────────
function ConferenceCard({ conf }: { conf: Conference }) {
  const tier = TIER_LABELS[conf.tier];
  const totalCapacity = conf.teams.reduce((s, t) => s + t.stadiumCapacity, 0);

  return (
    <div className="group rounded-2xl border border-slate-200 bg-white hover:bg-[#F8FAFC] transition-all p-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-lg font-bold text-slate-800">{conf.abbreviation}</h3>
          <p className="text-xs text-slate-400">{conf.name}</p>
        </div>
        <span
          className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${tier.bg} ${tier.border} border ${tier.color}`}
        >
          {tier.label}
        </span>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="text-center py-1.5 rounded-lg bg-slate-50">
          <div className="text-sm font-bold text-slate-800">{conf.teams.length}</div>
          <div className="text-[10px] text-slate-400">Teams</div>
        </div>
        <div className="text-center py-1.5 rounded-lg bg-slate-50">
          <div className="text-sm font-bold text-slate-800">{(totalCapacity / 1000).toFixed(0)}K</div>
          <div className="text-[10px] text-slate-400">Total Seats</div>
        </div>
        <div className="text-center py-1.5 rounded-lg bg-slate-50">
          <div className="text-sm font-bold text-slate-800">{conf.founded}</div>
          <div className="text-[10px] text-slate-400">Founded</div>
        </div>
      </div>

      {/* Team Grid */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {conf.teams.slice(0, 12).map((team) => (
          <span
            key={team.id}
            className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200 transition-colors cursor-default"
            title={`${team.schoolName} ${team.mascot} — ${team.headCoach}`}
          >
            {team.abbreviation}
          </span>
        ))}
        {conf.teams.length > 12 && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-50 text-slate-400">
            +{conf.teams.length - 12}
          </span>
        )}
      </div>

      {/* Commissioner */}
      <div className="flex items-center justify-between text-[11px] text-slate-400">
        <span>Commissioner: {conf.commissioner}</span>
        <span>
          {conf.hqCity}, {conf.hqState}
        </span>
      </div>
    </div>
  );
}

// ── Main Hub Page ────────────────────────────────────────────────

export default function PerFormHub() {
  const [topProspects, setTopProspects] = useState<Prospect[]>([]);
  const [recentContent, setRecentContent] = useState<ContentArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [newsItems, setNewsItems] = useState<any[]>([]);
  const [ticker, setTicker] = useState(0);

  // Conference directory state
  const [confSearch, setConfSearch] = useState('');
  const [confTierFilter, setConfTierFilter] = useState<ConferenceTier | ''>('');

  useEffect(() => {
    Promise.all([
      fetch('/api/perform/prospects').then(r => r.json()).catch(() => []),
      fetch('/api/perform/content').then(r => r.json()).catch(() => []),
      fetch('/api/perform/draft/news').then(r => r.json()).catch(() => ({ items: [] })),
    ]).then(([prospects, content, news]) => {
      setTopProspects(Array.isArray(prospects) ? prospects.slice(0, 5) : []);
      setRecentContent(Array.isArray(content) ? content.slice(0, 6) : []);
      setNewsItems(Array.isArray(news?.items) ? news.items.slice(0, 8) : []);
      setLoading(false);
    });
  }, []);

  // Ticker animation
  useEffect(() => {
    if (newsItems.length === 0) return;
    const t = setInterval(() => setTicker(p => (p + 1) % newsItems.length), 4000);
    return () => clearInterval(t);
  }, [newsItems.length]);

  // Conference aggregate stats
  const confStats = useMemo(() => {
    const allTeams = CONFERENCES.flatMap((c) => c.teams);
    const totalCapacity = allTeams.reduce((s, t) => s + t.stadiumCapacity, 0);
    const power4Count = CONFERENCES.filter((c) => c.tier === 'power4').flatMap((c) => c.teams).length;
    const g5Count = CONFERENCES.filter((c) => c.tier === 'group_of_5').flatMap((c) => c.teams).length;
    const largestStadium = allTeams.reduce((max, t) => (t.stadiumCapacity > max.stadiumCapacity ? t : max), allTeams[0]);

    return {
      conferences: CONFERENCES.length,
      teams: allTeams.length,
      totalCapacity,
      power4Count,
      g5Count,
      largestStadium,
    };
  }, []);

  // Filtered conferences
  const filteredConferences = useMemo(() => {
    let confs = [...CONFERENCES];

    if (confTierFilter) {
      confs = confs.filter((c) => c.tier === confTierFilter);
    }

    if (confSearch.trim()) {
      const q = confSearch.toLowerCase();
      confs = confs.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.abbreviation.toLowerCase().includes(q) ||
          c.teams.some(
            (t) =>
              t.schoolName.toLowerCase().includes(q) ||
              t.commonName.toLowerCase().includes(q) ||
              t.abbreviation.toLowerCase().includes(q) ||
              t.headCoach.toLowerCase().includes(q) ||
              t.mascot.toLowerCase().includes(q)
          )
      );
    }

    return confs;
  }, [confTierFilter, confSearch]);

  return (
    <div className="bg-white text-slate-800 overflow-x-hidden">

      {/* ── BREAKING TICKER ─────────────────────────────────────── */}
      <div className="sticky top-[6.5rem] z-30 h-11 bg-white border-b border-slate-200 flex items-center overflow-hidden shadow-sm">
        <div className="flex-shrink-0 h-full bg-slate-950 flex items-center px-6">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white whitespace-nowrap">
            AGI <span className="text-emerald-500">Pulse</span>
          </span>
        </div>
        <div className="flex-1 overflow-hidden px-8">
          <motion.p
            key={ticker}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className="text-[11px] font-bold text-slate-900 tracking-tight truncate flex items-center gap-3"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
            {newsItems.length > 0
              ? newsItems[ticker]?.headline || `Scout Hub: Top Graded prospects for ${CURRENT_YEAR} now live.`
              : `Scout Hub: Top Graded prospects for ${CURRENT_YEAR} now live.`}
          </motion.p>
        </div>
        <div className="flex-shrink-0 px-6 border-l border-slate-100 h-full flex items-center">
          <Link href="/perform/ncaa-database" className="text-[10px] font-black text-emerald-700 hover:text-emerald-800 transition-colors uppercase tracking-widest">
            Database Map →
          </Link>
        </div>
      </div>

      {/* ── HERO ────────────────────────────────────────────────── */}
      <section className="relative pt-28 pb-20 overflow-hidden border-b border-slate-100">
        <div className="absolute inset-0 bg-[#F8FAFC]/50" />

        <div className="relative z-10 max-w-[1400px] mx-auto px-8 w-full">
          <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-12">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-4xl"
            >
              <div className="flex items-center gap-3 mb-8">
                <span className="px-3 py-1 bg-emerald-950 text-white text-[9px] font-black uppercase tracking-[0.3em] rounded-sm">
                  Intelligence Plateform
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Version 4.2 &middot; Class of '26 Active
                </span>
              </div>

              <h1 className="text-7xl md:text-9xl font-serif font-bold tracking-tight leading-[0.85] text-slate-950 mb-10">
                PER<span className="italic text-emerald-700">|</span>FORM
              </h1>

              <p className="text-xl md:text-2xl font-medium text-slate-600 leading-relaxed max-w-2xl mb-12">
                The absolute source for collegiate scouting. Powered by the <span className="text-slate-950 font-bold border-b-2 border-emerald-500">AGI Associated Grading Index</span> and the A.I.M.S. neural scouting network.
              </p>

              <div className="flex flex-wrap items-center gap-6">
                <Link
                  href="/perform/ncaa-database"
                  className="group flex items-center gap-3 px-10 py-5 bg-emerald-700 text-white font-black text-xs uppercase tracking-[0.2em] rounded-sm hover:bg-emerald-800 transition-all shadow-xl shadow-emerald-900/10"
                >
                  <Database size={16} />
                  Explore Database
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/perform/big-board"
                  className="flex items-center gap-3 px-10 py-5 bg-white border border-slate-200 text-slate-950 font-black text-xs uppercase tracking-[0.2em] rounded-sm hover:bg-slate-50 transition-all"
                >
                  <ListOrdered size={16} />
                  2026 Big Board
                </Link>
              </div>
            </motion.div>

            <div className="grid grid-cols-2 gap-x-12 gap-y-8 lg:pb-4 border-l border-slate-200 pl-12">
              {[
                { label: 'Graded Prospects', val: '4,821' },
                { label: 'Avg AGI Confidence', val: '98.4%' },
                { label: 'Analyst Models', val: '12 Active' },
                { label: 'Daily Data Pulse', val: '22M Row' },
              ].map(m => (
                <div key={m.label} className="flex flex-col">
                  <span className="text-3xl font-serif font-bold text-slate-950">{m.val}</span>
                  <span className="text-[9px] font-black tracking-[0.2em] uppercase text-emerald-700 mt-1">{m.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── QUICK VOICE COMMAND ────────────────────────────────── */}
      <section className="max-w-[1400px] mx-auto px-8 pb-16 mt-[-30px]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="relative rounded-sm border border-slate-200 bg-white p-8 flex items-center gap-8 shadow-2xl shadow-slate-200/50"
        >
          <button className="relative flex-shrink-0 h-16 w-16 rounded-full bg-emerald-700 flex items-center justify-center text-white hover:bg-emerald-800 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-emerald-700/20">
            <Mic size={24} />
          </button>
          <div className="relative">
            <p className="text-2xl font-serif font-bold text-slate-950">&ldquo;Show me the Intangibles grade for Bryce Underwood&rdquo;</p>
            <p className="text-[10px] text-slate-400 font-black mt-2 uppercase tracking-[0.3em]">Scout Voice Mode &middot; Say a prospect name or school for immediate AGI breakdown</p>
          </div>
          <div className="relative ml-auto hidden xl:flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">
            <Activity size={14} className="text-emerald-500" /> Platform Connected
          </div>
        </motion.div>
      </section>

      {/* ── NAV TILES ──────────────────────────────────────────── */}
      <section className="max-w-[1400px] mx-auto px-6 pb-16">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-[0.65rem] font-mono tracking-[0.3em] uppercase text-slate-400">Platform</h2>
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
        >
          {NAV_TILES.map((tile, i) => (
            <motion.div
              key={tile.href}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i }}
            >
              <Link
                href={tile.href}
                className={`group flex flex-col gap-3 p-5 rounded-2xl bg-white border border-slate-200 ${tile.border} transition-all duration-200 hover:bg-[#F8FAFC] h-full`}
              >
                <div className={`h-10 w-10 rounded-xl ${tile.bg} border ${tile.border.replace('hover:', '')} flex items-center justify-center ${tile.color}`}>
                  <tile.icon size={18} />
                </div>
                <div>
                  <p className={`text-sm font-semibold text-slate-800 group-hover:${tile.color} transition-colors`}>{tile.label}</p>
                  <p className="text-[0.6rem] text-slate-400 font-mono mt-0.5">{tile.sub}</p>
                </div>
                <div className={`mt-auto flex items-center gap-1 text-[0.6rem] font-mono uppercase tracking-widest ${tile.color} opacity-0 group-hover:opacity-100 transition-opacity`}>
                  Enter <ChevronRight size={10} />
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── TOP PROSPECTS ──────────────────────────────────────── */}
      {!loading && topProspects.length > 0 && (
        <section className="max-w-[1400px] mx-auto px-8 pb-20">
          <div className="flex items-center justify-between mb-10 border-b border-slate-200 pb-5">
            <div>
              <h2 className="text-4xl font-serif font-bold tracking-tight text-slate-950">Current <span className="italic text-emerald-800">Big Board</span></h2>
              <p className="text-[10px] text-slate-400 font-black mt-2 uppercase tracking-[0.2em]">Ranked by Associated Grading Index &middot; Updated Daily</p>
            </div>
            <Link href="/perform/big-board" className="flex items-center gap-2 text-[11px] font-black text-emerald-700 hover:text-emerald-800 transition-colors uppercase tracking-widest group">
              View Full Board <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {topProspects.map((prospect, i) => {
              const tierPill = TIER_PILL[prospect.tier] || 'bg-slate-100 text-slate-500';
              return (
                <motion.div
                  key={prospect.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <Link
                    href={`/perform/prospects/${getProspectSlug(prospect)}`}
                    className="group flex items-center gap-8 p-6 rounded-sm bg-white border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/20 transition-all shadow-sm"
                  >
                    {/* Rank */}
                    <span className="text-4xl font-serif font-bold text-slate-200 w-14 text-center flex-shrink-0 group-hover:text-emerald-200 transition-colors">
                      {i + 1}
                    </span>

                    {/* Name + School */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <p className="font-serif font-bold text-slate-950 text-xl group-hover:text-emerald-900 transition-colors truncate">
                          {prospect.name}
                        </p>
                        <span className={`px-2 py-0.5 rounded-sm text-[9px] font-black uppercase tracking-widest ${tierPill}`}>
                          {prospect.tier}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-bold uppercase tracking-tight">
                        {prospect.position} &middot; {prospect.school} &middot; {prospect.classYear}
                      </p>
                    </div>

                    {/* Score Breakdown (Small) */}
                    <div className="hidden xl:flex items-center gap-8 px-8 border-x border-slate-100">
                      <div className="text-center">
                        <div className="text-sm font-black text-slate-900">{prospect.performance}</div>
                        <div className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Perf</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-black text-slate-900">{prospect.athleticism}</div>
                        <div className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Athl</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-black text-slate-900">{prospect.intangibles}</div>
                        <div className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Intg</div>
                      </div>
                    </div>

                    {/* AGI Score */}
                    <div className="text-right flex-shrink-0 min-w-[80px]">
                      <span className={`text-4xl font-serif font-bold ${getScoreColor(prospect.paiScore)}`}>
                        {prospect.paiScore}
                      </span>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">AGI</p>
                    </div>

                    <ChevronRight size={18} className="text-slate-300 group-hover:text-emerald-600 flex-shrink-0 transition-all group-hover:translate-x-1" />
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── ANALYTICS ENGINE ──────────────────────────────────── */}
      <section className="max-w-[1400px] mx-auto px-6 pb-16">
        <div className="mb-6">
          <h2 className="text-2xl font-black tracking-tight text-slate-800">Intelligence Engine</h2>
          <p className="text-xs text-slate-400 font-mono mt-1">Three-tier search architecture · Load balanced · Real-time</p>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            {
              tier: 'TIER 1',
              label: 'Quick Search',
              model: 'Gemini 3.1 Pro / Flash',
              desc: 'Rapid retrieval for player stats, baseline grades, and high-traffic queries. Pre-cached answers delivered instantly.',
              color: 'from-emerald-500/10 to-transparent border-emerald-500/20',
              accent: 'text-emerald-400',
              bar: 'bg-emerald-400',
            },
            {
              tier: 'TIER 2',
              label: 'Deep Research',
              model: 'OpenRouter / DeepMind',
              desc: 'Complex multi-variable analysis and historical context. Runs the "X-Factor" evaluation that separates Per|Form from every other platform.',
              color: 'from-blue-500/10 to-transparent border-blue-500/20',
              accent: 'text-blue-400',
              bar: 'bg-blue-400',
            },
            {
              tier: 'TIER 3',
              label: 'Targeted Crawl',
              model: 'Brave Search API',
              desc: 'Activated for hyper-local rumblings, hidden gems, and undrafted high school talent that mainstream networks never find.',
              color: 'from-amber-500/10 to-transparent border-amber-500/20',
              accent: 'text-amber-400',
              bar: 'bg-amber-400',
            },
          ].map(t => (
            <div key={t.tier} className={`relative bg-gradient-to-b ${t.color} border rounded-2xl p-6 overflow-hidden`}>
              <div className={`absolute top-0 left-0 w-full h-0.5 ${t.bar}`} />
              <div className={`text-[0.6rem] font-black tracking-[0.4em] uppercase ${t.accent} mb-3`}>{t.tier}</div>
              <h3 className="text-xl font-black text-slate-800 mb-1">{t.label}</h3>
              <p className={`text-[0.65rem] font-mono uppercase tracking-widest ${t.accent} opacity-70 mb-3`}>{t.model}</p>
              <p className="text-sm text-slate-500 leading-relaxed">{t.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── AGI SYSTEM ────────────────────────────────────────── */}
      <section className="max-w-[1400px] mx-auto px-8 pb-20">
        <div className="rounded-sm border border-slate-200 bg-emerald-950 p-12 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-[100px] transform translate-x-1/2 -translate-y-1/2" />

          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-16">
            <div className="max-w-2xl">
              <div className="flex items-center gap-4 mb-8">
                <Shield size={24} className="text-emerald-500" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500/80">Proprietary Grading Architecture</span>
              </div>
              <h2 className="text-5xl font-serif font-bold text-white mb-6">
                The <span className="italic">AGI</span> Associated Grading Index
              </h2>
              <p className="text-lg text-emerald-100/60 leading-relaxed mb-10">
                A non-linear intelligence model that evaluates prospects across three distinct dimensions.
                Replacing traditional star ratings with actual performance velocity.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { title: 'Performance', sub: 'Production Metrics', val: '40%' },
                  { title: 'Athleticism', sub: 'Bio-mechanical Data', val: '30%' },
                  { title: 'Intangibles', sub: 'Personnel Analysis', val: '30%' },
                ].map(metric => (
                  <div key={metric.title} className="p-5 rounded-sm bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group">
                    <div className="text-2xl font-serif font-bold text-white mb-1">{metric.val}</div>
                    <div className="text-xs font-black text-emerald-500 uppercase tracking-widest mb-1">{metric.title}</div>
                    <div className="text-[9px] font-bold text-emerald-200/40 uppercase">{metric.sub}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="w-full lg:w-80 space-y-4">
              {[
                { label: 'PRIME', range: '101+', color: 'bg-emerald-500' },
                { label: 'A+ ELITE', range: '90-100', color: 'bg-emerald-600' },
                { label: 'A PROSPECT', range: '80-89', color: 'bg-emerald-700' },
                { label: 'B+ VALUE', range: '70-79', color: 'bg-emerald-800' },
              ].map(tier => (
                <div key={tier.label} className="bg-white/5 border border-white/10 p-4 flex items-center justify-between rounded-sm hover:border-white/30 transition-all">
                  <div className="flex items-center gap-3">
                    <div className={`w-1.5 h-1.5 rounded-full ${tier.color}`} />
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">{tier.label}</span>
                  </div>
                  <span className="text-xs font-serif font-bold text-white/50">{tier.range}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── ANALYST TEAM ──────────────────────────────────────── */}
      <section className="max-w-[1400px] mx-auto px-8 pb-24">
        <div className="flex items-end justify-between mb-10 border-b border-slate-200 pb-5">
          <div>
            <h2 className="text-4xl font-serif font-bold tracking-tight text-slate-950">Platform <span className="italic text-emerald-800">Intelligence</span></h2>
            <p className="text-[10px] text-slate-400 font-black mt-2 uppercase tracking-[0.2em]">Neural Scouting Network &middot; Real-Time Analysis</p>
          </div>
          <Link href="/perform/analysts" className="flex items-center gap-2 text-[11px] font-black text-emerald-700 hover:text-emerald-800 transition-colors uppercase tracking-widest group">
            Meet the team <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {ANALYSTS.map((a, i) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i }}
              className={`relative rounded-sm border ${a.border} bg-white p-8 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 transition-all group`}
            >
              <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-br ${a.color} opacity-20`} />
              <div className={`absolute top-6 right-8 w-2 h-2 rounded-full ${a.dot} animate-pulse`} />

              <h3 className="text-2xl font-serif font-bold text-slate-950 mb-1 leading-tight">{a.name}</h3>
              <p className={`text-[10px] font-black uppercase tracking-widest ${a.accent} mb-6`}>{a.role}</p>
              <p className="text-sm text-slate-600 leading-relaxed mb-6 font-medium">{a.bio}</p>
              <div className="pt-4 border-t border-slate-50">
                <p className={`text-[11px] font-serif italic ${a.accent}`}>{a.catchphrase}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── RECENT CONTENT (The Athletic Style News Feed) ────────── */}
      {!loading && recentContent.length > 0 && (
        <section className="max-w-[1400px] mx-auto px-8 pb-24">
          <div className="flex items-end justify-between mb-10 border-b border-slate-200 pb-5">
            <div>
              <h2 className="text-4xl font-serif font-bold tracking-tight text-slate-950">Latest <span className="italic text-emerald-800">Briefings</span></h2>
              <p className="text-[10px] text-slate-400 font-black mt-2 uppercase tracking-[0.2em]">Scouting Reports &middot; Personnel Shifts &middot; Intelligence Hub</p>
            </div>
            <Link href="/perform/content" className="flex items-center gap-2 text-[11px] font-black text-emerald-700 hover:text-emerald-800 transition-colors uppercase tracking-widest group">
              Full Archive <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
            {recentContent.map((article, i) => (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group cursor-pointer"
              >
                <div className="overflow-hidden rounded-sm bg-slate-100 mb-6 aspect-video relative group-hover:shadow-2xl transition-all duration-500">
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent" />
                  <div className="absolute bottom-4 left-4">
                    <span className="px-2 py-1 bg-emerald-600 text-white text-[8px] font-black uppercase tracking-widest rounded-sm">
                      {String(article.type || '').replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{article.readTimeMin} MIN READ &middot; SCOUT HUB</p>
                  <h3 className="text-2xl font-serif font-bold text-slate-950 group-hover:text-emerald-800 transition-colors leading-tight">
                    {article.title}
                  </h3>
                  <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed font-medium">
                    {article.excerpt}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* ── COMBINE COUNTDOWN (Draft Center) ───────────────────────── */}
      <section className="max-w-[1400px] mx-auto px-8 pb-24">
        <div className="relative rounded-sm overflow-hidden bg-slate-950 p-16 text-center border border-slate-800">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(5,150,105,0.05)_0%,transparent_70%)]" />
          <div className="relative z-10 space-y-8">
            <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} className="inline-flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500">Live Draft Feed Active</span>
            </motion.div>
            <h2 className="text-5xl md:text-7xl font-serif font-bold tracking-tight text-white">
              NFL <span className="italic text-emerald-500">Draft</span> Center
            </h2>
            <p className="text-xl text-slate-400 font-medium max-w-2xl mx-auto">
              Real-time AGI grade adjustments based on combine measurables,
              pro-day metrics, and the latest personnel rumblings.
            </p>
            <div className="flex gap-6 justify-center flex-wrap pt-4">
              <Link
                href="/perform/draft"
                className="px-10 py-5 bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-sm transition-all shadow-xl shadow-emerald-900/40 flex items-center gap-3"
              >
                <Trophy size={18} /> Enter Draft Room
              </Link>
              <Link
                href="/perform/big-board"
                className="px-10 py-5 bg-transparent border border-slate-700 hover:border-slate-500 text-slate-300 font-black text-xs uppercase tracking-[0.2em] rounded-sm transition-all"
              >
                Full Big Board
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── CONFERENCE DIRECTORY ────────────────────────────────── */}
      <section className="max-w-[1400px] mx-auto px-8 pb-32">
        {/* Section header */}
        <div className="mb-12 border-b border-slate-200 pb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-8">
          <div className="max-w-3xl">
            <div className="flex items-center gap-4 mb-4">
              <Building2 className="w-6 h-6 text-emerald-800" />
              <h2 className="text-4xl font-serif font-bold tracking-tight text-slate-950">Conference <span className="italic text-emerald-800">Registry</span></h2>
            </div>
            <p className="text-lg text-slate-600 font-medium leading-relaxed">
              Proprietary depth indexes for every FBS program. Historical revenue data,
              coaching lineage, and AGI enrollment metrics.
            </p>
          </div>

          <div className="flex items-center gap-6">
            {[
              { label: 'FBS Programs', value: confStats.teams },
              { label: 'Active Conferences', value: confStats.conferences },
            ].map(kpi => (
              <div key={kpi.label} className="flex flex-col items-end">
                <span className="text-3xl font-serif font-bold text-slate-950">{kpi.value}</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">{kpi.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search teams, coaches, conferences..."
              value={confSearch}
              onChange={(e) => setConfSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-gold/30 focus:ring-1 focus:ring-gold/20 transition-all"
            />
          </div>

          <div className="flex gap-2">
            {(['', 'power4', 'group_of_5', 'independent'] as const).map((tier) => {
              const isActive = confTierFilter === tier;
              const label = tier === '' ? 'All' : TIER_LABELS[tier as ConferenceTier]?.label || tier;
              return (
                <button
                  key={tier}
                  onClick={() => setConfTierFilter(tier)}
                  className={`text-xs px-3 py-2 rounded-lg border transition-all whitespace-nowrap ${isActive
                    ? 'bg-gold/15 text-gold border-gold/30'
                    : 'bg-white text-slate-500 border-slate-200 hover:text-slate-700 hover:bg-slate-50'
                    }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Conference grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {filteredConferences.map((conf) => (
            <ConferenceCard key={conf.id} conf={conf} />
          ))}
        </div>

        {filteredConferences.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <Search className="w-8 h-8 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No conferences match your search.</p>
          </div>
        )}

        {/* Top 10 Stadiums Leaderboard */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-5 h-5 text-gold" />
            <h3 className="text-lg font-black text-slate-800">Top 10 Stadiums by Capacity</h3>
          </div>

          <div className="space-y-2">
            {CONFERENCES.flatMap((c) => c.teams.map((t) => ({ ...t, conferenceName: c.abbreviation })))
              .sort((a, b) => b.stadiumCapacity - a.stadiumCapacity)
              .slice(0, 10)
              .map((team, idx) => (
                <div
                  key={team.id}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${idx < 3 ? 'bg-gold/20 text-gold' : 'bg-slate-200 text-slate-500'
                      }`}
                  >
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-800 truncate">
                        {team.commonName} {team.mascot}
                      </span>
                      <span className="text-[10px] text-slate-400">{team.conferenceName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{team.stadium}</span>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-slate-800 tabular-nums">
                    {team.stadiumCapacity.toLocaleString()}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </section>

    </div>
  );
}
