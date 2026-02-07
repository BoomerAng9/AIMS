// frontend/app/dashboard/page.tsx
import React from "react";
import Link from "next/link";
import {
  MessageSquare,
  Layers,
  Settings,
  CreditCard,
  ArrowRight,
  Hammer,
  Copy,
  Plug,
} from "lucide-react";

export default function DashboardPage() {
  const tiles = [
    {
      title: "Chat with ACHEEVY",
      icon: MessageSquare,
      desc: "Direct orchestrator interface.",
      status: "Active",
      href: "/dashboard/chat"
    },
    { 
      title: "LUC Quotes", 
      icon: CreditCard, 
      desc: "Resource auditing and budgeting.", 
      status: "Active",
      href: "/dashboard/luc" 
    },
    { 
      title: "aiPlugs", 
      icon: Layers, 
      desc: "Deploy capability modules.", 
      status: "Active",
      href: "/dashboard/ai-plugs" 
    },
    {
      title: "Build a Plug",
      icon: Hammer,
      desc: "Step-by-step plug builder.",
      status: "Active",
      href: "/dashboard/build"
    },
    {
      title: "Your Plugs",
      icon: Plug,
      desc: "Manage deployed plugs.",
      status: "Active",
      href: "/dashboard/plugs"
    },
    {
      title: "Make It Mine",
      icon: Copy,
      desc: "Clone and customize templates.",
      status: "Active",
      href: "/dashboard/make-it-mine"
    },
    {
      title: "Settings",
      icon: Settings,
      desc: "Workspace and team config.",
      status: "Active",
      href: "/dashboard/settings"
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-1000">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
           <p className="text-[10px] uppercase tracking-[0.3em] text-amber-200/50 mb-1">Executive Console</p>
           <h1 className="text-3xl font-bold tracking-tight text-amber-50 font-display">DASHBOARD</h1>
        </div>
        <div className="flex items-center gap-3">
           <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
           <span className="text-[10px] uppercase font-bold text-emerald-400/80 tracking-widest">ACHEEVY Online</span>
        </div>
      </header>

      {/* Onboarding Alert / Action Tile */}
      <div className="group relative overflow-hidden rounded-[32px] border border-amber-300/20 bg-gradient-to-r from-amber-400/10 to-transparent p-1 transition-all hover:border-amber-300/40">
         <div className="flex flex-col md:flex-row items-center justify-between rounded-[31px] bg-black/80 p-6 md:p-8">
            <div className="space-y-2 text-center md:text-left">
               <h2 className="text-lg font-semibold text-amber-100 italic">Continue Onboarding?</h2>
               <p className="text-sm text-amber-100/60 max-w-sm">You haven&apos;t finalized The Park model configuration or initialized ByteRover memory.</p>
            </div>
            <Link href="/onboarding/estimate" className="mt-4 md:mt-0 flex items-center gap-2 rounded-full bg-amber-400 px-6 py-3 text-sm font-bold text-black shadow-[0_0_20px_rgba(251,191,36,0.3)] transition-all hover:scale-105 active:scale-95">
               Run Simulation <ArrowRight size={16} />
            </Link>
         </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((tile) => (
          <Link 
            key={tile.title} 
            href={tile.href}
            className={`group relative overflow-hidden rounded-3xl border border-white/5 bg-black/60 p-6 backdrop-blur-xl transition-all ${
              tile.status === "Disabled" ? "opacity-50 cursor-not-allowed" : "hover:border-amber-300/30 hover:bg-black/80"
            }`}
          >
            <div className="relative z-10 flex flex-col h-full">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5 text-amber-200 group-hover:bg-amber-300 group-hover:text-black transition-colors">
                <tile.icon size={20} />
              </div>
              <h3 className="text-sm font-semibold tracking-wide text-amber-50 font-display uppercase">{tile.title}</h3>
              <p className="mt-2 text-xs text-amber-100/50 leading-relaxed">{tile.desc}</p>
              
              <div className="mt-auto pt-6 flex justify-between items-center">
                 <span className={`text-[9px] uppercase font-bold tracking-[0.2em] ${tile.status === 'Active' ? 'text-amber-300' : 'text-white/20'}`}>
                   {tile.status}
                 </span>
                 {tile.status === 'Active' && <ArrowRight size={12} className="text-amber-300 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
