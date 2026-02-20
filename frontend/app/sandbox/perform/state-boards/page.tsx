'use client';

/**
 * Per|Form State Boards — Interactive Heat Map Hub
 * 
 * An elite command center displaying the US map with state-level
 * production density. Heat map coloring by total indexed prospects.
 * Click any state to dive into its top 100 producers.
 */

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, Search, MapPin, Database, Radar, Upload,
    Target, CheckCircle2, X, ChevronRight, Zap, Filter, TrendingUp
} from 'lucide-react';
import { staggerContainer, staggerItem } from '@/lib/motion/variants';

// ── All 50 States + territories with mock prospect counts ───
const ALL_STATES: { code: string; name: string; count: number; topProducer: string; topPosition: string }[] = [
    { code: 'AL', name: 'Alabama', count: 87, topProducer: 'Jaylen "Tank" Morrow', topPosition: 'LB' },
    { code: 'AK', name: 'Alaska', count: 3, topProducer: 'Kodiak Williams', topPosition: 'OT' },
    { code: 'AZ', name: 'Arizona', count: 41, topProducer: 'Phoenix Carter', topPosition: 'WR' },
    { code: 'AR', name: 'Arkansas', count: 28, topProducer: 'Deontae Rivers', topPosition: 'RB' },
    { code: 'CA', name: 'California', count: 142, topProducer: 'Xavier Coleman', topPosition: 'WR' },
    { code: 'CO', name: 'Colorado', count: 22, topProducer: 'Miles Frost', topPosition: 'QB' },
    { code: 'CT', name: 'Connecticut', count: 12, topProducer: 'Aiden Burke', topPosition: 'CB' },
    { code: 'DE', name: 'Delaware', count: 6, topProducer: 'Marcus Hall III', topPosition: 'S' },
    { code: 'FL', name: 'Florida', count: 168, topProducer: 'Cameron Price', topPosition: 'QB' },
    { code: 'GA', name: 'Georgia', count: 134, topProducer: 'DeShawn Williams', topPosition: 'WR' },
    { code: 'HI', name: 'Hawaii', count: 8, topProducer: 'Kainoa Mahoe', topPosition: 'LB' },
    { code: 'ID', name: 'Idaho', count: 5, topProducer: 'Colton Ridge', topPosition: 'OT' },
    { code: 'IL', name: 'Illinois', count: 52, topProducer: 'Darius Washington', topPosition: 'DE' },
    { code: 'IN', name: 'Indiana', count: 29, topProducer: 'Blake Hendricks', topPosition: 'QB' },
    { code: 'IA', name: 'Iowa', count: 18, topProducer: 'Cade Petersen', topPosition: 'OT' },
    { code: 'KS', name: 'Kansas', count: 14, topProducer: 'Tyree Sims', topPosition: 'RB' },
    { code: 'KY', name: 'Kentucky', count: 20, topProducer: 'Jalen Boone', topPosition: 'WR' },
    { code: 'LA', name: 'Louisiana', count: 98, topProducer: 'Kymani Broussard', topPosition: 'CB' },
    { code: 'ME', name: 'Maine', count: 4, topProducer: 'Liam O\'Sullivan', topPosition: 'TE' },
    { code: 'MD', name: 'Maryland', count: 38, topProducer: 'Javier Reyes', topPosition: 'DE' },
    { code: 'MA', name: 'Massachusetts', count: 21, topProducer: 'Dominic Ferraro', topPosition: 'QB' },
    { code: 'MI', name: 'Michigan', count: 44, topProducer: 'Andre Washington', topPosition: 'S' },
    { code: 'MN', name: 'Minnesota', count: 16, topProducer: 'Soren Lindqvist', topPosition: 'OT' },
    { code: 'MS', name: 'Mississippi', count: 62, topProducer: 'DeMarco Lott', topPosition: 'RB' },
    { code: 'MO', name: 'Missouri', count: 25, topProducer: 'Jayden Archer', topPosition: 'WR' },
    { code: 'MT', name: 'Montana', count: 4, topProducer: 'Ridge Cooper', topPosition: 'LB' },
    { code: 'NE', name: 'Nebraska', count: 11, topProducer: 'Elijah Frost', topPosition: 'RB' },
    { code: 'NV', name: 'Nevada', count: 15, topProducer: 'Malachi Henderson', topPosition: 'WR' },
    { code: 'NH', name: 'New Hampshire', count: 3, topProducer: 'Nolan Prescott', topPosition: 'TE' },
    { code: 'NJ', name: 'New Jersey', count: 56, topProducer: 'Khalil Robinson', topPosition: 'CB' },
    { code: 'NM', name: 'New Mexico', count: 7, topProducer: 'Diego Castillo', topPosition: 'QB' },
    { code: 'NY', name: 'New York', count: 42, topProducer: 'Rasheed Booker', topPosition: 'DE' },
    { code: 'NC', name: 'North Carolina', count: 74, topProducer: 'Marquis Daniels', topPosition: 'WR' },
    { code: 'ND', name: 'North Dakota', count: 3, topProducer: 'Bjorn Gustafson', topPosition: 'OT' },
    { code: 'OH', name: 'Ohio', count: 68, topProducer: 'Jaylen Carter', topPosition: 'RB' },
    { code: 'OK', name: 'Oklahoma', count: 31, topProducer: 'Trevon Stokes', topPosition: 'QB' },
    { code: 'OR', name: 'Oregon', count: 14, topProducer: 'Kai Reynolds', topPosition: 'CB' },
    { code: 'PA', name: 'Pennsylvania', count: 54, topProducer: 'Isaiah Torres', topPosition: 'OT' },
    { code: 'RI', name: 'Rhode Island', count: 2, topProducer: 'Jackson Oliveira', topPosition: 'K' },
    { code: 'SC', name: 'South Carolina', count: 48, topProducer: 'Damien Brooks', topPosition: 'DE' },
    { code: 'SD', name: 'South Dakota', count: 3, topProducer: 'Colt Andersen', topPosition: 'LB' },
    { code: 'TN', name: 'Tennessee', count: 55, topProducer: 'Dontae Williams', topPosition: 'WR' },
    { code: 'TX', name: 'Texas', count: 196, topProducer: 'Marcus Johnson', topPosition: 'QB' },
    { code: 'UT', name: 'Utah', count: 12, topProducer: 'Easton Campbell', topPosition: 'OT' },
    { code: 'VT', name: 'Vermont', count: 2, topProducer: 'Ethan Moreau', topPosition: 'P' },
    { code: 'VA', name: 'Virginia', count: 45, topProducer: 'Terrence Bell Jr.', topPosition: 'CB' },
    { code: 'WA', name: 'Washington', count: 24, topProducer: 'Kameron Patel', topPosition: 'WR' },
    { code: 'WV', name: 'West Virginia', count: 10, topProducer: 'Derek Mason III', topPosition: 'DE' },
    { code: 'WI', name: 'Wisconsin', count: 17, topProducer: 'Hans Gutierrez', topPosition: 'OT' },
    { code: 'WY', name: 'Wyoming', count: 3, topProducer: 'Cheyenne Blackhawk', topPosition: 'LB' },
];

