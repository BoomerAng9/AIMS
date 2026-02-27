"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plus,
    Eye,
    Edit3,
    CheckCircle2,
    Clock,
    AlertCircle,
    ChevronRight,
    Database,
    Globe,
    Code
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * WIREFRAME PLUG DISPLAY COMPONENT
 * Implements the technical, luxury industrial design for displaying finished plugs.
 * Features: Decentralized grid, glowing data lines, selection state, and active coding.
 */

interface PlugInstance {
    id: string;
    name: string;
    type: string;
    status: "active" | "standby" | "alert";
    timestamp: string;
    icon: React.ElementType;
}

const mockPlugs: PlugInstance[] = [
    { id: "PLUG-8821", name: "Sales Outreach Hawk", type: "Automation", status: "active", timestamp: "02.25.26", icon: Globe },
    { id: "PLUG-4412", name: "Content Strategy ang", type: "Creativity", status: "active", timestamp: "02.24.26", icon: Edit3 },
    { id: "PLUG-9901", name: "Data Scout Lil_Hawk", type: "Intelligence", status: "standby", timestamp: "02.22.26", icon: Database },
    { id: "PLUG-3329", name: "LUC Calculator", type: "Utility", status: "active", timestamp: "02.21.26", icon: Code },
    { id: "PLUG-1102", name: "Audit Engine", type: "Governance", status: "alert", timestamp: "02.20.26", icon: AlertCircle },
];

