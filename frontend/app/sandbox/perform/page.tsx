'use client';

/**
 * Per|Form — A.I.M.S. Sports Intelligence Platform
 *
 * A proof-of-concept vertical built entirely with A.I.M.S. technology:
 * the P.A.I. grading system, Boomer_Ang analyst agents, ACHEEVY orchestration,
 * and the three-tier intelligence engine.
 *
 * This internal app demonstrates what A.I.M.S. can build for any sports
 * organization, media brand, or content platform — powered by the same
 * methodology we offer to clients.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight, TrendingUp, FileText, Swords, Mic, Users, ListOrdered,
  Shuffle, MapPin, Radio, Flame, BarChart3, Activity, ChevronRight,
  Zap, Shield, Target, Star
} from 'lucide-react';
import type { Prospect, ContentArticle, Tier } from '@/lib/perform/types';
import { TIER_STYLES, getScoreColor, getProspectSlug } from '@/lib/perform/types';

const CURRENT_YEAR = new Date().getFullYear();

// ── Analyst roster for the "Meet the Analysts" section ─────────
const ANALYSTS = [
  {
    id: 'acheevy',
    name: 'ACHEEVY',
    role: 'Lead Color Analyst',
    bio: 'Orchestrates the entire Per|Form newsroom. Every scouting report, every debate, every grade — filtered through ACHEEVY before it reaches you.',
    color: 'from-gold/20 to-gold/5',
    border: 'border-gold/30',
    accent: 'text-gold',
    dot: 'bg-gold',
    catchphrase: '"The tape knows. The formula confirms."',
  },
  {
    id: 'primetime',
    name: 'PrimeTime Jr.',
    role: 'Swagger_Ang · Entertainment Analyst',
    bio: 'Bold takes. Bigger predictions. If he said it first, it\'s in the transcript.',
    color: 'from-red-500/20 to-red-500/5',
    border: 'border-red-500/30',
    accent: 'text-red-400',
    dot: 'bg-red-500',
    catchphrase: '"That boy DIFFERENT."',
  },
  {
    id: 'professor',
    name: 'The Professor',
    role: 'Film_First_Ang · Film Analyst',
    bio: 'Precision breakdowns. Every frame reviewed. Film-first, opinion-second.',
    color: 'from-blue-500/20 to-blue-500/5',
    border: 'border-blue-500/30',
    accent: 'text-blue-400',
    dot: 'bg-blue-400',
    catchphrase: '"Watch the tape."',
  },
  {
    id: 'uncle-blaze',
    name: 'Uncle Blaze',
    role: 'Heat_Ang · Fire Analyst',
    bio: 'He was saying it before everybody. Energy, drama, accountability.',
    color: 'from-orange-500/20 to-orange-500/5',
    border: 'border-orange-500/30',
    accent: 'text-orange-400',
    dot: 'bg-orange-500',
    catchphrase: '"I BEEN saying this!"',
  },
];

// ── Platform navigation tiles ───────────────────────────────────
const NAV_TILES = [
  { href: '/sandbox/perform/big-board', label: 'Big Board', sub: 'Ranked prospects · P.A.I. scores', icon: ListOrdered, color: 'text-gold', bg: 'bg-gold/10', border: 'hover:border-gold/30' },
  { href: '/sandbox/perform/draft', label: 'NFL Draft', sub: `${CURRENT_YEAR} Mock Draft · On the Clock`, icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'hover:border-emerald-400/30' },
  { href: '/sandbox/perform/war-room', label: 'War Room', sub: 'Bull vs Bear debates live', icon: Swords, color: 'text-red-400', bg: 'bg-red-400/10', border: 'hover:border-red-400/30' },
  { href: '/sandbox/perform/redraft', label: '2025 Redraft', sub: 'AGI accountability · Rookie grades', icon: Activity, color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'hover:border-orange-400/30' },
  { href: '/sandbox/perform/state-boards', label: 'HS State Boards', sub: 'Top 100 per state · Stats only', icon: MapPin, color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'hover:border-amber-400/30' },
  { href: '/sandbox/perform/transfer-portal', label: 'Transfer Portal', sub: 'AGI NIL & roster alignment', icon: Shuffle, color: 'text-cyan-400', bg: 'bg-cyan-400/10', border: 'hover:border-cyan-400/30' },
  { href: '/sandbox/perform/content', label: 'Content Feed', sub: 'Reports, debates, analysis', icon: FileText, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'hover:border-blue-400/30' },
  { href: '/sandbox/perform/analysts', label: 'Meet the Analysts', sub: 'ACHEEVY + the Boomer_Angs', icon: Users, color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'hover:border-amber-400/30' },
];

const TIER_PILL: Record<string, string> = {
  PRIME: 'bg-gradient-to-r from-yellow-400 to-gold text-black font-black',
  'A+': 'bg-gold/20 text-gold border border-gold/40',
  A: 'bg-cyan-400/20 text-cyan-400 border border-cyan-400/30',
  'B+': 'bg-emerald-400/20 text-emerald-400 border border-emerald-400/30',
  B: 'bg-amber-400/20 text-amber-400 border border-amber-400/30',
};

export default function PerFormHub() {
  const [topProspects, setTopProspects] = useState<Prospect[]>([]);
  const [recentContent, setRecentContent] = useState<ContentArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [newsItems, setNewsItems] = useState<any[]>([]);
  const [ticker, setTicker] = useState(0);

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

  return (
    <div className="min-h-screen bg-white text-slate-800 overflow-x-hidden">

      {/* ── BREAKING TICKER (top) ───────────────────────────────── */}
      <div className="sticky top-0 z-50 h-10 bg-white/95 backdrop-blur-xl border-b border-slate-100 flex items-center overflow-hidden">
        <div className="flex-shrink-0 h-full bg-red-600 flex items-center px-4 gap-2">
          <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1.2 }} className="w-2 h-2 rounded-full bg-white" />
          <span className="text-[0.6rem] font-black uppercase tracking-widest text-slate-800 whitespace-nowrap">BREAKING</span>
        </div>
        <div className="flex-1 overflow-hidden px-6">
          <motion.p
            key={ticker}
            initial={{ y: 15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -15, opacity: 0 }}
            className="text-[0.65rem] font-mono text-slate-600 tracking-wide truncate"
          >
            {newsItems.length > 0
              ? newsItems[ticker]?.headline || `Per|Form ${CURRENT_YEAR} NFL Combine Coverage — Feb 23–Mar 2 · On-field drills begin Feb 26`
              : `Per|Form ${CURRENT_YEAR} NFL Combine Coverage — Feb 23–Mar 2 · On-field drills begin Feb 26`}
          </motion.p>
        </div>
        <div className="flex-shrink-0 px-4">
          <Link href="/sandbox/perform/draft" className="text-[0.6rem] font-mono text-gold/70 hover:text-gold transition-colors tracking-widest uppercase">
            NFL DRAFT →
          </Link>
        </div>
      </div>

      {/* ── HERO ──────────────────────────────────────────────────── */}
      <section className="relative min-h-[70vh] flex flex-col justify-end pb-16 pt-32 overflow-hidden">

        {/* Background layers */}
        <div className="absolute inset-0 bg-gradient-to-b from-white via-white to-white" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(212,175,55,0.08)_0%,transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(34,211,238,0.04)_0%,transparent_60%)]" />
        {/* Grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />

        <div className="relative z-10 max-w-[1400px] mx-auto px-6 w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-6 max-w-3xl"
          >
            <div className="flex items-center gap-3">
              <div className="h-px w-12 bg-gold" />
              <span className="text-[0.65rem] font-mono tracking-[0.4em] uppercase text-gold/80">A.I.M.S. Sports Intelligence</span>
            </div>

            <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] text-slate-800">
              PER<span className="text-gold">|</span>FORM
            </h1>

            <p className="text-xl md:text-2xl font-light text-slate-500 leading-relaxed max-w-2xl">
              A proof-of-concept built on A.I.M.S. technology. The P.A.I. grading system, Boomer_Ang analysts, and ACHEEVY orchestration — applied to sports scouting and NIL intelligence.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                href="/sandbox/perform/draft"
                className="group flex items-center gap-3 px-8 py-4 bg-gold text-black font-bold text-sm rounded-xl hover:bg-yellow-400 transition-colors shadow-[0_0_30px_rgba(212,175,55,0.3)]"
              >
                <Radio size={16} />
                {CURRENT_YEAR} NFL Draft Coverage
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/sandbox/perform/big-board"
                className="flex items-center gap-3 px-8 py-4 bg-slate-50 border border-slate-200 text-slate-800 font-medium text-sm rounded-xl hover:bg-slate-100 transition-colors"
              >
                <ListOrdered size={16} />
                View Big Board
              </Link>
            </div>

            {/* Live metrics strip */}
            <div className="flex flex-wrap gap-4 pt-4">
              {[
                { label: 'Prospects Graded', val: '2,400+' },
                { label: 'Analyst Team', val: '5 AIs' },
                { label: 'P.A.I. Accuracy', val: '94.2%' },
                { label: 'States Covered', val: '50' },
              ].map(m => (
                <div key={m.label} className="flex flex-col">
                  <span className="text-2xl font-black text-slate-800">{m.val}</span>
                  <span className="text-[0.6rem] font-mono tracking-widest uppercase text-slate-400">{m.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── QUICK VOICE COMMAND ──────────────────────────────────── */}
      <section className="max-w-[1400px] mx-auto px-6 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="relative rounded-2xl border border-gold/20 bg-gradient-to-r from-gold/5 via-transparent to-transparent p-6 flex items-center gap-5 overflow-hidden"
        >
          <div className="absolute right-0 top-0 bottom-0 w-64 bg-gradient-to-l from-gold/5 to-transparent" />
          <button className="relative flex-shrink-0 h-14 w-14 rounded-full bg-gold/10 border-2 border-gold/40 flex items-center justify-center text-gold hover:bg-gold/20 transition-all hover:shadow-[0_0_20px_rgba(212,175,55,0.4)]">
            <Mic size={22} />
          </button>
          <div className="relative">
            <p className="text-base font-medium text-slate-800">&ldquo;Tell me about Fernando Mendoza&rdquo;</p>
            <p className="text-xs text-slate-400 font-mono mt-1 uppercase tracking-widest">Voice-first scouting — say a name, position, or school</p>
          </div>
          <div className="relative ml-auto hidden md:flex items-center gap-3 text-[0.6rem] font-mono uppercase tracking-widest text-slate-400">
            <Zap size={12} className="text-gold/50" /> Powered by A.I.M.S.
          </div>
        </motion.div>
      </section>

      {/* ── NAV TILES ──────────────────────────────────────────────── */}
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

      {/* ── TOP PROSPECTS ──────────────────────────────────────────── */}
      {!loading && topProspects.length > 0 && (
        <section className="max-w-[1400px] mx-auto px-6 pb-16">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-slate-800">{CURRENT_YEAR} Big Board</h2>
              <p className="text-xs text-slate-400 font-mono mt-1">Sorted by P.A.I. Score · Updated in real time</p>
            </div>
            <Link href="/sandbox/perform/big-board" className="flex items-center gap-2 text-xs font-mono text-gold/60 hover:text-gold transition-colors uppercase tracking-widest">
              Full Board <ArrowRight size={12} />
            </Link>
          </div>

          <div className="space-y-2">
            {topProspects.map((prospect, i) => {
              const tierStyle = TIER_STYLES[prospect.tier as Tier];
              const tierPill = TIER_PILL[prospect.tier] || 'bg-slate-100 text-slate-500';
              return (
                <motion.div
                  key={prospect.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <Link
                    href={`/sandbox/perform/prospects/${getProspectSlug(prospect)}`}
                    className="group flex items-center gap-5 p-5 rounded-2xl bg-white border border-slate-200 hover:border-gold/20 hover:bg-[#F8FAFC] transition-all"
                  >
                    {/* Rank */}
                    <span className="text-3xl font-black text-slate-300 w-10 text-center flex-shrink-0 group-hover:text-slate-300 transition-colors">
                      {i + 1}
                    </span>

                    {/* Position badge */}
                    <div className={`flex-shrink-0 h-11 w-11 rounded-xl ${tierStyle?.bg || 'bg-gold/10'} border ${tierStyle?.border || 'border-gold/20'} flex items-center justify-center text-xs font-black ${tierStyle?.text || 'text-gold'}`}>
                      {prospect.position}
                    </div>

                    {/* Name + School */}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 text-base group-hover:text-gold transition-colors truncate">
                        {prospect.name}
                      </p>
                      <p className="text-[0.65rem] text-slate-400 font-mono mt-0.5 truncate">
                        {prospect.school} · {prospect.state} · {prospect.classYear}
                      </p>
                    </div>

                    {/* Tier pill */}
                    <span className={`hidden md:inline-flex px-2.5 py-1 rounded-lg text-[0.6rem] font-bold uppercase tracking-widest ${tierPill}`}>
                      {prospect.tier}
                    </span>

                    {/* P.A.I. Score */}
                    <div className="text-right flex-shrink-0">
                      <span className={`text-2xl font-black ${getScoreColor(prospect.paiScore)}`}>
                        {prospect.paiScore}
                      </span>
                      <p className="text-[0.5rem] font-mono text-slate-300 uppercase tracking-widest">P.A.I.</p>
                    </div>

                    <ArrowRight size={14} className="text-slate-300 group-hover:text-gold/40 flex-shrink-0 transition-colors" />
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── ANALYTICS ENGINE ──────────────────────────────────────── */}
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
              desc: 'Complex multi-variable analysis and historical context. Runs the "X-Factor" evaluation that separates per|form from every other platform.',
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

      {/* ── P.A.I. SYSTEM ──────────────────────────────────────────── */}
      <section className="max-w-[1400px] mx-auto px-6 pb-16">
        <div className="rounded-2xl border border-gold/20 bg-gradient-to-br from-gold/5 to-transparent p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />

          <div className="relative z-10">
            <div className="flex items-start justify-between gap-6 flex-wrap">
              <div className="max-w-xl">
                <div className="flex items-center gap-3 mb-4">
                  <Shield size={20} className="text-gold" />
                  <span className="text-[0.65rem] font-mono tracking-[0.3em] uppercase text-gold/70">Proprietary Scoring System</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-800 mb-3">
                  The P.A.I. System
                </h2>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Performance · Athleticism · Intangibles. Three dimensions, evaluated independently, combined into one definitive score.
                  <span className="text-gold/70"> Grades are public. Formula is confidential.</span>
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                {[
                  { label: 'PRIME', val: '101+', cls: 'bg-gradient-to-r from-yellow-400 to-gold text-black' },
                  { label: 'A+', val: '90–100', cls: 'bg-gold/20 text-gold border border-gold/40' },
                  { label: 'A', val: '80–89', cls: 'bg-cyan-400/20 text-cyan-400 border border-cyan-400/30' },
                  { label: 'B+', val: '70–79', cls: 'bg-emerald-400/20 text-emerald-400 border border-emerald-400/30' },
                  { label: 'B', val: '60–69', cls: 'bg-amber-400/20 text-amber-400 border border-amber-400/30' },
                ].map(t => (
                  <div key={t.label} className={`px-4 py-2 rounded-xl text-center ${t.cls}`}>
                    <div className="text-sm font-black">{t.label}</div>
                    <div className="text-[0.55rem] font-mono opacity-70">{t.val}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4 mt-8">
              {[
                {
                  letter: 'P',
                  title: 'Performance',
                  desc: 'Stats from MaxPreps, ESPN, 247Sports — game production, efficiency, and career consistency',
                  pct: '40%',
                },
                {
                  letter: 'A',
                  title: 'Athleticism',
                  desc: 'Film analysis via SAM 2 — speed, separation distance, explosiveness, and movement quality at combine',
                  pct: '30%',
                },
                {
                  letter: 'I',
                  title: 'Intangibles',
                  desc: 'Leadership signals, coachability, media presence, character — from Brave-indexed news and interviews',
                  pct: '30%',
                },
              ].map(c => (
                <div key={c.letter} className="p-5 rounded-xl bg-slate-100/60 border border-slate-100">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-3xl font-black text-gold">{c.letter}</span>
                    <span className="text-[0.65rem] font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">{c.pct}</span>
                  </div>
                  <p className="font-bold text-slate-800 text-base mb-1">{c.title}</p>
                  <p className="text-[0.65rem] text-slate-400 leading-relaxed">{c.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── ANALYST TEAM ──────────────────────────────────────────── */}
      <section className="max-w-[1400px] mx-auto px-6 pb-16">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-800">The Analyst Team</h2>
            <p className="text-xs text-slate-400 font-mono mt-1">AI-powered · ESPN-level personalities · Real grades</p>
          </div>
          <Link href="/sandbox/perform/analysts" className="flex items-center gap-2 text-xs font-mono text-gold/60 hover:text-gold transition-colors uppercase tracking-widest">
            Full Roster <ArrowRight size={12} />
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {ANALYSTS.map((a, i) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i }}
              className={`relative rounded-2xl border ${a.border} bg-gradient-to-b ${a.color} p-6 overflow-hidden`}
            >
              <div className={`absolute top-4 right-4 w-2 h-2 rounded-full ${a.dot} animate-pulse`} />

              <div className={`w-12 h-12 rounded-xl bg-slate-50 border ${a.border} flex items-center justify-center mb-4`}>
                <Star size={20} className={a.accent} />
              </div>

              <h3 className={`text-lg font-black text-slate-800 mb-0.5`}>{a.name}</h3>
              <p className={`text-[0.6rem] font-mono uppercase tracking-widest ${a.accent} opacity-80 mb-3`}>{a.role}</p>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">{a.bio}</p>
              <p className={`text-[0.65rem] italic ${a.accent} opacity-70`}>{a.catchphrase}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── RECENT CONTENT ──────────────────────────────────────────── */}
      {!loading && recentContent.length > 0 && (
        <section className="max-w-[1400px] mx-auto px-6 pb-16">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-slate-800">Latest Analysis</h2>
              <p className="text-xs text-slate-400 font-mono mt-1">Written by the analyst team · Updated automatically</p>
            </div>
            <Link href="/sandbox/perform/content" className="flex items-center gap-2 text-xs font-mono text-gold/60 hover:text-gold transition-colors uppercase tracking-widest">
              All Articles <ArrowRight size={12} />
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentContent.map((article, i) => (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-0.5 rounded text-[0.55rem] font-mono font-bold uppercase tracking-widest bg-gold/10 text-gold/80 border border-gold/20">
                    {String(article.type || '').replace(/_/g, ' ')}
                  </span>
                  <span className="text-[0.55rem] font-mono text-slate-400">{article.readTimeMin} min read</span>
                </div>
                <p className="text-sm font-semibold text-slate-800 group-hover:text-gold transition-colors leading-snug mb-2">{article.title}</p>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{article.excerpt}</p>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* ── COMBINE COUNTDOWN ──────────────────────────────────────── */}
      <section className="max-w-[1400px] mx-auto px-6 pb-20">
        <div className="relative rounded-2xl overflow-hidden border border-red-500/20 bg-gradient-to-br from-red-900/10 to-transparent p-10 text-center">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(220,38,38,0.08)_0%,transparent_70%)]" />
          <div className="relative z-10">
            <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} className="inline-flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-[0.65rem] font-mono uppercase tracking-[0.4em] text-red-400">Live Coverage Active</span>
            </motion.div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-slate-800 mb-3">
              NFL Combine Coverage
            </h2>
            <p className="text-base text-slate-500 mb-2">February 23 – March 2, {CURRENT_YEAR} · Indianapolis</p>
            <p className="text-sm text-slate-400 max-w-xl mx-auto mb-8">
              Per|Form analysts score every workout in real time. P.A.I. scores update as combine measurables come in. No other platform does this.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link
                href="/sandbox/perform/draft"
                className="px-8 py-3.5 bg-red-600 hover:bg-red-500 text-slate-800 font-bold text-sm rounded-xl transition-colors shadow-[0_0_20px_rgba(220,38,38,0.3)] flex items-center gap-2"
              >
                <Radio size={16} /> Enter Draft Center
              </Link>
              <Link
                href="/sandbox/perform/big-board"
                className="px-8 py-3.5 bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl hover:bg-slate-100 transition-colors"
              >
                View Big Board
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-100 py-8">
        <div className="max-w-[1400px] mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-[0.6rem] font-mono uppercase tracking-widest text-slate-300">
          <span>Per|Form · A.I.M.S. Sports Intelligence Platform</span>
          <span>P.A.I. Grades Public · Formula Confidential · Powered by: A.I.M.S.</span>
        </div>
      </footer>

    </div>
  );
}
