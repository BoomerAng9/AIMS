// frontend/components/DashboardNav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const navItems = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/chat", label: "ACHEEVY Chat" },
  { href: "/dashboard/plan", label: "Plan" },
  { href: "/dashboard/ai-plugs", label: "aiPlugs" },
  { href: "/dashboard/boomerangs", label: "BoomerAngs" },
  { href: "/dashboard/house-of-ang", label: "House of Ang" },
  { href: "/dashboard/project-management", label: "PMO Offices" },
  { href: "/dashboard/lab", label: "Lab" },
  { href: "/dashboard/luc", label: "LUC Usage" },
  { href: "/dashboard/circuit-box", label: "Circuit Box" },
  { href: "/dashboard/settings", label: "Settings" },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 text-sm text-amber-100/80">
      <p className="px-3 pb-2 pt-1 text-[0.7rem] uppercase tracking-[0.18em] text-amber-200/60">
        Workspace
      </p>
      {navItems.map((item) => {
        const active =
          pathname === item.href ||
          (item.href !== "/dashboard" && pathname?.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              "mx-1 flex items-center gap-2 rounded-full px-3 py-2 transition-colors",
              active
                ? "bg-amber-300 text-black shadow-[0_0_20px_rgba(250,204,21,0.45)]"
                : "text-amber-100/75 hover:bg-amber-100/10 hover:text-amber-50"
            )}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-amber-300/80" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
