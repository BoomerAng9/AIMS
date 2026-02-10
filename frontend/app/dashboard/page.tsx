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
  Hammer,
  Copy,
  Plug,
  X,
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
      return "ACHEEVY Online";
    case "degraded":
      return "ACHEEVY Degraded";
    case "unhealthy":
      return "ACHEEVY Offline";
    default:
      return "Connecting...";
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

// ── Data ────────────────────────────────────────────────────

const ONBOARDING_DISMISSED_KEY = "aims_onboarding_dismissed";

const tiles = [
  {
    title: "Chat w/ACHEEVY",
    icon: MessageSquare,
    desc: "Direct orchestrator interface.",
    href: "/dashboard/chat",
  },
  {
    title: "LUC Quotes",
    icon: CreditCard,
    desc: "Resource auditing and budgeting.",
    href: "/dashboard/luc",
  },
  {
    title: "aiPlugs",
    icon: Layers,
    desc: "Deploy capability modules.",
    href: "/dashboard/plugs",
  },
  {
    title: "Build a Plug",
    icon: Hammer,
    desc: "Step-by-step plug builder.",
    href: "/dashboard/build",
  },
  {
    title: "Your Plugs",
    icon: Plug,
    desc: "Manage deployed plugs.",
    href: "/dashboard/plugs",
  },
  {
    title: "Make It Mine",
    icon: Copy,
    desc: "Clone and customize templates.",
    href: "/dashboard/make-it-mine",
  },
  {
    title: "Settings",
    icon: Settings,
    desc: "Workspace and team config.",
    href: "/dashboard/settings",
  },
];

// ── Page ────────────────────────────────────────────────────

export default function DashboardPage() {
  const healthStatus = useHealthStatus();
  const [alertDismissed, setAlertDismissed] = useState(true);

  // Check localStorage after mount (client only)
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
      // localStorage unavailable — dismiss in memory only
    }
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.header
        variants={staggerItem}
        className="flex flex-col md:flex-row md:items-end justify-between gap-4"
      >
        <div>
          <p className="text-[0.6rem] uppercase tracking-[0.25em] text-gold/50 mb-1 font-mono">
            Executive Console
          </p>
          <h1 className="text-2xl md:text-3xl font-display uppercase tracking-wider text-white">
            Dashboard
          </h1>
        </div>
        <div className="flex items-center gap-2">
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

      {/* Onboarding alert — dismissible */}
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
                  Continue Onboarding?
                </h2>
                <p className="text-xs text-white/40 max-w-sm">
                  You haven&apos;t finalized The Park model configuration or
                  initialized ByteRover memory.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href="/onboarding/estimate"
                  className="flex items-center gap-2 rounded-xl bg-gold px-5 py-2.5 text-sm font-medium text-black transition-colors hover:bg-gold-light"
                >
                  Run Simulation <ArrowRight size={14} />
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

      {/* Arsenal shelf — horizontal plug carousel */}
      <motion.div variants={staggerItem}>
        <ArsenalShelf />
      </motion.div>

      {/* Tile grid */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
      >
        {tiles.map((tile) => (
          <motion.div key={tile.title} variants={staggerItem}>
            <Link
              href={tile.href}
              className="group wireframe-card block p-5 hover:border-gold/20 transition-all"
            >
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl border border-wireframe-stroke bg-white/[0.02] text-white/50 group-hover:border-gold/30 group-hover:text-gold transition-colors">
                <tile.icon size={18} />
              </div>
              <h3 className="text-sm font-medium text-white group-hover:text-gold transition-colors">
                {tile.title}
              </h3>
              <p className="mt-1 text-xs text-white/30 leading-relaxed">
                {tile.desc}
              </p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-[0.55rem] uppercase font-mono tracking-widest text-gold/50">
                  Active
                </span>
                <ArrowRight
                  size={12}
                  className="text-gold/40 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all"
                />
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
