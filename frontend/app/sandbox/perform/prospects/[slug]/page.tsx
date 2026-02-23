'use client';

/**
 * Per|Form Prospect Profile — Individual Scouting Page
 *
 * Full prospect breakdown: P.A.I. grade, component scores, AGI analysis.
 * Styled to exact AGI Engine dark mode specifications.
 */

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowUpRight, Shield, Swords, TrendingUp, Zap, Target, Activity, CheckCircle2 } from 'lucide-react';
import type { Prospect } from '@/lib/perform/types';
import { TIER_STYLES, getScoreColor } from '@/lib/perform/types';
import { staggerContainer, staggerItem } from '@/lib/motion/variants';

function RadialScore({ label, value, icon: Icon }: { label: string; value: number, icon: any }) {
  const pct = Math.min(value, 100);
  const strokeDasharray = `${pct} 100`;

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white border border-slate-200 rounded-2xl relative overflow-hidden group hover:border-gold/30 transition-colors">
      <div className="absolute top-4 right-4 text-slate-300 group-hover:text-gold/20 transition-colors">
        <Icon size={24} />
      </div>

      <div className="relative w-24 h-24 mb-4">
        <svg viewBox="0 0 36 36" className="w-24 h-24 transform -rotate-90">
          {/* Background Circle */}
          <path
            className="text-slate-200"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
          {/* Progress Circle */}
          <path
            className={value >= 95 ? "text-gold" : value >= 90 ? "text-emerald-400" : "text-slate-400"}
            strokeDasharray={strokeDasharray}
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center flex-col">
          <span className="text-2xl font-display font-bold text-slate-800 tracking-tighter">{value}</span>
        </div>
      </div>

      <span className="text-[0.65rem] font-mono uppercase tracking-widest text-slate-500">{label}</span>
    </div>
  );
}

