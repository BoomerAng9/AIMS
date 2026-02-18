// frontend/components/DashboardShell.tsx
"use client";

import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, Home, LogOut, ChevronDown } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { DashboardNav } from "./DashboardNav";
import { DemoBanner } from "./DemoBanner";
import { LogoWallBackground } from "./LogoWallBackground";
import { DynamicTagline } from "./DynamicTagline";
import { MottoBar } from "./MottoBar";
import { LucUsageWidget } from "./LucUsageWidget";

const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

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
      return "bg-gold shadow-[0_0_8px_rgba(251,191,36,0.5)]";
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
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const [showAccountMenu, setShowAccountMenu] = useState(false);

  const userName = session?.user?.name || 'Guest';
  const userEmail = session?.user?.email || '';
  const userRole = (session?.user as any)?.role || 'USER';


  // Scroll to top when navigating between pages
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <LogoWallBackground mode="dashboard">
      {/* Demo banner — only visible when NEXT_PUBLIC_DEMO_MODE=true */}
      <DemoBanner />

      <div className={`flex min-h-full ${IS_DEMO ? "pt-9" : "pt-[env(safe-area-inset-top)]"}`}>
        {/* Left rail — wireframe glass sidebar */}
        <aside className="hidden w-64 flex-shrink-0 flex-col border-r border-wireframe-stroke bg-[#0A0A0A]/90 backdrop-blur-xl lg:flex z-30 sticky top-0 h-screen">
          <div className="px-4 py-5">
            <div className="flex flex-col">
              <span className="font-display text-sm uppercase tracking-wider text-white">
                A.I.M.S.
              </span>
              <span className="text-[0.5rem] uppercase tracking-[0.12em] text-white/55 -mt-0.5">
                AI Managed Solutions
              </span>
            </div>
            <p className="mt-1 text-[0.65rem] text-white/55">
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
        <div className="flex flex-1 flex-col min-h-full relative z-10">
          {/* Top bar */}
          <header className="sticky top-0 flex items-center justify-between border-b border-wireframe-stroke bg-[#0A0A0A]/90 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-8 xl:px-12 z-20 shadow-lg shadow-black/20">
            <div className="flex items-center gap-5">
              {/* Navigation Controls - Enhanced 'Pop' Style */}
              <div className="flex items-center gap-2 -ml-2">
                <button 
                  onClick={() => router.back()}
                  className="p-2.5 text-white/70 hover:text-gold hover:bg-gold/10 hover:shadow-[0_0_15px_rgba(212,175,55,0.2)] rounded-xl transition-all duration-300 border border-transparent hover:border-gold/20"
                  title="Go Back"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <Link 
                  href="/"
                  className="p-2.5 text-white/70 hover:text-gold hover:bg-gold/10 hover:shadow-[0_0_15px_rgba(212,175,55,0.2)] rounded-xl transition-all duration-300 border border-transparent hover:border-gold/20"
                  title="Return Home"
                >
                  <Home className="w-5 h-5" />
                </Link>
                {/* Separator - Glowing Gold Line */}
                <div className="w-px h-6 bg-gradient-to-b from-transparent via-gold/30 to-transparent mx-1" />
              </div>

              <div className="flex flex-col">
                <span className="text-[0.65rem] uppercase tracking-[0.18em] text-gold/60 font-mono">
                  Dashboard
                </span>
                <span className="text-xs text-white/65">
                  Think it. Prompt it. Let ACHEEVY manage it.
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* LUC pill */}
              <div className="hidden items-center gap-2 rounded-lg border border-wireframe-stroke bg-black/60 px-3 py-1.5 text-xs text-white/70 sm:flex">
                <span
                  className={`h-2 w-2 rounded-full ${statusDotClass(health.status)}`}
                />
                <span className="font-mono text-[0.65rem]">LUC</span>
                <span className="text-gold font-semibold">{balance}</span>
              </div>
              {/* User chip — functional with session */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowAccountMenu(!showAccountMenu)}
                  className="flex items-center gap-2 rounded-lg border border-wireframe-stroke bg-black/60 px-2.5 py-1.5 text-xs text-white/70 hover:border-white/20 transition-colors"
                >
                  <span className="h-6 w-6 rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center text-[10px] font-bold text-black">
                    {userName.charAt(0).toUpperCase()}
                  </span>
                  <span className="hidden sm:inline">{userName}</span>
                  <ChevronDown className="w-3 h-3 text-white/55" />
                </button>

                {/* Account Dropdown */}
                {showAccountMenu && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setShowAccountMenu(false)} />
                    <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-wireframe-stroke bg-[#0A0A0A]/95 backdrop-blur-xl shadow-2xl z-40 overflow-hidden">
                      <div className="px-4 py-3 border-b border-wireframe-stroke">
                        <p className="text-sm text-white font-medium truncate">{userName}</p>
                        <p className="text-[11px] text-white/55 truncate">{userEmail}</p>
                        <span className="inline-block mt-1 text-[9px] px-1.5 py-0.5 rounded border border-gold/20 bg-gold/10 text-gold/80 font-mono uppercase">
                          {userRole}
                        </span>
                      </div>
                      <div className="py-1">
                        <button
                          onClick={() => { setShowAccountMenu(false); router.push('/dashboard/circuit-box?tab=settings'); }}
                          className="w-full text-left px-4 py-2 text-sm text-white/70 hover:bg-white/5 hover:text-white transition-colors"
                        >
                          Settings
                        </button>
                        <button
                          onClick={() => signOut({ callbackUrl: '/sign-in' })}
                          className="w-full text-left px-4 py-2 text-sm text-red-400/80 hover:bg-red-500/10 hover:text-red-400 transition-colors flex items-center gap-2"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1 flex flex-col">
            <div className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 flex flex-col">
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
