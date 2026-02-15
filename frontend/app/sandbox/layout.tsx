/**
 * Sandbox Layout — Autonomous Project Shell
 *
 * Sandbox projects run outside the main dashboard.
 * They share brand tokens but have their own navigation
 * and visual identity. No DashboardShell dependency.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function SandboxLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-full flex flex-col">
      {/* Sandbox top bar */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-wireframe-stroke bg-black/40 backdrop-blur-xl">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-white/50 hover:text-gold transition-colors"
        >
          <ArrowLeft size={14} />
          <span className="font-mono text-[0.6rem] uppercase tracking-widest">
            Back to Workshop
          </span>
        </Link>

        <div className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[0.55rem] uppercase font-mono tracking-widest text-emerald-400/80">
            Sandbox
          </span>
        </div>
      </nav>

      {/* Sandbox content */}
      <main className="flex-1">{children}</main>
    </div>
  );
}
