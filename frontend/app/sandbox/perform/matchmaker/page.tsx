"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
    ChevronLeft,
    User,
    MapPin,
    TrendingUp,
    ArrowRight,
    ShieldAlert,
    GraduationCap
} from "lucide-react";
import Link from "next/link";
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer
} from "recharts";

// Mock Data
const player = {
    name: "Caleb Sterling",
    position: "QB",
    year: "GSR",
    height: "6'4\"",
    weight: 225,
    school: "Southern Tech",
    nationalRank: 3,
    transferRank: 1,

    // P.A.I Data
    paiScore: 94.2,
    tier: "PRIME",
    components: {
        performance: 92,
        athleticism: 96,
        intangibles: 95
    },

    // Radar Data for AI Match Engine
    radarData: [
        { subject: "Arm Strength", A: 95, B: 85, fullMark: 100 },
        { subject: "Mobility", A: 96, B: 75, fullMark: 100 },
        { subject: "Processing", A: 88, B: 90, fullMark: 100 },
        { subject: "Accuracy", A: 91, B: 88, fullMark: 100 },
        { subject: "Leadership", A: 95, B: 80, fullMark: 100 },
        { subject: "Scheme Fit", A: 92, B: 95, fullMark: 100 },
    ],

    bio: `An elite dual-threat field general transferring after a stellar junior campaign. Sterling possesses generation-level arm talent coupled with top-tier mobility. While his processing speed against complex zone blitzes needs minor refinement, his overall athletic profile makes him the most coveted asset in the transfer portal. Perfect fit for spread RPO systems.`,

    // Top Matches
    matches: [
        { team: "Ohio State", percent: 94, reason: "Scheme Fit, NIL Capacity" },
        { team: "Florida State", percent: 89, reason: "Starting Opportunity, RPO System" },
        { team: "LSU", percent: 85, reason: "Offensive Weaponry, SEC Exposure" }
    ],

    nilValuation: "$2.1M",
    nilTrend: "+15%"
};

