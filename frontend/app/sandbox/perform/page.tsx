"use client";

/**
 * Per|Form Sandbox — AI Sports Scouting + NIL Intelligence
 *
 * Autonomous scouting pipeline. This page is the entry point
 * for the Per|Form sandbox project. It showcases the athlete
 * grid, P.A.I. scoring system, and NIL valuation tools.
 *
 * Services: Scout Hub (5001), Film Room (5002), War Room (5003)
 */

import Link from "next/link";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/motion/variants";
import {
  ArrowRight,
  TrendingUp,
  Film,
  Trophy,
  DollarSign,
  Swords,
  Mic,
} from "lucide-react";

/* ── Tier badge colors ─── */
function tierStyle(tier: string) {
  switch (tier) {
    case "ELITE":
      return "bg-gold/20 text-gold border-gold/30";
    case "BLUE_CHIP":
      return "bg-blue-400/20 text-blue-400 border-blue-400/30";
    case "PROSPECT":
      return "bg-emerald-400/20 text-emerald-400 border-emerald-400/30";
    case "SLEEPER":
      return "bg-amber-400/20 text-amber-400 border-amber-400/30";
    default:
      return "bg-white/10 text-white/50 border-white/20";
  }
}

/* ── Mock athlete data (replaced by Scout Hub API in prod) ─── */
const MOCK_ATHLETES = [
  {
    id: "ath-001",
    name: "Marcus Johnson",
    position: "QB",
    class: "'26",
    school: "Oakwood HS, TX",
    paiScore: 92,
    tier: "ELITE",
    nilEstimate: "$500K–$1M",
    performance: 88,
    athleticism: 94,
    intangibles: 95,
  },
  {
    id: "ath-002",
    name: "DeShawn Williams",
    position: "WR",
    class: "'26",
    school: "Central HS, GA",
    paiScore: 85,
    tier: "BLUE_CHIP",
    nilEstimate: "$250K–$500K",
    performance: 82,
    athleticism: 90,
    intangibles: 83,
  },
  {
    id: "ath-003",
    name: "Jaylen Carter",
    position: "RB",
    class: "'27",
    school: "Summit Prep, FL",
    paiScore: 78,
    tier: "PROSPECT",
    nilEstimate: "$100K–$250K",
    performance: 80,
    athleticism: 82,
    intangibles: 72,
  },
  {
    id: "ath-004",
    name: "Trevor Mitchell",
    position: "LB",
    class: "'26",
    school: "Heritage Academy, AL",
    paiScore: 68,
    tier: "SLEEPER",
    nilEstimate: "$10K–$50K",
    performance: 70,
    athleticism: 72,
    intangibles: 62,
  },
];

