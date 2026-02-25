'use client';

/**
 * Per|Form 2025 Redraft Accountability Hub (Production)
 *
 * Showcases the AGI's grading accuracy by comparing pre-draft
 * P.A.I evaluations to actual rookie season performances.
 * Light theme per AIMS design system. No layout chrome — parent layout handles it.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowDownRight, ShieldAlert, Award, TrendingUp, CheckCircle2 } from 'lucide-react';
import { staggerContainer, staggerItem } from '@/lib/motion/variants';

export default function RedraftHubPage() {
  const [loading, setLoading] = useState(true);

  // Redraft data — in production this would come from the API
  const redraftCards = [
    {
      id: "cw25",
      name: "Cam Ward",
      position: "QB",
      nflTeam: "New York Giants",
      draftPick: "#3 Overall",
      pai: 86.0,
      paiTier: "TOP_5",
      rookieGrade: 64.0,
      rookieTier: "CHOICE",
      stats: "15 GP | 3188 YDS | 19 TD / 14 INT | 68.1 QBR",
      verdict: "The gunslinger tendencies showed up in the NFL. Too many turnovers in a difficult situation. The arm talent is real but the decision-making needs work.",
      status: "Under Evaluation",
      statusColor: "text-orange-400 border-orange-400/30 bg-orange-400/10"
    },
    {
      id: "th25",
      name: "Travis Hunter",
      position: "CB/WR",
      nflTeam: "Cleveland Browns",
      draftPick: "#2 Overall",
      pai: 95.0,
      paiTier: "TOP_5",
      rookieGrade: 91.0,
      rookieTier: "ELITE",
      stats: "17 GP | 4 INT | 14 PBU | 58 TKL | 24 REC / 312 YDS / 3 TD",
      verdict: "Lived up to the hype. Played CB primarily but was deployed on offense in key situations. Generational talent is translating. DROY candidate.",
      status: "Verified Validation",
      statusColor: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10"
    },
    {
      id: "ss25",
      name: "Shedeur Sanders",
      position: "QB",
      nflTeam: "Tennessee Titans",
      draftPick: "#1 Overall",
      pai: 88.0,
      paiTier: "TOP_5",
      rookieGrade: 72.0,
      rookieTier: "HIGH",
      stats: "17 GP | 3412 YDS | 22 TD / 11 INT | 74.2 QBR | 5W",
      verdict: "Showed the accuracy and poise that made him QB1. Titans' roster around him is thin. Improving as the season went on - Year 2 should be a leap.",
      status: "On Track",
      statusColor: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10"
    },
    {
      id: "ac25",
      name: "Abdul Carter",
      position: "EDGE",
      nflTeam: "New England Patriots",
      draftPick: "#4 Overall",
      pai: 93.0,
      paiTier: "TOP_5",
      rookieGrade: 87.0,
      rookieTier: "ELITE",
      stats: "17 GP | 9.5 SACKS | 16 TFL | 48 PRES | 82.4 PFF",
      verdict: "Immediate impact as a pass rusher. The Parsons comp is holding up. Patriots defense improved significantly with him on the edge. Made the Super Bowl.",
      status: "AGI Accuracy Highlight",
      statusColor: "text-gold border-gold/30 bg-gold/10"
    },
    {
      id: "aj25",
      name: "Ashton Jeanty",
      position: "RB",
      nflTeam: "Las Vegas Raiders",
      draftPick: "#6 Overall",
      pai: 82.0,
      paiTier: "TOP_15",
      rookieGrade: 55.0,
      rookieTier: "N/A",
      stats: "17 GP | 892 YDS | 6 TD | 3.8 YPC | 3 FUM",
      verdict: "The Raiders' top-10 RB pick has been widely criticized. Behind a terrible OL, Jeanty could not replicate his college dominance. The 3-14 record tells the story.",
      slide: "DRAFT SLIDE",
      status: "AGI Risk Warning Confirmed",
      statusColor: "text-red-400 border-red-400/30 bg-red-400/10",
      customMetric: { label: "AGI Known Concerns", value: "4.5 / 10" }
    },
    {
      id: "mg25",
      name: "Mason Graham",
      position: "DT",
      nflTeam: "New York Jets",
      draftPick: "#7 Overall",
      pai: 90.0,
      paiTier: "TOP_15",
      rookieGrade: 78.0,
      rookieTier: "HIGH",
      stats: "17 GP | 5 SACKS | 11 TFL | 34 PRES | 78.8 PFF",
      verdict: "Steady, reliable DT who anchored the Jets interior. Good not great rookie year but the foundation is there for a long career.",
      status: "On Track",
      statusColor: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10"
    }
  ];

  useEffect(() => {
    // Mimic network load
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="max-w-[1200px] mx-auto px-6 py-12 space-y-12"
    >
      {/* Header Section */}
      <motion.div variants={staggerItem} className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200">
        <div className="space-y-4 max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-display font-black tracking-tighter text-slate-800">
            2025 NFL Draft <span className="text-gold">Redraft</span>
          </h1>
          <p className="text-sm text-slate-500 leading-relaxed font-sans max-w-xl">
            According to the AGI: Re-grading draft night selections with total accountability.
            <span className="text-gold italic"> Precision analytics meet Sunday reality.</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-600 text-xs font-mono uppercase tracking-wider transition-colors">
            Past Ledgers
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-gold/10 hover:bg-gold/20 border border-gold/30 rounded-lg text-gold text-xs font-mono uppercase tracking-wider transition-colors">
            Full 2025 Ledger
          </button>
        </div>
      </motion.div>

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-4">
          <div className="h-8 w-8 border-2 border-gold/20 border-t-gold rounded-full animate-spin" />
          <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">Syncing Rookie ledgers...</span>
        </div>
      ) : (
        <motion.div variants={staggerItem} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {redraftCards.map((card) => (
            <div key={card.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-gold/30 transition-colors group flex flex-col h-full shadow-sm">

              {/* Visual Header (Color blocks mimicking jerseys) */}
              <div className="h-32 relative flex items-end p-4 border-b border-slate-100">
                <div className="absolute inset-0 bg-gradient-to-t from-white to-transparent z-10" />
                {/* Abstract bg color mapping based on team */}
                <div className={`absolute inset-0 opacity-20 ${
                  card.nflTeam.includes('Titans') ? 'bg-sky-500' :
                  card.nflTeam.includes('Browns') ? 'bg-orange-800' :
                  card.nflTeam.includes('Giants') ? 'bg-blue-600' :
                  card.nflTeam.includes('Patriots') ? 'bg-blue-900' :
                  card.nflTeam.includes('Raiders') ? 'bg-slate-800' :
                  card.nflTeam.includes('Jets') ? 'bg-green-700' :
                  'bg-slate-500'
                }`} />

                <div className="relative z-20 w-full flex justify-between items-center">
                  <div className="flex gap-2">
                    <span className="px-2 py-0.5 rounded text-[0.55rem] font-mono font-bold uppercase bg-slate-100 text-slate-800 backdrop-blur-md">
                      {card.draftPick}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[0.55rem] font-mono font-bold uppercase backdrop-blur-md ${
                      card.nflTeam.includes('Titans') ? 'bg-sky-500/20 text-sky-600' :
                      card.nflTeam.includes('Browns') ? 'bg-orange-800/20 text-orange-700' :
                      card.nflTeam.includes('Giants') ? 'bg-blue-600/20 text-blue-600' :
                      card.nflTeam.includes('Patriots') ? 'bg-blue-900/20 text-blue-800' :
                      card.nflTeam.includes('Raiders') ? 'bg-slate-800/20 text-slate-700' :
                      card.nflTeam.includes('Jets') ? 'bg-green-700/20 text-green-700' :
                      'bg-slate-500/20 text-slate-600'
                    }`}>
                      {card.nflTeam.split(' ').pop()}
                    </span>
                  </div>
                  {card.slide && (
                    <span className="px-2 py-0.5 rounded text-[0.55rem] font-mono font-bold uppercase bg-red-500/20 text-red-500 border border-red-500/50 flex items-center gap-1 backdrop-blur-md animate-pulse">
                      <ArrowDownRight size={10} /> {card.slide}
                    </span>
                  )}
                </div>
              </div>

              {/* Card Content */}
              <div className="p-6 flex flex-col flex-1 bg-white">
                <div className="mb-4">
                  <h2 className="text-2xl font-display font-bold text-slate-800 tracking-tight">{card.name} | <span className="text-slate-400">{card.position}</span></h2>
                  <p className="text-[0.65rem] font-mono text-slate-400 uppercase tracking-widest mt-1">&middot; {card.nflTeam} Selection</p>
                </div>

                {/* Grades Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-4 rounded-xl bg-white border border-slate-100 relative">
                    <div className="text-[0.55rem] font-mono uppercase tracking-widest text-slate-400 mb-1">Pre-Draft P.A.I.</div>
                    <div className="text-3xl font-display font-black text-gold">{card.pai.toFixed(1)}</div>
                    <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-gold/50 rounded-full" />
                  </div>

                  <div className="p-4 rounded-xl bg-white border border-slate-100 relative">
                    <div className="text-[0.55rem] font-mono uppercase tracking-widest text-slate-400 mb-1">Rookie Grade</div>
                    <div className={`text-3xl font-display font-black ${card.rookieGrade > 70 ? 'text-emerald-400' :
                      card.rookieGrade > 60 ? 'text-orange-400' : 'text-red-500'
                    }`}>
                      {card.rookieGrade.toFixed(1)}
                    </div>
                    <div className={`absolute bottom-0 left-4 right-4 h-0.5 rounded-full ${card.rookieGrade > 70 ? 'bg-emerald-400/50' :
                      card.rookieGrade > 60 ? 'bg-orange-400/50' : 'bg-red-500/50'
                    }`} />
                  </div>
                </div>

                {/* Custom Slide Metric if exists */}
                {card.customMetric && (
                  <div className="mb-6 flex items-center justify-between p-3 rounded bg-red-500/5 border border-red-500/10">
                    <span className="text-[0.6rem] font-mono text-red-400/70 uppercase tracking-widest">{card.customMetric.label}</span>
                    <span className="text-sm font-mono font-bold text-red-500">{card.customMetric.value}</span>
                  </div>
                )}

                {/* Verdict */}
                <div className="flex-1 space-y-3">
                  <div className="text-[0.65rem] font-mono uppercase tracking-widest text-gold/70">The Verdict</div>
                  <p className="text-sm font-serif italic text-slate-600 leading-relaxed">&ldquo;{card.verdict}&rdquo;</p>
                </div>

                {/* Bottom Stats & Status */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col gap-3">
                  <div className="text-xs font-mono text-slate-400">{card.stats}</div>
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded w-fit border text-[0.55rem] font-mono font-bold uppercase tracking-widest ${card.statusColor}`}>
                    <Award size={10} /> {card.status}
                  </div>
                </div>
              </div>

            </div>
          ))}
        </motion.div>
      )}

      {/* System Metrics Strip */}
      <motion.div variants={staggerItem} className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-200">
        <div className="p-4 rounded-xl bg-white border border-slate-100">
          <div className="text-[0.6rem] font-mono uppercase tracking-widest text-slate-400 mb-2">Predictive Accuracy</div>
          <div className="text-2xl font-display font-black text-slate-800 flex items-end gap-2">
            94.2% <span className="text-[0.6rem] font-mono text-emerald-400 uppercase tracking-widest flex items-center mb-1"><TrendingUp size={10} /> +2.1%</span>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-100">
          <div className="text-[0.6rem] font-mono uppercase tracking-widest text-slate-400 mb-2">Rookie Regressions</div>
          <div className="text-2xl font-display font-black text-slate-800 flex items-end gap-2">
            12.4% <span className="text-[0.6rem] font-mono text-emerald-400 uppercase tracking-widest flex items-center mb-1"><TrendingUp size={10} className="rotate-180" /> -0.5%</span>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-100">
          <div className="text-[0.6rem] font-mono uppercase tracking-widest text-slate-400 mb-2">System Confidence</div>
          <div className="text-2xl font-display font-black text-slate-800 flex items-end gap-2">
            98.9% <span className="text-[0.6rem] font-mono text-emerald-400 uppercase tracking-widest flex items-center mb-1"><TrendingUp size={10} /> +0.3%</span>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-100">
          <div className="text-[0.6rem] font-mono uppercase tracking-widest text-slate-400 mb-2">Data Integrity</div>
          <div className="text-2xl font-display font-black text-slate-800 flex items-end gap-2">
            99.9% <span className="text-[0.6rem] font-mono text-slate-400 uppercase tracking-widest flex items-center mb-1">STABLE</span>
          </div>
        </div>
      </motion.div>

      {/* Footer Propaganda Block */}
      <motion.div variants={staggerItem} className="mt-12 bg-gold/5 border border-gold/20 rounded-2xl p-12 text-center relative overflow-hidden flex flex-col items-center">
        <div className="h-10 w-10 bg-gold/10 border border-gold/30 rounded-lg flex items-center justify-center text-gold mb-6 shadow-[0_0_20px_rgba(212,175,55,0.2)]">
          <ShieldAlert size={20} />
        </div>
        <h2 className="text-4xl md:text-5xl font-display font-black text-slate-800 italic tracking-tighter max-w-2xl mx-auto leading-tight">
          &ldquo;The AGI doesn&#39;t just grade prospects. <span className="text-gold">It grades itself.</span>&rdquo;
        </h2>
        <p className="text-sm font-mono text-slate-500 uppercase tracking-widest mt-6">
          Real-time accountability tracking for the next generation of football intelligence.
        </p>
        <div className="flex gap-4 mt-8">
          <Link href="/perform/big-board" className="px-6 py-3 bg-gold text-black text-xs font-mono font-bold uppercase tracking-widest rounded-lg hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all">
            Explore Big Board
          </Link>
          <button className="px-6 py-3 bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-100 text-xs font-mono font-bold uppercase tracking-widest rounded-lg transition-all">
            Request API Access
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
