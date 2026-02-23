// frontend/app/perform/layout.tsx
"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import Footer from "@/components/landing/Footer";
import {
  LayoutGrid,
  RefreshCw,
  ArrowRightLeft,
  DollarSign,
  PiggyBank,
  Trophy,
  CreditCard,
} from "lucide-react";

const PERFORM_NAV = [
  { href: "/perform", label: "Big Board", icon: LayoutGrid },
  { href: "/perform/coaching-carousel", label: "Coaching Carousel", icon: RefreshCw },
  { href: "/perform/transfer-portal", label: "Transfer Portal", icon: ArrowRightLeft },
  { href: "/perform/nil-tracker", label: "NIL Tracker", icon: DollarSign },
  { href: "/perform/revenue-budget", label: "Revenue Budget", icon: PiggyBank },
  { href: "/perform/draft", label: "Draft", icon: Trophy },
  { href: "/perform/pricing", label: "Pricing", icon: CreditCard },
];

export default function PerFormLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <main className="min-h-screen bg-obsidian text-slate-800">
      <SiteHeader />

      {/* ── Per|Form Sub-Navigation ─────────────────────────── */}
      <div className="sticky top-14 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
          <nav
            className="flex items-center gap-1.5 py-2 overflow-x-auto scrollbar-hide"
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
                  className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs md:text-sm font-medium transition-all shrink-0 ${
                    isActive
                      ? "bg-gold/15 text-gold border border-gold/30 shadow-[0_0_10px_rgba(212,175,55,0.1)]"
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-50 border border-transparent"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
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
