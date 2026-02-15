// frontend/app/dashboard/the-hangar/page.tsx
"use client";

/**
 * THE HANGAR — Deployment Port & Organizational Command
 *
 * Inspired by the hangar scene from Tron: Ares — where digital entities
 * are laser-printed from the digital world into reality.
 *
 * This is the central visualization for the AIMS organizational hierarchy:
 *   ACHEEVY → Boomer_Angs (PMO Offices) → Chicken Hawk → Lil_Hawks (Squads)
 *   HR Department (Betty Ann Ang) oversees all actors.
 *
 * Features:
 *   - Tron-inspired hangar environment with LED ceiling lights
 *   - Interactive hierarchy chart with delegation flows
 *   - Actor cards with bios and descriptions
 *   - Circular ecosystem visualization (LilHawk maturation)
 *   - Scroll-triggered animations
 */

import React, { useState, useRef, useEffect } from "react";
import { motion, useScroll, useTransform, useInView, AnimatePresence } from "framer-motion";
import {
  Crown,
  Shield,
  Zap,
  Bird,
  Heart,
  Users,
  ArrowDown,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Target,
  Activity,
  BarChart3,
  RefreshCw,
  Star,
  Eye,
  Network,
  Layers,
  Award,
  TrendingUp,
  CircleDot,
  Building2,
  Factory,
  Radar,
} from "lucide-react";

import {
  DELEGATION_CHAIN,
  EVOLUTION_STAGES,
  LIL_HAWK_SQUADS,
  ACHEEVY_PERSONALITY,
  BOOMER_ANG_PERSONALITIES,
  ROLE_DEFINITIONS,
} from "@/lib/governance";

// ─────────────────────────────────────────────────────────────
// Types & Data
// ─────────────────────────────────────────────────────────────

interface HangarActor {
  id: string;
  name: string;
  title: string;
  role: string;
  tier: "executive" | "director" | "enforcer" | "worker" | "hr";
  accentColor: string;
  accentBg: string;
  accentBorder: string;
  accentGlow: string;
  icon: React.ElementType;
  avatar: string;
  bio: string;
  motto: string;
  capabilities: string[];
  pmoOffice?: string;
}

const HANGAR_ACTORS: HangarActor[] = [
  {
    id: "acheevy",
    name: "ACHEEVY",
    title: "Executive Orchestrator",
    role: "Digital CEO — Voice of InfinityLM",
    tier: "executive",
    accentColor: "text-gold",
    accentBg: "bg-gold/10",
    accentBorder: "border-gold/30",
    accentGlow: "shadow-[0_0_30px_rgba(212,175,55,0.2)]",
    icon: Crown,
    avatar: "A",
    bio: "The apex of the delegation chain. ACHEEVY does not execute — ACHEEVY architects. Sets strategic direction, intervenes via Boomer_Angs only. The amber visor stays on — always. Every word carries weight because none are wasted.",
    motto: "Activity breeds Activity — You see impossible, I see I'm Possible.",
    capabilities: ["Strategic Direction", "Policy Architecture", "Governance Integrity", "Rare Intervention"],
    pmoOffice: "EXECUTIVE COMMAND",
  },
  {
    id: "boomerangs",
    name: "Boomer_Angs",
    title: "Directors & Overseers",
    role: "PMO Office Leads — The Only Layer That Speaks to ACHEEVY",
    tier: "director",
    accentColor: "text-signal-blue",
    accentBg: "bg-signal-blue/10",
    accentBorder: "border-signal-blue/30",
    accentGlow: "shadow-[0_0_30px_rgba(59,130,246,0.2)]",
    icon: Shield,
    avatar: "B",
    bio: "Managers, trainers, and strategy translators. The human-in-the-loop logic layer. Boomer_Angs take the digital form of the boomerang — they go out and come back with the goods. They train, correct, and translate strategy from ACHEEVY.",
    motto: "We go, we deliver, we return. Every time.",
    capabilities: ["Team Management", "Training & Upskilling", "Strategy Translation", "Performance Oversight"],
    pmoOffice: "PMO OFFICES (6 DEPARTMENTS)",
  },
  {
    id: "chickenhawk",
    name: "Chicken Hawk",
    title: "Executor & Enforcer",
    role: "Coordinator — The Machine That Keeps the Machine Running",
    tier: "enforcer",
    accentColor: "text-orange-400",
    accentBg: "bg-orange-400/10",
    accentBorder: "border-orange-400/30",
    accentGlow: "shadow-[0_0_30px_rgba(251,146,60,0.2)]",
    icon: Zap,
    avatar: "CH",
    bio: "Cold efficiency. No feelings, no mentoring — just throughput. Chicken Hawks assign work, enforce SOP, monitor performance, and relay structured updates to Boomer_Angs. They do not mentor — they execute and enforce. Feared, effective.",
    motto: "The machine runs or it does not. There is no in between.",
    capabilities: ["Squad Throughput", "SOP Enforcement", "Structured Escalation", "Performance Monitoring"],
  },
  {
    id: "lilhawks",
    name: "Lil_Hawks",
    title: "Workers & Squad Members",
    role: "Task Executors — The Foundation of the System",
    tier: "worker",
    accentColor: "text-champagne",
    accentBg: "bg-champagne/10",
    accentBorder: "border-champagne/30",
    accentGlow: "shadow-[0_0_30px_rgba(246,196,83,0.2)]",
    icon: Bird,
    avatar: "LH",
    bio: "Task executors and role specialists organized in squads. They prove themselves through discipline, teamwork, and responsiveness to guidance. They do not lead or teach — they execute and adapt. Some earn the right to evolve.",
    motto: "Execute. Adapt. Evolve.",
    capabilities: ["Task Execution", "Squad Collaboration", "SOP Compliance", "Growth Through Discipline"],
  },
  {
    id: "bettyannang",
    name: "Betty Ann Ang",
    title: "HR Department Head",
    role: "PMO Office — Workforce Oversight & Culture Guardian",
    tier: "hr",
    accentColor: "text-emerald-400",
    accentBg: "bg-emerald-400/10",
    accentBorder: "border-emerald-400/30",
    accentGlow: "shadow-[0_0_30px_rgba(16,185,129,0.2)]",
    icon: Heart,
    avatar: "BA",
    bio: "The HR Department is a PMO office in and of itself. Betty Ann Ang oversees all actors — from ACHEEVY all the way down to the Lil_Hawks. She monitors, assesses, and measures efficiency in work habits, collaboration, highlights, and achievements.",
    motto: "Every agent has a story. I make sure it's told right.",
    capabilities: ["Efficiency Assessment", "Collaboration Metrics", "Achievement Tracking", "Culture Enforcement"],
    pmoOffice: "HR DEPARTMENT",
  },
];

