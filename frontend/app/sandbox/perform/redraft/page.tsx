'use client';

/**
 * Per|Form 2025 Redraft Accountability Hub
 *
 * Showcases the AGI's grading accuracy by comparing pre-draft
 * P.A.I evaluations to actual rookie season performances.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowDownRight, ShieldAlert, Award, TrendingUp, CheckCircle2 } from 'lucide-react';
import { staggerContainer, staggerItem } from '@/lib/motion/variants';

// Note: since this is just UI demonstration for the redraft, we fetch the prospects from our seed endpoint 
// The actual endpoint might change, but we'll try to fetch all and filter by redraft if available, 
// or for now, just fallback to mocked static structure if we don't have a dedicated redraft API yet.

export default function RedraftHubPage() {
    const [loading, setLoading] = useState(true);

    // In a real implementation we'd fetch the RedraftProspects from an API.
    // We'll mimic the layout for Cam Ward, Travis Hunter, and Shedeur Sanders based on the exact seed data.
    const redraftCards = [
        {
            id: "cw25",
            name: "Cam Ward",
            position: "QB",
            nflTeam: "Tennessee Titans",
            draftPick: "#1 Overall",
            pai: 96.2,
            paiTier: "PRIME",
            rookieGrade: 72.4,
            rookieTier: "HIGH",
            stats: "17 GP | 3169 YDS | 15 TD / 7 INT | 80.2 RTG",
            verdict: "Elite processing translated immediately. AGI predicted 94% accuracy in high-pressure snaps; actual rate 92.8%.",
            status: "Verified Validation",
            statusColor: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10"
        },
        {
            id: "th25",
            name: "Travis Hunter",
            position: "WR/CB",
            nflTeam: "Jacksonville Jaguars",
            draftPick: "#2 Overall",
            pai: 99.1,
            paiTier: "PRIME",
            rookieGrade: 68.0,
            rookieTier: "CHOICE",
            stats: "7 GP | 412 YDS | 3 TD",
            verdict: "Performance metrics remain top-tier, but durability coefficients triggered the AGI's 'Risk Threshold' protocol in Week 8.",
            injury: "INJURY FLAG",
            status: "PRIME On Hold",
            statusColor: "text-orange-400 border-orange-400/30 bg-orange-400/10"
        },
        {
            id: "ss25",
            name: "Shedeur Sanders",
            position: "QB",
            nflTeam: "Cleveland Browns",
            draftPick: "Round 5 (#144)",
            pai: 91.5,
            paiTier: "ELITE",
            rookieGrade: 55.0,
            rookieTier: "N/A",
            stats: "0 GP | Practice Squad",
            verdict: "System correctly prioritized data volatility over media narrative. Predicted slide materialized due to play-style fragility.",
            slide: "DRAFT SLIDE",
            status: "AGI Accuracy Highlight",
            statusColor: "text-red-400 border-red-400/30 bg-red-400/10",
            customMetric: { label: "AGI Known Concerns", value: "3.2 / 10" }
        }
    ];

    useEffect(() => {
        // Mimic network load
        const timer = setTimeout(() => setLoading(false), 800);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-gold/30 pb-24">
            {/* Top Nav */}
            <nav className="border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/sandbox/perform" className="flex items-center gap-2 text-[0.65rem] text-white/40 hover:text-gold transition-colors font-mono uppercase tracking-widest">
                        <ArrowLeft size={14} /> Per|Form Hub
                    </Link>
                    <div className="text-[0.6rem] font-mono tracking-widest text-gold/50 flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                        LIVE PERFORMANCE FEED
                    </div>
                </div>
            </nav>

            <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="max-w-[1200px] mx-auto px-6 py-12 space-y-12"
            >
                {/* Header Section */}
                <motion.div variants={staggerItem} className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/10">
                    <div className="space-y-4 max-w-2xl">
                        <h1 className="text-4xl md:text-5xl font-display font-black tracking-tighter text-white">
                            2025 NFL Draft <span className="text-gold">Redraft</span>
                        </h1>
                        <p className="text-sm text-white/60 leading-relaxed font-sans max-w-xl">
                            According to the AGI: Re-grading draft night selections with total accountability.
                            <span className="text-gold italic"> Precision analytics meet Sunday reality.</span>
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/70 text-xs font-mono uppercase tracking-wider transition-colors">
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
                        <span className="text-xs font-mono text-white/30 uppercase tracking-widest">Syncing Rookie ledgers...</span>
                    </div>
                ) : (
                    <motion.div variants={staggerItem} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {redraftCards.map((card) => (
                            <div key={card.id} className="bg-[#0f0f0f] border border-white/10 rounded-2xl overflow-hidden hover:border-gold/30 transition-colors group flex flex-col h-full shadow-2xl">

                                {/* Visual Header Mock (Color blocks mimicking jerseys) */}
                                <div className="h-32 relative flex items-end p-4 border-b border-white/5">
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] to-transparent z-10" />
                                    {/* Abstract bg color mapping based on team */}
                                    <div className={`absolute inset-0 opacity-20 ${card.nflTeam.includes('Titans') ? 'bg-sky-500' :
                                            card.nflTeam.includes('Jaguars') ? 'bg-teal-500' : 'bg-orange-800'
                                        }`} />

                                    <div className="relative z-20 w-full flex justify-between items-center">
                                        <div className="flex gap-2">
                                            <span className="px-2 py-0.5 rounded text-[0.55rem] font-mono font-bold uppercase bg-white/10 text-white backdrop-blur-md">
                                                {card.draftPick}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded text-[0.55rem] font-mono font-bold uppercase backdrop-blur-md ${card.nflTeam.includes('Titans') ? 'bg-sky-500/20 text-sky-400' :
                                                    card.nflTeam.includes('Jaguars') ? 'bg-teal-500/20 text-teal-400' : 'bg-orange-800/20 text-orange-400'
                                                }`}>
                                                {card.nflTeam.split(' ')[1]}
                                            </span>
                                        </div>
                                        {card.injury && (
                                            <span className="px-2 py-0.5 rounded text-[0.55rem] font-mono font-bold uppercase bg-red-500/20 text-red-500 border border-red-500/50 flex items-center gap-1 backdrop-blur-md">
                                                <ShieldAlert size={10} /> {card.injury}
                                            </span>
                                        )}
                                        {card.slide && (
                                            <span className="px-2 py-0.5 rounded text-[0.55rem] font-mono font-bold uppercase bg-red-500/20 text-red-500 border border-red-500/50 flex items-center gap-1 backdrop-blur-md animate-pulse">
                                                <ArrowDownRight size={10} /> {card.slide}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Card Content */}
                                <div className="p-6 flex flex-col flex-1 bg-[#0f0f0f]">
                                    <div className="mb-4">
                                        <h2 className="text-2xl font-display font-bold text-white tracking-tight">{card.name} | <span className="text-white/40">{card.position}</span></h2>
                                        <p className="text-[0.65rem] font-mono text-white/40 uppercase tracking-widest mt-1">&middot; {card.nflTeam} Selection</p>
                                    </div>

                                    {/* Grades Grid */}
                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 relative">
                                            <div className="text-[0.55rem] font-mono uppercase tracking-widest text-white/40 mb-1">Pre-Draft P.A.I.</div>
                                            <div className="text-3xl font-display font-black text-gold">{card.pai.toFixed(1)}</div>
                                            <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-gold/50 rounded-full" />
                                        </div>

                                        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 relative">
                                            <div className="text-[0.55rem] font-mono uppercase tracking-widest text-white/40 mb-1">Rookie Grade</div>
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
                                        <p className="text-sm font-serif italic text-white/70 leading-relaxed">&ldquo;{card.verdict}&rdquo;</p>
                                    </div>

                                    {/* Bottom Stats & Status */}
                                    <div className="mt-6 pt-4 border-t border-white/5 flex flex-col gap-3">
                                        <div className="text-xs font-mono text-white/40">{card.stats}</div>
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
                <motion.div variants={staggerItem} className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-white/10">
                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                        <div className="text-[0.6rem] font-mono uppercase tracking-widest text-white/40 mb-2">Predictive Accuracy</div>
                        <div className="text-2xl font-display font-black text-white flex items-end gap-2">
                            94.2% <span className="text-[0.6rem] font-mono text-emerald-400 uppercase tracking-widest flex items-center mb-1"><TrendingUp size={10} /> +2.1%</span>
                        </div>
                    </div>
                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                        <div className="text-[0.6rem] font-mono uppercase tracking-widest text-white/40 mb-2">Rookie Regressions</div>
                        <div className="text-2xl font-display font-black text-white flex items-end gap-2">
                            12.4% <span className="text-[0.6rem] font-mono text-emerald-400 uppercase tracking-widest flex items-center mb-1"><TrendingUp size={10} className="rotate-180" /> -0.5%</span>
                        </div>
                    </div>
                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                        <div className="text-[0.6rem] font-mono uppercase tracking-widest text-white/40 mb-2">System Confidence</div>
                        <div className="text-2xl font-display font-black text-white flex items-end gap-2">
                            98.9% <span className="text-[0.6rem] font-mono text-emerald-400 uppercase tracking-widest flex items-center mb-1"><TrendingUp size={10} /> +0.3%</span>
                        </div>
                    </div>
                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                        <div className="text-[0.6rem] font-mono uppercase tracking-widest text-white/40 mb-2">Data Integrity</div>
                        <div className="text-2xl font-display font-black text-white flex items-end gap-2">
                            99.9% <span className="text-[0.6rem] font-mono text-white/40 uppercase tracking-widest flex items-center mb-1">STABLE</span>
                        </div>
                    </div>
                </motion.div>

                {/* Footer Propaganda Block */}
                <motion.div variants={staggerItem} className="mt-12 bg-gold/5 border border-gold/20 rounded-2xl p-12 text-center relative overflow-hidden flex flex-col items-center">
                    <div className="h-10 w-10 bg-gold/10 border border-gold/30 rounded-lg flex items-center justify-center text-gold mb-6 shadow-[0_0_20px_rgba(212,175,55,0.2)]">
                        <ShieldAlert size={20} />
                    </div>
                    <h2 className="text-4xl md:text-5xl font-display font-black text-white italic tracking-tighter max-w-2xl mx-auto leading-tight">
                        &ldquo;The AGI doesn't just grade prospects. <span className="text-gold">It grades itself.</span>&rdquo;
                    </h2>
                    <p className="text-sm font-mono text-white/50 uppercase tracking-widest mt-6">
                        Real-time accountability tracking for the next generation of football intelligence.
                    </p>
                    <div className="flex gap-4 mt-8">
                        <button className="px-6 py-3 bg-gold text-black text-xs font-mono font-bold uppercase tracking-widest rounded-lg hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all">
                            Explore Full Architecture
                        </button>
                        <button className="px-6 py-3 bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 text-xs font-mono font-bold uppercase tracking-widest rounded-lg transition-all">
                            Request API Access
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
}