function StatBar({ label, value }: { label: string; value: number }) {
  const pct = Math.min(value, 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[0.55rem] font-mono uppercase tracking-wider">
        <span className="text-white/40">{label}</span>
        <span className="text-white/60">{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-gold/60 to-gold transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function PerFormSandbox() {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="max-w-6xl mx-auto px-6 py-10 space-y-10"
    >
      {/* Hero */}
      <motion.header variants={staggerItem} className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/10 border border-emerald-400/20 text-emerald-400">
            <TrendingUp size={20} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-display text-white tracking-tight">
              Per|Form
            </h1>
            <p className="text-xs text-emerald-400/60 font-mono">
              AI Sports Scouting + NIL Intelligence
            </p>
          </div>
        </div>
        <p className="text-sm text-white/40 max-w-xl">
          Lil_Bull_Hawk argues underrated. Lil_Bear_Hawk argues overrated.
          Chicken Hawk mediates. Film analysis via SAM 2 on Vertex AI.
          Everything scores into the P.A.I. formula.
        </p>
      </motion.header>

      {/* Voice entry */}
      <motion.div
        variants={staggerItem}
        className="wireframe-card p-6 rounded-2xl flex items-center gap-4"
      >
        <button
          type="button"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-gold/10 border-2 border-gold/30 text-gold hover:bg-gold/20 transition-colors animate-pulse-gold"
        >
          <Mic size={24} />
        </button>
        <div>
          <p className="text-sm text-white/70">
            &quot;Tell me about a player&quot;
          </p>
          <p className="text-[0.55rem] text-white/30 font-mono uppercase tracking-wider">
            Voice-first scouting — say a name, position, or school
          </p>
        </div>
      </motion.div>

      {/* Quick nav */}
      <motion.div
        variants={staggerItem}
        className="flex flex-wrap gap-3"
      >
        {[
          { label: "Rankings", icon: Trophy, href: "#rankings" },
          { label: "NIL Dashboard", icon: DollarSign, href: "/dashboard/nil" },
          { label: "Film Room", icon: Film, href: "#film" },
          { label: "War Room", icon: Swords, href: "/dashboard/war-room" },
        ].map((link) => (
          <Link
            key={link.label}
            href={link.href}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/5 bg-white/[0.02] text-xs text-white/50 hover:text-gold hover:border-gold/20 transition-colors"
          >
            <link.icon size={14} />
            {link.label}
          </Link>
        ))}
      </motion.div>

      {/* P.A.I. Formula */}
      <motion.div variants={staggerItem} className="wireframe-card p-6 rounded-2xl">
        <h2 className="text-xs uppercase tracking-widest text-gold/50 font-mono mb-4">
          P.A.I. Scoring Formula
        </h2>
        <div className="grid gap-4 md:grid-cols-3 text-sm">
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <p className="text-gold font-display text-lg mb-1">P × 0.40</p>
            <p className="text-white/60 font-medium text-xs">Performance</p>
            <p className="text-white/30 text-[0.65rem] mt-1">
              Stats from MaxPreps, ESPN, 247Sports via Firecrawl
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <p className="text-gold font-display text-lg mb-1">A × 0.30</p>
            <p className="text-white/60 font-medium text-xs">Athleticism</p>
            <p className="text-white/30 text-[0.65rem] mt-1">
              Video analysis via SAM 2 — speed, separation, route sharpness
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <p className="text-gold font-display text-lg mb-1">I × 0.30</p>
            <p className="text-white/60 font-medium text-xs">Intangibles</p>
            <p className="text-white/30 text-[0.65rem] mt-1">
              Brave Search analysis — news, interviews, leadership signals
            </p>
          </div>
        </div>
      </motion.div>

      {/* Athlete Grid */}
      <motion.section variants={staggerContainer} className="space-y-4">
        <h2 className="text-xs uppercase tracking-widest text-white/30 font-mono">
          Athlete Board
        </h2>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {MOCK_ATHLETES.map((athlete) => (
            <motion.div
              key={athlete.id}
              variants={staggerItem}
              className="wireframe-card p-5 rounded-2xl space-y-4 hover:border-gold/20 transition-colors"
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-medium text-white">
                    {athlete.name}
                  </h3>
                  <p className="text-[0.6rem] text-white/40 font-mono">
                    {athlete.position} · {athlete.class} · {athlete.school}
                  </p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[0.5rem] font-mono uppercase border ${tierStyle(athlete.tier)}`}
                >
                  {athlete.tier}
                </span>
              </div>

              {/* P.A.I. Score */}
              <div className="text-center py-2">
                <span className="text-3xl font-display text-gold">
                  {athlete.paiScore}
                </span>
                <span className="text-xs text-white/30 ml-1 font-mono">
                  P.A.I.
                </span>
              </div>

              {/* Stat Bars */}
              <div className="space-y-2">
                <StatBar label="Performance" value={athlete.performance} />
                <StatBar label="Athleticism" value={athlete.athleticism} />
                <StatBar label="Intangibles" value={athlete.intangibles} />
              </div>

              {/* NIL */}
              <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <span className="text-[0.55rem] font-mono text-white/30 uppercase">
                  NIL Est.
                </span>
                <span className="text-xs text-gold/80 font-mono">
                  {athlete.nilEstimate}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Bull vs Bear */}
      <motion.div
        variants={staggerItem}
        className="wireframe-card p-6 rounded-2xl"
      >
        <h2 className="text-xs uppercase tracking-widest text-gold/50 font-mono mb-4">
          War Room — Bull vs Bear Debate
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="p-4 rounded-xl bg-emerald-400/5 border border-emerald-400/10">
            <p className="text-xs text-emerald-400 font-mono uppercase mb-2">
              Lil_Bull_Hawk — Underrated
            </p>
            <p className="text-xs text-white/50">
              &quot;Marcus Johnson&apos;s arm talent is generational. Film shows
              consistent deep ball accuracy under pressure. The stats don&apos;t
              capture how he elevates everyone around him.&quot;
            </p>
          </div>
          <div className="p-4 rounded-xl bg-red-400/5 border border-red-400/10">
            <p className="text-xs text-red-400 font-mono uppercase mb-2">
              Lil_Bear_Hawk — Overrated
            </p>
            <p className="text-xs text-white/50">
              &quot;Johnson&apos;s competition level is a concern. 5A Texas is
              strong but the top opponents accounted for 3 of his 4 losses.
              Needs to prove it against Power 5 speed.&quot;
            </p>
          </div>
        </div>
        <div className="mt-4 p-3 rounded-lg bg-gold/5 border border-gold/10">
          <p className="text-[0.55rem] text-gold/60 font-mono uppercase mb-1">
            Chicken Hawk — Mediation
          </p>
          <p className="text-xs text-white/40">
            &quot;Bull makes the stronger case on film evidence. Bear raises a
            valid concern on schedule strength. GROC adjusted +2 for film, Luke
            -1 for competition. Net: P.A.I. holds at 92.&quot;
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