// ─────────────────────────────────────────────────────────────
// Motion Variants
// ─────────────────────────────────────────────────────────────

const fadeInUp = {
  hidden: { opacity: 0, y: 40, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
  },
};

const fadeInScale = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.2 },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
};

const lineGrow = {
  hidden: { scaleY: 0, originY: 0 },
  visible: {
    scaleY: 1,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  },
};

// ─────────────────────────────────────────────────────────────
// Scroll-Triggered Section Wrapper
// ─────────────────────────────────────────────────────────────

function ScrollSection({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 60, filter: "blur(6px)" }}
      animate={isInView ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// LED Ceiling Light Strip
// ─────────────────────────────────────────────────────────────

function LEDCeiling() {
  return (
    <div className="absolute inset-x-0 top-0 h-40 pointer-events-none overflow-hidden z-0">
      {/* Main LED strips */}
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="absolute left-0 right-0 h-px"
          style={{ top: `${12 + i * 18}%` }}
        >
          <div className="h-px w-full bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          <div
            className="absolute inset-0 h-2 -top-0.5 bg-gradient-to-r from-transparent via-white/8 to-transparent blur-sm"
          />
        </div>
      ))}
      {/* Ambient glow fade */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] via-transparent to-transparent" />
      {/* Side accent beams */}
      <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-gold/20 via-gold/5 to-transparent" />
      <div className="absolute right-0 top-0 w-1 h-full bg-gradient-to-b from-signal-blue/20 via-signal-blue/5 to-transparent" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Hangar Environment Background
// ─────────────────────────────────────────────────────────────

function HangarEnvironment() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      {/* Base grid */}
      <div className="absolute inset-0 bg-grid-fine bg-[length:48px_48px] opacity-30" />
      {/* Dot matrix */}
      <div className="absolute inset-0 bg-dot-matrix bg-[length:24px_24px] opacity-20" />
      {/* Vertical accent lines (hangar columns) */}
      <div className="absolute left-[10%] top-0 bottom-0 w-px bg-gradient-to-b from-gold/10 via-gold/3 to-transparent" />
      <div className="absolute right-[10%] top-0 bottom-0 w-px bg-gradient-to-b from-signal-blue/10 via-signal-blue/3 to-transparent" />
      {/* Floor gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      {/* Vignette */}
      <div className="absolute inset-0 bg-radial-gradient pointer-events-none" style={{
        background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)"
      }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Actor Bio Card
// ─────────────────────────────────────────────────────────────

