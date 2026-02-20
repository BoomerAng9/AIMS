'use client';

/**
 * Per|Form Transfer Portal Matchmaker
 *
 * All data fetched from /api/perform/transfer-portal.
 * Zero hardcoded data — empty state shown if DB has no portal entries.
 */

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
    ArrowLeft, Shuffle, Search, Filter, DollarSign, Target,
    ChevronDown, Zap, MapPin, Users, TrendingUp, Trophy,
    ArrowRight, Radar, CheckCircle2, ShieldAlert, RefreshCw
} from 'lucide-react';
import { staggerContainer, staggerItem } from '@/lib/motion/variants';

const POSITIONS = ['ALL', 'QB', 'RB', 'WR', 'EDGE', 'CB', 'S', 'OT', 'DL', 'LB', 'TE'];

export default function TransferPortalPage() {
    const [entries, setEntries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [source, setSource] = useState('');
    const [search, setSearch] = useState('');
    const [posFilter, setPosFilter] = useState('ALL');
    const [sortBy, setSortBy] = useState<'pai' | 'nil' | 'rank'>('pai');
    const [expanded, setExpanded] = useState<string | null>(null);

    useEffect(() => {
        fetch(`/api/perform/transfer-portal?sortBy=${sortBy}`)
            .then(r => r.json())
            .then(data => {
                setEntries(data.entries || []);
                setSource(data.source || '');
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [sortBy]);

    const filtered = useMemo(() => {
        return entries.filter(p => {
            const matchSearch = !search ||
                p.name?.toLowerCase().includes(search.toLowerCase()) ||
                p.fromSchool?.toLowerCase().includes(search.toLowerCase()) ||
                p.position?.toLowerCase().includes(search.toLowerCase());
            const matchPos = posFilter === 'ALL' || p.position === posFilter;
            return matchSearch && matchPos;
        });
    }, [entries, search, posFilter]);

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-cyan-400/30 pb-24">
            {/* Top Nav */}
            <nav className="border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/sandbox/perform" className="flex items-center gap-2 text-[0.65rem] text-white/40 hover:text-cyan-400 transition-colors font-mono uppercase tracking-widest">
                        <ArrowLeft size={14} /> Per|Form Hub
                    </Link>
                    <div className="text-[0.6rem] font-mono tracking-widest text-cyan-400/50 flex items-center gap-2">
                        <Shuffle size={12} className="text-cyan-400/70" />
                        AGI MATCHMAKER ENGINE
                    </div>
                </div>
            </nav>

            <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="max-w-[1400px] mx-auto px-6 py-12 space-y-10"
            >
                {/* Header */}
                <motion.div variants={staggerItem} className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-white/10">
                    <div className="space-y-3 max-w-2xl">
                        <h1 className="text-4xl md:text-5xl font-display font-black tracking-tighter text-white">
                            Transfer Portal <span className="text-cyan-400">Matchmaker</span>
                        </h1>
                        <p className="text-sm text-white/60 leading-relaxed font-sans">
                            Powered by AGI roster-fit analysis. P.A.I. scores cross-referenced against team depth charts,
                            scheme requirements, and NIL collective budgets.
                            <span className="text-cyan-400 font-medium"> The match finds them.</span>
                        </p>
                    </div>

                    {/* Stat capsules from live data */}
                    <div className="flex gap-3 flex-wrap">
                        <div className="px-4 py-3 bg-cyan-400/5 border border-cyan-400/20 rounded-xl text-center min-w-[100px]">
                            <div className="text-xl font-display font-black text-cyan-400">{entries.length}</div>
                            <div className="text-[0.55rem] font-mono text-white/40 uppercase tracking-widest">Indexed</div>
                        </div>
                        <div className="px-4 py-3 bg-gold/5 border border-gold/20 rounded-xl text-center min-w-[100px]">
                            <div className="text-xl font-display font-black text-gold">
                                {entries.length > 0
                                    ? (entries.reduce((s: number, p: any) => s + (p.paiScore || 0), 0) / entries.length).toFixed(1)
                                    : '—'}
                            </div>
                            <div className="text-[0.55rem] font-mono text-white/40 uppercase tracking-widest">Avg P.A.I.</div>
                        </div>
                    </div>
                </motion.div>

                {/* Filters */}
                <motion.div variants={staggerItem} className="flex flex-wrap items-center gap-4">
                    <div className="relative flex-1 min-w-[200px] max-w-md">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search player, school, or position..."
                            className="w-full pl-9 pr-4 py-2.5 bg-[#0f0f0f] border border-white/10 rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-400/40 font-mono"
                        />
                    </div>

                    <div className="flex gap-1.5 overflow-x-auto">
                        {POSITIONS.map(pos => (
                            <button
                                key={pos}
                                onClick={() => setPosFilter(pos)}
                                className={`px-3 py-1.5 rounded-lg text-[0.6rem] font-mono uppercase tracking-widest transition-colors whitespace-nowrap ${posFilter === pos
                                        ? 'bg-cyan-400 text-black font-bold'
                                        : 'bg-white/5 text-white/40 hover:text-white hover:bg-white/10 border border-white/5'
                                    }`}
                            >
                                {pos}
                            </button>
                        ))}
                    </div>

                    <div className="flex gap-1.5 ml-auto">
                        {([['pai', 'P.A.I.'], ['nil', 'NIL $'], ['rank', 'Rank']] as const).map(([key, label]) => (
                            <button
                                key={key}
                                onClick={() => setSortBy(key)}
                                className={`px-3 py-1.5 rounded-lg text-[0.6rem] font-mono uppercase tracking-widest transition-colors ${sortBy === key
                                        ? 'bg-white/10 text-white border border-white/20'
                                        : 'text-white/30 hover:text-white/60'
                                    }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* Loading State */}
                {loading && (
                    <motion.div variants={staggerItem} className="flex flex-col items-center justify-center py-20 gap-3">
                        <div className="h-8 w-8 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
                        <span className="text-xs font-mono text-white/30">Querying portal database...</span>
                    </motion.div>
                )}

                {/* Empty State */}
                {!loading && entries.length === 0 && (
                    <motion.div variants={staggerItem} className="bg-[#0f0f0f] border border-cyan-400/10 rounded-2xl p-16 text-center">
                        <Shuffle size={36} className="text-cyan-400/20 mx-auto mb-4" />
                        <h3 className="text-xl font-display font-bold text-white/60 mb-3">Transfer Portal Not Yet Indexed</h3>
                        <p className="text-sm text-white/30 font-mono max-w-lg mx-auto mb-8 leading-relaxed">
                            The transfer portal database has not been populated yet. Activate the search engine to begin
                            indexing portal entries from live sources — player data, NIL valuations, and roster-fit scores
                            will be computed automatically by the AGI.
                        </p>
                        <div className="flex gap-3 justify-center">
                            <button className="px-6 py-3 bg-cyan-400 text-black text-xs font-mono font-bold uppercase tracking-widest rounded-lg hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] transition-all flex items-center gap-2">
                                <Radar size={14} /> Activate Portal Indexer
                            </button>
                            <Link
                                href="/sandbox/perform/state-boards"
                                className="px-6 py-3 bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 text-xs font-mono font-bold uppercase tracking-widest rounded-lg transition-all"
                            >
                                View State Boards Instead
                            </Link>
                        </div>
                    </motion.div>
                )}

                {/* Data Cards (when entries exist) */}
                {!loading && filtered.length > 0 && (
                    <motion.div variants={staggerItem} className="space-y-4">
                        {filtered.map((player: any) => {
                            const isExpanded = expanded === player.id;
                            const tierColor = player.tier === 'ELITE' ? 'text-gold border-gold/30 bg-gold/10' :
                                player.tier === 'BLUE_CHIP' ? 'text-blue-400 border-blue-400/30 bg-blue-400/10' :
                                    'text-emerald-400 border-emerald-400/30 bg-emerald-400/10';

                            return (
                                <div key={player.id} className="bg-[#0f0f0f] border border-white/5 rounded-2xl overflow-hidden hover:border-cyan-400/20 transition-all shadow-xl">
                                    <button
                                        onClick={() => setExpanded(isExpanded ? null : player.id)}
                                        className="w-full p-6 flex flex-col md:flex-row md:items-center gap-4 text-left"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="text-xl font-display font-bold text-white truncate">{player.name}</h3>
                                                <span className={`px-2 py-0.5 rounded text-[0.55rem] font-mono font-bold uppercase border ${tierColor}`}>
                                                    {String(player.tier || '').replace('_', ' ')}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4 text-[0.65rem] font-mono text-white/40">
                                                <span>{player.position}</span>
                                                <span className="text-white/20">|</span>
                                                <span>{player.fromSchool}</span>
                                                <span className="text-white/20">|</span>
                                                <span>{player.classYear}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            <div className="text-center">
                                                <div className={`text-2xl font-display font-black ${(player.paiScore || 0) >= 90 ? 'text-gold' :
                                                        (player.paiScore || 0) >= 80 ? 'text-blue-400' : 'text-emerald-400'
                                                    }`}>
                                                    {player.paiScore || '—'}
                                                </div>
                                                <div className="text-[0.5rem] font-mono text-white/30 uppercase tracking-widest">P.A.I.</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-2xl font-display font-black text-green-400">{player.nilValue || '—'}</div>
                                                <div className="text-[0.5rem] font-mono text-white/30 uppercase tracking-widest">NIL Est.</div>
                                            </div>
                                            <ChevronDown size={16} className={`text-white/30 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                        </div>
                                    </button>

                                    {isExpanded && (
                                        <div className="border-t border-white/5 bg-[#0a0a0a] p-6 space-y-4">
                                            {player.scoutMemo && (
                                                <p className="text-sm text-white/60 italic font-serif leading-relaxed">&ldquo;{player.scoutMemo}&rdquo;</p>
                                            )}
                                            {player.tags && player.tags.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5">
                                                    {player.tags.map((tag: string, idx: number) => (
                                                        <span key={idx} className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[0.55rem] font-mono text-white/40">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                            <div className="flex justify-end">
                                                <button className="flex items-center gap-2 px-4 py-2 bg-cyan-400/10 border border-cyan-400/20 rounded-lg text-cyan-400 text-[0.65rem] font-mono uppercase tracking-widest hover:bg-cyan-400/20 transition-colors">
                                                    <Radar size={12} /> Activate Deep Research
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </motion.div>
                )}

                {/* Bottom CTA */}
                <motion.div variants={staggerItem} className="bg-cyan-400/5 border border-cyan-400/20 rounded-2xl p-10 text-center relative overflow-hidden">
                    <div className="absolute -top-20 -right-20 w-80 h-80 bg-cyan-400/5 rounded-full blur-3xl" />
                    <Shuffle className="text-cyan-400 mx-auto mb-4" size={32} />
                    <h2 className="text-3xl md:text-4xl font-display font-black text-white tracking-tight mb-3">
                        Every roster gap is an <span className="text-cyan-400">opportunity</span>.
                    </h2>
                    <p className="text-sm text-white/50 max-w-lg mx-auto mb-6 font-sans">
                        The AGI scans FBS depth charts in real-time, cross-referencing portal entries against scheme fit,
                        NIL budget capacity, and positional archetype compatibility.
                    </p>
                </motion.div>
            </motion.div>
        </div>
    );
}
