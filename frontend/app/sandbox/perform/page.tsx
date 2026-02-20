'use client';

/**
 * Per|Form Hub — AI Sports Scouting + NIL Intelligence
 *
 * The public landing page for the Per|Form platform.
 * Links to Big Board, Prospect Profiles, and Content Feed.
 *
 * Services: Scout Hub (5001), Film Room (5002), War Room (5003)
 *
 * PROPRIETARY BOUNDARY:
 * - P.A.I. grades and tiers are PUBLIC (shown to users)
 * - Formula weights, AGI internals, and AGI modifiers are PRIVATE
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '@/lib/motion/variants';
import {
  ArrowRight,
  TrendingUp,
  FileText,
  Swords,
  Mic,
  Users,
  ListOrdered,
} from 'lucide-react';
import type { Prospect, ContentArticle } from '@/lib/perform/types';
import { TIER_STYLES, getScoreColor, getProspectSlug } from '@/lib/perform/types';

export default function PerFormHub() {
  const [topProspects, setTopProspects] = useState<Prospect[]>([]);
  const [recentContent, setRecentContent] = useState<ContentArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/perform/prospects').then(r => r.json()).catch(() => []),
      fetch('/api/perform/content').then(r => r.json()).catch(() => []),
    ]).then(([prospects, content]) => {
      setTopProspects(Array.isArray(prospects) ? prospects.slice(0, 5) : []);
      setRecentContent(Array.isArray(content) ? content.slice(0, 3) : []);
      setLoading(false);
    });
  }, []);

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="max-w-6xl mx-auto px-6 py-10 space-y-10"
    >
      {/* Hero */}
      <motion.header variants={staggerItem} className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/10 border border-emerald-400/20 text-emerald-400">
            <TrendingUp size={20} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-display text-white tracking-tight">
              Per|Form
            </h1>
            <p className="text-xs text-emerald-400/60 font-mono">
              AI Sports Scouting + NIL Intelligence
            </p>
          </div>
        </div>
        <p className="text-sm text-white/40 max-w-xl">
          Autonomous scouting powered by the P.A.I. grading system.
          Lil_Bull_Hawk argues underrated, Lil_Bear_Hawk argues overrated,
          and Chicken Hawk mediates. Every prospect is scored, ranked, and debated.
        </p>
      </motion.header>

      {/* Voice Entry */}
      <motion.div
        variants={staggerItem}
        className="wireframe-card p-6 rounded-2xl flex items-center gap-4"
      >
        <button
          type="button"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-gold/10 border-2 border-gold/30 text-gold hover:bg-gold/20 transition-colors animate-pulse-gold"
        >
          <Mic size={24} />
        </button>
        <div>
          <p className="text-sm text-white/70">
            &quot;Tell me about a player&quot;
          </p>
          <p className="text-[0.55rem] text-white/30 font-mono uppercase tracking-wider">
            Voice-first scouting — say a name, position, or school
          </p>
        </div>
      </motion.div>

      {/* Quick Nav */}
      <motion.div variants={staggerItem} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/sandbox/perform/big-board"
          className="wireframe-card rounded-2xl p-5 flex items-center gap-4 hover:border-gold/20 transition-colors group"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10 border border-gold/20 text-gold">
            <ListOrdered size={18} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-white group-hover:text-gold transition-colors">Big Board</p>
            <p className="text-[0.55rem] text-white/30 font-mono">Ranked prospect list with P.A.I. grades</p>
          </div>
          <ArrowRight size={14} className="text-white/15 group-hover:text-gold/40 transition-colors" />
        </Link>

        <Link
          href="/sandbox/perform/draft"
          className="wireframe-card rounded-2xl p-5 flex items-center gap-4 hover:border-emerald-400/20 transition-colors group"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/10 border border-emerald-400/20 text-emerald-400">
            <TrendingUp size={18} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-white group-hover:text-gold transition-colors">NFL Draft</p>
            <p className="text-[0.55rem] text-white/30 font-mono">Mock drafts, simulator, prospect grades</p>
          </div>
          <ArrowRight size={14} className="text-white/15 group-hover:text-gold/40 transition-colors" />
        </Link>

        <Link
          href="/sandbox/perform/redraft"
          className="wireframe-card rounded-2xl p-5 flex items-center gap-4 hover:border-red-400/20 transition-colors group"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-400/10 border border-red-400/20 text-red-400">
            <Swords size={18} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-white group-hover:text-gold transition-colors">2025 Redraft</p>
            <p className="text-[0.55rem] text-white/30 font-mono">AGI Accountability & Rookie Grades</p>
          </div>
          <ArrowRight size={14} className="text-white/15 group-hover:text-gold/40 transition-colors" />
        </Link>

        <Link
          href="/sandbox/perform/content"
          className="wireframe-card rounded-2xl p-5 flex items-center gap-4 hover:border-blue-400/20 transition-colors group"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-400/10 border border-blue-400/20 text-blue-400">
            <FileText size={18} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-white group-hover:text-gold transition-colors">Content Feed</p>
            <p className="text-[0.55rem] text-white/30 font-mono">Reports, debates, analysis</p>
          </div>
          <ArrowRight size={14} className="text-white/15 group-hover:text-gold/40 transition-colors" />
        </Link>

        <Link
          href="/sandbox/perform/war-room"
          className="wireframe-card rounded-2xl p-5 flex items-center gap-4 hover:border-amber-400/20 transition-colors group"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-400">
            <Swords size={18} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-white group-hover:text-gold transition-colors">War Room</p>
            <p className="text-[0.55rem] text-white/30 font-mono">Bull vs Bear live debates</p>
          </div>
          <ArrowRight size={14} className="text-white/15 group-hover:text-gold/40 transition-colors" />
        </Link>

        {/* NEW ANALYTICS MODALITIES */}
        <Link
          href="/sandbox/perform/state-boards"
          className="wireframe-card rounded-2xl p-5 flex items-center gap-4 hover:border-purple-400/20 transition-colors group"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-400/10 border border-purple-400/20 text-purple-400">
            <ListOrdered size={18} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-white group-hover:text-gold transition-colors">HS State Boards</p>
            <p className="text-[0.55rem] text-white/30 font-mono">Top 100 by State &middot; Stats only</p>
          </div>
          <ArrowRight size={14} className="text-white/15 group-hover:text-gold/40 transition-colors" />
        </Link>

        <Link
          href="/sandbox/perform/transfer-portal"
          className="wireframe-card rounded-2xl p-5 flex items-center gap-4 hover:border-cyan-400/20 transition-colors group"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 border border-cyan-400/20 text-cyan-400">
            <Users size={18} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-white group-hover:text-gold transition-colors">Transfer Matchmaker</p>
            <p className="text-[0.55rem] text-white/30 font-mono">AGI NIL value & Roster Alignment</p>
          </div>
          <ArrowRight size={14} className="text-white/15 group-hover:text-gold/40 transition-colors" />
        </Link>
      </motion.div>

      {/* Analytics Engine Explainer */}
      <motion.div variants={staggerItem} className="wireframe-card p-6 rounded-2xl bg-white/[0.01]">
        <h2 className="text-xs uppercase tracking-widest text-[#D4AF37] font-mono mb-4">
          Layered Analytics Engine & Deep Research
        </h2>
        <div className="grid gap-4 md:grid-cols-3 text-sm">
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-400/50" />
            <p className="text-white font-display text-lg mb-1">Tier 1: Quick Search</p>
            <p className="text-emerald-400/60 text-[0.65rem] font-mono mb-2 uppercase tracking-wide">Gemini 3.1 Pro / Flash</p>
            <p className="text-white/40 text-[0.65rem] leading-relaxed">
              Rapid retrieval for basic player stats, placeholder searches, and load-balanced high-traffic queries.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-400/50" />
            <p className="text-white font-display text-lg mb-1">Tier 2: Deep Research</p>
            <p className="text-blue-400/60 text-[0.65rem] font-mono mb-2 uppercase tracking-wide">OpenRouter / DeepMind</p>
            <p className="text-white/40 text-[0.65rem] leading-relaxed">
              Complex historical analytics and multi-variable comparison. Runs the "X-Factor" evaluation on prospects.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-amber-400/50" />
            <p className="text-white font-display text-lg mb-1">Tier 3: Targeted Crawl</p>
            <p className="text-amber-400/60 text-[0.65rem] font-mono mb-2 uppercase tracking-wide">Brave Search API</p>
            <p className="text-white/40 text-[0.65rem] leading-relaxed">
              Activated for hyper-local clippings, community rumblings, and undrafted high school gems.
            </p>
          </div>
        </div>
      </motion.div>

      {/* P.A.I. System Explainer — grades shown, formula NEVER exposed */}
      <motion.div variants={staggerItem} className="wireframe-card p-6 rounded-2xl">
        <h2 className="text-xs uppercase tracking-widest text-gold/50 font-mono mb-4">
          P.A.I. Grading System
        </h2>
        <div className="grid gap-4 md:grid-cols-3 text-sm">
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <p className="text-gold font-display text-lg mb-1">Performance</p>
            <p className="text-white/30 text-[0.65rem] mt-1">
              Stats from MaxPreps, ESPN, 247Sports — game production, efficiency, and consistency
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <p className="text-gold font-display text-lg mb-1">Athleticism</p>
            <p className="text-white/30 text-[0.65rem] mt-1">
              Film analysis via SAM 2 — speed, separation, explosiveness, and movement quality
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <p className="text-gold font-display text-lg mb-1">Intangibles</p>
            <p className="text-white/30 text-[0.65rem] mt-1">
              Leadership signals, coachability, media presence, and character analysis
            </p>
          </div>
        </div>
        <p className="text-[0.55rem] text-white/20 font-mono mt-4 text-center">
          Proprietary scoring methodology &middot; Component scores visible &middot; Formula weights confidential
        </p>
      </motion.div>

      {/* Top 5 Preview */}
      {!loading && topProspects.length > 0 && (
        <motion.section variants={staggerItem} className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs uppercase tracking-widest text-white/30 font-mono">
              Top Prospects
            </h2>
            <Link
              href="/sandbox/perform/big-board"
              className="text-[0.6rem] font-mono text-gold/50 hover:text-gold transition-colors flex items-center gap-1"
            >
              View Full Board <ArrowRight size={10} />
            </Link>
          </div>

          <div className="wireframe-card rounded-2xl overflow-hidden">
            {topProspects.map((prospect, i) => {
              const tierStyle = TIER_STYLES[prospect.tier];
              return (
                <Link
                  key={prospect.id}
                  href={`/sandbox/perform/prospects/${getProspectSlug(prospect)}`}
                  className={`flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors ${i < topProspects.length - 1 ? 'border-b border-white/[0.04]' : ''
                    }`}
                >
                  <span className="text-lg font-display text-white/40 w-8 text-center">
                    {prospect.nationalRank}
                  </span>
                  <div className={`flex-shrink-0 h-9 w-9 rounded-lg ${tierStyle.bg} border ${tierStyle.border} flex items-center justify-center text-xs font-display ${tierStyle.text}`}>
                    {prospect.position}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{prospect.name}</p>
                    <p className="text-[0.6rem] text-white/30 font-mono">
                      {prospect.school}, {prospect.state} &middot; {prospect.classYear}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xl font-display ${getScoreColor(prospect.paiScore)}`}>
                      {prospect.paiScore}
                    </span>
                    <p className="text-[0.5rem] font-mono text-white/20 uppercase">P.A.I.</p>
                  </div>
                  <ArrowRight size={14} className="text-white/10 flex-shrink-0" />
                </Link>
              );
            })}
          </div>
        </motion.section>
      )}

      {/* Recent Content Preview */}
      {!loading && recentContent.length > 0 && (
        <motion.section variants={staggerItem} className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs uppercase tracking-widest text-white/30 font-mono">
              Latest Content
            </h2>
            <Link
              href="/sandbox/perform/content"
              className="text-[0.6rem] font-mono text-gold/50 hover:text-gold transition-colors flex items-center gap-1"
            >
              View All <ArrowRight size={10} />
            </Link>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {recentContent.map(article => (
              <div
                key={article.id}
                className="wireframe-card rounded-2xl p-4 space-y-2"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[0.5rem] font-mono uppercase text-gold/50">
                    {article.type.replace('_', ' ')}
                  </span>
                  <span className="text-white/10">&middot;</span>
                  <span className="text-[0.5rem] font-mono text-white/20">
                    {article.readTimeMin} min
                  </span>
                </div>
                <p className="text-sm text-white/70 font-medium leading-snug">{article.title}</p>
                <p className="text-xs text-white/30 line-clamp-2">{article.excerpt}</p>
              </div>
            ))}
          </div>
        </motion.section>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block h-6 w-6 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
          <p className="text-xs text-white/30 mt-3 font-mono">Loading Per|Form data...</p>
        </div>
      )}

      {/* Pipeline Architecture */}
      <motion.div variants={staggerItem} className="wireframe-card p-6 rounded-2xl">
        <h2 className="text-xs uppercase tracking-widest text-gold/50 font-mono mb-4">
          Scouting Pipeline
        </h2>
        <div className="grid gap-4 md:grid-cols-3 text-sm">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
            <Users size={16} className="text-emerald-400 flex-shrink-0" />
            <div>
              <p className="text-white/60 font-medium text-xs">Scout Hub</p>
              <p className="text-white/25 text-[0.6rem] font-mono">Data aggregation + grading</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
            <FileText size={16} className="text-blue-400 flex-shrink-0" />
            <div>
              <p className="text-white/60 font-medium text-xs">Film Room</p>
              <p className="text-white/25 text-[0.6rem] font-mono">SAM 2 video analysis</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
            <Swords size={16} className="text-amber-400 flex-shrink-0" />
            <div>
              <p className="text-white/60 font-medium text-xs">War Room</p>
              <p className="text-white/25 text-[0.6rem] font-mono">Bull vs Bear debate engine</p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
