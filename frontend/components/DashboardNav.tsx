// frontend/components/DashboardNav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import clsx from "clsx";

const navItems = [
  { href: "/dashboard/your-space", label: "Your Space" },
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/acheevy", label: "ACHEEVY", highlight: true },
  { href: "/dashboard/chat", label: "Chat w/ACHEEVY" },
  { href: "/dashboard/plan", label: "Plan" },
  { href: "/dashboard/plugs", label: "aiPlugs" },
  { href: "/dashboard/boomerangs", label: "Boomer_Angs" },
  { href: "/dashboard/house-of-ang", label: "House of Ang" },
  { href: "/dashboard/project-management", label: "PMO Offices" },
  { href: "/dashboard/lab", label: "Lab" },
  { href: "/dashboard/luc", label: "LUC Usage" },
  { href: "/dashboard/circuit-box", label: "Circuit Box" },
  { href: "/dashboard/build", label: "Build" },
  { href: "/dashboard/workstreams", label: "Workstreams" },
  { href: "/dashboard/make-it-mine", label: "Make It Mine" },
  { href: "/dashboard/gates", label: "Gates & Evidence" },
  { href: "/dashboard/environments", label: "Environments" },
  { href: "/dashboard/security", label: "Security Center" },
  { href: "/dashboard/operations", label: "Operations" },
  { href: "/dashboard/model-garden", label: "Model Garden" },
  { href: "/dashboard/sports-tracker", label: "Sports Tracker" },
  { href: "/dashboard/settings", label: "Settings" },
];

export function DashboardNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = (session?.user as Record<string, unknown> | undefined)?.role;

  return (
    <nav className="flex flex-col gap-0.5 text-sm">
      <p className="px-3 pb-2 pt-1 text-[0.6rem] uppercase tracking-[0.2em] text-white/30 font-mono">
        Workspace
      </p>
      {navItems.map((item) => {
        const active =
          pathname === item.href ||
          (item.href !== "/dashboard" && pathname?.startsWith(item.href));
        const isHighlight = 'highlight' in item && item.highlight;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              "mx-1 flex items-center gap-2 rounded-lg px-3 py-1.5 transition-colors border",
              active
                ? "border-gold/40 bg-gold/5 text-gold"
                : isHighlight
                ? "border-gold/20 bg-gold/5 text-gold/80 hover:bg-gold/10"
                : "border-transparent text-white/60 hover:bg-white/5 hover:border-white/10 hover:text-white/80"
            )}
          >
            <span className={clsx(
              "h-1.5 w-1.5 rounded-full flex-shrink-0",
              active
                ? "bg-gold"
                : isHighlight
                ? "bg-gold/60 animate-pulse"
                : "bg-white/20"
            )} />
            <span className="truncate">{item.label}</span>
            {isHighlight && (
              <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded border border-gold/20 bg-gold/10 text-gold/80 font-mono uppercase">
                New
              </span>
            )}
          </Link>
        );
      })}

      {/* Owner-only admin link */}
      {role === "OWNER" && (
        <>
          <div className="mx-3 my-2 border-t border-red-500/20" />
          <Link
            href="/dashboard/admin"
            className={clsx(
              "mx-1 flex items-center gap-2 rounded-lg px-3 py-1.5 transition-colors border",
              pathname === "/dashboard/admin"
                ? "border-red-500/30 bg-red-500/10 text-red-300"
                : "border-transparent text-red-400/50 hover:bg-red-500/5 hover:border-red-500/15 hover:text-red-300"
            )}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-red-400/80" />
            <span>Super Admin</span>
          </Link>
        </>
      )}
    </nav>
  );
}
