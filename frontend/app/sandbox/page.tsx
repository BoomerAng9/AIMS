"use client";

/**
 * Sandbox Hub — Autonomous Project Showcase
 *
 * Landing page for all sandbox projects. Each project
 * runs autonomously with its own agent team, data pipeline,
 * and Docker services. Discoverable here.
 */

import Link from "next/link";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/motion/variants";
import { ArrowRight, Zap, TrendingUp, Shield, Users, FileSearch, Video } from "lucide-react";

const LIVE_PROJECTS = [
  {
    slug: "perform",
    name: "Per|Form",
    tagline: "AI Sports Scouting + NIL Intelligence",
    description:
      "Autonomous scouting pipeline. Lil_Bull_Hawk argues underrated, Lil_Bear_Hawk argues overrated, Chicken Hawk mediates. Film analysis via SAM 2. NIL valuation from social reach to on-field performance.",
    icon: TrendingUp,
    accent: "emerald",
    status: "LIVE",
    ports: "5001–5003",
  },
  {
    slug: "blockwise",
    name: "Blockwise AI",
    tagline: "Wealth Tech for the Culture",
    description:
      "AI finds deals BEFORE Zillow. Know your numbers, fund with OPM, close in 90 days. From renter to landlord. Voice-driven property discovery and analysis.",
    icon: Zap,
    accent: "gold",
    status: "LIVE",
    ports: "5004–5005",
  },
  {
    slug: "verticals",
    name: "Veritas",
    tagline: "Business Plan Fact-Checking",
    description:
      "Upload a pitch deck or business plan. Veritas extracts every claim, cross-references multiple sources, and delivers a confidence-scored fact-check report. $180M error detection case study.",
    icon: Shield,
    accent: "blue",
    status: "LIVE",
    ports: "5006",
  },
];

const COMING_PROJECTS = [
  {
    name: "Strategos",
    tagline: "Census-Backed Customer Personas",
    icon: Users,
    status: "COMING",
  },
  {
    name: "Grant Scout",
    tagline: "Government Contracts & Grants",
    icon: FileSearch,
    status: "COMING",
  },
  {
    name: "Content Engine",
    tagline: "Video → Multi-Platform Clips",
    icon: Video,
    status: "COMING",
  },
];

function accentColor(accent: string) {
  switch (accent) {
    case "emerald":
      return "text-emerald-400 border-emerald-400/20 bg-emerald-400/10";
    case "gold":
      return "text-gold border-gold/20 bg-gold/10";
    case "blue":
      return "text-blue-400 border-blue-400/20 bg-blue-400/10";
    default:
      return "text-white/50 border-white/10 bg-white/5";
  }
}

export default function SandboxHub() {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="max-w-6xl mx-auto px-6 py-12 space-y-12"
    >
      {/* Header */}
      <motion.header variants={staggerItem} className="space-y-3">
        <p className="text-[0.6rem] uppercase tracking-[0.25em] text-gold/50 font-mono">
          Autonomous Projects
        </p>
        <h1 className="text-3xl md:text-4xl font-display text-white tracking-tight">
          The Sandbox
        </h1>
        <p className="text-sm text-white/40 max-w-lg">
          Each project runs autonomously with its own agent team, data pipeline,
          and infrastructure. ACHEEVY orchestrates. Evidence required.
        </p>
      </motion.header>

      {/* Live Projects */}
      <motion.section variants={staggerContainer} className="space-y-6">
        <h2 className="text-xs uppercase tracking-widest text-emerald-400/60 font-mono">
          Live
        </h2>

        <div className="grid gap-6 md:grid-cols-3">
          {LIVE_PROJECTS.map((project) => (
            <motion.div key={project.slug} variants={staggerItem}>
              <Link
                href={`/sandbox/${project.slug}`}
                className="group block p-6 h-full rounded-2xl border border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04] transition-all relative overflow-hidden"
              >
                {/* Icon */}
                <div
                  className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl border ${accentColor(project.accent)}`}
                >
                  <project.icon size={20} />
                </div>

                {/* Content */}
                <h3 className="text-base font-medium text-white mb-1 group-hover:text-gold transition-colors">
                  {project.name}
                </h3>
                <p className="text-xs text-gold/60 font-mono mb-3">
                  {project.tagline}
                </p>
                <p className="text-xs text-white/40 leading-relaxed mb-4">
                  {project.description}
                </p>

                {/* Meta */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    <span className="text-[0.55rem] uppercase font-mono tracking-wider text-emerald-400/80">
                      {project.status}
                    </span>
                  </div>
                  <span className="text-[0.55rem] font-mono text-white/20">
                    Ports {project.ports}
                  </span>
                </div>

                {/* Arrow */}
                <div className="absolute top-6 right-6 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                  <ArrowRight size={16} className="text-white/30" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Coming Soon */}
      <motion.section variants={staggerContainer} className="space-y-6">
        <h2 className="text-xs uppercase tracking-widest text-amber-400/60 font-mono">
          Coming Soon
        </h2>

        <div className="grid gap-4 md:grid-cols-3">
          {COMING_PROJECTS.map((project) => (
            <motion.div
              key={project.name}
              variants={staggerItem}
              className="p-5 rounded-2xl border border-white/5 bg-white/[0.01] opacity-60"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 border border-white/10 text-white/30">
                  <project.icon size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-white/60">
                    {project.name}
                  </h3>
                  <p className="text-[0.55rem] font-mono text-white/30">
                    {project.tagline}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Architecture note */}
      <motion.div
        variants={staggerItem}
        className="wireframe-card p-6 rounded-2xl"
      >
        <h3 className="text-xs uppercase tracking-widest text-gold/50 font-mono mb-3">
          How Sandboxes Work
        </h3>
        <div className="grid gap-4 md:grid-cols-3 text-xs text-white/40">
          <div>
            <p className="text-white/60 font-medium mb-1">Autonomous</p>
            <p>
              Each project has its own Docker services, agent teams, and data
              pipelines. They run independently of the main platform.
            </p>
          </div>
          <div>
            <p className="text-white/60 font-medium mb-1">ACHEEVY-Orchestrated</p>
            <p>
              All projects report through the chain of command. ACHEEVY
              delegates, Boomer_Angs execute, Hawks scout.
            </p>
          </div>
          <div>
            <p className="text-white/60 font-medium mb-1">Evidence-Gated</p>
            <p>
              No proof, no done. Every completed task requires attestation.
              Every pipeline stage is auditable.
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
