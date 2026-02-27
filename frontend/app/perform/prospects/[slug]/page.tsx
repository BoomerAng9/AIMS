'use client';

/**
 * Per|Form Prospect Profile — Individual Scouting Page (Production)
 *
 * Full prospect breakdown: AGI grade, component scores, intelligence analysis.
 * "Luxury Industrial" editorial theme.
 */

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowUpRight, Shield, Swords, TrendingUp, Zap, Target, Activity, CheckCircle2 } from 'lucide-react';
import type { Prospect } from '@/lib/perform/types';
import { TIER_STYLES, getScoreColor } from '@/lib/perform/types';
import { staggerContainer, staggerItem } from '@/lib/motion/variants';

function RadialScore({ label, value, icon: Icon }: { label: string; value: number, icon: React.ComponentType<{ size?: number }> }) {
  const pct = Math.min(value, 100);
  const strokeDasharray = `${pct} 100`;

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white border border-slate-200 rounded-sm relative overflow-hidden group hover:border-emerald-500 transition-all shadow-sm">
      <div className="absolute top-4 right-4 text-slate-200 group-hover:text-emerald-100 transition-colors">
        <Icon size={32} />
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
            className={value >= 90 ? "text-emerald-600" : value >= 80 ? "text-emerald-500" : "text-slate-400"}
            strokeDasharray={strokeDasharray}
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center flex-col">
          <span className="text-3xl font-serif font-bold text-slate-950 tracking-tighter">{value}</span>
        </div>
      </div>

      <span className="text-[0.65rem] font-mono uppercase tracking-widest text-slate-500">{label}</span>
    </div>
  );
}

