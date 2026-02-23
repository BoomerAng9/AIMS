'use client';

/**
 * Per|Form Analysts — The Boomer_Angs Roster
 *
 * Profiles all five Color Analysts and the infrastructure Boomer_Angs.
 * Each card is built from PERFORM_BOOMERANGS_ROSTER.md data.
 * No internal IDs exposed — only public-facing personas.
 */

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Star, Zap, Flame, Shield, BarChart3, Radio, Database } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

// ── Color Analyst Cards (public personas) ─────────────────────
const COLOR_ANALYSTS = [
    {
        id: 'acheevy',
        name: 'ACHEEVY',
        title: 'Lead Color Analyst',
        subtitle: 'Orchestrator · Final Word · Powered by A.I.M.S.',
        bio: `The hub of the entire Per|Form newsroom. Every scouting report, every debate, every grade is reviewed and filtered through ACHEEVY before reaching you. Doesn't just analyze the player — analyzes the analysts.`,
        catchphrase: '"The tape knows. The formula confirms. ACHEEVY decides."',
        tags: ['Orchestrator', 'Scouting Director', 'Editorial Lead'],
        color: {
            gradient: 'from-yellow-900/30 to-white',
            border: 'border-gold/30',
            accent: 'text-gold',
            badge: 'bg-gold/20 text-gold border-gold/30',
            dot: 'bg-gold',
            bar: 'bg-gradient-to-r from-gold to-yellow-500',
        },
        icon: Zap,
        stats: [
            { label: 'Grade Accuracy', val: '94.2%' },
            { label: 'Reports Filed', val: '2,400+' },
            { label: 'Debates Mediated', val: '580' },
        ],
        featured: true,
    },
    {
        id: 'primetime',
        name: 'PrimeTime Jr.',
        title: 'Entertainment Analyst',
        subtitle: 'Bold Takes · Big Predictions · Cultural Authority',
        bio: `Born confidence. If he said it first, it's in the transcript. Blends elite analytical knowledge with maximum swagger. Real P.A.I. grades, delivered with a flair no other platform can match.`,
        catchphrase: '"That boy DIFFERENT. I knew it before everybody knew it."',
        tags: ['Skill Positions', 'Draft Risers', 'Bold Predictions'],
        color: {
            gradient: 'from-red-950/30 to-white',
            border: 'border-red-500/30',
            accent: 'text-red-400',
            badge: 'bg-red-500/15 text-red-400 border-red-500/30',
            dot: 'bg-red-500',
            bar: 'bg-gradient-to-r from-red-600 to-red-400',
        },
        icon: Flame,
        stats: [
            { label: 'Avg Confidence', val: '98%' },
            { label: 'Hot Takes Filed', val: '340' },
            { label: 'Accuracy Rate', val: '71.3%' },
        ],
    },
    {
        id: 'professor',
        name: 'The Professor',
        title: 'Film Analyst',
        subtitle: 'Every Frame Reviewed · Film-First · Data-Backed',
        bio: `Precision and nuance. No narrative. No hot takes. The Professor watches every snap before forming an opinion. When he speaks, the case is airtight.`,
        catchphrase: '"Watch the tape. The film doesn\'t lie."',
        tags: ['Film Breakdowns', 'Technique Analysis', 'Player Comps'],
        color: {
            gradient: 'from-blue-950/30 to-white',
            border: 'border-blue-500/30',
            accent: 'text-blue-400',
            badge: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
            dot: 'bg-blue-400',
            bar: 'bg-gradient-to-r from-blue-600 to-blue-400',
        },
        icon: BarChart3,
        stats: [
            { label: 'Avg Data Reliance', val: '95%' },
            { label: 'Film Reports', val: '820' },
            { label: 'Accuracy Rate', val: '89.4%' },
        ],
    },
    {
        id: 'the-strategist',
        name: 'The Strategist',
        title: 'Scheme Analyst',
        subtitle: 'Scheme Fit · Team Needs · Coaching Impact',
        bio: `Football is not just about players — it's about systems. The Strategist evaluates every prospect through the lens of the offense and defense they'll be asked to execute.`,
        catchphrase: '"It\'s about the fit. Look at the scheme demands."',
        tags: ['Scheme Fit', 'Team Needs', 'Coaching Impact'],
        color: {
            gradient: 'from-emerald-950/30 to-white',
            border: 'border-emerald-500/30',
            accent: 'text-emerald-400',
            badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
            dot: 'bg-emerald-400',
            bar: 'bg-gradient-to-r from-emerald-600 to-emerald-400',
        },
        icon: Shield,
        stats: [
            { label: 'Avg Confidence', val: '70%' },
            { label: 'Scheme Reports', val: '415' },
            { label: 'Accuracy Rate', val: '83.1%' },
        ],
    },
    {
        id: 'uncle-blaze',
        name: 'Uncle Blaze',
        title: 'Fire Analyst',
        subtitle: 'Maximum Energy · Long Memory · Zero Filter',
        bio: `He was talking about this player BEFORE you knew their name. Uncle Blaze turns P.A.I. data into stories, debates into theater, and draft rooms into must-watch television.`,
        catchphrase: '"Let me tell you something! I BEEN saying this since DAY ONE."',
        tags: ['Hot Takes', 'Draft Controversies', 'Player Storytelling'],
        color: {
            gradient: 'from-orange-950/30 to-white',
            border: 'border-orange-500/30',
            accent: 'text-orange-400',
            badge: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
            dot: 'bg-orange-500',
            bar: 'bg-gradient-to-r from-orange-600 to-orange-400',
        },
        icon: Flame,
        stats: [
            { label: 'Avg Drama', val: '95%' },
            { label: 'Articles Written', val: '620' },
            { label: 'Accuracy Rate', val: '67.8%' },
        ],
    },
    {
        id: 'the-anchor',
        name: 'The Anchor',
        title: 'Balance Analyst',
        subtitle: 'Moderation · Both Sides · Summary Pieces',
        bio: `When it all gets too loud, The Anchor brings everyone back to the data. The voice of reason in every debate. Not the flashiest, but the most trusted.`,
        catchphrase: '"Let\'s look at this from both sides. Here\'s what the data actually says."',
        tags: ['Debate Moderation', 'Balanced Analysis', 'Summaries'],
        color: {
            gradient: 'from-slate-900/30 to-white',
            border: 'border-slate-500/30',
            accent: 'text-slate-400',
            badge: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
            dot: 'bg-slate-400',
            bar: 'bg-gradient-to-r from-slate-600 to-slate-400',
        },
        icon: Radio,
        stats: [
            { label: 'Debates Moderated', val: '290' },
            { label: 'Summary Articles', val: '380' },
            { label: 'Accuracy Rate', val: '91.2%' },
        ],
    },
];

