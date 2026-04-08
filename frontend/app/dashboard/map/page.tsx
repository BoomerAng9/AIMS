// frontend/app/dashboard/map/page.tsx
"use client";

/**
 * /dashboard/map — Platform Mind Map
 *
 * Interactive node-graph visualization of the entire AIMS platform.
 * Live nodes link to their pages. Planned nodes show "coming soon."
 * Drag to pan, scroll to zoom. Click any live node to navigate.
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/motion/variants";
import { PlatformMindMap } from "@/components/mind-map/PlatformMindMap";
import { Map, List, ArrowRight } from "lucide-react";
import Link from "next/link";

type ViewMode = "map" | "list";

// List view data — same nodes, flat format
const SECTIONS = [
  {
    title: "Core",
    color: "border-gold/30",
    dot: "bg-gold",
    items: [
      { label: "ACHEEVY", href: "/dashboard/acheevy", status: "live" as const, desc: "Executive AI Orchestrator" },
      { label: "Chat", href: "/dashboard/chat", status: "live" as const, desc: "Streaming chat with ACHEEVY" },
      { label: "Overview", href: "/dashboard", status: "live" as const, desc: "Platform overview & health" },
    ],
  },
  {
    title: "Infrastructure",
    color: "border-cyan-400/30",
    dot: "bg-cyan-400",
    items: [
      { label: "Circuit Box", href: "/dashboard/circuit-box", status: "live" as const, desc: "System panel — services, integrations" },
      { label: "Deploy Dock", href: "/dashboard/deploy-dock", status: "live" as const, desc: "Build → Assign → Launch" },
      { label: "Operations", href: "/dashboard/operations", status: "live" as const, desc: "Service health & container status" },
    ],
  },
  {
    title: "Tools",
    color: "border-blue-400/30",
    dot: "bg-blue-400",
    items: [
      { label: "Plug Catalog", href: "/dashboard/plug-catalog", status: "live" as const, desc: "Browse and deploy AI tools" },
      { label: "Playground", href: "/dashboard/playground", status: "live" as const, desc: "Code, prompt, and agent sandboxes" },
      { label: "Custom Hawks", href: "/dashboard/custom-hawks", status: "live" as const, desc: "Create custom AI bots" },
      { label: "Model Garden", href: "/dashboard/model-garden", status: "live" as const, desc: "Browse and compare AI models" },
      { label: "Chicken Hawk", href: "/dashboard/build", status: "live" as const, desc: "Autonomous build & execute" },
      { label: "Computer Control", href: null, status: "planned" as const, desc: "Sandboxed desktop control (coming soon)" },
    ],
  },
  {
    title: "Verticals",
    color: "border-emerald-400/30",
    dot: "bg-emerald-400",
    items: [
      { label: "LUC Calculator", href: "/dashboard/luc", status: "live" as const, desc: "Usage credits & billing" },
      { label: "Garage to Global", href: "/dashboard/garage-to-global", status: "live" as const, desc: "5-stage business scaling" },
      { label: "Buy in Bulk", href: "/dashboard/buy-in-bulk", status: "live" as const, desc: "AI wholesale shopping" },
      { label: "Needs Analysis", href: "/dashboard/needs-analysis", status: "live" as const, desc: "Business requirements assessment" },
    ],
  },
  {
    title: "Per|Form Sports",
    color: "border-amber-400/30",
    dot: "bg-amber-400",
    items: [
      { label: "Per|Form Hub", href: "/sandbox/perform", status: "live" as const, desc: "Sports analytics — Big Board, Draft" },
      { label: "Film Room", href: "/dashboard/film-room", status: "live" as const, desc: "Video intelligence via Twelve Labs" },
      { label: "Sports Tracker", href: "/dashboard/sports-tracker", status: "live" as const, desc: "Live scores & nixie tube displays" },
      { label: "N.I.L.", href: "/dashboard/nil", status: "live" as const, desc: "Name-Image-Likeness tracking" },
      { label: "Playbook Engine", href: null, status: "planned" as const, desc: "Voice-to-play-diagram (coming soon)" },
    ],
  },
  {
    title: "Agents",
    color: "border-amber-400/30",
    dot: "bg-amber-400",
    items: [
      { label: "LiveSim", href: "/dashboard/livesim", status: "live" as const, desc: "Real-time agent observation" },
      { label: "Boomer_Angs", href: "/dashboard/boomerangs", status: "live" as const, desc: "Specialist agent team" },
      { label: "Prompt Agent", href: null, status: "planned" as const, desc: "Cross-platform prompt engineering (coming soon)" },
    ],
  },
];

export default function PlatformMapPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("map");

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="flex flex-col h-full min-h-[calc(100vh-120px)]"
    >
      {/* Header */}
      <motion.header
        variants={staggerItem}
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-white/8"
      >
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-gold/50 mb-1 font-mono">
            Antigravity
          </p>
          <h1 className="text-2xl md:text-3xl font-display text-zinc-100 tracking-tight">
            Platform Map
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Every surface in A.I.M.S. — click any live node to navigate.
          </p>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 p-1 rounded-lg border border-wireframe-stroke bg-[#1F1F23]/60">
          <button
            onClick={() => setViewMode("map")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-mono transition-all ${
              viewMode === "map"
                ? "bg-gold/10 text-gold border border-gold/30"
                : "text-zinc-500 border border-transparent hover:text-zinc-400"
            }`}
          >
            <Map size={12} /> Map
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-mono transition-all ${
              viewMode === "list"
                ? "bg-gold/10 text-gold border border-gold/30"
                : "text-zinc-500 border border-transparent hover:text-zinc-400"
            }`}
          >
            <List size={12} /> List
          </button>
        </div>
      </motion.header>

      {/* Content */}
      {viewMode === "map" ? (
        <motion.div variants={staggerItem} className="flex-1 mt-4 rounded-xl border border-wireframe-stroke bg-[#1F1F23]/40 overflow-hidden relative">
          <PlatformMindMap />
        </motion.div>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {SECTIONS.map((section) => (
            <motion.div
              key={section.title}
              variants={staggerItem}
              className={`wireframe-card p-5 border-l-2 ${section.color}`}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className={`w-2 h-2 rounded-full ${section.dot}`} />
                <h2 className="text-sm font-medium text-zinc-100">{section.title}</h2>
                <span className="text-xs text-zinc-600 font-mono">{section.items.length}</span>
              </div>
              <div className="space-y-1.5">
                {section.items.map((item) => (
                  item.href ? (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all hover:bg-white/5 border border-transparent hover:border-wireframe-stroke"
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        item.status === "live" ? "bg-emerald-400" : "bg-[#1F1F23]"
                      }`} />
                      <span className="flex-1 text-zinc-300 group-hover:text-zinc-100 transition-colors">
                        {item.label}
                      </span>
                      <ArrowRight size={12} className="text-transparent group-hover:text-gold/60 transition-all" />
                    </Link>
                  ) : (
                    <div
                      key={item.label}
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm opacity-40"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#1F1F23]" />
                      <span className="flex-1 text-zinc-500">{item.label}</span>
                      <span className="text-xs font-mono text-zinc-600">PLANNED</span>
                    </div>
                  )
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
