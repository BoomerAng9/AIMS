'use client';

import { motion } from 'framer-motion';
import { BroadcastSegment } from '../engine';

const CURRENT_YEAR = new Date().getFullYear();

// Top picks come from actual NFL 2026 draft order (seed data)
const ON_THE_CLOCK_ORDER = [
    { pick: 1, team: 'Las Vegas Raiders', abbrev: 'LV', needs: ['QB', 'EDGE'] },
    { pick: 2, team: 'New York Jets', abbrev: 'NYJ', needs: ['QB', 'EDGE'] },
    { pick: 3, team: 'Arizona Cardinals', abbrev: 'ARI', needs: ['OT', 'QB'] },
    { pick: 4, team: 'Tennessee Titans', abbrev: 'TEN', needs: ['EDGE', 'OT'] },
    { pick: 5, team: 'New York Giants', abbrev: 'NYG', needs: ['S', 'OT'] },
];

export function MockDraftSet({ segment }: { segment: BroadcastSegment }) {

    return (
        <div className="w-full h-full flex flex-col items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-black to-black relative">

            {/* Ambient glow */}
            <div className="absolute inset-0 bg-gradient-radial from-blue-900/10 to-transparent pointer-events-none" />

            {/* Header Bar */}
            <motion.div
                initial={{ y: -40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6 }}
                className="absolute top-0 w-full flex items-center justify-between px-16 py-6 border-b border-white/10 bg-black/40 backdrop-blur-sm z-10"
            >
                <div className="flex items-center gap-4">
                    <span className="text-[10px] font-bold tracking-[0.4em] uppercase text-gold/80">Per|Form Network</span>
                </div>
                <span className="text-[10px] font-mono uppercase text-white/40 tracking-widest">
                    NFL Draft {CURRENT_YEAR} · Round 1
                </span>
            </motion.div>

            {/* ON THE CLOCK Banner */}
            <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="z-10 flex flex-col items-center mb-8"
            >
                <motion.span
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1.4, repeat: Infinity }}
                    className="text-[11px] font-black tracking-[0.6em] uppercase text-gold mb-3"
                >
                    ● On The Clock
                </motion.span>

                {/* ON THE CLOCK Team Card */}
                <motion.div
                    animate={{ boxShadow: ['0 0 30px rgba(218,165,32,0.1)', '0 0 60px rgba(218,165,32,0.3)', '0 0 30px rgba(218,165,32,0.1)'] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="bg-black/80 backdrop-blur-xl border border-gold/30 rounded-2xl px-20 py-10 flex flex-col items-center gap-4"
                >
                    <span className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40">
                        #{ON_THE_CLOCK_ORDER[0].pick}
                    </span>
                    <div className="text-center">
                        <p className="text-3xl font-bold text-white tracking-wide">{ON_THE_CLOCK_ORDER[0].team}</p>
                        <div className="flex gap-2 mt-3 justify-center">
                            {ON_THE_CLOCK_ORDER[0].needs.map(n => (
                                <span key={n} className="px-3 py-1 bg-white/10 border border-white/20 text-white/70 text-xs font-bold rounded-full uppercase tracking-widest">
                                    {n}
                                </span>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </motion.div>

            {/* Draft Order Row */}
            <motion.div
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="z-10 flex gap-4 flex-wrap justify-center px-8"
            >
                {ON_THE_CLOCK_ORDER.slice(1).map((pick) => (
                    <div
                        key={pick.pick}
                        className="bg-white/5 border border-white/10 rounded-xl px-6 py-4 flex flex-col items-center gap-1 min-w-[110px]"
                    >
                        <span className="text-xl font-black text-white/50">#{pick.pick}</span>
                        <span className="text-xs text-white/40 font-medium tracking-wide text-center leading-tight">{pick.team}</span>
                    </div>
                ))}
            </motion.div>

            {/* Footer label */}
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                transition={{ delay: 1 }}
                className="absolute bottom-6 text-[10px] text-white/40 tracking-widest uppercase font-mono"
            >
                NFL Draft {CURRENT_YEAR} · A.I.M.S. Scoring &amp; Grading System
            </motion.p>
        </div>
    );
}
