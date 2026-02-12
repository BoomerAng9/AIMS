// frontend/components/DashboardNav.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import clsx from "clsx";
import {
  MessageSquare, Rocket, Cpu, BarChart3, Wrench, Zap, Users,
  Settings, ChevronDown, Shield, Bot, FlaskConical, Palette,
  LayoutDashboard, CreditCard, FolderKanban, Boxes,
} from "lucide-react";

// ── Circuit Box Navigation Structure ──

interface NavSection {
  id: string;
  label: string;
  icon: typeof MessageSquare;
  items: NavItem[];
  defaultOpen?: boolean;
}

interface NavItem {
  href: string;
  label: string;
  icon?: typeof MessageSquare;
  highlight?: boolean;
}

// Primary actions — always visible, not collapsed
const PRIMARY_ACTIONS: NavItem[] = [
  { href: "/dashboard/chat", label: "Chat w/ACHEEVY", icon: MessageSquare, highlight: true },
  { href: "/dashboard/acheevy", label: "ACHEEVY", icon: Zap, highlight: true },
];

// Grouped navigation sections — collapsible Circuit Box groups
const NAV_SECTIONS: NavSection[] = [
  {
    id: "command",
    label: "Command Center",
    icon: LayoutDashboard,
    defaultOpen: true,
    items: [
      { href: "/dashboard", label: "Overview", icon: BarChart3 },
      { href: "/dashboard/your-space", label: "Your Space", icon: Users },
      { href: "/dashboard/plan", label: "Plan", icon: FolderKanban },
    ],
  },
  {
    id: "build",
    label: "Build & Deploy",
    icon: Rocket,
    defaultOpen: true,
    items: [
      { href: "/dashboard/deploy-dock", label: "Deploy Dock", icon: Rocket, highlight: true },
      { href: "/dashboard/plugs", label: "aiPlugs", icon: Boxes },
      { href: "/dashboard/lab", label: "Workbench", icon: Wrench },
    ],
  },
  {
    id: "intelligence",
    label: "Intelligence",
    icon: Cpu,
    items: [
      { href: "/dashboard/house-of-ang", label: "House of Ang", icon: Bot },
      { href: "/dashboard/research", label: "R&D Hub", icon: FlaskConical },
      { href: "/dashboard/model-garden", label: "Model Garden", icon: Cpu },
    ],
  },
  {
    id: "operations",
    label: "Operations",
    icon: BarChart3,
    items: [
      { href: "/dashboard/project-management", label: "PMO Offices", icon: FolderKanban },
      { href: "/dashboard/workstreams", label: "Workstreams", icon: BarChart3 },
      { href: "/dashboard/luc", label: "LUC Credits", icon: CreditCard },
    ],
  },
  {
    id: "customize",
    label: "Customize",
    icon: Palette,
    items: [
      { href: "/dashboard/make-it-mine", label: "Make It Mine", icon: Palette },
      { href: "/dashboard/settings", label: "Settings", icon: Settings },
    ],
  },
];

// Admin-only Circuit Box section
const ADMIN_SECTION: NavSection = {
  id: "circuit-box",
  label: "Circuit Box",
  icon: Shield,
  items: [
    { href: "/dashboard/circuit-box", label: "System Panel", icon: Shield },
    { href: "/dashboard/boomerangs", label: "Boomer_Angs", icon: Bot },
    { href: "/dashboard/operations", label: "Operations", icon: BarChart3 },
    { href: "/dashboard/gates", label: "Gates & Evidence", icon: Shield },
    { href: "/dashboard/environments", label: "Environments", icon: Boxes },
    { href: "/dashboard/security", label: "Security Center", icon: Shield },
    { href: "/dashboard/sports-tracker", label: "Sports Tracker", icon: BarChart3 },
  ],
};

// ── Components ──

function NavLink({ item, pathname, compact }: { item: NavItem; pathname: string | null; compact?: boolean }) {
  const active =
    pathname === item.href ||
    (item.href !== "/dashboard" && pathname?.startsWith(item.href));
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
      {Icon && (
        <Icon className={clsx(
          "w-4 h-4 flex-shrink-0",
          active ? "text-gold" : item.highlight ? "text-gold/60" : "text-white/30"
        )} />
      )}
      {!compact && <span className="truncate">{item.label}</span>}
      {item.highlight && !active && (
        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-gold/60 animate-pulse" />
      )}
    </Link>
  );
}

function CollapsibleSection({ section, pathname }: { section: NavSection; pathname: string | null }) {
  const [open, setOpen] = useState(section.defaultOpen ?? false);
  const hasActiveChild = section.items.some(
    item => pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href))
  );
  const Icon = section.icon;

  // Auto-expand if a child is active
  const isOpen = open || hasActiveChild;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!isOpen)}
        className={clsx(
          "w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-xs",
          hasActiveChild
            ? "text-gold/80"
            : "text-white/35 hover:text-white/60"
        )}
      >
        <Icon className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="font-mono uppercase tracking-[0.15em] text-[10px]">{section.label}</span>
        <ChevronDown className={clsx(
          "w-3 h-3 ml-auto transition-transform duration-200",
          isOpen ? "rotate-180" : ""
        )} />
      </button>
      {isOpen && (
        <div className="ml-1 mt-0.5 space-y-0.5">
          {section.items.map(item => (
            <NavLink key={item.href} item={item} pathname={pathname} />
          ))}
        </div>
      )}
    </div>
  );
}

export function DashboardNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = (session?.user as Record<string, unknown> | undefined)?.role;
  const isAdmin = role === "OWNER";

  return (
    <nav className="flex flex-col gap-1 text-sm">
      {/* Primary Actions — always visible */}
      <div className="space-y-1 mb-3">
        {PRIMARY_ACTIONS.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}
      </div>

      <div className="mx-2 border-t border-wireframe-stroke" />

      {/* Grouped Sections */}
      <div className="mt-2 space-y-1">
        {NAV_SECTIONS.map((section) => (
          <CollapsibleSection key={section.id} section={section} pathname={pathname} />
        ))}
      </div>

      {/* Admin / Circuit Box */}
      {isAdmin && (
        <>
          <div className="mx-2 my-2 border-t border-gold/10" />
          <CollapsibleSection section={ADMIN_SECTION} pathname={pathname} />

          <div className="mx-2 my-1 border-t border-red-500/15" />
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
        </>
      )}
    </nav>
  );
}