export default function MatchmakerPage() {
    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-24">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/sandbox/perform" className="text-slate-500 hover:text-slate-900 transition-colors">
                            <ChevronLeft size={20} />
                        </Link>
                        <div>
                            <h1 className="text-lg font-bold tracking-tight text-slate-900 leading-none">
                                Transfer Portal Matchmaker
                            </h1>
                            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
                                P.A.I. Analytics Dashboard
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] uppercase font-bold text-white bg-[#D97706] px-2 py-1 rounded shadow-sm">
                            Live Evaluation
                        </span>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* ────────────────────────────────────────────────────────
              LEFT COLUMN: Player Profile & PA.I. Component Breakdown
              ──────────────────────────────────────────────────────── */}
                    <div className="lg:col-span-3 space-y-6">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm"
                        >
                            <div className="aspect-[4/3] bg-slate-100 flex items-center justify-center relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-tr from-slate-200 to-slate-100" />
                                <User size={64} className="text-slate-400 relative z-10" />
                                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm border border-slate-200 text-slate-900 text-[10px] font-bold px-2 py-1 rounded">
                                    #{player.transferRank} PORTAL
                                </div>
                            </div>
                            <div className="p-5">
                                <h2 className="text-xl font-bold text-slate-900 tracking-tight leading-none mb-1">
                                    {player.name}
                                </h2>
                                <div className="flex items-center gap-2 text-sm font-medium text-slate-500 mb-4">
                                    <span>{player.position}</span>
                                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                                    <span>{player.school}</span>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="bg-slate-50 rounded border border-slate-100 p-2 text-center">
                                        <span className="block text-slate-400 uppercase tracking-wider text-[9px] mb-0.5">Height</span>
                                        <span className="font-semibold text-slate-700">{player.height}</span>
                                    </div>
                                    <div className="bg-slate-50 rounded border border-slate-100 p-2 text-center">
                                        <span className="block text-slate-400 uppercase tracking-wider text-[9px] mb-0.5">Weight</span>
                                        <span className="font-semibold text-slate-700">{player.weight} lbs</span>
                                    </div>
                                    <div className="bg-slate-50 rounded border border-slate-100 p-2 text-center">
                                        <span className="block text-slate-400 uppercase tracking-wider text-[9px] mb-0.5">Class</span>
                                        <span className="font-semibold text-slate-700">{player.year}</span>
                                    </div>
                                    <div className="bg-slate-50 rounded border border-slate-100 p-2 text-center">
                                        <span className="block text-slate-400 uppercase tracking-wider text-[9px] mb-0.5">Eligibility</span>
                                        <span className="font-semibold text-slate-700">1 Year</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                            className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                                    P.A.I. Grade
                                </h3>
                                <div className="bg-amber-100 border border-amber-200 text-[#D97706] text-[10px] font-black uppercase px-2 py-0.5 rounded tracking-widest">
                                    {player.tier}
                                </div>
                            </div>

                            <div className="text-4xl font-black text-slate-900 tracking-tighter text-center mb-6">
                                {player.paiScore}
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="font-medium text-slate-700">Performance</span>
                                        <span className="text-slate-500">{player.components.performance}</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-slate-800 rounded-full" style={{ width: `${player.components.performance}%` }} />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="font-medium text-slate-700">Athleticism</span>
                                        <span className="text-slate-500">{player.components.athleticism}</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-[#D97706] rounded-full" style={{ width: `${player.components.athleticism}%` }} />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="font-medium text-slate-700">Intangibles</span>
                                        <span className="text-slate-500">{player.components.intangibles}</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-slate-400 rounded-full" style={{ width: `${player.components.intangibles}%` }} />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* ────────────────────────────────────────────────────────
              MIDDLE COLUMN: AI Match Engine & Boomer_Ang Scout Report
              ──────────────────────────────────────────────────────── */}
                    <div className="lg:col-span-6 space-y-6">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
                            className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm min-h-[400px] flex flex-col"
                        >
                            <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2 mb-4">
                                <span className="w-2 h-2 rounded-full bg-[#D97706] animate-pulse" />
                                AI Profile Match Engine
                            </h3>


                            <div className="flex-1 w-full relative min-h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={player.radarData}>
                                        <PolarGrid stroke="#e2e8f0" />
                                        <PolarAngleAxis
                                            dataKey="subject"
                                            tick={{ fill: "#64748b", fontSize: 11, fontWeight: 500 }}
                                        />
                                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                        <Radar
                                            name="Player Profile"
                                            dataKey="A"
                                            stroke="#0f172a"
                                            strokeWidth={2}
                                            fill="#0f172a"
                                            fillOpacity={0.1}
                                        />
                                        <Radar
                                            name="Ideal Scheme Fit"
                                            dataKey="B"
                                            stroke="#D97706"
                                            strokeWidth={2}
                                            strokeDasharray="4 4"
                                            fill="#D97706"
                                            fillOpacity={0.0}
                                        />
                                    </RadarChart>
                                </ResponsiveContainer>

                                {/* Legend positioned absolutely or inline */}
                                <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-4 text-[10px] uppercase font-bold text-slate-500">
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-sm bg-slate-900" /> Player Profile
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-2 h-2 border-2 border-dashed border-[#D97706]" /> Ideal Scheme Fit
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                            className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden"
                        >
                            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                                    Boomer_Ang Scout Report
                                </h3>
                                <span className="text-[9px] font-mono text-slate-400 bg-slate-200 px-1.5 py-0.5 rounded">
                                    AI GENERATED
                                </span>
                            </div>
                            <div className="p-5">
                                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                                    {player.bio}
                                </p>
                                <div className="mt-4 pt-4 border-t border-slate-100 flex gap-2">
                                    <span className="text-[10px] font-bold uppercase text-slate-500 bg-slate-100 px-2 py-1 rounded">Zone Read</span>
                                    <span className="text-[10px] font-bold uppercase text-slate-500 bg-slate-100 px-2 py-1 rounded">Arm Magnetism</span>
                                    <span className="text-[10px] font-bold uppercase text-slate-500 bg-slate-100 px-2 py-1 rounded">Leadership</span>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* ────────────────────────────────────────────────────────
              RIGHT COLUMN: Landing Spots & NIL Tracker
              ──────────────────────────────────────────────────────── */}
                    <div className="lg:col-span-3 space-y-6">
                        <motion.div
                            initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
                            className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm"
                        >
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-4 border-b border-slate-100 pb-2">
                                Top Landing Spots
                            </h3>

                            <div className="space-y-4">
                                {player.matches.map((spot, i) => (
                                    <div key={i} className="group cursor-pointer">
                                        <div className="flex justify-between items-end mb-1">
                                            <h4 className="font-bold text-slate-900 text-sm group-hover:text-[#D97706] transition-colors">{spot.team}</h4>
                                            <span className="text-xs font-black text-emerald-600">{spot.percent}% Match</span>
                                        </div>
                                        <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                                            {spot.reason}
                                        </p>
                                        <div className="h-1 w-full bg-slate-100 rounded-full mt-2 overflow-hidden">
                                            <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${spot.percent}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button className="w-full mt-5 py-2 text-xs font-bold uppercase tracking-wider text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded transition-colors flex items-center justify-center gap-1">
                                Run Simulation <ArrowRight size={14} />
                            </button>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}
                            className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm text-white"
                        >
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                                <TrendingUp size={14} /> NIL Valuation
                            </h3>

                            <div className="text-3xl font-black tracking-tight mb-2">
                                {player.nilValuation}
                            </div>

                            <div className="flex justify-between text-xs font-medium items-center">
                                <span className="text-slate-400">30-Day Trend</span>
                                <span className="text-[#D97706] bg-[#D97706]/10 px-2 py-0.5 rounded border border-[#D97706]/20">
                                    {player.nilTrend}
                                </span>
                            </div>
                        </motion.div>
                    </div>

                </div>
            </main>
        </div>
    );
}