export const WireframePlugDisplay = () => {
    const [selectedPlugs, setSelectedPlugs] = useState<string[]>([]);
    const [hoveredPlug, setHoveredPlug] = useState<string | null>(null);

    const toggleSelection = (id: string) => {
        setSelectedPlugs(prev =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    };

    return (
        <div className="relative w-full min-h-[600px] bg-black p-8 overflow-hidden rounded-3xl border border-white/5">
            {/* Background Technical Grid */}
            <div
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                    backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)
          `,
                    backgroundSize: '40px 40px'
                }}
            />

            {/* Header Section */}
            <div className="relative z-10 mb-12 flex justify-between items-start">
                <div>
                    <h2 className="text-5xl font-black text-[#BFFF07] font-display italic tracking-tighter leading-none">
                        DEPLOY
                    </h2>
                    <h2 className="text-5xl font-black text-white font-display italic tracking-tighter leading-none -mt-2">
                        More Plugs
                    </h2>
                    <div className="mt-4 flex items-center space-x-2">
                        <div className="h-1 w-8 bg-[#BFFF07]" />
                        <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.3em]">
                            Select Finished Plugs for Hub Deployment
                        </p>
                    </div>
                </div>

                <div className="text-right">
                    <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.2em] mb-1">
                        Active Selection
                    </p>
                    <p className="text-2xl font-display text-white">
                        {selectedPlugs.length} / {mockPlugs.length}
                    </p>
                </div>
            </div>

            {/* Technical Connection Lines (Visual Decor) */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
                <defs>
                    <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#BFFF07" stopOpacity="0" />
                        <stop offset="50%" stopColor="#BFFF07" stopOpacity="0.5" />
                        <stop offset="100%" stopColor="#BFFF07" stopOpacity="0" />
                    </linearGradient>
                </defs>
                <path d="M 0,150 Q 500,200 1000,150" stroke="url(#lineGrad)" strokeWidth="1" fill="transparent" />
                <path d="M 0,350 Q 500,300 1000,350" stroke="url(#lineGrad)" strokeWidth="1" fill="transparent" />
            </svg>

            {/* Plug Card Grid */}
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mockPlugs.map((plug, i) => {
                    const isSelected = selectedPlugs.includes(plug.id);
                    const isHovered = hoveredPlug === plug.id;

                    return (
                        <motion.div
                            key={plug.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            onMouseEnter={() => setHoveredPlug(plug.id)}
                            onMouseLeave={() => setHoveredPlug(null)}
                            onClick={() => toggleSelection(plug.id)}
                            className={cn(
                                "group relative cursor-pointer border rounded-2xl p-6 transition-all duration-300",
                                "bg-[#0A0A0A]/80 backdrop-blur-md",
                                isSelected
                                    ? "border-[#BFFF07] shadow-[0_0_30px_rgba(191,255,7,0.1)]"
                                    : "border-white/10 hover:border-white/20"
                            )}
                        >
                            {/* Card Meta Header */}
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex space-x-1.3">
                                    <div className={cn(
                                        "w-1.5 h-1.5 rounded-full",
                                        plug.status === "active" ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" :
                                            plug.status === "standby" ? "bg-yellow-500" : "bg-red-500"
                                    )} />
                                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-800" />
                                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-800" />
                                </div>
                                <p className="text-[9px] font-mono text-zinc-600 tracking-widest uppercase">
                                    {plug.timestamp}
                                </p>
                            </div>

                            {/* Main Content */}
                            <div className="flex items-center space-x-4 mb-4">
                                <div className={cn(
                                    "w-12 h-12 rounded-xl flex items-center justify-center border transition-all duration-500",
                                    isSelected ? "bg-[#BFFF07]/10 border-[#BFFF07]/20" : "bg-white/5 border-white/5"
                                )}>
                                    <plug.icon className={cn(
                                        "w-6 h-6",
                                        isSelected ? "text-[#BFFF07]" : "text-zinc-500"
                                    )} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-md font-bold text-white truncate group-hover:text-[#BFFF07] transition-colors uppercase tracking-tight">
                                        {plug.name}
                                    </h3>
                                    <p className="text-[10px] font-mono text-zinc-500 mt-1 uppercase">
                                        {plug.type} // {plug.id}
                                    </p>
                                </div>
                            </div>

                            {/* Selection Checkmark */}
                            <AnimatePresence>
                                {isSelected && (
                                    <motion.div
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0, opacity: 0 }}
                                        className="absolute -top-2 -right-2 w-5 h-5 bg-[#BFFF07] rounded-full flex items-center justify-center shadow-lg"
                                    >
                                        <CheckCircle2 size={12} className="text-black" />
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Actions Footer */}
                            <div className="grid grid-cols-2 gap-3 mt-8">
                                <button className="flex items-center justify-center space-x-2 py-2 rounded-lg bg-zinc-900 border border-white/5 text-[10px] text-zinc-400 font-bold uppercase tracking-widest hover:bg-zinc-800 hover:text-white transition-all">
                                    <Eye size={12} />
                                    <span>View</span>
                                </button>
                                <button className="flex items-center justify-center space-x-2 py-2 rounded-lg bg-zinc-900 border border-white/5 text-[10px] text-zinc-400 font-bold uppercase tracking-widest hover:bg-[#BFFF07] hover:text-black hover:border-transparent transition-all">
                                    <Edit3 size={12} />
                                    <span>Edit</span>
                                </button>
                            </div>

                            {/* Hover Glow Effect */}
                            {isHovered && !isSelected && (
                                <div className="absolute inset-0 bg-[#BFFF07]/5 rounded-2xl pointer-events-none" />
                            )}
                        </motion.div>
                    );
                })}

                {/* Create New Plug Placeholder */}
                <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="border border-dashed border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center space-y-4 hover:border-[#BFFF07]/30 transition-all cursor-pointer bg-white/[0.02]"
                >
                    <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center border border-white/5">
                        <Plus size={24} className="text-zinc-500" />
                    </div>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">
                        Build Another Plug
                    </p>
                </motion.div>
            </div>

            {/* Footer Branding Area */}
            <div className="mt-16 flex items-center justify-between opacity-30">
                <div className="flex items-center space-x-4">
                    <p className="text-[10px] font-mono font-bold tracking-[0.3em] text-white uppercase">A.I.M.S.</p>
                    <div className="h-0.5 w-12 bg-white/20" />
                    <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest italic">Autonomous Logistics Matrix</p>
                </div>
                <div className="flex space-x-2">
                    <div className="w-2 h-2 rounded-full bg-[#BFFF07]" />
                    <div className="w-2 h-2 rounded-full bg-zinc-800" />
                    <div className="w-2 h-2 rounded-full bg-zinc-800" />
                </div>
            </div>
        </div>
    );
};
