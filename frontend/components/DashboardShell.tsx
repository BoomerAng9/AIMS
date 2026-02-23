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
      return "bg-emerald-500";
    case "degraded":
      return "bg-amber-500";
    case "unhealthy":
      return "bg-red-500";
    default:
      return "bg-slate-300 animate-pulse";
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
        {/* Left rail — clean light sidebar */}
        <aside className="hidden w-64 flex-shrink-0 flex-col border-r border-slate-200 bg-white lg:flex z-30 sticky top-0 h-screen">
          <div className="px-4 py-5">
            <div className="flex flex-col">
              <span className="font-display text-sm uppercase tracking-wider text-slate-900">
                A.I.M.S.
              </span>
              <span className="text-[0.5rem] uppercase tracking-[0.12em] text-slate-400 -mt-0.5">
                AI Managed Solutions
              </span>
            </div>
            <p className="mt-1 text-[0.65rem] text-slate-400">
              ACHEEVY command center
            </p>
          </div>

          {/* Navigation — scrollable */}
          <div className="flex-1 overflow-y-auto px-2 pb-3">
            <DashboardNav />
          </div>

          {/* Live status card */}
          <div className="mx-3 mb-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-[0.75rem] text-slate-600">
            <div className="flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${statusDotClass(health.status)}`}
              />
              <p className="text-[0.6rem] uppercase tracking-[0.18em] text-amber-600/70 font-mono">
                {statusLabel(health.status)}
              </p>
            </div>
            <p className="mt-1">{statusMessage(health.status)}</p>

            {/* LUC usage widget — compact sidebar mode */}
            <div className="mt-3 border-t border-slate-200 pt-3">
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
          <header className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-8 xl:px-12 z-20 shadow-sm">
            <div className="flex items-center gap-5">
              {/* Navigation Controls */}
              <div className="flex items-center gap-2 -ml-2">
                <button
                  onClick={() => router.back()}
                  className="p-2.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all duration-200 border border-transparent hover:border-amber-200"
                  title="Go Back"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <Link
                  href="/"
                  className="p-2.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all duration-200 border border-transparent hover:border-amber-200"
                  title="Return Home"
                >
                  <Home className="w-5 h-5" />
                </Link>
                {/* Separator */}
                <div className="w-px h-6 bg-slate-200 mx-1" />
              </div>

              <div className="flex flex-col">
                <span className="text-[0.65rem] uppercase tracking-[0.18em] text-amber-600/70 font-mono">
                  Dashboard
                </span>
                <span className="text-xs text-slate-500">
                  Think it. Prompt it. Let ACHEEVY manage it.
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* LUC pill */}
              <div className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 sm:flex">
                <span
                  className={`h-2 w-2 rounded-full ${statusDotClass(health.status)}`}
                />
                <span className="font-mono text-[0.65rem]">LUC</span>
                <span className="text-amber-600 font-semibold">{balance}</span>
              </div>
              {/* User chip — functional with session */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowAccountMenu(!showAccountMenu)}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-600 hover:border-slate-300 transition-colors"
                >
                  <span className="h-6 w-6 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-[10px] font-bold text-white">
                    {userName.charAt(0).toUpperCase()}
                  </span>
                  <span className="hidden sm:inline">{userName}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {/* Account Dropdown */}
                {showAccountMenu && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setShowAccountMenu(false)} />
                    <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-slate-200 bg-white shadow-lg shadow-slate-200/50 z-40 overflow-hidden">
                      <div className="px-4 py-3 border-b border-slate-100">
                        <p className="text-sm text-slate-900 font-medium truncate">{userName}</p>
                        <p className="text-[11px] text-slate-400 truncate">{userEmail}</p>
                        <span className="inline-block mt-1 text-[9px] px-1.5 py-0.5 rounded border border-amber-200 bg-amber-50 text-amber-700 font-mono uppercase">
                          {userRole}
                        </span>
                      </div>
                      <div className="py-1">
                        <button
                          onClick={() => { setShowAccountMenu(false); router.push('/dashboard/circuit-box?tab=settings'); }}
                          className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                        >
                          Settings
                        </button>
                        <button
                          onClick={() => signOut({ callbackUrl: '/sign-in' })}
                          className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors flex items-center gap-2"
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