function AgiRow({ label, score }: { label: string, score: number }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
      <span className="text-xs text-slate-500 font-medium">{label}</span>
      <div className="flex items-center gap-4">
        <div className="w-32 h-1.5 bg-slate-50 rounded-full overflow-hidden">
          <div className="h-full bg-gold/70 rounded-full" style={{ width: `${(score / 10) * 100}%` }} />
        </div>
        <span className="text-xs font-mono font-bold text-slate-800 w-6 text-right">{score.toFixed(1)}</span>
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 border-2 border-gold/20 border-t-gold rounded-full animate-spin" />
          <p className="text-[0.65rem] text-slate-400 font-mono tracking-widest uppercase">Loading AGI Data...</p>
        </div>
      </div>
    );
  }

  if (error || !prospect) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
        <p className="text-slate-400 font-mono text-sm">Prospect not found.</p>
        <Link href="/sandbox/perform/big-board" className="text-gold text-xs font-mono uppercase hover:underline">
          Return to Big Board
        </Link>
      </div>
    );
  }

  const isPrime = prospect.tier === 'TOP_5' || prospect.paiScore >= 100;

  // Mock AGI sub-metrics for the frontend (since they aren't explicitly in the seed data schema yet, we derive them for the UI)
  const agiCore = {
    game: (prospect.performance / 10),
    athletics: (prospect.athleticism / 10),
    production: ((prospect.performance + prospect.intangibles) / 20),
    competition: 9.8 // static mock for top tier
  };

  const agiMods = {
    leadership: (prospect.intangibles / 10),
    upside: (prospect.athleticism / 10) + 0.5 > 10 ? 10 : (prospect.athleticism / 10) + 0.5,
    concerns: prospect.paiScore > 90 ? 1.5 : 4.5,
    confidence: (prospect.paiScore / 10)
  };

  return (
    <div className="min-h-screen bg-white text-slate-800 selection:bg-gold/30 pb-20">
      {/* Top Nav */}
      <nav className="border-b border-slate-100 bg-white/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/sandbox/perform/big-board" className="flex items-center gap-2 text-[0.65rem] text-slate-400 hover:text-gold transition-colors font-mono uppercase tracking-widest">
            <ArrowLeft size={14} /> Back to Big Board
          </Link>
          <div className="text-[0.6rem] font-mono tracking-widest text-gold/50">
            AGI PROSPECT DOSSIER
          </div>
        </div>
      </nav>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="max-w-[1200px] mx-auto px-6 py-12 space-y-12"
      >
        {/* HERO SECTION */}
        <motion.div variants={staggerItem} className="flex flex-col lg:flex-row items-center justify-between gap-12">
          {/* Left: Identity */}
          <div className="space-y-6 flex-1">
            <div className="inline-flex items-center gap-3 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full">
              <span className="h-2 w-2 rounded-full bg-gold animate-pulse" />
              <span className="text-[0.6rem] font-mono tracking-widest uppercase text-slate-500">{prospect.school}</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-display font-black tracking-tighter uppercase leading-[0.9]">
              {prospect.firstName} <br />
              <span className={isPrime ? "text-slate-800" : "text-slate-800"}>{prospect.lastName}</span>
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs font-mono font-bold uppercase tracking-wider">
              <div className="px-3 py-1 bg-gold/10 text-gold border border-gold/30 rounded">{prospect.position}</div>
              <div className="text-slate-400">{prospect.conference || prospect.state}</div>
              <div className="text-slate-400">{prospect.classYear}</div>
            </div>

            {prospect.tags && prospect.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-100">
                {prospect.tags.map(tag => (
                  <span key={tag} className="px-3 py-1.5 rounded bg-white border border-slate-100 text-[0.6rem] text-gold/70 font-mono uppercase tracking-widest flex items-center gap-1">
                    <CheckCircle2 size={10} /> {tag.replace(/-/g, ' ')}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Right: Big Circle Score */}
          <div className="shrink-0 relative flex items-center justify-center">
            {/* Glow ring */}
            <div className={`absolute inset-0 rounded-full blur-3xl opacity-20 ${isPrime ? 'bg-gold' : 'bg-slate-100'}`} />

            <div className={`w-64 h-64 rounded-full border-[3px] border-dashed flex flex-col items-center justify-center relative bg-white z-10 ${isPrime ? 'border-gold shadow-[0_0_50px_rgba(212,175,55,0.15)] text-gold' : 'border-slate-200 text-slate-800'}`}>
              <div className="text-[0.6rem] font-mono uppercase tracking-widest mb-1 opacity-60">P.A.I. Score</div>
              <div className="text-7xl font-display font-black tracking-tighter">{prospect.paiScore.toFixed(1)}</div>
              <div className={`mt-2 px-3 py-1 rounded text-[0.65rem] font-bold font-mono tracking-widest uppercase ${isPrime ? 'bg-gold text-black' : 'bg-slate-100 text-slate-800'}`}>
                {isPrime ? 'PRIME TIER' : 'ELITE TIER'}
              </div>
            </div>
          </div>
        </motion.div>

        {/* 3 RADIAL DIALS (P.A.I Breakdown) */}
        <motion.div variants={staggerItem} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <RadialScore label="Performance" value={prospect.performance} icon={Target} />
          <RadialScore label="Athleticism" value={prospect.athleticism} icon={Zap} />
          <RadialScore label="Intangibles" value={prospect.intangibles} icon={Activity} />
        </motion.div>

        {/* AGI BREAKDOWN TABLE */}
        <motion.div variants={staggerItem} className="bg-white border border-slate-200 rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-6 w-1 bg-gold rounded-full" />
            <h2 className="text-lg font-display font-bold uppercase tracking-widest">AGI Breakdown</h2>
            <span className="text-[0.6rem] text-gold/50 font-mono ml-auto">0-10 SCALED METRICS</span>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-[0.65rem] font-mono uppercase tracking-widest text-slate-400 mb-4 border-b border-slate-200 pb-2">AGI Core</h3>
              <div className="space-y-1">
                <AgiRow label="Game Performance" score={agiCore.game} />
                <AgiRow label="Raw Athletics" score={agiCore.athletics} />
                <AgiRow label="Overall Production" score={agiCore.production} />
                <AgiRow label="Competition Level" score={agiCore.competition} />
              </div>
            </div>
            <div>
              <h3 className="text-[0.65rem] font-mono uppercase tracking-widest text-slate-400 mb-4 border-b border-slate-200 pb-2">AGI Modifiers</h3>
              <div className="space-y-1">
                <AgiRow label="Leadership" score={agiMods.leadership} />
                <AgiRow label="Upside Ceiling" score={agiMods.upside} />
                <AgiRow label="Known Concerns" score={agiMods.concerns} />
                <AgiRow label="Evaluator Confidence" score={agiMods.confidence} />
              </div>
            </div>
          </div>
        </motion.div>

        {/* ACHEEVY'S TAKE */}
        <motion.div variants={staggerItem} className="relative bg-white border border-slate-200 rounded-2xl p-8 overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gold" />
          <h3 className="text-[0.65rem] font-mono font-bold uppercase tracking-widest text-gold mb-4">ACHEEVY's Exclusive Take</h3>
          <p className="text-xl md:text-2xl font-serif italic text-slate-800 leading-relaxed font-light">
            "{prospect.scoutMemo}"
          </p>
          <div className="mt-6 flex items-center gap-3">
            <div className="h-8 w-8 rounded bg-gold/20 flex items-center justify-center text-gold border border-gold/30">
              <Shield size={14} />
            </div>
            <div>
              <div className="text-xs font-display font-bold text-slate-800">ACHEEVY AGI</div>
              <div className="text-[0.55rem] font-mono text-slate-400 uppercase tracking-widest">Chief Predictive Architect</div>
            </div>
          </div>
        </motion.div>

        {/* BOOMER_ANG ANALYSTS */}
        <motion.div variants={staggerItem} className="space-y-6">
          <h2 className="text-center text-[0.7rem] font-mono uppercase tracking-widest text-slate-400">Boomer_Ang AI Analyst Perspectives</h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 relative shadow-sm">
              <div className="absolute top-6 right-6 text-emerald-500">
                <TrendingUp size={16} />
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center">
                  <span className="text-[0.6rem] font-mono text-emerald-600">PT</span>
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-800">PrimeTime Jr.</div>
                  <div className="text-[0.55rem] font-mono text-emerald-600 uppercase tracking-widest bg-emerald-50 px-1.5 py-0.5 inline-block rounded mt-1">Bull Case</div>
                </div>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed italic">
                "{prospect.bullCase}"
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 relative shadow-sm">
              <div className="absolute top-6 right-6 text-red-400">
                <TrendingUp size={16} className="rotate-180" />
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-red-50 border-2 border-red-200 flex items-center justify-center">
                  <span className="text-[0.6rem] font-mono text-red-500">Prof</span>
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-800">The Professor</div>
                  <div className="text-[0.55rem] font-mono text-red-400 uppercase tracking-widest bg-red-400/10 px-1.5 py-0.5 inline-block rounded mt-1">Bear Case</div>
                </div>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed italic">
                "{prospect.bearCase}"
              </p>
            </div>
          </div>
        </motion.div>

        {/* CROSS PLATFORM BENCHMARK (Mock Display) */}
        <motion.div variants={staggerItem} className="space-y-4">
          <h2 className="text-[0.7rem] inline-block px-3 py-1 bg-slate-50 border border-slate-200 rounded font-mono uppercase tracking-widest text-slate-500">Benchmark Comparison</h2>
          <div className="w-full bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-5 px-6 py-4 bg-white border-b border-slate-100 text-[0.6rem] font-mono uppercase tracking-widest text-slate-400">
              <div className="col-span-2">Platform</div>
              <div className="text-center">Overall Grade</div>
              <div className="text-center">Raw Talent</div>
              <div className="text-center">Production</div>
            </div>

            <div className="grid grid-cols-5 px-6 py-4 border-b border-slate-200 items-center">
              <div className="col-span-2 flex items-center gap-2 font-display font-bold text-gold">
                PER|FORM AGI
              </div>
              <div className="text-center font-display font-black text-xl text-gold">{prospect.paiScore.toFixed(1)}</div>
              <div className="text-center font-mono text-sm text-slate-600">{agiCore.athletics.toFixed(1)}</div>
              <div className="text-center font-mono text-sm text-slate-600">{agiCore.production.toFixed(1)}</div>
            </div>

            <div className="grid grid-cols-5 px-6 py-4 border-b border-slate-200 items-center">
              <div className="col-span-2 flex items-center gap-2 font-sans font-semibold text-slate-500 text-sm">
                Consensus Data
              </div>
              <div className="text-center font-display font-semibold text-lg text-slate-400">~93.5</div>
              <div className="text-center font-mono text-sm text-slate-400">9.0</div>
              <div className="text-center font-mono text-sm text-slate-400">9.2</div>
            </div>
          </div>
        </motion.div>

      </motion.div>
    </div>
  );
}
