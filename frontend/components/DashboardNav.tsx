// frontend/components/DashboardNav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import clsx from "clsx";

// ── User-facing navigation ──────────────────────────────────
const userNavItems = [
  { href: "/dashboard/your-space", label: "Your Space" },
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/deploy-dock", label: "Deploy Dock", highlight: true },
  { href: "/dashboard/plugs", label: "aiPlugs" },
  { href: "/dashboard/house-of-ang", label: "House of Ang" },
  { href: "/dashboard/the-hangar", label: "The Hangar", highlight: true },
  { href: "/dashboard/project-management", label: "PMO Offices" },
  { href: "/dashboard/make-it-mine", label: "Make It Mine" },
  { href: "/dashboard/circuit-box", label: "Circuit Box", highlight: true },
];

function NavLink({ item, pathname }: { item: { href: string; label: string; highlight?: boolean }; pathname: string | null }) {
  const active =
    pathname === item.href ||
    (item.href !== "/dashboard" && pathname?.startsWith(item.href));
  const isHighlight = item.highlight;

  return (
    <Link
      href={item.href}
      className={clsx(
        "mx-1 flex items-center gap-2 rounded-lg px-3 py-1.5 transition-colors border",
        active
          ? "border-gold/40 bg-gold/5 text-gold"
          : isHighlight
          ? "border-gold/20 bg-gold/5 text-gold/80 hover:bg-gold/10"
          : "border-transparent text-white/60 hover:bg-white/5 hover:border-wireframe-stroke hover:text-white/80"
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
}

export function DashboardNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = (session?.user as Record<string, unknown> | undefined)?.role;
  const isAdmin = role === "OWNER";

  return (
    <nav className="flex flex-col gap-0.5 text-sm">
      <p className="px-3 pb-2 pt-1 text-[0.6rem] uppercase tracking-[0.2em] text-white/30 font-mono">
        Workspace
      </p>

      {userNavItems.map((item) => (
        <NavLink key={item.href} item={item} pathname={pathname} />
      ))}

      {/* Admin access — consolidated into Circuit Box */}
      {isAdmin && (
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