// Mock state-level player data for expanded view
const MOCK_PLAYERS: Record<string, { rank: number; name: string; position: string; school: string; class: string; stars: number; stats: string; status: string; tier?: string }[]> = {
    TX: [
        { rank: 1, name: 'Marcus Johnson', position: 'QB', school: 'Oakwood HS', class: '2026', stars: 5, stats: '3,420 Pass Yds | 34 TD / 4 INT', status: 'AGI Scored', tier: 'ELITE' },
        { rank: 2, name: 'Cam Newton Jr.', position: 'RB', school: 'Westlake HS', class: '2026', stars: 0, stats: '2,412 Rush Yds | 34 TD | 9.8 YPC', status: 'Deep Research Queued' },
        { rank: 3, name: 'Jaxson Dart Jr.', position: 'QB', school: 'Southlake Carroll', class: '2027', stars: 3, stats: '3,800 Pass Yds | 42 TD / 3 INT', status: 'Tier 1 Indexed' },
        { rank: 4, name: "Eli 'Tank' Williams", position: 'ILB', school: 'Allen HS', class: '2026', stars: 0, stats: '184 Tackles | 22 TFL | 8 Sacks', status: 'Community Submitted' },
        { rank: 5, name: 'DaVonte Freeman', position: 'WR', school: 'North Shore HS', class: '2026', stars: 4, stats: '1,650 Rec Yds | 19 TD | 22.3 YPR', status: 'AGI Scored', tier: 'BLUE_CHIP' },
    ],
    FL: [
        { rank: 1, name: 'Cameron Price', position: 'QB', school: 'IMG Academy', class: '2026', stars: 5, stats: '4,120 Pass Yds | 42 TD / 3 INT', status: 'AGI Scored', tier: 'ELITE' },
        { rank: 2, name: 'Jaylen Carter', position: 'RB', school: 'Summit Prep', class: '2027', stars: 4, stats: '1,680 Rush Yds | 18 TD | 7.2 YPC', status: 'AGI Scored', tier: 'PROSPECT' },
        { rank: 3, name: 'DeShaun Mitchell', position: 'CB', school: 'St. Thomas Aquinas', class: '2026', stars: 4, stats: '6 INT | 14 PBU | 52 Tackles', status: 'AGI Scored', tier: 'BLUE_CHIP' },
    ],
    GA: [
        { rank: 1, name: 'DeShawn Williams', position: 'WR', school: 'Central HS', class: '2026', stars: 4, stats: '1,340 Rec Yds | 16 TD | 17.2 YPC', status: 'AGI Scored', tier: 'BLUE_CHIP' },
        { rank: 2, name: 'Torrian Bell', position: 'DE', school: 'Grayson HS', class: '2026', stars: 3, stats: '14 Sacks | 20 TFL | 24 QB Hurries', status: 'Deep Research Queued' },
    ],
    CA: [
        { rank: 1, name: 'Xavier Coleman', position: 'WR', school: 'Mater Dei', class: '2026', stars: 3, stats: '380 Rec Yds | 4 TD | 21.1 YPC', status: 'AGI Scored', tier: 'DEVELOPMENTAL' },
        { rank: 2, name: 'Dante Reyes', position: 'EDGE', school: 'De La Salle', class: '2026', stars: 4, stats: '16 Sacks | 24 TFL | 30 QB Hurries', status: 'AGI Scored', tier: 'BLUE_CHIP' },
    ],
};

