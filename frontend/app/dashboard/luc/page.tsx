// frontend/app/dashboard/luc/page.tsx
"use client";

import React from "react";
import Image from "next/image";
import { Calculator, Zap, Database, Globe } from "lucide-react";

export default function LucUsagePage() {
  const usageStats = [
    { label: "Token Usage", value: "0", unit: "tokens", trend: "0%", icon: Zap },
    { label: "Compute Time", value: "0", unit: "min", trend: "0%", icon: Globe },
    { label: "API Calls", value: "0", unit: "req", trend: "0%", icon: Database },
    { label: "Storage", value: "0.2", unit: "GB", trend: "0.01%", icon: Calculator },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* ---- Hero Section: LUC Product Box ---- */}
      <section className="relative overflow-hidden rounded-3xl border border-amber-300/20 shadow-[0_0_60px_rgba(251,191,36,0.15)]">
        <div className="flex flex-col md:flex-row">
          {/* Left: Copy */}
          <div className="w-full md:w-[50%] bg-gradient-to-br from-black via-black/95 to-amber-950/30 p-8 md:p-10 flex flex-col justify-center">
            <p className="text-[10px] uppercase tracking-[0.3em] text-amber-200/50 mb-2">
              Locale Usage Calculator
            </p>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-amber-50 font-display">
              LUC
            </h1>
            <p className="mt-3 text-sm text-amber-100/60 leading-relaxed max-w-md">
              Real-time infrastructure and AI intelligence cost auditing.
              Every token, every compute cycle, every API call &mdash; tracked and optimized.
            </p>
            <div className="mt-6 flex items-center gap-4">
              <div className="flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/5 px-4 py-2">
                <span className="text-[10px] uppercase tracking-widest text-amber-200/60 font-semibold font-display">Wallet Balance:</span>
                <span className="text-sm font-mono font-bold text-amber-50">$250.00</span>
              </div>
            </div>
            <p className="mt-6 text-[10px] uppercase tracking-wider text-amber-100/30">
              www.plugmein.cloud
            </p>
          </div>

          {/* Right: LUC Hero Image */}
          <div className="relative w-full md:w-[50%] min-h-[300px] md:min-h-[400px] bg-gradient-to-br from-amber-950/20 to-black">
            <Image
              src="/images/brand/luc-box.png"
              alt="LUC — Locale Usage Calculator"
              fill
              className="object-contain p-4"
              unoptimized
            />
          </div>
        </div>
      </section>

      {/* ---- Stats Grid ---- */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {usageStats.map((stat) => (
          <div key={stat.label} className="rounded-3xl border border-white/10 bg-black/60 p-5 backdrop-blur-2xl">
            <div className="flex items-center gap-2 mb-2">
              <stat.icon size={14} className="text-amber-300/60" />
              <p className="text-[10px] uppercase tracking-widest text-amber-100/50">{stat.label}</p>
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-semibold text-amber-50">{stat.value}</span>
              <span className="text-xs text-amber-100/60">{stat.unit}</span>
            </div>
            <div className="mt-3 flex items-center gap-1.5">
              <span className="text-[10px] text-amber-400 font-medium">{stat.trend} from last hour</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_350px]">
        {/* Cost Accumulation chart placeholder */}
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-black/80 p-6 flex flex-col items-center justify-center min-h-[300px]">
           <div className="text-amber-100/20 text-center space-y-2">
              <div className="mx-auto h-12 w-12 rounded-full border border-dashed border-white/20 flex items-center justify-center">
                <Calculator size={20} className="text-amber-100/20" />
              </div>
              <p className="text-sm">Usage graph will populate after your first ACHEEVY session.</p>
           </div>
        </div>

        {/* Pricing Tiers Quick Reference */}
        <div className="space-y-4">
           <section className="rounded-3xl border border-white/10 bg-black/60 p-6 backdrop-blur-2xl">
             <h2 className="text-xs font-semibold uppercase tracking-widest text-amber-200/80 font-display">Rate Card</h2>
             <div className="mt-4 space-y-4">
               <div className="flex justify-between text-xs">
                 <span className="text-amber-100/60">Flash Models</span>
                 <span className="text-amber-50">$0.0004 / 1k tokens</span>
               </div>
               <div className="flex justify-between text-xs">
                 <span className="text-amber-100/60">Pro Models</span>
                 <span className="text-amber-50">$0.0035 / 1k tokens</span>
               </div>
               <div className="flex justify-between text-xs">
                 <span className="text-amber-100/60">Cloud Run</span>
                 <span className="text-amber-50">$0.00002 / second</span>
               </div>
               <hr className="border-white/5" />
               <p className="text-[10px] text-amber-100/40 italic">
                 * ByteRover discount (35%) applied automatically for ACHIEVEMOR Partners.
               </p>
             </div>
           </section>
        </div>
      </div>
    </div>
  );
}
