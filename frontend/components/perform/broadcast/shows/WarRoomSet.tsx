'use client';

import { motion } from 'framer-motion';
import { BroadcastSegment } from '../engine';
import { Swords, MessageSquare, Flame } from 'lucide-react';
import Image from 'next/image';

export function WarRoomSet({ segment }: { segment: BroadcastSegment }) {
    // Simulating an active debate desk showing the two analysts head to head.

    return (
        <div className="w-full h-full flex items-center justify-center p-8 bg-[url('/noise.png')] opacity-95">
            <div className="w-full max-w-7xl flex gap-8 items-stretch h-[600px]">
                {/* BULL DESK */}
                <motion.div
                    initial={{ x: -100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ type: 'spring', damping: 20 }}
                    className="flex-1 bg-white border border-emerald-200 rounded-3xl overflow-hidden relative shadow-sm flex flex-col justify-end p-8"
                >
                    <div className="absolute top-0 right-0 p-6 pointer-events-none">
                        <Flame className="w-16 h-16 text-emerald-500/10" />
                    </div>

                    <div className="absolute bottom-0 right-[-50px] opacity-70">
                        <Image
                            src="/images/perform/boomer-ang-debate.png"
                            alt="Boomer_Ang"
                            width={600}
                            height={600}
                            className="object-cover"
                        />
                    </div>

                    <div className="relative z-10 bg-white/90 backdrop-blur-md border border-emerald-500/20 p-6 rounded-2xl w-3/4 shadow-lg">
                        <h4 className="text-emerald-600 font-bold uppercase tracking-widest text-xs mb-2 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            The Bull Case
                        </h4>
                        <p className="text-slate-800 text-lg leading-relaxed">
                            "When healthy, McCoy is the best CB in this class. ACL recovery is routine now — 12+ months out. The ball skills and athleticism are elite."
                        </p>
                    </div>
                </motion.div>

                {/* VS Center */}
                <div className="w-24 flex flex-col items-center justify-center pointer-events-none z-10">
                    <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-16 h-16 rounded-full bg-gold/20 flex items-center justify-center border border-gold/50 backdrop-blur text-gold font-black italic text-xl drop-shadow-[0_0_10px_rgba(218,165,32,0.8)]"
                    >
                        VS
                    </motion.div>
                    <div className="w-px h-full bg-gold/10 my-4" />
                </div>

                {/* BEAR DESK */}
                <motion.div
                    initial={{ x: 100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ type: 'spring', damping: 20 }}
                    className="flex-1 bg-white border border-slate-200 rounded-3xl overflow-hidden relative shadow-sm flex flex-col justify-end p-8"
                >
                    <div className="absolute top-0 left-0 p-6 pointer-events-none">
                        <MessageSquare className="w-16 h-16 text-slate-500/10" />
                    </div>

                    <div className="absolute bottom-0 left-[-50px] opacity-80 scale-x-[-1]">
                        <Image
                            src="/images/perform/lil-hawk-debate.png"
                            alt="Lil_Hawk"
                            width={600}
                            height={600}
                            className="object-cover"
                        />
                    </div>

                    <div className="relative z-10 bg-white/90 backdrop-blur-md border border-slate-500/20 p-6 rounded-2xl w-3/4 self-end shadow-lg">
                        <h4 className="text-slate-600 font-bold uppercase tracking-widest text-xs mb-2 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-slate-500 animate-pulse" />
                            The Bear Case
                        </h4>
                        <p className="text-slate-800 text-lg leading-relaxed text-right">
                            "Missed entire 2025 season. ACL tears change athletes. Teams drafting in the top 15 can't afford medical risks."
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
