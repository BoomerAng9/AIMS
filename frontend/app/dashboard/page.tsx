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
  BrainCircuit,
  Bot,
  Terminal,
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
      return "bg-emerald-500 animate-pulse";
    case "degraded":
      return "bg-amber-500 animate-pulse";
    case "unhealthy":
      return "bg-red-500 animate-pulse";
    default:
      return "bg-slate-300 animate-pulse";
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
      return "text-emerald-600";
    case "degraded":
      return "text-amber-600";
    case "unhealthy":
      return "text-red-600";
    default:
      return "text-slate-400";
  }
}

// ── Data ────────────────────────────────────────────────────

const ONBOARDING_DISMISSED_KEY = "aims_onboarding_dismissed";

const tiles = [
  {
    title: "Chat w/ACHEEVY",
    icon: MessageSquare,
    desc: "Executive Orchestrator. Start here.",
    href: "/dashboard",
    highlight: true,
  },
  {
    title: "Chicken Hawk",
    icon: Terminal,
    desc: "Build & Execute Code.",
    href: "/dashboard/build",
  },
  {
    title: "AVVA NOON",
    icon: BrainCircuit,
    desc: "Strategy & Deep Reasoning.",
    href: "/dashboard/circuit-box?tab=plan",
  },
  {
    title: "Boomer_Angs",
    icon: Bot,
    desc: "Specialist Agent Team.",
    href: "/dashboard/circuit-box?tab=boomerangs",
  },
  {
    title: "Deployed Tools",
    icon: Layers,
    desc: "Your active Plugs.",
    href: "/dashboard/plugs",
  },
  {
    title: "LUC",
    icon: CreditCard,
    desc: "Usage & Cost.",
    href: "/dashboard/circuit-box?tab=luc",
  },
  {
    title: "Settings",
    icon: Settings,
    desc: "System Config.",
    href: "/dashboard/circuit-box?tab=settings",
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
      className="space-y-8"
    >
      {/* Header */}
      <motion.header
        variants={staggerItem}
        className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6"
      >
        <div>
          <p className="text-[0.6rem] uppercase tracking-[0.25em] text-amber-600/60 mb-1 font-mono">
            Platform Overview
          </p>
          <h1 className="text-3xl md:text-4xl font-display text-slate-800 tracking-tight">
            Managed AI Systems
          </h1>
        </div>
        <div className="flex items-center gap-3 bg-white py-2 px-4 rounded-full border border-slate-200 shadow-sm">
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
            className="rounded-xl border border-amber-200 bg-amber-50 overflow-hidden hover:border-amber-300 transition-colors"
          >
            <div className="h-px bg-gradient-to-r from-transparent via-amber-300 to-transparent" />
            <div className="flex flex-col md:flex-row items-center justify-between p-6 gap-4">
              <div className="space-y-1 text-center md:text-left">
                <h2 className="text-sm font-medium text-slate-800">
                  Welcome to A.I.M.S.
                </h2>
                <p className="text-xs text-slate-500 max-w-sm">
                  Ready to deploy your first tool? Launch the builder.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href="/dashboard/build"
                  className="flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-amber-700"
                >
                  Launch Builder <ArrowRight size={14} />
                </Link>
                <button
                  type="button"
                  onClick={dismissAlert}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-colors"
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

      {/* Tool Grid */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {tiles.map((tile) => (
          <motion.div key={tile.title} variants={staggerItem}>
            <Link
              href={tile.href}
              className={`
                group block p-6 h-full rounded-2xl border transition-all relative overflow-hidden
                ${tile.highlight
                  ? 'bg-amber-50 border-amber-200 hover:bg-amber-100/70 hover:shadow-sm'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'}
              `}
            >
              <div className={`
                mb-4 flex h-10 w-10 items-center justify-center rounded-xl border transition-colors
                ${tile.highlight
                  ? 'bg-amber-600 text-white border-amber-600'
                  : 'bg-slate-50 border-slate-200 text-slate-500 group-hover:text-amber-600 group-hover:border-amber-200'}
              `}>
                <tile.icon size={20} />
              </div>

              <h3 className={`text-base font-medium mb-1 ${tile.highlight ? 'text-amber-700' : 'text-slate-800 group-hover:text-amber-700 transition-colors'}`}>
                {tile.title}
              </h3>

              <p className="text-xs text-slate-500 leading-relaxed">
                {tile.desc}
              </p>

              <div className="absolute top-6 right-6 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                <ArrowRight size={16} className={tile.highlight ? 'text-amber-600' : 'text-slate-400'} />
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
