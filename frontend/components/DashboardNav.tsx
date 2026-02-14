// frontend/components/DashboardNav.tsx
"use client";

/**
 * Consolidated Dashboard Navigation
 *
 * Primary actions at top: Chat w/ACHEEVY, ACHEEVY
 * Everything else routes into Circuit Box with ?tab= parameter.
 * No more scattered pages — Circuit Box IS the hub.
 *
 * Owner-only items gated by session role.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import clsx from "clsx";
import {
  MessageSquare, Zap, Shield, BarChart3,
  Cpu, Rocket, FlaskConical, FolderKanban, Users,
  Trophy, Activity, Mic, Theater, BookOpen,
  Coins, CircleDot, TrendingUp, Building, Layers,
} from "lucide-react";

// ── Types ──

interface NavItem {
  href: string;
  label: string;
  icon: typeof MessageSquare;
  highlight?: boolean;
  ownerOnly?: boolean;
}

// ── Navigation Items ──

// Primary actions — always visible at top, full-width
const PRIMARY_ACTIONS: NavItem[] = [
  { href: "/dashboard/chat", label: "Chat w/ACHEEVY", icon: MessageSquare, highlight: true },
  { href: "/dashboard/acheevy", label: "ACHEEVY", icon: Zap, highlight: true },
];

// Core pages — always visible
const CORE_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: BarChart3 },
  { href: "/dashboard/deploy-dock", label: "Deploy Dock", icon: Rocket, highlight: true },
  { href: "/dashboard/your-space", label: "Your Space", icon: Users },
  { href: "/dashboard/plan", label: "Plan", icon: FolderKanban },
];

// Workshop — Voice-First Companion Flows
const WORKSHOP_ITEMS: NavItem[] = [
  { href: "/workshop", label: "Workshop Hub", icon: Mic, highlight: true },
  { href: "/workshop/life-scenes", label: "Life Scenes", icon: Theater },
  { href: "/workshop/moment-studio", label: "Moment Studio", icon: BookOpen },
  { href: "/workshop/money-moves", label: "Money Moves", icon: Coins },
  { href: "/workshop/creator-circles", label: "Creator Circles", icon: CircleDot },
];

// Sandbox — Autonomous Projects
const SANDBOX_ITEMS: NavItem[] = [
  { href: "/sandbox", label: "Sandbox Hub", icon: Layers, highlight: true },
  { href: "/sandbox/perform", label: "Per|Form", icon: TrendingUp },
  { href: "/sandbox/blockwise", label: "Blockwise AI", icon: Building },
  { href: "/sandbox/verticals", label: "Verticals", icon: Shield },
];

// Per|Form — Sports Analytics & N.I.L.
const PERFORM_ITEMS: NavItem[] = [
  { href: "/dashboard/nil", label: "N.I.L.", icon: Trophy },
  { href: "/dashboard/sports-tracker", label: "Sports Tracker", icon: Activity },
];

// Owner-only Circuit Box tabs
const OWNER_TABS: NavItem[] = [
  { href: "/dashboard/circuit-box?tab=control-plane", label: "Control Plane", icon: Shield, ownerOnly: true },
  { href: "/dashboard/circuit-box?tab=live-events", label: "Live Events", icon: Zap, ownerOnly: true },
  { href: "/dashboard/circuit-box?tab=security", label: "Security", icon: Shield, ownerOnly: true },
  { href: "/dashboard/circuit-box?tab=research", label: "R&D Hub", icon: FlaskConical, ownerOnly: true },
  { href: "/dashboard/war-room", label: "War Room", icon: Cpu, ownerOnly: true },
];

// ── NavLink Component ──

function NavLink({ item, pathname }: { item: NavItem; pathname: string | null }) {
  // For Circuit Box tab links, check both the base path and query param
  const itemBase = item.href.split("?")[0];
  const itemTab = item.href.includes("?tab=") ? item.href.split("?tab=")[1] : null;

  const active = itemTab
    ? pathname?.startsWith(itemBase) && typeof window !== "undefined" && new URLSearchParams(window.location.search).get("tab") === itemTab
    : pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href));

  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={clsx(
        "flex items-center gap-2.5 rounded-lg px-3 py-2 transition-all text-sm",
        active
          ? "border border-gold/30 bg-gold/8 text-gold shadow-[0_0_12px_rgba(212,175,55,0.08)]"
          : item.highlight
          ? "border border-gold/15 bg-gold/5 text-gold/80 hover:bg-gold/10 hover:border-gold/25"
          : "border border-transparent text-white/55 hover:bg-white/5 hover:border-wireframe-stroke hover:text-white/80"
      )}
    >
      <Icon
        className={clsx(
          "w-4 h-4 flex-shrink-0",
          active ? "text-gold" : item.highlight ? "text-gold/60" : "text-white/30"
        )}
      />
      <span className="truncate">{item.label}</span>
      {item.highlight && !active && (
        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-gold/60 animate-pulse" />
      )}
    </Link>
  );
}

// ── Section Label ──

function SectionLabel({ label, icon: Icon }: { label: string; icon: typeof MessageSquare }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 text-white/30">
      <Icon className="w-3.5 h-3.5 flex-shrink-0" />
      <span className="font-mono uppercase tracking-[0.15em] text-[10px]">{label}</span>
    </div>
  );
}

// ── Main Nav Component ──

export function DashboardNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = (session?.user as Record<string, unknown> | undefined)?.role;
  const isOwner = role === "OWNER";

  return (
    <nav className="flex flex-col gap-1 text-sm">
      {/* Primary Actions — always visible */}
      <div className="space-y-1 mb-2">
        {PRIMARY_ACTIONS.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}
      </div>

      <div className="mx-2 border-t border-wireframe-stroke" />

      {/* Core Pages */}
      <div className="mt-2 space-y-0.5">
        <SectionLabel label="Command" icon={BarChart3} />
        {CORE_ITEMS.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}
      </div>

      <div className="mx-2 mt-2 border-t border-gold/10" />

      {/* Circuit Box — Single link, tabs are inside the page */}
      <div className="mt-2 space-y-0.5">
        <SectionLabel label="Circuit Box" icon={Shield} />
        <Link
          href="/dashboard/circuit-box"
          className={clsx(
            "flex items-center gap-2.5 rounded-lg px-3 py-2 transition-all text-sm",
            pathname?.startsWith("/dashboard/circuit-box")
              ? "border border-gold/30 bg-gold/8 text-gold shadow-[0_0_12px_rgba(212,175,55,0.08)]"
              : "border border-gold/15 bg-gold/5 text-gold/80 hover:bg-gold/10 hover:border-gold/25"
          )}
        >
          <Shield className="w-4 h-4 text-gold/60" />
          <span className="truncate">System Panel</span>
          <span className="ml-auto text-[9px] font-mono text-gold/40 tracking-wider">9 TABS</span>
        </Link>
      </div>

      {/* Workshop — Voice-First Companion Flows */}
      <div className="mx-2 mt-2 border-t border-cyan-500/10" />
      <div className="mt-1 space-y-0.5">
        <SectionLabel label="Workshop" icon={Mic} />
        {WORKSHOP_ITEMS.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}
      </div>

      {/* Sandbox — Autonomous Projects */}
      <div className="mx-2 mt-2 border-t border-emerald-500/10" />
      <div className="mt-1 space-y-0.5">
        <SectionLabel label="Sandbox" icon={Layers} />
        {SANDBOX_ITEMS.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}
      </div>

      {/* Per|Form — Sports Analytics & N.I.L. */}
      <div className="mx-2 mt-2 border-t border-amber-500/10" />
      <div className="mt-1 space-y-0.5">
        <SectionLabel label="Per|Form" icon={Trophy} />
        {PERFORM_ITEMS.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}
      </div>

      {/* Owner-Only Tabs */}
      {isOwner && (
        <>
          <div className="mx-2 mt-2 border-t border-red-500/15" />
          <div className="mt-1 space-y-0.5">
            <SectionLabel label="Owner Only" icon={Shield} />
            {OWNER_TABS.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} />
            ))}
            <Link
              href="/dashboard/admin"
              className={clsx(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 transition-all text-sm",
                pathname === "/dashboard/admin"
                  ? "border border-red-500/30 bg-red-500/10 text-red-300"
                  : "border border-transparent text-red-400/40 hover:bg-red-500/5 hover:border-red-500/15 hover:text-red-300"
              )}
            >
              <Shield className="w-4 h-4" />
              <span>Super Admin</span>
            </Link>
          </div>
        </>
      )}
    </nav>
  );
}