function ActorCard({ actor, expanded, onToggle }: { actor: HangarActor; expanded: boolean; onToggle: () => void }) {
  const Icon = actor.icon;

  return (
    <motion.div
      variants={staggerItem}
      layout
      className={`relative rounded-2xl border backdrop-blur-xl overflow-hidden transition-all duration-300 ${actor.accentBorder} ${expanded ? actor.accentGlow : ""} ${expanded ? "bg-black/80" : "bg-black/40"}`}
    >
      {/* Laser print scanline on hover */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-0 hover:opacity-100 transition-opacity">
        <div className="absolute inset-0 hangar-scanline" />
      </div>

      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full p-5 flex items-start gap-4 text-left"
      >
        {/* Avatar */}
        <div className={`relative shrink-0 h-14 w-14 rounded-2xl ${actor.accentBg} border ${actor.accentBorder} flex items-center justify-center`}>
          <Icon size={24} className={actor.accentColor} />
          {/* Status pulse */}
          <div className={`absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-400 border-2 border-black animate-pulse`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className={`text-base font-bold ${actor.accentColor} font-display`}>
              {actor.name}
            </h3>
            {actor.pmoOffice && (
              <span className={`px-2 py-0.5 rounded-full ${actor.accentBg} border ${actor.accentBorder} text-[8px] font-bold uppercase tracking-wider ${actor.accentColor}`}>
                {actor.pmoOffice}
              </span>
            )}
          </div>
          <p className="text-xs text-white/50 mt-0.5">{actor.title}</p>
          <p className="text-[10px] text-white/30 mt-0.5 uppercase tracking-wider">{actor.role}</p>
        </div>

        <div className="shrink-0 mt-1">
          {expanded ? (
            <ChevronDown size={16} className={actor.accentColor} />
          ) : (
            <ChevronRight size={16} className="text-white/30" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-4">
              {/* Divider */}
              <div className={`h-px w-full bg-gradient-to-r from-transparent ${actor.accentBorder.replace("border-", "via-").replace("/30", "/20")} to-transparent`} />

              {/* Bio */}
              <p className="text-sm text-white/60 leading-relaxed">{actor.bio}</p>

              {/* Motto */}
              <div className={`rounded-xl ${actor.accentBg} border ${actor.accentBorder} p-3`}>
                <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1">Motto</p>
                <p className={`text-xs ${actor.accentColor} font-medium italic`}>"{actor.motto}"</p>
              </div>

              {/* Capabilities */}
              <div>
                <p className="text-[10px] text-white/30 uppercase tracking-wider mb-2">Core Capabilities</p>
                <div className="flex flex-wrap gap-1.5">
                  {actor.capabilities.map((cap) => (
                    <span
                      key={cap}
                      className={`px-2 py-1 rounded-lg text-[10px] font-mono ${actor.accentBg} border ${actor.accentBorder} ${actor.accentColor}`}
                    >
                      {cap}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// Hierarchy Node
// ─────────────────────────────────────────────────────────────

function HierarchyNode({
  actor,
  isLast = false,
  children,
}: {
  actor: HangarActor;
  isLast?: boolean;
  children?: React.ReactNode;
}) {
  const Icon = actor.icon;
  const nodeRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(nodeRef, { once: true, margin: "-40px" });

  return (
    <div ref={nodeRef} className="flex flex-col items-center">
      {/* Node */}
      <motion.div
        initial={{ opacity: 0, scale: 0.7 }}
        animate={isInView ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className={`relative z-10 flex items-center gap-3 rounded-2xl border ${actor.accentBorder} ${actor.accentBg} backdrop-blur-xl px-5 py-3 ${actor.accentGlow} transition-all hover:scale-105`}
      >
        <div className={`h-10 w-10 rounded-xl ${actor.accentBg} border ${actor.accentBorder} flex items-center justify-center`}>
          <Icon size={20} className={actor.accentColor} />
        </div>
        <div>
          <p className={`text-sm font-bold ${actor.accentColor} font-display`}>{actor.name}</p>
          <p className="text-[10px] text-white/40">{actor.title}</p>
        </div>
      </motion.div>

      {/* Connector line */}
      {!isLast && (
        <motion.div
          initial={{ scaleY: 0 }}
          animate={isInView ? { scaleY: 1 } : {}}
          transition={{ duration: 0.4, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className={`w-px h-10 origin-top`}
          style={{
            background: `linear-gradient(to bottom, ${
              actor.id === "acheevy" ? "rgba(212,175,55,0.4)" :
              actor.id === "boomerangs" ? "rgba(59,130,246,0.4)" :
              actor.id === "chickenhawk" ? "rgba(251,146,60,0.4)" :
              "rgba(246,196,83,0.4)"
            }, transparent)`
          }}
        />
      )}

      {/* Arrow indicator */}
      {!isLast && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.4 }}
        >
          <ArrowDown size={14} className="text-white/20 -mt-1 mb-1" />
        </motion.div>
      )}

      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Circular Ecosystem Visualization
// ─────────────────────────────────────────────────────────────

function EcosystemCycle() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  const stages = [
    { name: "Lil_Hawk", subtitle: "Worker", color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/30", icon: Bird },
    { name: "Power Surge", subtitle: "Peak Efficiency", color: "text-emerald-300", bg: "bg-emerald-300/10", border: "border-emerald-300/30", icon: TrendingUp },
    { name: "CH Candidate", subtitle: "Proven Consistent", color: "text-gold", bg: "bg-gold/10", border: "border-gold/30", icon: Star },
    { name: "Chicken Hawk", subtitle: "Enforcer", color: "text-orange-400", bg: "bg-orange-400/10", border: "border-orange-400/30", icon: Zap },
    { name: "Builds Squad", subtitle: "New Lil_Hawks", color: "text-champagne", bg: "bg-champagne/10", border: "border-champagne/30", icon: Users },
  ];

  return (
    <div ref={ref} className="relative">
      {/* Desktop: Circular layout */}
      <div className="hidden lg:block relative mx-auto" style={{ width: "480px", height: "480px" }}>
        {/* Central label */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
        >
          <div className="h-28 w-28 rounded-full border border-gold/20 bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center text-center shadow-[0_0_40px_rgba(212,175,55,0.1)]">
            <RefreshCw size={20} className="text-gold mb-1 animate-spin" style={{ animationDuration: "8s" }} />
            <p className="text-[9px] font-bold text-gold uppercase tracking-wider">Ever-Growing</p>
            <p className="text-[8px] text-white/30">Ecosystem</p>
          </div>
        </motion.div>

        {/* Orbital ring */}
        <motion.div
          initial={{ opacity: 0, rotate: -30 }}
          animate={isInView ? { opacity: 1, rotate: 0 } : {}}
          transition={{ duration: 1, ease: "easeOut" }}
          className="absolute inset-8 rounded-full border border-dashed border-white/8"
        />

        {/* Stage nodes positioned in a circle */}
        {stages.map((stage, i) => {
          const angle = (i / stages.length) * 2 * Math.PI - Math.PI / 2;
          const radius = 190;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          const Icon = stage.icon;

          return (
            <motion.div
              key={stage.name}
              initial={{ opacity: 0, scale: 0 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.1 * i + 0.5 }}
              className="absolute"
              style={{
                left: `calc(50% + ${x}px - 52px)`,
                top: `calc(50% + ${y}px - 36px)`,
              }}
            >
              <div className={`w-[104px] rounded-xl border ${stage.border} ${stage.bg} backdrop-blur-xl p-3 text-center transition-all hover:scale-110`}>
                <Icon size={18} className={`${stage.color} mx-auto mb-1`} />
                <p className={`text-[10px] font-bold ${stage.color}`}>{stage.name}</p>
                <p className="text-[8px] text-white/30">{stage.subtitle}</p>
              </div>
            </motion.div>
          );
        })}

        {/* Directional arrows between nodes */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 480 480">
          <defs>
            <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
              <polygon points="0 0, 6 2, 0 4" fill="rgba(212,175,55,0.4)" />
            </marker>
          </defs>
          {stages.map((_, i) => {
            const angle1 = (i / stages.length) * 2 * Math.PI - Math.PI / 2;
            const angle2 = ((i + 1) / stages.length) * 2 * Math.PI - Math.PI / 2;
            const r = 150;
            const cx = 240, cy = 240;
            const midAngle = (angle1 + angle2) / 2;
            const mx = cx + Math.cos(midAngle) * (r + 10);
            const my = cy + Math.sin(midAngle) * (r + 10);
            const x1 = cx + Math.cos(angle1) * r;
            const y1 = cy + Math.sin(angle1) * r;
            const x2 = cx + Math.cos(angle2) * r;
            const y2 = cy + Math.sin(angle2) * r;

            return (
              <motion.path
                key={`arrow-${i}`}
                d={`M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`}
                fill="none"
                stroke="rgba(212,175,55,0.15)"
                strokeWidth="1"
                markerEnd="url(#arrowhead)"
                initial={{ pathLength: 0 }}
                animate={isInView ? { pathLength: 1 } : {}}
                transition={{ duration: 0.8, delay: 0.1 * i + 0.8 }}
              />
            );
          })}
        </svg>
      </div>

      {/* Mobile / Tablet: Vertical flow */}
      <div className="lg:hidden space-y-3">
        {stages.map((stage, i) => {
          const Icon = stage.icon;
          return (
            <React.Fragment key={stage.name}>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className={`flex items-center gap-3 rounded-xl border ${stage.border} ${stage.bg} backdrop-blur-xl p-3`}
              >
                <div className={`h-10 w-10 rounded-lg ${stage.bg} border ${stage.border} flex items-center justify-center shrink-0`}>
                  <Icon size={18} className={stage.color} />
                </div>
                <div>
                  <p className={`text-xs font-bold ${stage.color}`}>{stage.name}</p>
                  <p className="text-[10px] text-white/30">{stage.subtitle}</p>
                </div>
                {i === stages.length - 1 && (
                  <RefreshCw size={14} className="text-gold/40 ml-auto" />
                )}
              </motion.div>
              {i < stages.length - 1 && (
                <div className="flex justify-center">
                  <ArrowDown size={14} className="text-white/15" />
                </div>
              )}
            </React.Fragment>
          );
        })}
        <div className="flex justify-center">
          <div className="flex items-center gap-2 text-[10px] text-gold/40">
            <RefreshCw size={12} />
            <span>Cycle repeats — ever-growing organization</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Boomerang PMO Office Cards
// ─────────────────────────────────────────────────────────────

const PMO_OFFICES = [
  { name: "Tech Office", lead: "Boomer_CTO", icon: Network, color: "text-cyan-400", bg: "bg-cyan-400/10", border: "border-cyan-400/20" },
  { name: "Finance Office", lead: "Boomer_CFO", icon: BarChart3, color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20" },
  { name: "Ops Office", lead: "Boomer_COO", icon: Activity, color: "text-violet-400", bg: "bg-violet-400/10", border: "border-violet-400/20" },
  { name: "Marketing Office", lead: "Boomer_CMO", icon: Radar, color: "text-pink-400", bg: "bg-pink-400/10", border: "border-pink-400/20" },
  { name: "Design Office", lead: "Boomer_CDO", icon: Sparkles, color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20" },
  { name: "Publishing Office", lead: "Boomer_CPO", icon: Layers, color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/20" },
];

function PMOGrid() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {PMO_OFFICES.map((office) => {
        const Icon = office.icon;
        return (
          <motion.div
            key={office.name}
            variants={staggerItem}
            whileHover={{ scale: 1.03, y: -2 }}
            className={`rounded-xl border ${office.border} ${office.bg} backdrop-blur-xl p-4 transition-all cursor-default`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Icon size={16} className={office.color} />
              <span className={`text-xs font-bold ${office.color}`}>{office.name}</span>
            </div>
            <p className="text-[10px] text-white/40 font-mono">{office.lead}</p>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Lil_Hawk Squad Cards (No PMO — Specialized Dispatch)
// ─────────────────────────────────────────────────────────────

function SquadGrid() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {LIL_HAWK_SQUADS.map((squad) => (
        <motion.div
          key={squad.name}
          variants={staggerItem}
          whileHover={{ scale: 1.02 }}
          className="rounded-xl border border-champagne/20 bg-champagne/5 backdrop-blur-xl p-4 transition-all"
        >
          <div className="flex items-center gap-2 mb-1">
            <Users size={14} className="text-champagne" />
            <p className="text-xs font-bold text-champagne">{squad.name}</p>
          </div>
          <p className="text-[10px] text-white/30 mb-3">{squad.purpose}</p>

          <div className="flex items-center gap-2 mb-2">
            <span className="text-[8px] uppercase tracking-wider text-white/20">Squad Leader:</span>
            <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[8px] font-bold text-emerald-400 font-mono">
              {squad.leaderRole}_LIL_HAWK
            </span>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <span className="text-[8px] uppercase tracking-wider text-white/20">Reports to:</span>
            <span className="text-[9px] text-orange-400/70 font-mono">{squad.reportsTo}</span>
          </div>

          <div className="flex flex-wrap gap-1">
            {squad.hawks.map((hawk) => (
              <span
                key={hawk}
                className={`rounded-full border px-2 py-0.5 text-[8px] font-mono ${
                  hawk === squad.leaderRole
                    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                    : "border-champagne/15 bg-champagne/5 text-white/40"
                }`}
              >
                {hawk}
              </span>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// HR Oversight Panel
// ─────────────────────────────────────────────────────────────

function HRPanel() {
  const metrics = [
    { label: "Work Habits", value: 94, color: "text-emerald-400", bar: "bg-emerald-400" },
    { label: "Collaboration", value: 88, color: "text-signal-blue", bar: "bg-signal-blue" },
    { label: "Highlights", value: 12, color: "text-gold", bar: "bg-gold", isCount: true },
    { label: "Achievements", value: 7, color: "text-champagne", bar: "bg-champagne", isCount: true },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {metrics.map((m) => (
        <div
          key={m.label}
          className="rounded-xl border border-emerald-400/15 bg-emerald-400/5 backdrop-blur-xl p-4 text-center"
        >
          <p className="text-[10px] uppercase tracking-widest text-white/30 mb-1">{m.label}</p>
          <p className={`text-2xl font-bold ${m.color} font-display`}>
            {m.isCount ? m.value : `${m.value}%`}
          </p>
          {!m.isCount && (
            <div className="mt-2 h-1 rounded-full bg-white/5 overflow-hidden">
              <div className={`h-full rounded-full ${m.bar}`} style={{ width: `${m.value}%` }} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Tab Navigation
// ─────────────────────────────────────────────────────────────

type HangarTab = "overview" | "hierarchy" | "actors" | "ecosystem" | "hr";

function HangarTabs({ active, onChange }: { active: HangarTab; onChange: (t: HangarTab) => void }) {
  const tabs: { id: HangarTab; label: string; icon: React.ElementType }[] = [
    { id: "overview", label: "Command View", icon: Eye },
    { id: "hierarchy", label: "Chain of Command", icon: Network },
    { id: "actors", label: "Personnel Dossiers", icon: Users },
    { id: "ecosystem", label: "Evolution Cycle", icon: RefreshCw },
    { id: "hr", label: "HR Oversight", icon: Heart },
  ];

  return (
    <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-thin">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium uppercase tracking-wider transition-all whitespace-nowrap ${
              isActive
                ? "bg-gold/10 text-gold border border-gold/30 shadow-[0_0_15px_rgba(212,175,55,0.15)]"
                : "text-white/40 border border-transparent hover:text-white/60 hover:bg-white/5"
            }`}
          >
            <Icon size={14} />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Page Component
// ─────────────────────────────────────────────────────────────

export default function TheHangarPage() {
  const [activeTab, setActiveTab] = useState<HangarTab>("overview");
  const [expandedActor, setExpandedActor] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({ target: containerRef });
  const headerOpacity = useTransform(scrollYProgress, [0, 0.05], [1, 0.4]);
  const headerScale = useTransform(scrollYProgress, [0, 0.05], [1, 0.98]);

  return (
    <div ref={containerRef} className="relative min-h-screen text-white/80 font-sans selection:bg-gold/30">
      {/* Hangar environment */}
      <HangarEnvironment />
      <LEDCeiling />

      {/* Content */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">

        {/* ── Hero Section ── */}
        <motion.section
          style={{ opacity: headerOpacity, scale: headerScale }}
          className="pt-4 pb-8"
        >
          <ScrollSection>
            <div className="relative overflow-hidden rounded-3xl border border-gold/15 bg-black/60 backdrop-blur-2xl">
              {/* LED strip accent at top */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
              <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />

              <div className="relative p-6 sm:p-8 lg:p-10">
                <div className="flex items-center gap-2 mb-3">
                  <Factory size={14} className="text-gold" />
                  <span className="text-[10px] uppercase font-bold text-gold tracking-widest hangar-flicker">
                    Deployment Port Active
                  </span>
                </div>

                <p className="text-[10px] uppercase tracking-[0.3em] text-gold/60 mb-1">
                  Organizational Command & Deployment Center
                </p>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white font-display">
                  THE HANGAR
                </h1>

                <p className="mt-3 text-sm text-white/40 max-w-2xl leading-relaxed">
                  The deployment port where digital entities materialize. Here, the organizational
                  hierarchy comes alive — from ACHEEVY&apos;s executive command through the Boomer_Angs&apos;
                  PMO offices, down to Chicken Hawk&apos;s enforcement squads and the ever-evolving Lil_Hawks.
                  Overseen by Betty Ann Ang&apos;s HR Department.
                </p>

                {/* Quick Stats */}
                <div className="mt-6 grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {[
                    { label: "Executive", value: "1", color: "text-gold" },
                    { label: "Directors", value: "12", color: "text-signal-blue" },
                    { label: "Enforcers", value: "1", color: "text-orange-400" },
                    { label: "Squads", value: String(LIL_HAWK_SQUADS.length), color: "text-champagne" },
                    { label: "HR Oversight", value: "Active", color: "text-emerald-400" },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-xl border border-wireframe-stroke bg-black/40 p-3 text-center">
                      <p className="text-[9px] uppercase tracking-widest text-white/30">{stat.label}</p>
                      <p className={`text-lg font-bold ${stat.color} font-display mt-0.5`}>{stat.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom LED strip */}
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
            </div>
          </ScrollSection>
        </motion.section>

        {/* ── Tab Navigation ── */}
        <ScrollSection delay={0.1} className="mb-6">
          <HangarTabs active={activeTab} onChange={setActiveTab} />
        </ScrollSection>

        {/* ── Tab Content ── */}
        <AnimatePresence mode="wait">
          {/* ─── COMMAND VIEW (Overview) ─── */}
          {activeTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className="space-y-8"
            >
              {/* Full Hierarchy Visual */}
              <ScrollSection>
                <div className="rounded-3xl border border-wireframe-stroke bg-black/50 backdrop-blur-xl p-6 sm:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <Network size={16} className="text-gold" />
                    <div>
                      <h2 className="text-sm font-semibold uppercase tracking-widest text-white/80 font-display">
                        Organizational Hierarchy
                      </h2>
                      <p className="text-[10px] text-white/30 uppercase tracking-wider">
                        Authority flows upward — Accountability flows downward
                      </p>
                    </div>
                  </div>

                  {/* Vertical hierarchy */}
                  <div className="flex flex-col items-center gap-0">
                    <HierarchyNode actor={HANGAR_ACTORS[0]}>
                      <HierarchyNode actor={HANGAR_ACTORS[1]}>
                        <HierarchyNode actor={HANGAR_ACTORS[2]}>
                          <HierarchyNode actor={HANGAR_ACTORS[3]} isLast />
                        </HierarchyNode>
                      </HierarchyNode>
                    </HierarchyNode>
                  </div>

                  {/* HR crosscut */}
                  <div className="mt-8 pt-6 border-t border-wireframe-stroke">
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      <div className="flex items-center gap-3 px-4 py-2 rounded-xl border border-emerald-400/20 bg-emerald-400/5">
                        <Eye size={16} className="text-emerald-400" />
                        <div>
                          <p className="text-xs font-bold text-emerald-400">Betty Ann Ang — HR Department</p>
                          <p className="text-[9px] text-white/30">Oversees all actors — monitors efficiency, collaboration, achievements</p>
                        </div>
                      </div>
                      <div className="hidden sm:block h-px flex-1 bg-gradient-to-r from-emerald-400/20 via-emerald-400/10 to-transparent" />
                      <div className="flex gap-2">
                        {["ACHEEVY", "Boomer_Angs", "Chicken Hawk", "Lil_Hawks"].map((name) => (
                          <span key={name} className="px-2 py-1 rounded-lg text-[8px] font-mono text-emerald-400/50 border border-emerald-400/10 bg-emerald-400/5">
                            {name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollSection>

              {/* Boomerang PMO Offices */}
              <ScrollSection delay={0.1}>
                <div className="rounded-3xl border border-signal-blue/15 bg-black/50 backdrop-blur-xl p-6 sm:p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <Building2 size={16} className="text-signal-blue" />
                    <div>
                      <h2 className="text-sm font-semibold uppercase tracking-widest text-white/80 font-display">
                        Boomer_Ang PMO Offices
                      </h2>
                      <p className="text-[10px] text-white/30 uppercase tracking-wider">
                        Job creation, delegation, roster remediation, and deployment
                      </p>
                    </div>
                  </div>
                  <PMOGrid />
                </div>
              </ScrollSection>

              {/* Chicken Hawk Dispatch (No PMO) */}
              <ScrollSection delay={0.1}>
                <div className="rounded-3xl border border-orange-400/15 bg-black/50 backdrop-blur-xl p-6 sm:p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <Zap size={16} className="text-orange-400" />
                    <div>
                      <h2 className="text-sm font-semibold uppercase tracking-widest text-white/80 font-display">
                        Chicken Hawk — Squad Dispatch
                      </h2>
                      <p className="text-[10px] text-white/30 uppercase tracking-wider">
                        More specialized, more vast — no PMO offices. Direct squad delegation.
                      </p>
                    </div>
                  </div>
                  <SquadGrid />
                </div>
              </ScrollSection>
            </motion.div>
          )}

          {/* ─── CHAIN OF COMMAND ─── */}
          {activeTab === "hierarchy" && (
            <motion.div
              key="hierarchy"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className="space-y-6"
            >
              <ScrollSection>
                <div className="rounded-3xl border border-wireframe-stroke bg-black/50 backdrop-blur-xl p-6 sm:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <ArrowDown size={16} className="text-gold" />
                    <div>
                      <h2 className="text-sm font-semibold uppercase tracking-widest text-white/80 font-display">
                        Chain of Command
                      </h2>
                      <p className="text-[10px] text-white/30 uppercase tracking-wider">
                        Hard rule — no shortcuts, no exceptions
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-3">
                    {DELEGATION_CHAIN.slice().reverse().map((level, i) => (
                      <React.Fragment key={level.role}>
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className={`w-full max-w-lg rounded-2xl border p-4 transition-all ${
                            level.rank === 4
                              ? "border-gold/20 bg-gold/10 shadow-[0_0_20px_rgba(212,175,55,0.08)]"
                              : level.rank === 3
                                ? "border-signal-blue/20 bg-signal-blue/5"
                                : level.rank === 2
                                  ? "border-orange-400/20 bg-orange-400/5"
                                  : level.rank === 1
                                    ? "border-champagne/20 bg-champagne/5"
                                    : "border-wireframe-stroke bg-black/40"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                              level.rank === 4 ? "bg-gold/20 text-gold" :
                              level.rank === 3 ? "bg-signal-blue/20 text-signal-blue" :
                              level.rank === 2 ? "bg-orange-400/20 text-orange-400" :
                              level.rank === 1 ? "bg-champagne/20 text-champagne" :
                              "bg-white/10 text-white/40"
                            }`}>
                              {level.rank}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-bold text-white">{level.role}</p>
                              <p className="text-[10px] text-white/40">{level.label}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[9px] text-white/20 uppercase tracking-wider">Speaks to</p>
                              <p className="text-[10px] text-white/40">{level.speaks_to}</p>
                            </div>
                          </div>
                        </motion.div>
                        {i < DELEGATION_CHAIN.length - 1 && (
                          <ArrowDown size={14} className="text-gold/30" />
                        )}
                      </React.Fragment>
                    ))}
                  </div>

                  <p className="mt-6 text-[10px] text-white/20 text-center max-w-lg mx-auto leading-relaxed">
                    Lil_Hawks only speak to their Squad Leader or Chicken Hawk.
                    Chicken Hawks only speak to Boomer_Angs.
                    Boomer_Angs are the only ones that speak to ACHEEVY.
                    ACHEEVY rarely speaks downward — and only via Boomer_Angs.
                  </p>
                </div>
              </ScrollSection>

              {/* Role Definitions */}
              <ScrollSection delay={0.1}>
                <div className="rounded-3xl border border-wireframe-stroke bg-black/50 backdrop-blur-xl p-6 sm:p-8">
                  <h2 className="text-sm font-semibold uppercase tracking-widest text-white/80 font-display mb-4">
                    Role Definitions
                  </h2>
                  <div className="grid gap-4 md:grid-cols-2">
                    {ROLE_DEFINITIONS.map((def) => (
                      <div
                        key={def.role}
                        className="rounded-2xl border border-wireframe-stroke bg-black/40 p-4"
                      >
                        <p className="text-xs font-bold text-white mb-2">{def.role}</p>
                        <div className="space-y-2">
                          <div>
                            <p className="text-[9px] text-emerald-400/60 uppercase tracking-wider mb-1">What they are</p>
                            <ul className="space-y-0.5">
                              {def.what_they_are.map((item, i) => (
                                <li key={i} className="text-[10px] text-white/40 flex items-start gap-1">
                                  <span className="text-emerald-400/40 shrink-0 mt-0.5">+</span>{item}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="text-[9px] text-red-400/60 uppercase tracking-wider mb-1">What they are NOT</p>
                            <ul className="space-y-0.5">
                              {def.what_they_are_NOT.map((item, i) => (
                                <li key={i} className="text-[10px] text-white/30 flex items-start gap-1">
                                  <span className="text-red-400/40 shrink-0 mt-0.5">-</span>{item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollSection>
            </motion.div>
          )}

          {/* ─── PERSONNEL DOSSIERS ─── */}
          {activeTab === "actors" && (
            <motion.div
              key="actors"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className="space-y-6"
            >
              <ScrollSection>
                <div className="rounded-3xl border border-wireframe-stroke bg-black/50 backdrop-blur-xl p-6 sm:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <Users size={16} className="text-gold" />
                    <div>
                      <h2 className="text-sm font-semibold uppercase tracking-widest text-white/80 font-display">
                        Personnel Dossiers
                      </h2>
                      <p className="text-[10px] text-white/30 uppercase tracking-wider">
                        Every actor — their card, their bio, their mission
                      </p>
                    </div>
                  </div>

                  <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    animate="visible"
                    className="space-y-3"
                  >
                    {HANGAR_ACTORS.map((actor) => (
                      <ActorCard
                        key={actor.id}
                        actor={actor}
                        expanded={expandedActor === actor.id}
                        onToggle={() =>
                          setExpandedActor(expandedActor === actor.id ? null : actor.id)
                        }
                      />
                    ))}
                  </motion.div>
                </div>
              </ScrollSection>

              {/* Boomer_Ang Personality Profiles */}
              <ScrollSection delay={0.1}>
                <div className="rounded-3xl border border-signal-blue/15 bg-black/50 backdrop-blur-xl p-6 sm:p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <Shield size={16} className="text-signal-blue" />
                    <div>
                      <h2 className="text-sm font-semibold uppercase tracking-widest text-white/80 font-display">
                        Boomer_Ang Personalities
                      </h2>
                      <p className="text-[10px] text-white/30 uppercase tracking-wider">
                        Individual agent profiles — archetypes, strengths, blindspots
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {Object.values(BOOMER_ANG_PERSONALITIES).map((personality) => (
                      <div
                        key={personality.id}
                        className={`rounded-2xl border p-4 transition-all ${
                          personality.id === "chicken-hawk"
                            ? "border-orange-400/20 bg-orange-400/5"
                            : "border-signal-blue/15 bg-signal-blue/5"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className={`text-xs font-bold ${
                            personality.id === "chicken-hawk" ? "text-orange-400" : "text-signal-blue"
                          }`}>
                            {personality.name}
                          </h3>
                          <span className="text-[8px] text-white/20 uppercase tracking-wider">
                            {personality.archetype}
                          </span>
                        </div>
                        <p className="text-[10px] text-white/40 mb-2 leading-relaxed">
                          {personality.communication_style}
                        </p>
                        <div className={`rounded-lg p-2 ${
                          personality.id === "chicken-hawk"
                            ? "bg-orange-400/5 border border-orange-400/10"
                            : "bg-signal-blue/5 border border-signal-blue/10"
                        }`}>
                          <p className={`text-[9px] font-medium italic ${
                            personality.id === "chicken-hawk" ? "text-orange-400/70" : "text-signal-blue/70"
                          }`}>
                            &ldquo;{personality.motto}&rdquo;
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollSection>
            </motion.div>
          )}

          {/* ─── EVOLUTION CYCLE ─── */}
          {activeTab === "ecosystem" && (
            <motion.div
              key="ecosystem"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className="space-y-6"
            >
              {/* Circular Ecosystem */}
              <ScrollSection>
                <div className="rounded-3xl border border-wireframe-stroke bg-black/50 backdrop-blur-xl p-6 sm:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <RefreshCw size={16} className="text-gold" />
                    <div>
                      <h2 className="text-sm font-semibold uppercase tracking-widest text-white/80 font-display">
                        The Ever-Growing Ecosystem
                      </h2>
                      <p className="text-[10px] text-white/30 uppercase tracking-wider">
                        Lil_Hawks mature to Chicken Hawks, who build their own squads
                      </p>
                    </div>
                  </div>

                  <EcosystemCycle />

                  <p className="mt-6 text-[10px] text-white/20 text-center max-w-lg mx-auto leading-relaxed">
                    This creates a self-perpetuating growth cycle. Lil_Hawks who prove themselves
                    through discipline and consistency evolve through Power Surge to become
                    Chicken Hawk Candidates. Once promoted, they build their own squads of new
                    Lil_Hawks — and the cycle continues. The organization grows from within.
                  </p>
                </div>
              </ScrollSection>

              {/* Evolution Stages Detail */}
              <ScrollSection delay={0.1}>
                <div className="rounded-3xl border border-wireframe-stroke bg-black/50 backdrop-blur-xl p-6 sm:p-8">
                  <h2 className="text-sm font-semibold uppercase tracking-widest text-gold font-display mb-4">
                    Lil_Hawk Evolution Stages
                  </h2>
                  <div className="grid gap-4 md:grid-cols-3">
                    {EVOLUTION_STAGES.map((stage) => (
                      <motion.div
                        key={stage.id}
                        variants={staggerItem}
                        className="rounded-2xl border border-wireframe-stroke bg-black/40 p-4"
                      >
                        <div className="h-20 rounded-xl border border-wireframe-stroke bg-black/20 mb-3 flex items-center justify-center overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={stage.image}
                            alt={stage.visual}
                            className="h-full object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = "none";
                            }}
                          />
                        </div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className={`text-xs font-bold ${stage.color}`}>{stage.name}</p>
                          {stage.canRegress && (
                            <span className="rounded-full bg-gold/10 border border-gold/20 px-1.5 py-0.5 text-[7px] font-bold text-gold uppercase">
                              Can Regress
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-white/30 mb-2">{stage.description}</p>
                        <ul className="space-y-1">
                          {stage.criteria.map((c, i) => (
                            <li key={i} className="text-[9px] text-white/20 flex items-start gap-1.5">
                              <span className="text-gold mt-0.5 shrink-0">&bull;</span>
                              {c}
                            </li>
                          ))}
                        </ul>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </ScrollSection>
            </motion.div>
          )}

          {/* ─── HR OVERSIGHT ─── */}
          {activeTab === "hr" && (
            <motion.div
              key="hr"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className="space-y-6"
            >
              <ScrollSection>
                <div className="rounded-3xl border border-emerald-400/15 bg-black/50 backdrop-blur-xl p-6 sm:p-8">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="h-16 w-16 rounded-2xl bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center shrink-0">
                      <Heart size={28} className="text-emerald-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-emerald-400 font-display">
                        Betty Ann Ang
                      </h2>
                      <p className="text-xs text-white/50 mt-0.5">HR Department Head — PMO Office</p>
                      <p className="text-[10px] text-white/30 mt-1 leading-relaxed max-w-xl">
                        The HR Department is a PMO office in and of itself. Betty Ann Ang oversees
                        all actors — from ACHEEVY all the way down to the Lil_Hawks. She monitors,
                        assesses, and measures efficiency in work habits, collaboration, highlights,
                        and achievements across the entire organization.
                      </p>
                    </div>
                  </div>

                  <HRPanel />

                  {/* Oversight Scope */}
                  <div className="mt-6 pt-6 border-t border-emerald-400/10">
                    <h3 className="text-xs font-semibold uppercase tracking-widest text-emerald-400/60 mb-4">
                      Oversight Scope
                    </h3>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      {[
                        { actor: "ACHEEVY", scope: "Strategic alignment, governance integrity", color: "text-gold", border: "border-gold/15" },
                        { actor: "Boomer_Angs", scope: "Team output, training effectiveness, escalation quality", color: "text-signal-blue", border: "border-signal-blue/15" },
                        { actor: "Chicken Hawk", scope: "Throughput, SOP enforcement, escalation accuracy", color: "text-orange-400", border: "border-orange-400/15" },
                        { actor: "Lil_Hawks", scope: "Task quality, efficiency, squad collaboration, growth", color: "text-champagne", border: "border-champagne/15" },
                      ].map((item) => (
                        <div
                          key={item.actor}
                          className={`rounded-xl border ${item.border} bg-black/40 p-3`}
                        >
                          <p className={`text-xs font-bold ${item.color} mb-1`}>{item.actor}</p>
                          <p className="text-[10px] text-white/30 leading-relaxed">{item.scope}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* HR Monitoring Categories */}
                  <div className="mt-6 pt-6 border-t border-emerald-400/10">
                    <h3 className="text-xs font-semibold uppercase tracking-widest text-emerald-400/60 mb-4">
                      What HR Monitors
                    </h3>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {[
                        { label: "Work Habits", desc: "Consistency, efficiency, SOP adherence across all tiers", icon: Activity },
                        { label: "Collaboration", desc: "Intra-squad dynamics, cross-team communication, delegation flow", icon: Users },
                        { label: "Highlights", desc: "Notable achievements, streak performance, surge milestones", icon: Star },
                        { label: "Achievements", desc: "Promotions, evolution events, squad formation, record-breaking output", icon: Award },
                      ].map((item) => {
                        const Icon = item.icon;
                        return (
                          <div key={item.label} className="flex items-start gap-3 rounded-xl border border-emerald-400/10 bg-emerald-400/5 p-3">
                            <Icon size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs font-bold text-emerald-400">{item.label}</p>
                              <p className="text-[10px] text-white/30">{item.desc}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </ScrollSection>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
