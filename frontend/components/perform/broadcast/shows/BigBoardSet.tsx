'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BroadcastSegment } from '../engine';
import { getScoreColor } from '@/lib/perform/types';

export function BigBoardSet({ segment }: { segment: BroadcastSegment }) {
    const [prospects, setProspects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/perform/draft?limit=5')
            .then(res => res.json())
            .then(data => {
                setProspects(data.prospects || []);
                setLoading(false);
            });
    }, []);

    return (
        <div className="w-full h-full flex items-center justify-center p-12 perspective-[2000px]">
            <motion.div
                initial={{ rotateY: 15, scale: 0.9, opacity: 0 }}
                animate={{ rotateY: 0, scale: 1, opacity: 1 }}
                transition={{ duration: 1.2, type: 'spring' }}
                className="w-full max-w-7xl h-full max-h-[700px] bg-black/60 border border-gold/40 rounded-[2rem] shadow-[0_0_80px_rgba(218,165,32,0.15)] overflow-hidden flex flex-col p-8 relative backdrop-blur-xl"
            >
                <div className="absolute top-0 right-0 w-full h-1/2 bg-gradient-to-b from-gold/10 to-transparent pointer-events-none" />

                <h2 className="text-4xl font-black text-white uppercase tracking-[0.2em] mb-8 flex items-center gap-4">
                    <span className="w-4 h-4 rounded-full bg-gold animate-pulse" />
                    The Big Board Top 5
                </h2>

                {loading ? (
                    <div className="flex-1 flex items-center justify-center text-gold/50 font-mono">LOADING DATA FEED...</div>
                ) : (
                    <div className="flex-1 grid grid-cols-5 gap-6">
                        {prospects.map((p, i) => (
                            <motion.div
                                key={p.id}
                                initial={{ opacity: 0, y: 50 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.15 + 0.5, type: 'spring' }}
                                className="bg-white/5 border border-white/10 rounded-2xl flex flex-col overflow-hidden group hover:border-gold/50 transition-colors"
                            >
                                <div className="h-2 bg-gradient-to-r from-gold to-yellow-600" />
                                <div className="p-6 flex-1 flex flex-col items-center text-center justify-center">
                                    <div className="text-[6rem] font-black text-white/5 leading-none absolute top-10 pointer-events-none select-none">
                                        {i + 1}
                                    </div>
                                    <h3 className="text-2xl font-bold uppercase z-10">{p.firstName} <br /><span className="text-gold">{p.lastName}</span></h3>
                                    <div className="px-3 py-1 bg-white/10 rounded font-mono text-sm mt-4 mb-2 z-10">
                                        {p.position} | {p.college}
                                    </div>
                                    <div className="mt-auto z-10 pt-6">
                                        <span className="text-xs text-white/40 uppercase tracking-widest block mb-1">PAI Score</span>
                                        <span className={`text-3xl font-black ${getScoreColor(p.paiScore)}`}>
                                            {p.paiScore}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </motion.div>
        </div>
    );
}
