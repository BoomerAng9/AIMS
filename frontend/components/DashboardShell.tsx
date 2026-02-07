// frontend/components/DashboardShell.tsx
"use client";

import type { ReactNode } from "react";
import { DashboardNav } from "./DashboardNav";
import { LogoWallBackground } from "./LogoWallBackground";
import { DynamicTagline } from "./DynamicTagline";
import { MottoBar } from "./MottoBar";

type Props = {
  children: ReactNode;
};

export function DashboardShell({ children }: Props) {
  return (
    <LogoWallBackground mode="dashboard">
      <div className="flex min-h-screen">
        {/* Left rail */}
        <aside className="hidden w-64 border-r border-amber-50/8 bg-black/40/60 px-3 py-4 backdrop-blur-xl lg:block">
          <div className="mb-6 px-2">
            <p className="text-[0.7rem] uppercase tracking-[0.22em] text-amber-200/70">
              AI Managed Solutions
            </p>
            <p className="mt-1 text-xs text-amber-100/65">
              ACHEEVY command center
            </p>
          </div>

          <DashboardNav />

          <div className="mt-8 rounded-2xl border border-amber-50/10 bg-gradient-to-br from-amber-500/10 via-black/60 to-black/90 px-3 py-3 text-[0.75rem] text-amber-100/80">
            <p className="text-[0.65rem] uppercase tracking-[0.18em] text-amber-200/70">
              Live status
            </p>
            <p className="mt-1">
              ACHEEVY is online and ready to orchestrate Boomer_Angs.
            </p>
            <p className="mt-1 text-amber-100/60">
              LUC tracking:{" "}
              <span className="font-semibold text-amber-200">
                real-time
              </span>
              .
            </p>
          </div>

          {/* Dynamic tagline — soft billboard */}
          <div className="mt-6">
            <DynamicTagline compact />
          </div>
        </aside>

        {/* Main column */}
        <div className="flex min-h-screen flex-1 flex-col">
          {/* Top bar */}
          <header className="flex items-center justify-between border-b border-amber-50/8 bg-black/50 px-4 py-3 backdrop-blur-xl">
            <div className="flex flex-col">
              <span className="text-[0.7rem] uppercase tracking-[0.18em] text-amber-200/70">
                Dashboard
              </span>
              <span className="text-sm text-amber-50">
                Think it. Prompt it. Let ACHEEVY manage it.
              </span>
            </div>
            <div className="flex items-center gap-4">
              {/* LUC pill */}
              <div className="hidden items-center gap-2 rounded-full border border-amber-50/15 bg-black/60 px-3 py-1.5 text-xs text-amber-100/80 sm:flex">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(74,222,128,0.8)]" />
                <span>LUC: live estimate</span>
                <span className="text-amber-200 font-semibold">$0.00</span>
              </div>
              {/* User chip placeholder */}
              <button className="flex items-center gap-2 rounded-full border border-amber-50/15 bg-black/60 px-2.5 py-1.5 text-xs text-amber-100/85">
                <span className="h-6 w-6 rounded-full bg-gradient-to-br from-amber-400 to-amber-700 shadow-[0_0_15px_rgba(251,191,36,0.9)]" />
                <span>My account</span>
              </button>
            </div>
          </header>

          {/* Scrollable content */}
          <main className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
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
