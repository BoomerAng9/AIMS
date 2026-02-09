// frontend/components/DashboardShell.tsx
"use client";

import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { DashboardNav } from "./DashboardNav";
import { LogoWallBackground } from "./LogoWallBackground";
import { DynamicTagline } from "./DynamicTagline";
import { MottoBar } from "./MottoBar";
import { LucUsageWidget } from "./LucUsageWidget";

// ── Inline hooks ────────────────────────────────────────────

type HealthStatus = "healthy" | "degraded" | "unhealthy" | "loading";

interface HealthData {
  status: HealthStatus;
  services: { name: string; status: string }[];
  responseTime?: number;
}

function useHealthCheck() {
  const [health, setHealth] = useState<HealthData>({
    status: "loading",
    services: [],
  });

  useEffect(() => {
    let mounted = true;

    async function check() {
      try {
        const res = await fetch("/api/health");
        if (!res.ok) throw new Error("unhealthy");
        const data = await res.json();
        if (mounted) {
          setHealth({
            status: data.status as HealthStatus,
            services: data.services ?? [],
            responseTime: data.responseTime,
          });
        }
      } catch {
        if (mounted) {
          setHealth({ status: "unhealthy", services: [] });
        }
      }
    }

    check();
    const interval = setInterval(check, 30_000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return health;
}

function useLucBalance() {
  const [balance, setBalance] = useState<string>("...");
  const [tier, setTier] = useState<string>("");

  useEffect(() => {
    let mounted = true;

    fetch("/api/luc/usage")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        if (mounted) {
          setBalance(data.balance ?? "$0.00");
          setTier(data.name ?? "Explorer");
        }
      })
      .catch(() => {
        if (mounted) setBalance("$0.00");
      });

    return () => {
      mounted = false;
    };
  }, []);

  return { balance, tier };
}

// ── Helpers ─────────────────────────────────────────────────

function statusDotClass(status: HealthStatus): string {
  switch (status) {
    case "healthy":
      return "bg-emerald-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]";
    case "degraded":
      return "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]";
    case "unhealthy":
      return "bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.5)]";
    default:
      return "bg-white/30 animate-pulse";
  }
}

function statusLabel(status: HealthStatus): string {
  switch (status) {
    case "healthy":
      return "All systems operational";
    case "degraded":
      return "Partial degradation detected";
    case "unhealthy":
      return "Services unreachable";
    default:
      return "Checking status...";
  }
}

function statusMessage(status: HealthStatus): string {
  switch (status) {
    case "healthy":
      return "ACHEEVY is online and ready to orchestrate Boomer_Angs.";
    case "degraded":
      return "ACHEEVY is running with limited capacity. Some services may be slow.";
    case "unhealthy":
      return "ACHEEVY is currently unreachable. Retrying automatically.";
    default:
      return "Connecting to ACHEEVY...";
  }
}

// ── Component ───────────────────────────────────────────────

type Props = {
  children: ReactNode;
};

export function DashboardShell({ children }: Props) {
  const health = useHealthCheck();
  const { balance } = useLucBalance();

  return (
    <LogoWallBackground mode="dashboard">
      <div className="flex max-h-screen overflow-hidden">
        {/* Left rail — wireframe glass sidebar */}
        <aside className="hidden w-64 flex-shrink-0 flex-col border-r border-wireframe-stroke bg-black/60 backdrop-blur-xl lg:flex">
          <div className="px-4 py-5">
            <div className="flex flex-col">
              <span className="font-display text-sm uppercase tracking-wider text-amber-50">
                A.I.M.S.
              </span>
              <span className="text-[0.5rem] uppercase tracking-[0.12em] text-white/40 -mt-0.5">
                AI Managed Solutions
              </span>
            </div>
            <p className="mt-1 text-[0.65rem] text-white/40">
              ACHEEVY command center
            </p>
          </div>

          {/* Navigation — scrollable */}
          <div className="flex-1 overflow-y-auto px-2 pb-3">
            <DashboardNav />
          </div>

          {/* Live status card */}
          <div className="mx-3 mb-3 wireframe-card px-3 py-3 text-[0.75rem] text-white/70">
            <div className="flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${statusDotClass(health.status)}`}
              />
              <p className="text-[0.6rem] uppercase tracking-[0.18em] text-gold/60 font-mono">
                {statusLabel(health.status)}
              </p>
            </div>
            <p className="mt-1">{statusMessage(health.status)}</p>

            {/* LUC usage widget — compact sidebar mode */}
            <div className="mt-3 border-t border-wireframe-stroke pt-3">
              <LucUsageWidget compact />
            </div>
          </div>

          {/* Dynamic tagline */}
          <div className="px-3 pb-4">
            <DynamicTagline compact />
          </div>
        </aside>

        {/* Main column */}
        <div className="flex flex-1 flex-col max-h-screen overflow-hidden">
          {/* Top bar */}
          <header className="flex items-center justify-between border-b border-wireframe-stroke bg-[#0A0A0A]/80 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-8 xl:px-12">
            <div className="flex flex-col">
              <span className="text-[0.65rem] uppercase tracking-[0.18em] text-gold/60 font-mono">
                Dashboard
              </span>
              <span className="text-sm text-white/80">
                Think it. Prompt it. Let ACHEEVY manage it.
              </span>
            </div>
            <div className="flex items-center gap-3">
              {/* LUC pill */}
              <div className="hidden items-center gap-2 rounded-lg border border-wireframe-stroke bg-black/60 px-3 py-1.5 text-xs text-white/60 sm:flex">
                <span
                  className={`h-2 w-2 rounded-full ${statusDotClass(health.status)}`}
                />
                <span className="font-mono text-[0.65rem]">LUC</span>
                <span className="text-gold font-semibold">{balance}</span>
              </div>
              {/* User chip */}
              <button type="button" className="flex items-center gap-2 rounded-lg border border-wireframe-stroke bg-black/60 px-2.5 py-1.5 text-xs text-white/70 hover:border-white/20 transition-colors">
                <span className="h-6 w-6 rounded-full bg-gradient-to-br from-gold to-gold-dark" />
                <span>My account</span>
              </button>
            </div>
          </header>

          {/* Scrollable content */}
          <main className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6 lg:px-8 xl:px-12">
            <div className="mx-auto max-w-6xl space-y-4 sm:space-y-6">
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* Doctrine — ambient reinforcement */}
      <MottoBar position="fixed" />
    </LogoWallBackground>
  );
}