// ── Infrastructure agents (brief mention) ───────────────────────
const INFRA_AGENTS = [
    { name: 'Scout_Ang', role: 'Stats & Data Gathering', icon: '🔍' },
    { name: 'Film_Ang', role: 'Video Analysis (SAM 2)', icon: '🎬' },
    { name: 'Intel_Ang', role: 'Intangibles Research', icon: '🧠' },
    { name: 'Draft_Ang', role: 'Mock Draft Engine', icon: '📊' },
    { name: 'NIL_Ang', role: 'NIL Valuation Model', icon: '💰' },
    { name: 'Showrunner_Ang', role: 'Content Formatting & Publishing', icon: '📰' },
    { name: 'Node_Trig_Ang', role: 'Workflow Trigger Specialist', icon: '⚡' },
    { name: 'JSON_Ang', role: 'Data Structure & Payload Management', icon: '🔧' },
    { name: 'Scrape_Ang', role: 'Web Scraping Operations', icon: '🕸️' },
    { name: 'Index_Ang', role: 'Data Indexing & Search', icon: '📇' },
    { name: 'Chronicle_Ang', role: 'Audit Trail & Compliance', icon: '📋' },
];

export default function AnalystsPage() {
    return (
        <div className="min-h-screen bg-white text-slate-800 pb-24">

            {/* ── NAV ─────────────────────────────────────────────────── */}
            <nav className="sticky top-0 z-50 border-b border-slate-100 bg-white/95 backdrop-blur-xl h-14 flex items-center">
                <div className="max-w-[1400px] mx-auto px-6 w-full flex items-center justify-between">
                    <Link href="/sandbox/perform" className="flex items-center gap-2 text-[0.65rem] text-slate-400 hover:text-slate-800 transition-colors font-mono uppercase tracking-widest">
                        <ArrowLeft size={13} /> Per|Form
                    </Link>
                    <span className="text-[0.6rem] font-mono uppercase tracking-[0.3em] text-slate-300">Analyst Roster</span>
                </div>
            </nav>

            {/* ── HERO ─────────────────────────────────────────────────── */}
            <section className="relative overflow-hidden border-b border-slate-100 pb-16 pt-20">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(212,175,55,0.06)_0%,transparent_60%)]" />
                <div className="relative z-10 max-w-[1400px] mx-auto px-6">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 max-w-2xl">
                        <div className="flex items-center gap-3">
                            <Star size={20} className="text-gold" />
                            <span className="text-[0.65rem] font-mono tracking-[0.4em] uppercase text-gold/70">Per|Form Analyst Team</span>
                        </div>
                        <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-slate-800">
                            Meet the Analysts
                        </h1>
                        <p className="text-lg text-slate-500 leading-relaxed max-w-xl">
                            AI-powered analyst personas built from the best minds in football evaluation.
                            Each one delivers real P.A.I. grades with a personality that makes the data come alive.
                        </p>
                        <p className="text-xs font-mono text-slate-400 uppercase tracking-widest">
                            All grades come from the P.A.I. formula · Personality is the wrapper · The formula is the truth
                        </p>
                    </motion.div>
                </div>
            </section>

            <div className="max-w-[1400px] mx-auto px-6 py-12 space-y-16">

                {/* ── FEATURED: ACHEEVY ─────────────────────────────────── */}
                {COLOR_ANALYSTS.filter(a => a.featured).map(analyst => (
                    <motion.div
                        key={analyst.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`relative rounded-3xl border ${analyst.color.border} bg-gradient-to-br ${analyst.color.gradient} overflow-hidden p-8 md:p-12`}
                    >
                        {/* Top bar */}
                        <div className={`absolute top-0 left-0 w-full h-1 ${analyst.color.bar}`} />
                        {/* Background glow */}
                        <div className="absolute top-0 right-0 w-96 h-96 bg-gold/5 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />

                        <div className="relative z-10 grid md:grid-cols-2 gap-10 items-center">
                            <div>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className={`w-3 h-3 rounded-full ${analyst.color.dot} animate-pulse`} />
                                    <span className={`text-[0.65rem] font-mono tracking-[0.35em] uppercase ${analyst.color.accent}`}>Lead Analyst</span>
                                </div>
                                <h2 className="text-5xl font-black text-slate-800 tracking-tight mb-2">{analyst.name}</h2>
                                <p className={`text-sm font-mono uppercase tracking-widest ${analyst.color.accent} opacity-70 mb-5`}>{analyst.subtitle}</p>
                                <p className="text-base text-slate-500 leading-relaxed mb-6">{analyst.bio}</p>
                                <blockquote className={`border-l-2 border-gold/40 pl-4 italic text-sm ${analyst.color.accent} opacity-80`}>
                                    {analyst.catchphrase}
                                </blockquote>
                                <div className="flex flex-wrap gap-2 mt-5">
                                    {analyst.tags.map(tag => (
                                        <span key={tag} className={`px-3 py-1 rounded-lg text-[0.6rem] font-mono uppercase tracking-widest border ${analyst.color.badge}`}>{tag}</span>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4">
                                {analyst.stats.map(s => (
                                    <div key={s.label} className="p-5 rounded-2xl bg-slate-100/40 border border-slate-100">
                                        <div className="text-3xl font-black text-slate-800 mb-1">{s.val}</div>
                                        <div className={`text-[0.6rem] font-mono uppercase tracking-widest ${analyst.color.accent} opacity-60`}>{s.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                ))}

                {/* ── COLOR ANALYSTS GRID ───────────────────────────────── */}
                <div>
                    <div className="mb-8">
                        <h2 className="text-2xl font-black tracking-tight text-slate-800">Color Analysts</h2>
                        <p className="text-xs text-slate-400 font-mono mt-1">Each with a distinct voice · All grounded in P.A.I. data</p>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {COLOR_ANALYSTS.filter(a => !a.featured).map((analyst, i) => (
                            <motion.div
                                key={analyst.id}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.08 }}
                                className={`relative rounded-2xl border ${analyst.color.border} bg-gradient-to-b ${analyst.color.gradient} overflow-hidden p-6 flex flex-col`}
                            >
                                <div className={`absolute top-0 left-0 w-full h-0.5 ${analyst.color.bar}`} />

                                {/* Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`w-10 h-10 rounded-xl bg-slate-50 border ${analyst.color.border} flex items-center justify-center`}>
                                        <analyst.icon size={18} className={analyst.color.accent} />
                                    </div>
                                    <div className={`w-2 h-2 rounded-full mt-2 ${analyst.color.dot} animate-pulse`} />
                                </div>

                                <h3 className="text-xl font-black text-slate-800 mb-0.5">{analyst.name}</h3>
                                <p className={`text-[0.6rem] font-mono uppercase tracking-widest ${analyst.color.accent} opacity-70 mb-3`}>{analyst.title}</p>
                                <p className="text-xs text-slate-500 leading-relaxed mb-4 flex-1">{analyst.bio}</p>

                                <blockquote className={`text-[0.7rem] italic ${analyst.color.accent} opacity-70 border-l border-current pl-3 mb-4`}>
                                    {analyst.catchphrase}
                                </blockquote>

                                {/* Stats row */}
                                <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-100">
                                    {analyst.stats.map(s => (
                                        <div key={s.label} className="text-center">
                                            <div className={`text-sm font-black ${analyst.color.accent}`}>{s.val}</div>
                                            <div className="text-[0.5rem] font-mono text-slate-300 uppercase tracking-widest mt-0.5">{s.label}</div>
                                        </div>
                                    ))}
                                </div>

                                {/* Tags */}
                                <div className="flex flex-wrap gap-1.5 mt-3">
                                    {analyst.tags.map(tag => (
                                        <span key={tag} className={`px-2 py-0.5 rounded text-[0.5rem] font-mono uppercase tracking-widest border ${analyst.color.badge}`}>{tag}</span>
                                    ))}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* ── WAR ROOM CTA ──────────────────────────────────────── */}
                <div className="rounded-2xl border border-red-500/20 bg-gradient-to-br from-red-950/20 to-transparent p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                        <h3 className="text-xl font-black text-slate-800 mb-1">See them in action</h3>
                        <p className="text-sm text-slate-400">Watch the analysts debate in real time. Bull vs Bear. Every prospect argued from both sides.</p>
                    </div>
                    <Link
                        href="/sandbox/perform/war-room"
                        className="flex-shrink-0 flex items-center gap-2 px-8 py-4 bg-red-600 hover:bg-red-500 text-slate-800 font-bold text-sm rounded-xl transition-colors whitespace-nowrap"
                    >
                        Enter the War Room →
                    </Link>
                </div>

                {/* ── INFRASTRUCTURE AGENTS ─────────────────────────────── */}
                <div>
                    <div className="mb-6">
                        <h2 className="text-2xl font-black tracking-tight text-slate-800">Behind the Scenes</h2>
                        <p className="text-xs text-slate-400 font-mono mt-1">Specialist agents that power the research pipeline — not public-facing</p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {INFRA_AGENTS.map((agent, i) => (
                            <motion.div
                                key={agent.name}
                                initial={{ opacity: 0, scale: 0.97 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.04 }}
                                className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors"
                            >
                                <div className="text-2xl mb-2">{agent.icon}</div>
                                <p className="text-xs font-mono font-bold text-slate-600">{agent.name}</p>
                                <p className="text-[0.6rem] text-slate-400 font-mono mt-0.5 leading-relaxed">{agent.role}</p>
                            </motion.div>
                        ))}
                    </div>

                    <p className="text-[0.6rem] font-mono text-slate-300 text-center mt-6 uppercase tracking-widest">
                        Infrastructure agents are internal · Not public-facing · Managed by ACHEEVY
                    </p>
                </div>

                {/* ── METHODOLOGY ───────────────────────────────────────── */}
                <div className="border border-gold/20 rounded-2xl p-8 bg-gradient-to-br from-gold/5 to-transparent text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.05)_0%,transparent_70%)]" />
                    <div className="relative z-10 max-w-xl mx-auto">
                        <h3 className="text-2xl font-black text-slate-800 mb-3 tracking-tight">One Formula. Many Voices.</h3>
                        <p className="text-sm text-slate-500 leading-relaxed">
                            No matter how wild or entertaining an analyst&apos;s takes get, their grades and rankings <strong className="text-slate-700">always</strong> come from the P.A.I. + grading system.
                            The personality is the wrapper. The formula is the truth.
                        </p>
                        <div className="flex gap-3 justify-center mt-6">
                            <Link href="/sandbox/perform" className="px-6 py-3 bg-gold text-black font-bold text-xs rounded-xl hover:bg-yellow-400 transition-colors uppercase tracking-widest">
                                View Per|Form Hub
                            </Link>
                            <Link href="/sandbox/perform/big-board" className="px-6 py-3 bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl hover:bg-slate-100 transition-colors">
                                See the Grades
                            </Link>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
