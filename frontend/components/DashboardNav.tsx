// frontend/components/DashboardNav.tsx
"use client";

/**
 * Consolidated Dashboard Navigation
 *
 * Complete platform access — every section that exists is routable from here.
 * Owner-only items gated by session role.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import clsx from "clsx";
import {
  MessageSquare, Zap, Shield, BarChart3, Bot,
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

const PRIMARY_ACTIONS: NavItem[] = [
  { href: "/dashboard/chat", label: "Chat w/ACHEEVY", icon: MessageSquare, highlight: true },
  { href: "/dashboard/acheevy", label: "ACHEEVY", icon: Zap, highlight: true },
];

const CORE_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: BarChart3 },
  { href: "/dashboard/deploy-dock", label: "Deploy Dock", icon: Rocket, highlight: true },
  { href: "/dashboard/plugs", label: "Plugs", icon: Layers },
  { href: "/dashboard/plan", label: "Plan", icon: FolderKanban },
];

// Agent Command — Boomer_Ang ecosystem
const AGENT_ITEMS: NavItem[] = [
  { href: "/dashboard/house-of-ang", label: "House of Ang", icon: Users, highlight: true },
  { href: "/dashboard/boomerangs", label: "Boomer_Angs", icon: Bot },
  { href: "/dashboard/the-hangar", label: "The Hangar", icon: Zap },
];

// Per|Form — Sports Analytics & N.I.L.
const PERFORM_ITEMS: NavItem[] = [
  { href: "/sandbox/perform", label: "Per|Form Scouting", icon: TrendingUp, highlight: true },
  { href: "/dashboard/nil", label: "N.I.L.", icon: Trophy },
  { href: "/dashboard/sports-tracker", label: "Sports Tracker", icon: Activity },
];

// Sandbox — Autonomous Projects
const SANDBOX_ITEMS: NavItem[] = [
  { href: "/sandbox", label: "Sandbox Hub", icon: Layers, highlight: true },
  { href: "/sandbox/blockwise", label: "Blockwise AI", icon: Building },
  { href: "/sandbox/verticals", label: "Verticals", icon: Shield },
];

// Workshop — Voice-First Companion Flows
const WORKSHOP_ITEMS: NavItem[] = [
  { href: "/workshop", label: "Workshop Hub", icon: Mic, highlight: true },
  { href: "/workshop/life-scenes", label: "Life Scenes", icon: Theater },
  { href: "/workshop/moment-studio", label: "Moment Studio", icon: BookOpen },
  { href: "/workshop/money-moves", label: "Money Moves", icon: Coins },
  { href: "/workshop/creator-circles", label: "Creator Circles", icon: CircleDot },
];

// Intelligence
const INTELLIGENCE_ITEMS: NavItem[] = [
  { href: "/dashboard/model-garden", label: "Model Garden", icon: Cpu },
  { href: "/dashboard/research", label: "R&D Hub", icon: FlaskConical },
];

// Owner-only
const OWNER_TABS: NavItem[] = [
  { href: "/dashboard/circuit-box?tab=control-plane", label: "Control Plane", icon: Shield, ownerOnly: true },
  { href: "/dashboard/circuit-box?tab=live-events", label: "Live Events", icon: Zap, ownerOnly: true },
  { href: "/dashboard/circuit-box?tab=security", label: "Security", icon: Shield, ownerOnly: true },
  { href: "/dashboard/circuit-box?tab=research", label: "Research Lab", icon: FlaskConical, ownerOnly: true },
  { href: "/dashboard/war-room", label: "War Room", icon: Cpu, ownerOnly: true },
];

// ── NavLink Component ──

function NavLink({ item, pathname }: { item: NavItem; pathname: string | null }) {
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

function SectionLabel({ label, icon: Icon, color = "text-white/30" }: { label: string; icon: typeof MessageSquare; color?: string }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 ${color}`}>
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
      {/* Primary Actions */}
      <div className="space-y-1 mb-2">
        {PRIMARY_ACTIONS.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}
      </div>

      <div className="mx-2 border-t border-wireframe-stroke" />

      {/* Command */}
      <div className="mt-2 space-y-0.5">
        <SectionLabel label="Command" icon={BarChart3} />
        {CORE_ITEMS.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}
      </div>

      <div className="mx-2 mt-2 border-t border-gold/10" />

      {/* Circuit Box */}
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

      <div className="mx-2 mt-2 border-t border-gold/10" />

      {/* Agent Command */}
      <div className="mt-1 space-y-0.5">
        <SectionLabel label="Agent Command" icon={Users} color="text-gold/40" />
        {AGENT_ITEMS.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}
      </div>

      {/* Per|Form — Sports Analytics & N.I.L. */}
      <div className="mx-2 mt-2 border-t border-amber-500/10" />
      <div className="mt-1 space-y-0.5">
        <SectionLabel label="Per|Form" icon={Trophy} color="text-amber-500/40" />
        {PERFORM_ITEMS.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}
      </div>

      {/* Sandbox — Autonomous Projects */}
      <div className="mx-2 mt-2 border-t border-emerald-500/10" />
      <div className="mt-1 space-y-0.5">
        <SectionLabel label="Sandbox" icon={Layers} color="text-emerald-500/40" />
        {SANDBOX_ITEMS.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}
      </div>

      {/* Workshop — Voice-First Companion Flows */}
      <div className="mx-2 mt-2 border-t border-cyan-500/10" />
      <div className="mt-1 space-y-0.5">
        <SectionLabel label="Workshop" icon={Mic} color="text-cyan-500/40" />
        {WORKSHOP_ITEMS.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}
      </div>

      {/* Intelligence */}
      <div className="mx-2 mt-2 border-t border-purple-500/10" />
      <div className="mt-1 space-y-0.5">
        <SectionLabel label="Intelligence" icon={Cpu} color="text-purple-500/40" />
        {INTELLIGENCE_ITEMS.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}
      </div>

      {/* Owner-Only */}
      {isOwner && (
        <>
          <div className="mx-2 mt-2 border-t border-red-500/15" />
          <div className="mt-1 space-y-0.5">
            <SectionLabel label="Owner Only" icon={Shield} color="text-red-400/40" />
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
