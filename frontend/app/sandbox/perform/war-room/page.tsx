'use client';

/**
 * Per|Form War Room — Bull vs Bear Debate Engine
 *
 * Live adversarial debate segments between Boomer_Angs and Lil_Hawks.
 * Every prospect is argued from both sides. Chicken Hawk mediates.
 * Powered by /api/perform/draft/debate
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, Swords, Flame, Shield, Radio, TrendingUp,
    TrendingDown, Zap, ChevronRight, RefreshCw, MessageSquare
} from 'lucide-react';
import { staggerContainer, staggerItem } from '@/lib/motion/variants';

const CURRENT_YEAR = new Date().getFullYear();

// ── Showcase debate topics (auto-populated from real news when available) ──
const DEBATE_SEEDS = [
    { headline: 'Fernando Mendoza — #1 Overall or Overrated?', prospectName: 'Fernando Mendoza', type: 'general' },
    { headline: 'Caleb Downs — Can a Safety go Top 5?', prospectName: 'Caleb Downs', type: 'projection' },
    { headline: 'Rueben Bain Jr. — Best EDGE in the Class?', prospectName: 'Rueben Bain Jr.', type: 'general' },
    { headline: 'Combine Week: What measurables matter most?', prospectName: '', type: 'combine' },
    { headline: 'Travis Hunter — Is PRIME still on the table?', prospectName: 'Travis Hunter', type: 'general' },
    { headline: 'T.J. Parker vs. Arvell Reese — Who goes higher?', prospectName: 'TJ Parker', type: 'general' },
];

interface DebateResult {
    debate: {
        topic: string;
        bull: { analyst: string; angId: string; style: string; take: string };
        bear: { analyst: string; angId: string; style: string; take: string };
        verdict: string;
        mediator: string;
        timestamp: string;
    };
}

export default function WarRoomPage() {
    const [activeSeed, setActiveSeed] = useState<number | null>(null);
    const [debate, setDebate] = useState<DebateResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [newsItems, setNewsItems] = useState<any[]>([]);
    const [customTopic, setCustomTopic] = useState('');
    const [activeTab, setActiveTab] = useState<'featured' | 'live' | 'custom'>('featured');

    // Fetch live draft news for debate topics
    useEffect(() => {
        fetch('/api/perform/draft/news')
            .then(r => r.json())
            .then(d => setNewsItems((d.items || []).slice(0, 6)))
            .catch(() => { });
    }, []);

    async function triggerDebate(seed: typeof DEBATE_SEEDS[0], idx: number) {
        setActiveSeed(idx);
        setLoading(true);
        setDebate(null);
        try {
            const res = await fetch('/api/perform/draft/debate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    headline: seed.headline,
                    prospectName: seed.prospectName,
                    type: seed.type,
                }),
            });
            const data = await res.json();
            setDebate(data);
        } catch {
            // graceful
        } finally {
            setLoading(false);
        }
    }

    async function triggerCustomDebate() {
        if (!customTopic.trim()) return;
        setActiveSeed(-1);
        setLoading(true);
        setDebate(null);
        try {
            const res = await fetch('/api/perform/draft/debate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ headline: customTopic, type: 'general' }),
            });
            const data = await res.json();
            setDebate(data);
        } catch {
            // graceful
        } finally {
            setLoading(false);
        }
    }

    async function triggerLiveDebate(item: any, idx: number) {
        setActiveSeed(100 + idx);
        setLoading(true);
        setDebate(null);
        try {
            const res = await fetch('/api/perform/draft/debate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    headline: item.headline,
                    prospectName: item.prospectName,
                    type: item.type || 'general',
                }),
            });
            const data = await res.json();
            setDebate(data);
        } catch {
            // graceful
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-white text-slate-800 pb-24">

            {/* ── NAV ─────────────────────────────────────────────────────── */}
            <nav className="sticky top-0 z-50 border-b border-slate-100 bg-white/95 backdrop-blur-xl h-14 flex items-center">
                <div className="max-w-[1400px] mx-auto px-6 w-full flex items-center justify-between">
                    <Link href="/sandbox/perform" className="flex items-center gap-2 text-[0.65rem] text-slate-400 hover:text-slate-800 transition-colors font-mono uppercase tracking-widest">
                        <ArrowLeft size={13} /> Per|Form
                    </Link>
                    <div className="flex items-center gap-3">
                        <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} className="w-2 h-2 rounded-full bg-red-500" />
                        <span className="text-[0.6rem] font-mono uppercase tracking-[0.3em] text-red-400/70">War Room Live</span>
                    </div>
                </div>
            </nav>

            {/* ── HERO BANNER ─────────────────────────────────────────────── */}
            <section className="relative overflow-hidden border-b border-slate-100">
                <div className="absolute inset-0 bg-gradient-to-br from-red-900/10 via-transparent to-blue-900/10" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(220,38,38,0.05)_0%,transparent_70%)]" />

                <div className="relative z-10 max-w-[1400px] mx-auto px-6 py-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4 max-w-2xl"
                    >
                        <div className="flex items-center gap-3">
                            <Swords size={24} className="text-red-400" />
                            <span className="text-[0.65rem] font-mono tracking-[0.4em] uppercase text-red-400/70">Adversarial Analysis Engine</span>
                        </div>
                        <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-slate-800">
                            The War Room
                        </h1>
                        <p className="text-lg text-slate-500 leading-relaxed">
                            Every prospect argued from both sides. Bull vs Bear. Raw takes, real grades.
                            <span className="text-slate-600"> Chicken Hawk mediates. ACHEEVY delivers the verdict.</span>
                        </p>

                        <div className="flex flex-wrap gap-3 pt-2 text-[0.6rem] font-mono uppercase tracking-widest">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
                                <Flame size={12} /> Bull Case
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-400">
                                <Shield size={12} /> Bear Case
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-gold/10 border border-gold/30 rounded-lg text-gold">
                                <Zap size={12} /> ACHEEVY Verdict
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            <div className="max-w-[1400px] mx-auto px-6 py-10 space-y-10">

                {/* ── TOPIC SELECTOR TAB ────────────────────────────────────── */}
                <div>
                    <div className="flex gap-1 mb-6 bg-white border border-slate-100 rounded-xl p-1 w-fit">
                        {([['featured', 'Featured Debates'], ['live', 'Live News'], ['custom', 'Custom Topic']] as const).map(([key, label]) => (
                            <button
                                key={key}
                                onClick={() => setActiveTab(key)}
                                className={`px-5 py-2 rounded-lg text-xs font-mono uppercase tracking-widest transition-all ${activeTab === key
                                    ? 'bg-slate-100 text-slate-800'
                                    : 'text-slate-400 hover:text-slate-500'
                                    }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    <AnimatePresence mode="wait">
                        {/* Featured Debates */}
                        {activeTab === 'featured' && (
                            <motion.div
                                key="featured"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3"
                            >
                                {DEBATE_SEEDS.map((seed, i) => (
                                    <button
                                        key={i}
                                        onClick={() => triggerDebate(seed, i)}
                                        disabled={loading && activeSeed === i}
                                        className={`group text-left p-5 rounded-2xl border transition-all ${activeSeed === i
                                            ? 'border-gold/40 bg-gold/5 shadow-[0_0_20px_rgba(212,175,55,0.1)]'
                                            : 'border-slate-200 bg-white hover:border-red-500/30 hover:bg-red-500/5'
                                            }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={`mt-0.5 w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center ${activeSeed === i ? 'bg-gold/20 text-gold' : 'bg-red-500/10 text-red-400 group-hover:bg-red-500/20'}`}>
                                                <Swords size={14} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-slate-800 leading-snug">{seed.headline}</p>
                                                <div className="flex items-center gap-2 mt-2 text-[0.6rem] font-mono uppercase tracking-widest text-slate-400">
                                                    <MessageSquare size={10} />
                                                    {loading && activeSeed === i ? 'Loading debate...' : 'Click to debate'}
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </motion.div>
                        )}

                        {/* Live News Debates */}
                        {activeTab === 'live' && (
                            <motion.div
                                key="live"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="space-y-2"
                            >
                                {newsItems.length === 0 ? (
                                    <div className="p-12 text-center border border-slate-100 rounded-2xl bg-white">
                                        <Radio size={24} className="text-slate-300 mx-auto mb-3" />
                                        <p className="text-sm text-slate-400 font-mono">No live news items available. Check back during Combine week.</p>
                                    </div>
                                ) : newsItems.map((item, i) => (
                                    <button
                                        key={i}
                                        onClick={() => triggerLiveDebate(item, i)}
                                        disabled={loading && activeSeed === 100 + i}
                                        className={`w-full text-left flex items-center gap-4 p-4 rounded-xl border transition-all ${activeSeed === 100 + i
                                            ? 'border-gold/30 bg-gold/5'
                                            : 'border-slate-200 bg-white hover:border-red-500/20'
                                            }`}
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 flex-shrink-0">
                                            <Flame size={14} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-slate-800 truncate">{item.headline}</p>
                                            <p className="text-[0.6rem] font-mono text-slate-400 mt-0.5">{item.source} · Debate this</p>
                                        </div>
                                        <ChevronRight size={14} className="text-slate-300 flex-shrink-0" />
                                    </button>
                                ))}
                            </motion.div>
                        )}

                        {/* Custom Topic */}
                        {activeTab === 'custom' && (
                            <motion.div
                                key="custom"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="space-y-4"
                            >
                                <p className="text-xs text-slate-400 font-mono">Enter any draft topic, prospect name, or question to trigger a live debate.</p>
                                <div className="flex gap-3">
                                    <input
                                        value={customTopic}
                                        onChange={e => setCustomTopic(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && triggerCustomDebate()}
                                        placeholder="e.g. 'Is Abdul Carter worth a top-3 pick?'"
                                        className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:border-gold/40 font-mono"
                                    />
                                    <button
                                        onClick={triggerCustomDebate}
                                        disabled={loading || !customTopic.trim()}
                                        className="px-6 py-3 bg-gold text-black font-bold text-xs rounded-xl hover:bg-yellow-400 transition-colors disabled:opacity-40 flex items-center gap-2 uppercase tracking-widest"
                                    >
                                        <Swords size={14} /> Debate
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* ── DEBATE RESULT ─────────────────────────────────────────── */}
                <AnimatePresence>
                    {loading && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center py-20 gap-4"
                        >
                            <div className="relative">
                                <div className="h-16 w-16 rounded-full border-2 border-red-500/20 border-t-red-500 animate-spin" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Swords size={20} className="text-red-400" />
                                </div>
                            </div>
                            <p className="text-sm text-slate-400 font-mono">Activating analysts...</p>
                        </motion.div>
                    )}

                    {!loading && debate && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="space-y-6"
                        >
                            {/* Topic header */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[0.6rem] font-mono uppercase tracking-[0.3em] text-slate-400 mb-1">Active Debate</p>
                                    <h3 className="text-xl font-bold text-slate-800">{debate.debate.topic}</h3>
                                </div>
                                <button
                                    onClick={() => {
                                        const seed = DEBATE_SEEDS[activeSeed as number];
                                        if (seed) triggerDebate(seed, activeSeed as number);
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 text-xs font-mono hover:text-slate-800 transition-colors"
                                >
                                    <RefreshCw size={12} /> Regenerate
                                </button>
                            </div>

                            {/* Bull vs Bear */}
                            <div className="grid md:grid-cols-2 gap-4">
                                {/* BULL */}
                                <div className="relative rounded-2xl bg-gradient-to-b from-red-50 to-white border border-red-500/30 overflow-hidden p-6">
                                    <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-red-500 to-transparent" />
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-8 h-8 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                                            <TrendingUp size={14} className="text-red-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black uppercase tracking-widest text-red-400">{debate.debate.bull.analyst}</p>
                                            <p className="text-[0.55rem] font-mono text-slate-400 uppercase">{debate.debate.bull.angId} · The Bull Case</p>
                                        </div>
                                        <div className="ml-auto w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                    </div>
                                    <blockquote className="text-base text-slate-700 leading-relaxed italic font-serif">
                                        &ldquo;{debate.debate.bull.take}&rdquo;
                                    </blockquote>
                                </div>

                                {/* BEAR */}
                                <div className="relative rounded-2xl bg-gradient-to-b from-blue-50 to-white border border-blue-500/30 overflow-hidden p-6">
                                    <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-blue-500 to-transparent" />
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                                            <TrendingDown size={14} className="text-blue-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black uppercase tracking-widest text-blue-400">{debate.debate.bear.analyst}</p>
                                            <p className="text-[0.55rem] font-mono text-slate-400 uppercase">{debate.debate.bear.angId} · The Bear Case</p>
                                        </div>
                                        <div className="ml-auto w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                    </div>
                                    <blockquote className="text-base text-slate-700 leading-relaxed italic font-serif">
                                        &ldquo;{debate.debate.bear.take}&rdquo;
                                    </blockquote>
                                </div>
                            </div>

                            {/* ACHEEVY Verdict */}
                            <div className="relative rounded-2xl border border-gold/30 bg-gradient-to-br from-gold/5 via-transparent to-transparent p-6 overflow-hidden">
                                <div className="absolute top-0 right-0 w-40 h-40 bg-gold/5 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-8 h-8 rounded-lg bg-gold/20 border border-gold/30 flex items-center justify-center">
                                            <Zap size={14} className="text-gold" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black uppercase tracking-widest text-gold">ACHEEVY</p>
                                            <p className="text-[0.55rem] font-mono text-slate-400 uppercase">Lead Analyst · Final Verdict</p>
                                        </div>
                                        <div className="ml-auto px-2.5 py-1 bg-gold/10 border border-gold/20 rounded-lg text-[0.6rem] font-mono text-gold/70 uppercase tracking-widest">
                                            Mediated by {debate.debate.mediator}
                                        </div>
                                    </div>
                                    <p className="text-base text-slate-700 leading-relaxed">{debate.debate.verdict}</p>
                                    <p className="text-[0.6rem] font-mono text-slate-300 mt-3">
                                        {new Date(debate.debate.timestamp).toLocaleTimeString()} · Per|Form War Room · Powered by A.I.M.S.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── HOW IT WORKS ─────────────────────────────────────────── */}
                {!debate && !loading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="grid md:grid-cols-3 gap-4 pt-4"
                    >
                        {[
                            {
                                step: '01',
                                title: 'Select or Submit',
                                desc: 'Pick a featured topic, pull from live draft news, or type your own debate question.',
                                color: 'text-red-400',
                                border: 'border-red-400/20',
                            },
                            {
                                step: '02',
                                title: 'Analysts Activate',
                                desc: 'Boomer_Angs and Lil_Hawks are assigned. Bull analyst argues one side, Bear argues the other.',
                                color: 'text-blue-400',
                                border: 'border-blue-400/20',
                            },
                            {
                                step: '03',
                                title: 'ACHEEVY Decides',
                                desc: 'The Lead Analyst reviews both cases and delivers the final Per|Form verdict, grounded in P.A.I. data.',
                                color: 'text-gold',
                                border: 'border-gold/20',
                            },
                        ].map(s => (
                            <div key={s.step} className={`p-6 rounded-2xl border ${s.border} bg-white`}>
                                <span className={`text-3xl font-black ${s.color} opacity-30 block mb-3`}>{s.step}</span>
                                <h3 className="font-bold text-slate-800 mb-2">{s.title}</h3>
                                <p className="text-sm text-slate-400 leading-relaxed">{s.desc}</p>
                            </div>
                        ))}
                    </motion.div>
                )}
            </div>
        </div>
    );
}