function getHeatColor(count: number): string {
    if (count >= 150) return 'bg-red-500/80 border-red-500/50 text-white';
    if (count >= 100) return 'bg-orange-500/70 border-orange-500/50 text-white';
    if (count >= 60) return 'bg-amber-500/60 border-amber-500/50 text-black';
    if (count >= 30) return 'bg-yellow-400/50 border-yellow-400/50 text-black';
    if (count >= 15) return 'bg-emerald-400/40 border-emerald-400/40 text-white';
    return 'bg-blue-400/20 border-blue-400/20 text-white/70';
}

function getHeatLabel(count: number): string {
    if (count >= 150) return 'CRITICAL MASS';
    if (count >= 100) return 'TALENT HOTBED';
    if (count >= 60) return 'HIGH DENSITY';
    if (count >= 30) return 'MODERATE';
    if (count >= 15) return 'EMERGING';
    return 'LOW VOLUME';
}

export default function StateBoardsPage() {
    const [activeState, setActiveState] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSubmitForm, setShowSubmitForm] = useState(false);

    const totalProspects = ALL_STATES.reduce((sum, s) => sum + s.count, 0);
    const topStates = [...ALL_STATES].sort((a, b) => b.count - a.count).slice(0, 5);

    const filteredStates = useMemo(() => {
        if (!search) return ALL_STATES;
        const q = search.toLowerCase();
        return ALL_STATES.filter(s =>
            s.name.toLowerCase().includes(q) ||
            s.code.toLowerCase().includes(q) ||
            s.topProducer.toLowerCase().includes(q)
        );
    }, [search]);

    const activePlayers = activeState ? (MOCK_PLAYERS[activeState] || []) : [];
    const activeStateData = ALL_STATES.find(s => s.code === activeState);

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-purple-400/30 pb-24">
            {/* Top Nav */}
            <nav className="border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/sandbox/perform" className="flex items-center gap-2 text-[0.65rem] text-white/40 hover:text-purple-400 transition-colors font-mono uppercase tracking-widest">
                        <ArrowLeft size={14} /> Per|Form Hub
                    </Link>
                    <div className="text-[0.6rem] font-mono tracking-widest text-purple-400/50 flex items-center gap-2">
                        <Database size={12} className="text-purple-400/70" />
                        {totalProspects.toLocaleString()} PROSPECTS INDEXED &middot; 50 STATES
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
                            High School <span className="text-purple-400">State Boards</span>
                        </h1>
                        <p className="text-sm text-white/60 leading-relaxed font-sans max-w-xl">
                            We don&apos;t index stars. We index <span className="text-white font-mono font-bold tracking-wider">PRODUCTION</span>.
                            Tracking the top 50-100 high school athletes per state based entirely on previous-year statistical output.
                            Zero-star recruits outperforming 5-star narratives.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowSubmitForm(true)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 rounded-lg text-purple-400 text-xs font-mono uppercase tracking-wider transition-colors"
                        >
                            <Upload size={14} /> Submit a Prospect
                        </button>
                    </div>
                </motion.div>

                {/* Stat Strip */}
                <motion.div variants={staggerItem} className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {topStates.map((st, idx) => (
                        <button
                            key={st.code}
                            onClick={() => setActiveState(st.code)}
                            className={`p-4 rounded-xl border text-left transition-all hover:scale-[1.02] ${activeState === st.code
                                    ? 'bg-purple-400/10 border-purple-400/30 shadow-[0_0_20px_rgba(168,85,247,0.1)]'
                                    : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                                }`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-[0.6rem] font-mono uppercase tracking-widest text-white/40">#{idx + 1}</span>
                                <span className={`px-1.5 py-0.5 rounded text-[0.5rem] font-mono font-bold ${getHeatColor(st.count)}`}>
                                    {st.count}
                                </span>
                            </div>
                            <div className="text-lg font-display font-bold text-white">{st.name}</div>
                            <div className="text-[0.6rem] font-mono text-white/30 mt-1">{st.topProducer} · {st.topPosition}</div>
                        </button>
                    ))}
                </motion.div>

                {/* Heat Map Legend */}
                <motion.div variants={staggerItem} className="flex flex-wrap items-center gap-3 text-[0.6rem] font-mono uppercase tracking-widest text-white/40">
                    <span>Density:</span>
                    {[
                        { label: '150+', cls: 'bg-red-500/80' },
                        { label: '100+', cls: 'bg-orange-500/70' },
                        { label: '60+', cls: 'bg-amber-500/60' },
                        { label: '30+', cls: 'bg-yellow-400/50' },
                        { label: '15+', cls: 'bg-emerald-400/40' },
                        { label: '<15', cls: 'bg-blue-400/20' },
                    ].map(h => (
                        <div key={h.label} className="flex items-center gap-1.5">
                            <div className={`w-3 h-3 rounded-sm ${h.cls}`} />
                            <span>{h.label}</span>
                        </div>
                    ))}
                </motion.div>

                {/* Search + State Grid */}
                <motion.div variants={staggerItem} className="space-y-6">
                    <div className="relative max-w-md">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search states, players, or positions..."
                            className="w-full pl-9 pr-4 py-2.5 bg-[#0f0f0f] border border-white/10 rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-purple-400/40 font-mono"
                        />
                    </div>

                    {/* All 50 State Tiles */}
                    <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-8 lg:grid-cols-10 gap-2">
                        {filteredStates.map(st => (
                            <button
                                key={st.code}
                                onClick={() => setActiveState(st.code)}
                                className={`p-3 rounded-xl border text-center transition-all hover:scale-105 relative group ${activeState === st.code
                                        ? 'ring-2 ring-purple-400 border-purple-400/50 bg-purple-400/10'
                                        : `${getHeatColor(st.count)} hover:ring-1 hover:ring-white/20`
                                    }`}
                            >
                                <div className="text-lg font-mono font-black">{st.code}</div>
                                <div className="text-[0.5rem] font-mono opacity-70">{st.count}</div>
                                {/* Tooltip */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-lg text-left min-w-[160px] opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-20 shadow-2xl">
                                    <div className="text-xs font-display font-bold text-white">{st.name}</div>
                                    <div className="text-[0.55rem] font-mono text-white/40 mt-1">{st.count} prospects indexed</div>
                                    <div className="text-[0.55rem] font-mono text-purple-400 mt-0.5">{st.topProducer}</div>
                                </div>
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* Expanded State View */}
                <AnimatePresence>
                    {activeState && activeStateData && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="bg-[#0f0f0f] border border-purple-400/20 rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(168,85,247,0.08)]"
                        >
                            <div className="p-6 border-b border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center font-mono font-black text-lg ${getHeatColor(activeStateData.count)}`}>
                                        {activeState}
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-display font-bold text-white">{activeStateData.name}</h2>
                                        <div className="flex gap-3 text-[0.6rem] font-mono text-white/40 mt-1">
                                            <span>{activeStateData.count} indexed</span>
                                            <span className="text-purple-400">{getHeatLabel(activeStateData.count)}</span>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => setActiveState(null)} className="text-white/30 hover:text-white transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            {activePlayers.length > 0 ? (
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-white/5 bg-white/[0.02]">
                                            <th className="p-4 text-[0.65rem] font-mono uppercase tracking-widest text-white/30 font-medium">Rank</th>
                                            <th className="p-4 text-[0.65rem] font-mono uppercase tracking-widest text-white/30 font-medium">Prospect</th>
                                            <th className="p-4 text-[0.65rem] font-mono uppercase tracking-widest text-white/30 font-medium hidden md:table-cell">School / Class</th>
                                            <th className="p-4 text-[0.65rem] font-mono uppercase tracking-widest text-white/30 font-medium">Prev. Season Stats</th>
                                            <th className="p-4 text-[0.65rem] font-mono uppercase tracking-widest text-white/30 font-medium text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {activePlayers.map(p => (
                                            <tr key={p.rank} className="group hover:bg-white/[0.02] transition-colors">
                                                <td className="p-4">
                                                    <span className="text-sm font-mono text-white/50">{p.rank.toString().padStart(2, '0')}</span>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="font-display font-bold text-white text-base group-hover:text-purple-400 transition-colors">
                                                            {p.name}
                                                        </span>
                                                        <div className="flex gap-2 items-center">
                                                            <span className="text-xs font-mono text-white/40">{p.position}</span>
                                                            {p.stars === 0 ? (
                                                                <span className="text-[0.55rem] font-mono bg-purple-400/20 text-purple-400 px-1.5 py-0.5 rounded tracking-widest">UNRANKED GEM</span>
                                                            ) : (
                                                                <span className="text-[0.55rem] font-mono text-yellow-500/50">{'★'.repeat(p.stars)}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4 hidden md:table-cell">
                                                    <div className="text-sm text-white/70">{p.school}</div>
                                                    <div className="text-[0.6rem] font-mono text-white/30">Class of &apos;{p.class.slice(2)}</div>
                                                </td>
                                                <td className="p-4">
                                                    <span className="text-xs font-mono tracking-wide text-emerald-400/80">{p.stats}</span>
                                                </td>
                                                <td className="p-4 text-right">
                                                    {p.status === 'AGI Scored' ? (
                                                        <div className="inline-flex items-center gap-1.5 bg-gold/10 border border-gold/30 text-gold px-2.5 py-1 rounded text-[0.6rem] font-mono uppercase tracking-widest">
                                                            <CheckCircle2 size={10} /> {p.tier}
                                                        </div>
                                                    ) : p.status === 'Deep Research Queued' ? (
                                                        <div className="inline-flex items-center gap-1.5 bg-blue-400/10 border border-blue-400/30 text-blue-400 px-2.5 py-1 rounded text-[0.6rem] font-mono uppercase tracking-widest animate-pulse">
                                                            <Target size={10} /> Tier 2/3
                                                        </div>
                                                    ) : (
                                                        <div className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 text-white/50 px-2.5 py-1 rounded text-[0.6rem] font-mono uppercase tracking-widest">
                                                            {p.status}
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="p-12 text-center">
                                    <Radar size={24} className="text-purple-400/30 mx-auto mb-3 animate-spin-slow" />
                                    <p className="text-sm text-white/40 font-mono">Prospect data for {activeStateData.name} is being indexed...</p>
                                    <p className="text-[0.6rem] text-white/20 font-mono mt-2">Tier 1 harvest in progress. {activeStateData.count} records identified.</p>
                                </div>
                            )}

                            <div className="p-4 border-t border-white/5 flex justify-between items-center">
                                <span className="text-[0.6rem] font-mono text-white/30">Showing top {activePlayers.length} of {activeStateData.count} indexed</span>
                                <button className="text-[0.65rem] font-mono text-purple-400/70 hover:text-purple-400 transition-colors flex items-center gap-1">
                                    View Full {activeState} Board <ChevronRight size={12} />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Submit Form Modal */}
                <AnimatePresence>
                    {showSubmitForm && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
                            onClick={() => setShowSubmitForm(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                onClick={e => e.stopPropagation()}
                                className="bg-[#0f0f0f] border border-purple-500/20 rounded-2xl p-8 max-w-lg w-full shadow-[0_0_60px_rgba(168,85,247,0.1)] relative"
                            >
                                <button onClick={() => setShowSubmitForm(false)} className="absolute top-4 right-4 text-white/30 hover:text-white">
                                    <X size={20} />
                                </button>

                                <Upload className="text-purple-400 mb-4" size={28} />
                                <h3 className="text-2xl font-display font-bold text-white mb-2 tracking-tight">
                                    Submit a Prospect
                                </h3>
                                <p className="text-sm text-white/50 mb-6 leading-relaxed">
                                    Mainstream recruiting networks miss production every day. Submit a player we should be tracking.
                                    Our AGI will activate Deep Research and output an accurate grade.
                                </p>

                                <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setIsSubmitting(true); setTimeout(() => { setIsSubmitting(false); setShowSubmitForm(false); }, 2000); }}>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-[0.65rem] font-mono text-white/40 uppercase tracking-widest mb-1">First Name</label>
                                            <input type="text" className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-400/50" required />
                                        </div>
                                        <div>
                                            <label className="block text-[0.65rem] font-mono text-white/40 uppercase tracking-widest mb-1">Last Name</label>
                                            <input type="text" className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-400/50" required />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div>
                                            <label className="block text-[0.65rem] font-mono text-white/40 uppercase tracking-widest mb-1">Position</label>
                                            <input type="text" className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-400/50" placeholder="RB" required />
                                        </div>
                                        <div>
                                            <label className="block text-[0.65rem] font-mono text-white/40 uppercase tracking-widest mb-1">High School</label>
                                            <input type="text" className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-400/50" required />
                                        </div>
                                        <div>
                                            <label className="block text-[0.65rem] font-mono text-white/40 uppercase tracking-widest mb-1">State</label>
                                            <input type="text" className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-400/50" placeholder="TX" required />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[0.65rem] font-mono text-white/40 uppercase tracking-widest mb-1">Stat Line or MaxPreps Link</label>
                                        <textarea className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-400/50 h-24 resize-none" placeholder="2,400 Rush Yds | 32 TD | 8.5 YPC or paste MaxPreps URL..." required />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full py-3 bg-purple-500 hover:bg-purple-400 text-black font-mono font-bold uppercase tracking-widest text-xs rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {isSubmitting ? (
                                            <><Radar size={14} className="animate-spin" /> Activating Deep Research...</>
                                        ) : (
                                            <><Zap size={14} /> Submit to AGI Queue</>
                                        )}
                                    </button>
                                </form>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
