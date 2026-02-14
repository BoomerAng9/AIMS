// frontend/app/dashboard/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/motion/variants";
import { ArsenalShelf } from "@/components/ArsenalShelf";
import {
  MessageSquare,
  Layers,
  Settings,
  CreditCard,
  ArrowRight,
  X,
  BrainCircuit,
  Bot,
  Terminal,
  Trophy,
  Activity,
  TrendingUp,
  Building,
  Shield,
  Cpu,
  Rocket,
  Users,
  Mic,
  Theater,
  BookOpen,
  Coins,
  CircleDot,
  FlaskConical,
  Zap,
} from "lucide-react";

// ── Health hook ─────────────────────────────────────────────

type HealthStatus = "healthy" | "degraded" | "unhealthy" | "loading";

function useHealthStatus() {
  const [status, setStatus] = useState<HealthStatus>("loading");

  useEffect(() => {
    let mounted = true;

    async function check() {
      try {
        const res = await fetch("/api/health");
        if (!res.ok) throw new Error("unhealthy");
        const data = await res.json();
        if (mounted) setStatus(data.status as HealthStatus);
      } catch {
        if (mounted) setStatus("unhealthy");
      }
    }

    check();
    const interval = setInterval(check, 30_000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return status;
}

// ── Helpers ─────────────────────────────────────────────────

function statusDotClass(status: HealthStatus): string {
  switch (status) {
    case "healthy":
      return "bg-emerald-400 animate-pulse";
    case "degraded":
      return "bg-gold animate-pulse";
    case "unhealthy":
      return "bg-red-400 animate-pulse";
    default:
      return "bg-white/30 animate-pulse";
  }
}

function statusText(status: HealthStatus): string {
  switch (status) {
    case "healthy":
      return "ALL SYSTEMS ONLINE";
    case "degraded":
      return "DEGRADED SERVICE";
    case "unhealthy":
      return "OFFLINE";
    default:
      return "CONNECTING...";
  }
}

function statusTextColor(status: HealthStatus): string {
  switch (status) {
    case "healthy":
      return "text-emerald-400/80";
    case "degraded":
      return "text-gold/80";
    case "unhealthy":
      return "text-red-400/80";
    default:
      return "text-white/40";
  }
}

// ── Tile type ──────────────────────────────────────────────

interface Tile {
  title: string;
  icon: typeof MessageSquare;
  desc: string;
  href: string;
  highlight?: boolean;
  accent?: string;
}

// ── Section definitions ────────────────────────────────────

const QUICK_ACTIONS: Tile[] = [
  {
    title: "Chat w/ACHEEVY",
    icon: MessageSquare,
    desc: "Executive Orchestrator. Start here.",
    href: "/dashboard/chat",
    highlight: true,
  },
  {
    title: "Deploy Dock",
    icon: Rocket,
    desc: "Launch, manage, and monitor deployments.",
    href: "/dashboard/deploy-dock",
    highlight: true,
  },
  {
    title: "Circuit Box",
    icon: Shield,
    desc: "System panel — services, integrations, security.",
    href: "/dashboard/circuit-box",
  },
];

const PERFORM_SECTION: Tile[] = [
  {
    title: "Per|Form Scouting",
    icon: TrendingUp,
    desc: "P.A.I. scoring, athlete evaluation, Bull vs Bear.",
    href: "/sandbox/perform",
    accent: "amber",
  },
  {
    title: "N.I.L. Dashboard",
    icon: Trophy,
    desc: "Name, Image & Likeness — deals, valuation, tiers.",
    href: "/dashboard/nil",
    accent: "amber",
  },
  {
    title: "Sports Tracker",
    icon: Activity,
    desc: "Player careers, stats, injury tracking with Nixie displays.",
    href: "/dashboard/sports-tracker",
    accent: "amber",
  },
];

const AGENT_SECTION: Tile[] = [
  {
    title: "House of Ang",
    icon: Users,
    desc: "Boomer_Ang factory, chain of command, spawn bay.",
    href: "/dashboard/house-of-ang",
    accent: "gold",
  },
  {
    title: "Boomer_Angs",
    icon: Bot,
    desc: "Live agent roster from the registry.",
    href: "/dashboard/boomerangs",
    accent: "gold",
  },
  {
    title: "The Hangar",
    icon: Zap,
    desc: "Tron-inspired hierarchy visualization.",
    href: "/dashboard/the-hangar",
    accent: "gold",
  },
];

const SANDBOX_SECTION: Tile[] = [
  {
    title: "Sandbox Hub",
    icon: Layers,
    desc: "Per|Form, Blockwise AI, Verticals — autonomous projects.",
    href: "/sandbox",
    accent: "emerald",
  },
  {
    title: "Blockwise AI",
    icon: Building,
    desc: "Real estate deal intelligence & OPM funding.",
    href: "/sandbox/blockwise",
    accent: "emerald",
  },
  {
    title: "Verticals",
    icon: Shield,
    desc: "Veritas, Strategos, Grant Scout — autonomous pipelines.",
    href: "/sandbox/verticals",
    accent: "emerald",
  },
];

const WORKSHOP_SECTION: Tile[] = [
  {
    title: "Workshop Hub",
    icon: Mic,
    desc: "Voice-first companion experiences.",
    href: "/workshop",
    accent: "cyan",
  },
  {
    title: "Life Scenes",
    icon: Theater,
    desc: "Immersive life coaching scenarios.",
    href: "/workshop/life-scenes",
    accent: "cyan",
  },
  {
    title: "Money Moves",
    icon: Coins,
    desc: "Financial literacy companion flows.",
    href: "/workshop/money-moves",
    accent: "cyan",
  },
];

const INTELLIGENCE_SECTION: Tile[] = [
  {
    title: "Model Garden",
    icon: Cpu,
    desc: "Browse 200+ AI models — select, compare, integrate.",
    href: "/dashboard/model-garden",
    accent: "purple",
  },
  {
    title: "Plugs Catalog",
    icon: Layers,
    desc: "Your active tools and deployed applications.",
    href: "/dashboard/plugs",
    accent: "purple",
  },
  {
    title: "R&D Hub",
    icon: FlaskConical,
    desc: "Research, experiments, codebase sync.",
    href: "/dashboard/research",
    accent: "purple",
  },
];

const SYSTEM_SECTION: Tile[] = [
  {
    title: "Chicken Hawk",
    icon: Terminal,
    desc: "Build & execute code. Coordinator enforcer.",
    href: "/dashboard/build",
  },
  {
    title: "AVVA NOON",
    icon: BrainCircuit,
    desc: "Strategy & deep reasoning.",
    href: "/dashboard/circuit-box?tab=plan",
  },
  {
    title: "LUC Credits",
    icon: CreditCard,
    desc: "Usage tracking & cost management.",
    href: "/dashboard/luc",
  },
  {
    title: "Settings",
    icon: Settings,
    desc: "System configuration.",
    href: "/dashboard/circuit-box?tab=settings",
  },
];

// ── Section Component ──────────────────────────────────────

function SectionHeader({
  title,
  subtitle,
  accent = "gold",
}: {
  title: string;
  subtitle: string;
  accent?: string;
}) {
  const accentColors: Record<string, string> = {
    gold: "text-gold/60 border-gold/10",
    amber: "text-amber-400/60 border-amber-500/10",
    emerald: "text-emerald-400/60 border-emerald-500/10",
    cyan: "text-cyan-400/60 border-cyan-500/10",
    purple: "text-purple-400/60 border-purple-500/10",
  };
  const c = accentColors[accent] || accentColors.gold;

  return (
    <div className={`border-b ${c.split(" ")[1]} pb-3 mb-4`}>
      <h2 className={`text-xs font-mono uppercase tracking-[0.2em] ${c.split(" ")[0]}`}>
        {title}
      </h2>
      <p className="text-[11px] text-white/30 mt-0.5">{subtitle}</p>
    </div>
  );
}

function TileCard({ tile }: { tile: Tile }) {
  const accentMap: Record<string, { border: string; bg: string; text: string; icon: string }> = {
    amber: {
      border: "border-amber-500/20 hover:border-amber-500/30",
      bg: "bg-amber-500/5 hover:bg-amber-500/10",
      text: "text-amber-400",
      icon: "bg-amber-500/10 text-amber-400 border-amber-500/20 group-hover:bg-amber-500 group-hover:text-black",
    },
    gold: {
      border: "border-gold/20 hover:border-gold/30",
      bg: "bg-gold/5 hover:bg-gold/10",
      text: "text-gold",
      icon: "bg-gold/10 text-gold border-gold/20 group-hover:bg-gold group-hover:text-black",
    },
    emerald: {
      border: "border-emerald-500/20 hover:border-emerald-500/30",
      bg: "bg-emerald-500/5 hover:bg-emerald-500/10",
      text: "text-emerald-400",
      icon: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-black",
    },
    cyan: {
      border: "border-cyan-500/20 hover:border-cyan-500/30",
      bg: "bg-cyan-500/5 hover:bg-cyan-500/10",
      text: "text-cyan-400",
      icon: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20 group-hover:bg-cyan-500 group-hover:text-black",
    },
    purple: {
      border: "border-purple-500/20 hover:border-purple-500/30",
      bg: "bg-purple-500/5 hover:bg-purple-500/10",
      text: "text-purple-400",
      icon: "bg-purple-500/10 text-purple-400 border-purple-500/20 group-hover:bg-purple-500 group-hover:text-black",
    },
  };

  const a = tile.accent ? accentMap[tile.accent] : null;

  return (
    <Link
      href={tile.href}
      className={`
        group block p-5 h-full rounded-2xl border transition-all relative overflow-hidden
        ${tile.highlight
          ? "bg-gold/10 border-gold/30 hover:bg-gold/15"
          : a
            ? `${a.bg} ${a.border}`
            : "bg-white/[0.02] border-white/5 hover:border-white/10 hover:bg-white/[0.04]"
        }
      `}
    >
      <div
        className={`
          mb-3 flex h-9 w-9 items-center justify-center rounded-xl border transition-colors
          ${tile.highlight
            ? "bg-gold text-black border-gold"
            : a
              ? a.icon
              : "bg-white/5 border-white/10 text-white/50 group-hover:text-gold group-hover:border-gold/30"
          }
        `}
      >
        <tile.icon size={18} />
      </div>

      <h3
        className={`text-sm font-medium mb-0.5 ${
          tile.highlight
            ? "text-gold"
            : a
              ? `${a.text} group-hover:text-white`
              : "text-white group-hover:text-gold"
        } transition-colors`}
      >
        {tile.title}
      </h3>

      <p className="text-[11px] text-white/35 leading-relaxed">{tile.desc}</p>

      <div className="absolute top-5 right-5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
        <ArrowRight
          size={14}
          className={tile.highlight ? "text-gold" : a ? a.text.split(" ")[0] : "text-white/30"}
        />
      </div>
    </Link>
  );
}

// ── Data ────────────────────────────────────────────────────

const ONBOARDING_DISMISSED_KEY = "aims_onboarding_dismissed";

// ── Page ────────────────────────────────────────────────────

export default function DashboardPage() {
  const healthStatus = useHealthStatus();
  const [alertDismissed, setAlertDismissed] = useState(true);

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem(ONBOARDING_DISMISSED_KEY);
      setAlertDismissed(dismissed === "true");
    } catch {
      setAlertDismissed(false);
    }
  }, []);

  function dismissAlert() {
    setAlertDismissed(true);
    try {
      localStorage.setItem(ONBOARDING_DISMISSED_KEY, "true");
    } catch {
      // localStorage unavailable
    }
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Header */}
      <motion.header
        variants={staggerItem}
        className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/5 pb-6"
      >
        <div>
          <p className="text-[0.6rem] uppercase tracking-[0.25em] text-gold/50 mb-1 font-mono">
            Command Center
          </p>
          <h1 className="text-3xl md:text-4xl font-display text-white tracking-tight">
            A.I.M.S. Dashboard
          </h1>
        </div>
        <div className="flex items-center gap-3 bg-white/5 py-2 px-4 rounded-full border border-white/5">
          <span
            className={`h-2 w-2 rounded-full ${statusDotClass(healthStatus)}`}
          />
          <span
            className={`text-[0.6rem] uppercase font-mono tracking-widest ${statusTextColor(healthStatus)}`}
          >
            {statusText(healthStatus)}
          </span>
        </div>
      </motion.header>

      {/* Onboarding alert */}
      <AnimatePresence>
        {!alertDismissed && (
          <motion.div
            variants={staggerItem}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}
            className="wireframe-card overflow-hidden hover:border-gold/20 transition-colors"
          >
            <div className="h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
            <div className="flex flex-col md:flex-row items-center justify-between p-6 gap-4">
              <div className="space-y-1 text-center md:text-left">
                <h2 className="text-sm font-medium text-white">
                  Welcome to A.I.M.S.
                </h2>
                <p className="text-xs text-white/40 max-w-sm">
                  Start by chatting with ACHEEVY or explore the platform below.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href="/dashboard/chat"
                  className="flex items-center gap-2 rounded-xl bg-gold px-5 py-2.5 text-sm font-medium text-black transition-colors hover:bg-gold-light"
                >
                  Chat w/ACHEEVY <ArrowRight size={14} />
                </Link>
                <button
                  type="button"
                  onClick={dismissAlert}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-wireframe-stroke text-white/40 hover:text-white/70 hover:border-white/20 transition-colors"
                  aria-label="Dismiss onboarding alert"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Arsenal shelf */}
      <motion.div variants={staggerItem}>
        <ArsenalShelf />
      </motion.div>

      {/* ═══ Quick Actions ═══ */}
      <motion.section variants={staggerItem}>
        <SectionHeader
          title="Quick Actions"
          subtitle="Primary entry points — chat, deploy, manage"
        />
        <div className="grid gap-3 sm:grid-cols-3">
          {QUICK_ACTIONS.map((tile) => (
            <TileCard key={tile.title} tile={tile} />
          ))}
        </div>
      </motion.section>

      {/* ═══ Per|Form Platform ═══ */}
      <motion.section variants={staggerItem}>
        <SectionHeader
          title="Per|Form Platform"
          subtitle="Sports analytics, N.I.L. valuation, athlete intelligence"
          accent="amber"
        />
        <div className="grid gap-3 sm:grid-cols-3">
          {PERFORM_SECTION.map((tile) => (
            <TileCard key={tile.title} tile={tile} />
          ))}
        </div>
      </motion.section>

      {/* ═══ Agent Command ═══ */}
      <motion.section variants={staggerItem}>
        <SectionHeader
          title="Agent Command"
          subtitle="Boomer_Angs, Lil_Hawks, chain of command, agent spawning"
          accent="gold"
        />
        <div className="grid gap-3 sm:grid-cols-3">
          {AGENT_SECTION.map((tile) => (
            <TileCard key={tile.title} tile={tile} />
          ))}
        </div>
      </motion.section>

      {/* ═══ Sandbox & Verticals ═══ */}
      <motion.section variants={staggerItem}>
        <SectionHeader
          title="Sandbox & Verticals"
          subtitle="Autonomous projects — own agents, own pipelines, own environments"
          accent="emerald"
        />
        <div className="grid gap-3 sm:grid-cols-3">
          {SANDBOX_SECTION.map((tile) => (
            <TileCard key={tile.title} tile={tile} />
          ))}
        </div>
      </motion.section>

      {/* ═══ Workshop ═══ */}
      <motion.section variants={staggerItem}>
        <SectionHeader
          title="Workshop"
          subtitle="Voice-first companion experiences — life coaching, financial flows"
          accent="cyan"
        />
        <div className="grid gap-3 sm:grid-cols-3">
          {WORKSHOP_SECTION.map((tile) => (
            <TileCard key={tile.title} tile={tile} />
          ))}
        </div>
      </motion.section>

      {/* ═══ Intelligence & Tools ═══ */}
      <motion.section variants={staggerItem}>
        <SectionHeader
          title="Intelligence & Tools"
          subtitle="Models, plugs, research — the brain behind the operation"
          accent="purple"
        />
        <div className="grid gap-3 sm:grid-cols-3">
          {INTELLIGENCE_SECTION.map((tile) => (
            <TileCard key={tile.title} tile={tile} />
          ))}
        </div>
      </motion.section>

      {/* ═══ System ═══ */}
      <motion.section variants={staggerItem}>
        <SectionHeader
          title="System"
          subtitle="Build tools, reasoning, billing, configuration"
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {SYSTEM_SECTION.map((tile) => (
            <TileCard key={tile.title} tile={tile} />
          ))}
        </div>
      </motion.section>
    </motion.div>
  );
}
