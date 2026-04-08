"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Box, Server, Activity, Terminal, Shield } from "lucide-react";

export default function AimsDeployDockWatermark({ appName = "A.I.M.S. Plug" }: { appName?: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [uptime, setUptime] = useState(0);

    useEffect(() => {
        const t = setInterval(() => setUptime((prev) => prev + 1), 1000);
        return () => clearInterval(t);
    }, []);

    const formatUptime = (sec: number) => {
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const s = sec % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="fixed bottom-6 left-6 z-[9999]">
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                className="relative group flex items-center justify-center w-12 h-12 bg-black/80 backdrop-blur-md border border-[#D4AF37]/30 rounded-xl hover:border-[#D4AF37] transition-all overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.5)]"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <Box size={20} className="text-[#D4AF37]" />

                {/* Radar ping effect */}
                <span className="absolute top-2 right-2 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22C55E] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#22C55E]"></span>
                </span>
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="absolute bottom-16 left-0 w-80 bg-black/95 backdrop-blur-xl border border-[#D4AF37]/20 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.8)] overflow-hidden font-mono"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-[#D4AF37]/20 to-transparent p-4 border-b border-[#D4AF37]/20 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Box size={16} className="text-[#D4AF37]" />
                                <span className="text-[0.65rem] uppercase tracking-[0.2em] font-black text-[#D4AF37]">Deploy Dock</span>
                            </div>
                            <span className="text-[0.55rem] text-[#22C55E] bg-[#22C55E]/10 px-2 py-0.5 rounded border border-[#22C55E]/30 uppercase tracking-widest flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" /> Active
                            </span>
                        </div>

                        {/* Content */}
                        <div className="p-5 space-y-4">
                            <div className="space-y-1">
                                <p className="text-[0.55rem] uppercase tracking-widest text-[#D4AF37]/60">Hosted Application</p>
                                <p className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                                    <Server size={14} className="text-slate-400" /> {appName}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                                    <p className="text-[0.5rem] uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1">
                                        <Activity size={10} /> Container
                                    </p>
                                    <p className="text-xs text-white font-medium">Running</p>
                                </div>
                                <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                                    <p className="text-[0.5rem] uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1">
                                        <Terminal size={10} /> Uptime
                                    </p>
                                    <p className="text-xs text-[#22C55E] font-medium">{formatUptime(uptime)}</p>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <p className="text-[0.55rem] uppercase tracking-widest text-[#D4AF37]/60">Orchestration Route</p>
                                <div className="font-mono text-[0.65rem] text-slate-300 bg-white/5 p-2 rounded border border-white/10 flex items-center justify-between">
                                    <span>ACHEEVY <span className="text-slate-500">→</span> Docker</span>
                                    <Shield size={12} className="text-[#D4AF37]" />
                                </div>
                            </div>

                            <div className="pt-2">
                                <p className="text-[0.5rem] text-slate-500 text-center uppercase tracking-widest">
                                    Shipped via A.I.M.S.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