function AgiRow({ label, score }: { label: string, score: number }) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-slate-100 last:border-0">
      <span className="text-[11px] text-slate-500 font-bold uppercase tracking-tight">{label}</span>
      <div className="flex items-center gap-6">
        <div className="w-40 h-1 bg-slate-50 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${(score / 10) * 100}%` }} />
        </div>
        <span className="text-sm font-serif font-black text-slate-950 w-8 text-right">{score.toFixed(1)}</span>
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
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 border-2 border-gold/20 border-t-gold rounded-full animate-spin" />
          <p className="text-[0.65rem] text-slate-400 font-mono tracking-widest uppercase">Loading AGI Data...</p>
        </div>
      </div>
    );
  }

  if (error || !prospect) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <p className="text-slate-400 font-mono text-sm">Prospect not found.</p>
        <Link href="/perform/big-board" className="text-gold text-xs font-mono uppercase hover:underline">
          Return to Big Board
        </Link>
      </div>
    );
  }

  const isPrime = prospect.tier === 'TOP_5' || prospect.paiScore >= 100;

  // AGI sub-metrics derived from core prospect scores
  const agiCore = {
    game: (prospect.performance / 10),
    athletics: (prospect.athleticism / 10),
    production: ((prospect.performance + prospect.intangibles) / 20),
    competition: 9.8
  };

  const agiMods = {
    leadership: (prospect.intangibles / 10),
    upside: (prospect.athleticism / 10) + 0.5 > 10 ? 10 : (prospect.athleticism / 10) + 0.5,
    concerns: prospect.paiScore > 90 ? 1.5 : 4.5,
    confidence: (prospect.paiScore / 10)
  };

  return (
    <div className="pb-20">
      {/* Back Link */}
      <div className="max-w-[1200px] mx-auto px-6 pt-10">
        <Link href="/perform/ncaa-database" className="inline-flex items-center gap-2 text-[10px] text-slate-400 hover:text-emerald-700 transition-colors font-black uppercase tracking-[0.2em]">
          <ArrowLeft size={16} /> NCAA Database Registry
        </Link>
      </div>

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
            <div className="inline-flex items-center gap-3 px-3 py-1 bg-emerald-950 text-white rounded-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[9px] font-black tracking-[0.2em] uppercase">{prospect.school}</span>
            </div>

            <h1 className="text-6xl md:text-8xl font-serif font-bold tracking-tighter uppercase leading-[0.85] text-slate-950">
              {prospect.firstName} <br />
              <span className="italic text-emerald-700">{prospect.lastName}</span>
            </h1>

            <div className="flex flex-wrap items-center gap-6 text-[10px] font-black uppercase tracking-[0.2em]">
              <div className="text-emerald-800">{prospect.position}</div>
              <div className="text-slate-300">/</div>
              <div className="text-slate-400">{prospect.conference || prospect.state}</div>
              <div className="text-slate-300">/</div>
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
            <div className={`absolute inset-0 rounded-full blur-3xl opacity-10 ${isPrime ? 'bg-emerald-500' : 'bg-slate-100'}`} />

            <div className={`w-72 h-72 rounded-sm border border-slate-200 flex flex-col items-center justify-center relative bg-white z-10 shadow-2xl shadow-slate-200/50`}>
              <div className="text-[10px] font-black uppercase tracking-[0.3em] mb-4 text-slate-400">Associated Grading Index</div>
              <div className={`text-8xl font-serif font-bold tracking-tighter ${getScoreColor(prospect.paiScore)}`}>{prospect.paiScore}</div>
              <div className={`mt-6 px-4 py-1.5 rounded-sm text-[10px] font-black tracking-[0.2em] uppercase ${isPrime ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-800'}`}>
                {isPrime ? 'PRIME GRADE' : 'ELITE GRADE'}
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
        <motion.div variants={staggerItem} className="bg-white border border-slate-200 rounded-sm p-12 shadow-sm">
          <div className="flex items-center gap-6 mb-12 border-b border-slate-100 pb-8">
            <h2 className="text-3xl font-serif font-bold tracking-tight text-slate-950">AGI <span className="italic text-emerald-800">Intelligence Breakdown</span></h2>
            <span className="text-[9px] text-slate-400 font-black ml-auto uppercase tracking-[0.3em]">0-10 SCALED METRICS</span>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 pb-2 border-b border-slate-50">Dimensions</h3>
              <div className="space-y-1">
                <AgiRow label="Performance Utility" score={agiCore.game} />
                <AgiRow label="Biomechanical Metrics" score={agiCore.athletics} />
                <AgiRow label="Aggregate Production" score={agiCore.production} />
                <AgiRow label="Level of Competition" score={agiCore.competition} />
              </div>
            </div>
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 pb-2 border-b border-slate-50">Orchestration Modifiers</h3>
              <div className="space-y-1">
                <AgiRow label="Leadership & Signal" score={agiMods.leadership} />
                <AgiRow label="Athletic Ceiling" score={agiMods.upside} />
                <AgiRow label="Risk Profile" score={agiMods.concerns} />
                <AgiRow label="Orchestrator Confidence" score={agiMods.confidence} />
              </div>
            </div>
          </div>
        </motion.div>

        {/* ACHEEVY'S TAKE */}
        <motion.div variants={staggerItem} className="relative bg-white border border-slate-200 rounded-2xl p-8 overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gold" />
          <h3 className="text-[0.65rem] font-mono font-bold uppercase tracking-widest text-gold mb-4">ACHEEVY&#39;s Exclusive Take</h3>
          <p className="text-xl md:text-2xl font-serif italic text-slate-800 leading-relaxed font-light">
            &ldquo;{prospect.scoutMemo}&rdquo;
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

        {/* AI ANALYST PERSPECTIVES */}
        <motion.div variants={staggerItem} className="space-y-6">
          <h2 className="text-center text-[0.7rem] font-mono uppercase tracking-widest text-slate-400">AI Analyst Perspectives</h2>

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
                &ldquo;{prospect.bullCase}&rdquo;
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
                &ldquo;{prospect.bearCase}&rdquo;
              </p>
            </div>
          </div>
        </motion.div>

        {/* CROSS PLATFORM BENCHMARK */}
        <motion.div variants={staggerItem} className="space-y-6">
          <div className="flex items-center gap-4">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Platform Benchmarks</h2>
            <div className="h-px flex-1 bg-slate-100" />
          </div>
          <div className="w-full bg-white border border-slate-200 rounded-sm overflow-hidden shadow-sm">
            <div className="grid grid-cols-5 px-8 py-6 bg-slate-50 border-b border-slate-200 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
              <div className="col-span-2">System Authority</div>
              <div className="text-center">AGI Grade</div>
              <div className="text-center">Talent Utility</div>
              <div className="text-center">Production</div>
            </div>

            <div className="grid grid-cols-5 px-8 py-8 border-b border-slate-100 items-center">
              <div className="col-span-2 flex items-center gap-3 font-serif font-bold text-emerald-800 text-lg">
                PER<span className="italic text-emerald-600">|</span>FORM AGI
              </div>
              <div className="text-center font-serif font-black text-3xl text-emerald-700">{prospect.paiScore}</div>
              <div className="text-center font-bold text-sm text-slate-900">{agiCore.athletics.toFixed(1)}</div>
              <div className="text-center font-bold text-sm text-slate-900">{agiCore.production.toFixed(1)}</div>
            </div>

            <div className="grid grid-cols-5 px-8 py-8 items-center bg-slate-50/30">
              <div className="col-span-2 flex items-center gap-2 font-black text-[10px] uppercase tracking-widest text-slate-400">
                Industry Consensus
              </div>
              <div className="text-center font-serif font-bold text-xl text-slate-300">~93.5</div>
              <div className="text-center font-bold text-sm text-slate-300">9.0</div>
              <div className="text-center font-bold text-sm text-slate-300">9.2</div>
            </div>
          </div>
        </motion.div>

      </motion.div>
    </div>
  );
}
