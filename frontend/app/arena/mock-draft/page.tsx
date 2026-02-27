'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Trophy, ChevronLeft, ArrowRight, Shield, Zap, Search, Activity } from 'lucide-react';

const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_URL || 'https://aimanagedsolutions.cloud';

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const staggerItem = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function MockDraftSurfacePage() {
    const [prospects, setProspects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/perform/draft?limit=25')
            .then(res => res.json())
            .then(data => {
                setProspects(data.prospects || []);
                setLoading(false);
            })
            .catch(console.error);
    }, []);

    return (
        <div className="min-h-screen bg-white text-slate-800 selection:bg-gold/30 pt-24 pb-16 px-4 md:px-8">
            <div className="max-w-7xl mx-auto space-y-12">
                {/* Header / Hero */}
                <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    animate="visible"
                    className="space-y-6 text-center max-w-3xl mx-auto"
                >
                    <motion.div variants={staggerItem} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gold/30 bg-gold/10 text-gold text-xs font-mono uppercase tracking-widest shadow-[0_0_15px_rgba(218,165,32,0.1)]">
                        <span className="h-2 w-2 rounded-full bg-gold animate-pulse" />
                        Live Intel Pulse
                    </motion.div>

                    <motion.h1 variants={staggerItem} className="text-4xl md:text-6xl font-display text-slate-800 tracking-tight">
                        2026 NFL Mock Draft
                    </motion.h1>

                    <motion.p variants={staggerItem} className="text-base md:text-lg text-slate-500 leading-relaxed font-sans max-w-2xl mx-auto">
                        Explore the elite prospects of the 2026 class. Powered by Per|Form AI, grading analytics, and continuous market tracking. To run your own scenarios and access the full War Room pipeline, jump to the main platform.
                    </motion.p>

                    <motion.div variants={staggerItem} className="pt-4">
                        <a
                            href={`${APP_DOMAIN}/dashboard/perform`}
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gold/10 border border-gold/30 text-gold font-medium hover:bg-gold/20 hover:shadow-[0_0_30px_rgba(218,165,32,0.15)] transition-all uppercase tracking-widest text-sm"
                            style={{ fontFamily: 'var(--font-display, "Doto", monospace)' }}
                        >
                            Enter The War Room <ArrowRight size={16} />
                        </a>
                    </motion.div>
                </motion.div>

                {/* Status Bar */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl border border-wireframe-stroke bg-slate-50/60 backdrop-blur-md"
                >
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-slate-400">
                            <Activity size={16} />
                            <span className="text-xs font-mono uppercase tracking-widest">Data Integrity: 100%</span>
                        </div>
                        <div className="h-4 w-px bg-slate-100" />
                        <div className="flex items-center gap-2 text-slate-400">
                            <Shield size={16} />
                            <span className="text-xs font-mono uppercase tracking-widest">ACHEEVY Verified</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search prospects..."
                                disabled
                                className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-gold/30 transition-colors w-64"
                            />
                        </div>
                    </div>
                </motion.div>

                {/* Big Board Grid */}
                {loading ? (
                    <div className="text-center py-24">
                        <div className="inline-block h-10 w-10 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
                        <p className="text-xs text-slate-400 mt-4 font-mono uppercase tracking-widest">Syncing Draft Database...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {prospects.map((p, idx) => (
                            <motion.div
                                key={p.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.3, delay: idx * 0.05 }}
                                className="relative group rounded-2xl border border-slate-200 bg-slate-100/60 hover:bg-white overflow-hidden hover:border-gold/30 transition-all duration-300 shadow-xl"
                            >
                                {/* Glowing subtle background */}
                                <div className="absolute inset-0 bg-gradient-to-br from-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                <div className="relative p-5 space-y-4">
                                    {/* Top row: Rank & Tier */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-3xl font-display text-slate-300 group-hover:text-gold/20 transition-colors">
                                            {String(idx + 1).padStart(2, '0')}
                                        </span>
                                        <span className={`text-[9px] font-mono uppercase tracking-widest px-2 py-1 rounded border ${p.tier === 'ELITE' ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' :
                                                p.tier === 'BLUE_CHIP' ? 'bg-blue-400/10 text-blue-400 border-blue-400/30' :
                                                    'bg-slate-50 text-slate-400 border-slate-200'
                                            }`}>
                                            {p.tier}
                                        </span>
                                    </div>

                                    {/* Player Info */}
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-800 tracking-tight leading-tight group-hover:text-gold transition-colors font-sans">
                                            {p.firstName} {p.lastName}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-2 text-sm text-slate-500 font-mono">
                                            <span className="text-slate-800 font-medium">{p.position}</span>
                                            <span className="w-1 h-1 rounded-full bg-slate-100" />
                                            <span>{p.college}</span>
                                        </div>
                                    </div>

                                    {/* Score & Stats */}
                                    <div className="pt-4 flex items-end justify-between border-t border-slate-100">
                                        <div>
                                            <p className="text-xs text-slate-400 font-mono uppercase tracking-widest mb-1">P.A.I. Score</p>
                                            <div className="flex items-center gap-2">
                                                <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-gold/5 border border-gold/20 shadow-[0_0_10px_rgba(218,165,32,0.1)] group-hover:shadow-[0_0_20px_rgba(218,165,32,0.2)] transition-shadow">
                                                    <span className="text-sm font-display text-gold">{p.paiScore}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <p className="text-xs text-slate-400 font-mono uppercase tracking-widest mb-1">NIL Est.</p>
                                            <p className="text-sm font-sans font-semibold text-emerald-400/80 group-hover:text-emerald-400 transition-colors">
                                                {p.nilEstimate || 'TBD'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

            </div>
        </div>
    );
}
