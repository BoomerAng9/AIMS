'use client';

/**
 * Per|Form Prospect Profile — Individual Scouting Page
 *
 * Full prospect breakdown: P.A.I. grade, component scores, scouting report,
 * Bull vs Bear debate, stats, and NIL estimate.
 *
 * PROPRIETARY: Grade and tier are displayed. Formula weights are NEVER shown.
 */

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowUpRight, Shield, Swords, TrendingUp } from 'lucide-react';
import type { Prospect } from '@/lib/perform/types';
import { TIER_STYLES, TREND_STYLES, getScoreColor } from '@/lib/perform/types';
import { staggerContainer, staggerItem } from '@/lib/motion/variants';

function ScoreBar({ label, value }: { label: string; value: number }) {
  const pct = Math.min(value, 100);
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-white/50">{label}</span>
        <span className={`font-display ${getScoreColor(value)}`}>{value}</span>
      </div>
      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full rounded-full bg-gradient-to-r from-gold/60 to-gold"
        />
      </div>
    </div>
  );
}

export default function ProspectProfilePage() {
  const params = useParams();
  const slug = params.slug as string;
  const [prospect, setProspect] = useState<Prospect | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/perform/prospects?slug=${encodeURIComponent(slug)}`)
      .then(res => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then(data => {
        setProspect(data);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20 text-center">
        <div className="inline-block h-6 w-6 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
        <p className="text-xs text-white/30 mt-3 font-mono">Loading prospect...</p>
      </div>
    );
  }

  if (error || !prospect) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20 text-center space-y-4">
        <p className="text-white/40">Prospect not found.</p>
        <Link href="/sandbox/perform/big-board" className="text-gold text-sm hover:underline">
          Back to Big Board
        </Link>
      </div>
    );
  }

  const tierStyle = TIER_STYLES[prospect.tier];
  const trendStyle = TREND_STYLES[prospect.trend];

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="max-w-4xl mx-auto px-6 py-10 space-y-8"
    >
      {/* Back nav */}
      <motion.div variants={staggerItem}>
        <Link
          href="/sandbox/perform/big-board"
          className="inline-flex items-center gap-2 text-xs text-white/30 hover:text-gold transition-colors font-mono uppercase tracking-wider"
        >
          <ArrowLeft size={12} />
          Big Board
        </Link>
      </motion.div>

      {/* Hero Card */}
      <motion.div variants={staggerItem} className={`wireframe-card rounded-2xl p-6 md:p-8 ${tierStyle.glow}`}>
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          {/* Identity */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className={`px-2.5 py-1 rounded-lg text-[0.55rem] font-mono uppercase border ${tierStyle.bg} ${tierStyle.border} ${tierStyle.text}`}>
                {tierStyle.label}
              </span>
              <span className={`text-xs ${trendStyle.color}`}>
                {trendStyle.icon} {trendStyle.label}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-display text-white tracking-tight">
              {prospect.name}
            </h1>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-white/40">
              <span className="font-mono">{prospect.position}</span>
              <span>&middot;</span>
              <span>{prospect.school}, {prospect.state}</span>
              <span>&middot;</span>
              <span>Class of {prospect.classYear}</span>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/30">
              <span>{prospect.height} &middot; {prospect.weight} lbs</span>
              {prospect.gpa && <span>GPA: {prospect.gpa}</span>}
            </div>
          </div>

          {/* P.A.I. Score */}
          <div className="text-center md:text-right space-y-1">
            <div className={`text-5xl md:text-6xl font-display ${getScoreColor(prospect.paiScore)}`}>
              {prospect.paiScore}
            </div>
            <div className="text-[0.6rem] font-mono uppercase tracking-widest text-white/25">
              P.A.I. Score
            </div>
            <div className="text-xs text-white/30 font-mono">
              #{prospect.nationalRank} National &middot; #{prospect.positionRank} {prospect.position}
            </div>
          </div>
        </div>

        {/* Component Scores */}
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <ScoreBar label="Performance" value={prospect.performance} />
          <ScoreBar label="Athleticism" value={prospect.athleticism} />
          <ScoreBar label="Intangibles" value={prospect.intangibles} />
        </div>

        {/* Tags */}
        <div className="mt-6 flex flex-wrap gap-2">
          {prospect.tags.map(tag => (
            <span key={tag} className="px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/5 text-[0.6rem] text-white/40 font-mono">
              {tag}
            </span>
          ))}
        </div>
      </motion.div>

      {/* Two-column: Scout Memo + Stats */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Scout Memo */}
        <motion.div variants={staggerItem} className="wireframe-card rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-[0.6rem] font-mono uppercase tracking-widest text-white/25">
            <Shield size={12} />
            Scouting Report
          </div>
          <p className="text-sm text-white/60 leading-relaxed">
            {prospect.scoutMemo}
          </p>
          {prospect.comparisons.length > 0 && (
            <div className="pt-3 border-t border-white/5">
              <p className="text-[0.55rem] font-mono uppercase text-white/20 mb-2">Player Comps</p>
              {prospect.comparisons.map(comp => (
                <p key={comp} className="text-xs text-gold/70 italic">&ldquo;{comp}&rdquo;</p>
              ))}
            </div>
          )}
        </motion.div>

        {/* Stats */}
        <motion.div variants={staggerItem} className="wireframe-card rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-[0.6rem] font-mono uppercase tracking-widest text-white/25">
            <TrendingUp size={12} />
            Key Stats
          </div>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(prospect.stats).map(([key, value]) => (
              <div key={key} className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <p className="text-lg font-display text-white">{value}</p>
                <p className="text-[0.55rem] font-mono uppercase text-white/25 mt-0.5">{key}</p>
              </div>
            ))}
          </div>
          <div className="pt-3 border-t border-white/5 flex items-center justify-between">
            <span className="text-[0.55rem] font-mono text-white/20 uppercase">NIL Estimate</span>
            <span className="text-sm text-gold font-mono">{prospect.nilEstimate}</span>
          </div>
        </motion.div>
      </div>

      {/* Bull vs Bear Debate */}
      <motion.div variants={staggerItem} className="wireframe-card rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2 text-[0.6rem] font-mono uppercase tracking-widest text-white/25">
          <Swords size={12} />
          Bull vs Bear Debate
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Bull */}
          <div className="p-4 rounded-xl bg-emerald-400/5 border border-emerald-400/10 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase text-emerald-400">Lil_Bull_Hawk</span>
              <span className="text-[0.5rem] font-mono uppercase text-emerald-400/50 border border-emerald-400/20 px-1.5 py-0.5 rounded">Underrated</span>
              {prospect.debateWinner === 'BULL' && (
                <span className="text-[0.5rem] font-mono uppercase text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded">Winner</span>
              )}
            </div>
            <p className="text-sm text-white/50 leading-relaxed">&ldquo;{prospect.bullCase}&rdquo;</p>
          </div>

          {/* Bear */}
          <div className="p-4 rounded-xl bg-red-400/5 border border-red-400/10 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase text-red-400">Lil_Bear_Hawk</span>
              <span className="text-[0.5rem] font-mono uppercase text-red-400/50 border border-red-400/20 px-1.5 py-0.5 rounded">Overrated</span>
              {prospect.debateWinner === 'BEAR' && (
                <span className="text-[0.5rem] font-mono uppercase text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded">Winner</span>
              )}
            </div>
            <p className="text-sm text-white/50 leading-relaxed">&ldquo;{prospect.bearCase}&rdquo;</p>
          </div>
        </div>

        {/* Mediation */}
        <div className="p-4 rounded-xl bg-gold/5 border border-gold/10 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase text-gold/60">Chicken Hawk — Mediation</span>
            {prospect.debateWinner === 'SPLIT' && (
              <span className="text-[0.5rem] font-mono uppercase text-gold bg-gold/10 px-1.5 py-0.5 rounded">Split Decision</span>
            )}
          </div>
          <p className="text-sm text-white/40 leading-relaxed">&ldquo;{prospect.mediationVerdict}&rdquo;</p>
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div variants={staggerItem} className="flex flex-wrap gap-3">
        <Link
          href="/sandbox/perform/big-board"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/[0.02] text-xs text-white/50 hover:text-gold hover:border-gold/20 transition-colors"
        >
          <ArrowLeft size={14} />
          Big Board
        </Link>
        <Link
          href="/sandbox/perform/content"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/[0.02] text-xs text-white/50 hover:text-gold hover:border-gold/20 transition-colors"
        >
          Content Feed
          <ArrowUpRight size={14} />
        </Link>
      </motion.div>
    </motion.div>
  );
}
