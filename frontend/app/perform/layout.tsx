// frontend/app/perform/layout.tsx
"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import Footer from "@/components/landing/Footer";
import {
  LayoutGrid,
  ListOrdered,
  Trophy,
  Swords,
  RefreshCw,
  ArrowRightLeft,
  DollarSign,
  PiggyBank,
  MapPin,
  FileText,
  Users,
  Building2,
  CreditCard,
  RotateCcw,
  Database,
} from "lucide-react";

const PERFORM_NAV = [
  { href: "/perform", label: "Hub", icon: LayoutGrid },
  { href: "/perform/ncaa-database", label: "Database", icon: Database },
  { href: "/perform/big-board", label: "Big Board", icon: ListOrdered },
  { href: "/perform/redraft", label: "Redraft", icon: RotateCcw },
  { href: "/perform/draft", label: "Draft", icon: Trophy },
  { href: "/perform/war-room", label: "War Room", icon: Swords },
  { href: "/perform/coaching-carousel", label: "Coaching", icon: RefreshCw },
  { href: "/perform/transfer-portal", label: "Portal", icon: ArrowRightLeft },
  { href: "/perform/nil-tracker", label: "NIL", icon: DollarSign },
  { href: "/perform/state-boards", label: "HS Boards", icon: MapPin },
  { href: "/perform/content", label: "Content", icon: FileText },
  { href: "/perform/analysts", label: "Analysts", icon: Users },
  { href: "/perform/directory", label: "Directory", icon: Building2 },
  { href: "/perform/pricing", label: "Pricing", icon: CreditCard },
];

export default function PerFormLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-slate-800">
      <SiteHeader />

      {/* ── Per|Form Sub-Navigation ─────────────────────────── */}
      <div className="sticky top-14 z-40 border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
          <nav
            className="flex items-center gap-1 py-1.5 overflow-x-auto scrollbar-hide no-scrollbar"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {PERFORM_NAV.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/perform"
                  ? pathname === "/perform"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 whitespace-nowrap rounded-sm px-4 py-2 text-xs md:text-[11px] font-black uppercase tracking-widest transition-all shrink-0 border-b-2 ${isActive
                      ? "text-emerald-800 border-emerald-600 bg-emerald-50/30"
                      : "text-slate-400 border-transparent hover:text-slate-600 hover:bg-slate-50"
                    }`}
                >
                  <Icon className="w-3 h-3 opacity-60" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* ── Page Content ────────────────────────────────────── */}
      <div className="flex-1">{children}</div>

      <Footer />
    </main>
  );
}
