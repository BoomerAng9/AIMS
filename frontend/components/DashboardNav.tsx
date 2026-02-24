// frontend/components/DashboardNav.tsx
"use client";

/**
 * Consolidated Dashboard Navigation — Dual Mode (PRIVATE / PUBLIC)
 *
 * PRIVATE mode (Owner/Admin): Full technical navigation — all agents, integrations, dev tools
 * PUBLIC mode (Customer): Simplified navigation — plain language, curated features
 *
 * Owner gets a "Developer Mode" toggle in the nav footer.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { usePlatformMode } from "@/lib/platform-mode";
import { t } from "@/lib/terminology";
import {
  MessageSquare, Zap, Shield, Bot, BarChart3,
  Settings, Cpu, Wrench, CreditCard, Rocket,
  FlaskConical, FolderKanban, Users, Boxes,
  Trophy, Activity, Mic, Theater, BookOpen,
  Coins, CircleDot, TrendingUp, Building, Layers,
  Store, ShoppingCart, Calculator, Map, Plug,
  Code, Eye, Wand2,
} from "lucide-react";

// ── Types ──

interface NavItem {
  href: string;
  label: string;
  icon: typeof MessageSquare;
  highlight?: boolean;
  ownerOnly?: boolean;
}

// ══════════════════════════════════════════════════════════════
// PRIVATE MODE Navigation (Owner / Admin — full developer view)
// ══════════════════════════════════════════════════════════════

const PRIVATE_PRIMARY: NavItem[] = [
  { href: "/dashboard/chat", label: "Chat w/ACHEEVY", icon: MessageSquare, highlight: true },
  { href: "/dashboard/acheevy", label: "ACHEEVY", icon: Zap, highlight: true },
];

const PRIVATE_CORE: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: BarChart3 },
  { href: "/dashboard/map", label: "Platform Map", icon: Map, highlight: true },
  { href: "/dashboard/deploy-dock", label: "Deploy Dock", icon: Rocket, highlight: true },
  { href: "/dashboard/automations", label: "Automations", icon: Zap, highlight: true },
  { href: "/dashboard/make-it-mine", label: "Make It Mine", icon: Wrench, highlight: true },
  { href: "/dashboard/ntntn-studio", label: "Creative Studio", icon: Wand2, highlight: true },
  { href: "/dashboard/your-space", label: "Your Space", icon: Users },
  { href: "/dashboard/plan", label: "Plan", icon: FolderKanban },
];

const PRIVATE_CIRCUIT_BOX: NavItem[] = [
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

const PRIVATE_WORKSHOP: NavItem[] = [
  { href: "/workshop", label: "Workshop Hub", icon: Mic, highlight: true },
  { href: "/workshop/life-scenes", label: "Life Scenes", icon: Theater },
  { href: "/workshop/moment-studio", label: "Moment Studio", icon: BookOpen },
  { href: "/workshop/money-moves", label: "Money Moves", icon: Coins },
  { href: "/workshop/creator-circles", label: "Creator Circles", icon: CircleDot },
];

const PRIVATE_SANDBOX: NavItem[] = [
  { href: "/sandbox", label: "Sandbox Hub", icon: Layers, highlight: true },
  { href: "/sandbox/perform", label: "Per|Form", icon: TrendingUp },
  { href: "/sandbox/blockwise", label: "Blockwise AI", icon: Building },
  { href: "/sandbox/verticals", label: "Verticals", icon: Shield },
];

// Plugs — Catalog + My Plugs
const PLUG_ITEMS: NavItem[] = [
  { href: "/dashboard/plug-catalog", label: "Plug Catalog", icon: Store, highlight: true },
  { href: "/dashboard/plugs", label: "My Plugs", icon: Boxes, highlight: true },
];

// Live Apps — Standalone tools accessible without diving into verticals
const PRIVATE_LIVE_APPS: NavItem[] = [
  { href: "/dashboard/luc", label: "LUC Calculator", icon: Calculator, highlight: true },
  { href: "/dashboard/garage-to-global", label: "Garage to Global", icon: Store, highlight: true },
  { href: "/dashboard/buy-in-bulk", label: "Buy in Bulk", icon: ShoppingCart, highlight: true },
];

const PRIVATE_PERFORM: NavItem[] = [
  { href: "/dashboard/nil", label: "N.I.L.", icon: Trophy },
  { href: "/dashboard/sports-tracker", label: "Sports Tracker", icon: Activity },
];

const PRIVATE_OWNER: NavItem[] = [
  { href: "/dashboard/circuit-box?tab=control-plane", label: "Control Plane", icon: Shield, ownerOnly: true },
  { href: "/dashboard/circuit-box?tab=live-events", label: "Live Events", icon: Zap, ownerOnly: true },
  { href: "/dashboard/circuit-box?tab=security", label: "Security", icon: Shield, ownerOnly: true },
  { href: "/dashboard/circuit-box?tab=research", label: "R&D Hub", icon: FlaskConical, ownerOnly: true },
  { href: "/dashboard/war-room", label: "War Room", icon: Cpu, ownerOnly: true },
];

// ══════════════════════════════════════════════════════════════
// PUBLIC MODE Navigation (Customer — simplified, plain language)
// ══════════════════════════════════════════════════════════════

const PUBLIC_PRIMARY: NavItem[] = [
  { href: "/dashboard/chat", label: "Talk to ACHEEVY", icon: MessageSquare, highlight: true },
];

const PUBLIC_CORE: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: BarChart3 },
  { href: "/dashboard/deploy-dock", label: "Launch Tools", icon: Rocket, highlight: true },
  { href: "/dashboard/make-it-mine", label: "Build Something", icon: Wrench, highlight: true },
  { href: "/dashboard/ntntn-studio", label: "Creative Studio", icon: Wand2, highlight: true },
  { href: "/dashboard/your-space", label: "My Workspace", icon: Users },
  { href: "/dashboard/plan", label: "My Plan", icon: FolderKanban },
];

const PUBLIC_APPS: NavItem[] = [
  { href: "/dashboard/plug-catalog", label: "Tool Catalog", icon: Store, highlight: true },
  { href: "/halalhub", label: "HalalHub", icon: Store },
  { href: "/dashboard/luc", label: "Usage Credits", icon: Calculator },
];

const PUBLIC_SETTINGS: NavItem[] = [
  { href: "/dashboard/circuit-box?tab=services", label: "My Services", icon: Shield },
  { href: "/dashboard/circuit-box?tab=settings", label: "Settings", icon: Settings },
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
          ? "border border-amber-500/20 bg-amber-500/10 text-amber-400 shadow-sm"
          : item.highlight
            ? "border border-amber-500/10 bg-amber-500/5 text-amber-500 hover:bg-amber-500/10 hover:border-amber-500/20"
            : "border border-transparent text-zinc-400 hover:bg-white/5 hover:border-white/10 hover:text-zinc-200"
      )}
    >
      <Icon
        className={clsx(
          "w-4 h-4 flex-shrink-0",
          active ? "text-amber-400" : item.highlight ? "text-amber-500" : "text-zinc-500"
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
    <div className="flex items-center gap-2 px-3 py-1.5 text-zinc-500">
      <Icon className="w-3.5 h-3.5 flex-shrink-0" />
      <span className="font-mono uppercase tracking-[0.15em] text-[10px]">{label}</span>
    </div>
  );
}

// ── Developer Mode Toggle ──

function DevModeToggle() {
  const { mode, canToggle, toggleMode } = usePlatformMode();

  if (!canToggle) return null;

  const isPrivate = mode === 'PRIVATE';

  return (
    <button
      onClick={toggleMode}
      className={clsx(
        "flex items-center gap-2.5 w-full rounded-lg px-3 py-2 transition-all text-sm border",
        isPrivate
          ? "border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100"
          : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
      )}
      title={isPrivate ? "Switch to Customer View" : "Switch to Developer View"}
    >
      {isPrivate ? (
        <Code className="w-4 h-4 text-violet-500" />
      ) : (
        <Eye className="w-4 h-4 text-slate-400" />
      )}
      <span className="truncate">
        {isPrivate ? "Developer Mode" : "Customer View"}
      </span>
      <span
        className={clsx(
          "ml-auto text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded",
          isPrivate
            ? "bg-violet-200 text-violet-800"
            : "bg-slate-200 text-slate-600"
        )}
      >
        {isPrivate ? "DEV" : "PUB"}
      </span>
    </button>
  );
}

// ── Main Nav Component ──

export function DashboardNav() {
  const pathname = usePathname();
  const { mode, isOwner } = usePlatformMode();

  if (mode === 'PUBLIC') {
    return (
      <nav className="flex flex-col gap-1 text-sm">
        {/* Primary — Talk to ACHEEVY */}
        <div className="space-y-1 mb-2">
          {PUBLIC_PRIMARY.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} />
          ))}
        </div>

        <div className="mx-2 border-t border-slate-200" />

        {/* Core — simplified */}
        <div className="mt-2 space-y-0.5">
          <SectionLabel label="Navigate" icon={BarChart3} />
          {PUBLIC_CORE.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} />
          ))}
        </div>

        {/* Apps */}
        <div className="mx-2 mt-2 border-t border-emerald-200/50" />
        <div className="mt-1 space-y-0.5">
          <SectionLabel label="Apps" icon={Rocket} />
          {PUBLIC_APPS.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} />
          ))}
        </div>

        {/* Settings — minimal */}
        <div className="mx-2 mt-2 border-t border-slate-200" />
        <div className="mt-1 space-y-0.5">
          <SectionLabel label="Account" icon={Settings} />
          {PUBLIC_SETTINGS.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} />
          ))}
        </div>

        {/* Dev Mode Toggle (only shown to owners viewing public mode) */}
        <div className="mx-2 mt-4 border-t border-slate-200 pt-3">
          <DevModeToggle />
        </div>
      </nav>
    );
  }

  // ── PRIVATE MODE (full developer navigation) ──
  return (
    <nav className="flex flex-col gap-1 text-sm">
      {/* Primary Actions */}
      <div className="space-y-1 mb-2">
        {PRIVATE_PRIMARY.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}
      </div>

      <div className="mx-2 border-t border-white/10" />

      {/* Core Pages */}
      <div className="mt-2 space-y-0.5">
        <SectionLabel label="Command" icon={BarChart3} />
        {PRIVATE_CORE.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}
      </div>

      {/* Plugs — Catalog & Deployed */}
      <div className="mx-2 mt-2 border-t border-white/8" />
      <div className="mt-1 space-y-0.5">
        <SectionLabel label="Plugs" icon={Plug} />
        {PLUG_ITEMS.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}
      </div>

      {/* Live Apps — Direct access tools */}
      <div className="mx-2 mt-2 border-t border-emerald-200/50" />
      <div className="mt-1 space-y-0.5">
        <SectionLabel label="Live Apps" icon={Rocket} />
        {PRIVATE_LIVE_APPS.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}
      </div>

      <div className="mx-2 mt-2 border-t border-amber-200/50" />

      {/* Circuit Box */}
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
        {PRIVATE_CIRCUIT_BOX.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}
      </div>

      {/* Workshop */}
      <div className="mx-2 mt-2 border-t border-cyan-200/50" />
      <div className="mt-1 space-y-0.5">
        <SectionLabel label="Workshop" icon={Mic} />
        {PRIVATE_WORKSHOP.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}
      </div>

      {/* Sandbox */}
      <div className="mx-2 mt-2 border-t border-emerald-200/50" />
      <div className="mt-1 space-y-0.5">
        <SectionLabel label="Sandbox" icon={Layers} />
        {PRIVATE_SANDBOX.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}
      </div>

      {/* Per|Form */}
      <div className="mx-2 mt-2 border-t border-amber-200/50" />
      <div className="mt-1 space-y-0.5">
        <SectionLabel label="Per|Form" icon={Trophy} />
        {PRIVATE_PERFORM.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}
      </div>

      {/* Owner-Only Tabs */}
      {isOwner && (
        <>
          <div className="mx-2 mt-2 border-t border-red-200/50" />
          <div className="mt-1 space-y-0.5">
            <SectionLabel label="Owner Only" icon={Shield} />
            {PRIVATE_OWNER.map((item) => (
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

      {/* Dev Mode Toggle */}
      <div className="mx-2 mt-4 border-t border-slate-200 pt-3">
        <DevModeToggle />
      </div>
    </nav>
  );
}
