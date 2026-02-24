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
  MessageSquare, Zap, Shield, Bot, BarChart3,
  Settings, Cpu, Wrench, CreditCard, Rocket,
  FlaskConical, FolderKanban, Users, Boxes,
  Trophy, Activity, Mic, Theater, BookOpen,
  Coins, CircleDot, TrendingUp, Building, Layers,
  Store, ShoppingCart, Calculator, Map,
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
  { href: "/dashboard/map", label: "Platform Map", icon: Map, highlight: true },
  { href: "/dashboard/deploy-dock", label: "Deploy Dock", icon: Rocket, highlight: true },
  { href: "/dashboard/automations", label: "Automations", icon: Zap, highlight: true },
  { href: "/dashboard/make-it-mine", label: "Make It Mine", icon: Wrench, highlight: true },
  { href: "/dashboard/your-space", label: "Your Space", icon: Users },
  { href: "/dashboard/plan", label: "Plan", icon: FolderKanban },
];

// Circuit Box tabs — consolidated into single page with tab routing
const CIRCUIT_BOX_TABS: NavItem[] = [
  { href: "/dashboard/circuit-box?tab=services", label: "Services", icon: Shield },
  { href: "/dashboard/circuit-box?tab=integrations", label: "Integrations", icon: Boxes },
  { href: "/dashboard/circuit-box?tab=social-channels", label: "Social Channels", icon: MessageSquare },
  { href: "/dashboard/circuit-box?tab=model-garden", label: "Model Garden", icon: Cpu },
  { href: "/dashboard/circuit-box?tab=boomerangs", label: "Boomer_Angs", icon: Bot },
  { href: "/dashboard/circuit-box?tab=luc", label: "LUC Credits", icon: CreditCard },
  { href: "/dashboard/circuit-box?tab=workbench", label: "Workbench", icon: Wrench },
  { href: "/dashboard/circuit-box?tab=workstreams", label: "Workstreams", icon: BarChart3 },
  { href: "/dashboard/circuit-box?tab=settings", label: "Settings", icon: Settings },
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

// Live Apps — Standalone tools accessible without diving into verticals
const LIVE_APPS: NavItem[] = [
  { href: "/halalhub", label: "HalalHub", icon: Store, highlight: true },
  { href: "/dashboard/luc", label: "LUC Calculator", icon: Calculator, highlight: true },
  { href: "/dashboard/garage-to-global", label: "Garage to Global", icon: Store, highlight: true },
  { href: "/dashboard/buy-in-bulk", label: "Buy in Bulk", icon: ShoppingCart, highlight: true },
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
          ? "border border-amber-200 bg-amber-50 text-amber-800 shadow-sm"
          : item.highlight
            ? "border border-amber-100 bg-amber-50/50 text-amber-700 hover:bg-amber-50 hover:border-amber-200"
            : "border border-transparent text-slate-500 hover:bg-slate-50 hover:border-slate-200 hover:text-slate-700"
      )}
    >
      <Icon
        className={clsx(
          "w-4 h-4 flex-shrink-0",
          active ? "text-amber-600" : item.highlight ? "text-amber-500" : "text-slate-400"
        )}
      />
      <span className="truncate">{item.label}</span>
      {item.highlight && !active && (
        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
      )}
    </Link>
  );
}

// ── Section Label ──

function SectionLabel({ label, icon: Icon }: { label: string; icon: typeof MessageSquare }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 text-slate-400">
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

      <div className="mx-2 border-t border-slate-200" />

      {/* Core Pages */}
      <div className="mt-2 space-y-0.5">
        <SectionLabel label="Command" icon={BarChart3} />
        {CORE_ITEMS.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}
      </div>

      {/* Live Apps — Direct access tools */}
      <div className="mx-2 mt-2 border-t border-emerald-200/50" />
      <div className="mt-1 space-y-0.5">
        <SectionLabel label="Live Apps" icon={Rocket} />
        {LIVE_APPS.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}
      </div>

      <div className="mx-2 mt-2 border-t border-amber-200/50" />

      {/* Circuit Box — Consolidated Hub */}
      <div className="mt-2 space-y-0.5">
        <SectionLabel label="Circuit Box" icon={Shield} />
        <Link
          href="/dashboard/circuit-box"
          className={clsx(
            "flex items-center gap-2.5 rounded-lg px-3 py-2 transition-all text-sm",
            pathname === "/dashboard/circuit-box" && !new URLSearchParams(typeof window !== "undefined" ? window.location.search : "").get("tab")
              ? "border border-amber-200 bg-amber-50 text-amber-800 shadow-sm"
              : "border border-amber-100 bg-amber-50/50 text-amber-700 hover:bg-amber-50 hover:border-amber-200"
          )}
        >
          <Shield className="w-4 h-4 text-amber-500" />
          <span className="truncate">System Panel</span>
          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
        </Link>
        {CIRCUIT_BOX_TABS.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}
      </div>

      {/* Workshop — Voice-First Companion Flows */}
      <div className="mx-2 mt-2 border-t border-cyan-200/50" />
      <div className="mt-1 space-y-0.5">
        <SectionLabel label="Workshop" icon={Mic} />
        {WORKSHOP_ITEMS.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}
      </div>

      {/* Sandbox — Autonomous Projects */}
      <div className="mx-2 mt-2 border-t border-emerald-200/50" />
      <div className="mt-1 space-y-0.5">
        <SectionLabel label="Sandbox" icon={Layers} />
        {SANDBOX_ITEMS.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}
      </div>

      {/* Per|Form — Sports Analytics & N.I.L. */}
      <div className="mx-2 mt-2 border-t border-amber-200/50" />
      <div className="mt-1 space-y-0.5">
        <SectionLabel label="Per|Form" icon={Trophy} />
        {PERFORM_ITEMS.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}
      </div>

      {/* Owner-Only Tabs */}
      {isOwner && (
        <>
          <div className="mx-2 mt-2 border-t border-red-200/50" />
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
                  ? "border border-red-200 bg-red-50 text-red-700"
                  : "border border-transparent text-red-400 hover:bg-red-50 hover:border-red-200 hover:text-red-600"
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
