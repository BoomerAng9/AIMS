// frontend/app/perform/revenue-budget/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  PiggyBank,
  DollarSign,
  TrendingUp,
  Building2,
  ChevronDown,
  FileText,
} from "lucide-react";
import type { SchoolRevenueBudget, SpendingTier } from "@/lib/perform/ncaa-types";
import { SPENDING_TIER_STYLES } from "@/lib/perform/ncaa-types";

const markerFont = 'var(--font-marker), "Permanent Marker", cursive';

const SEASONS = [2024, 2025, 2026];

function formatCurrency(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toLocaleString()}`;
}

function formatCurrencyShort(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return value.toLocaleString();
}

function KpiCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 backdrop-blur-md p-4 flex items-center gap-3">
      <div className={`rounded-lg p-2 ${color}`}>{icon}</div>
      <div>
        <p className="text-xl md:text-2xl font-bold text-slate-800">{value}</p>
        <p className="text-xs text-slate-500 uppercase tracking-wider">{label}</p>
      </div>
    </div>
  );
}

/** Mini horizontal stacked bar for revenue breakdown */
function RevenueBar({ budget }: { budget: SchoolRevenueBudget }) {
  const total = budget.totalRevenue || 1;
  const segments = [
    { value: budget.tvRevenue, color: "bg-blue-400", label: "TV" },
    { value: budget.ticketRevenue, color: "bg-emerald-400", label: "Tickets" },
    { value: budget.donorRevenue, color: "bg-amber-400", label: "Donors" },
    { value: budget.merchandiseRev, color: "bg-amber-400", label: "Merch" },
    { value: budget.conferenceShare, color: "bg-cyan-400", label: "Conf" },
  ];

  return (
    <div className="flex flex-col gap-1">
      <div className="flex h-2 w-full rounded-full overflow-hidden bg-slate-50">
        {segments.map((seg, i) => {
          const pct = (seg.value / total) * 100;
          if (pct < 1) return null;
          return (
            <div
              key={i}
              className={`${seg.color} opacity-70`}
              style={{ width: `${pct}%` }}
              title={`${seg.label}: ${formatCurrency(seg.value)} (${pct.toFixed(0)}%)`}
            />
          );
        })}
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {segments.map((seg, i) => (
          <span key={i} className="flex items-center gap-1 text-xs text-slate-400">
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${seg.color} opacity-70`} />
            {seg.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function CapSpaceCell({ nilBudget, nilSpent }: { nilBudget: number; nilSpent: number }) {
  const capSpace = nilBudget - nilSpent;
  const ratio = nilBudget > 0 ? nilSpent / nilBudget : 0;

  let colorClass = "text-emerald-400";
  if (ratio > 1) colorClass = "text-red-400";
  else if (ratio > 0.85) colorClass = "text-amber-400";
  else if (ratio > 0.7) colorClass = "text-yellow-400";

  return (
    <span className={`text-sm font-bold ${colorClass}`}>
      {capSpace >= 0 ? formatCurrency(capSpace) : `-${formatCurrency(Math.abs(capSpace))}`}
    </span>
  );
}

function SkeletonRow() {
  return (
    <tr className="border-t border-slate-100 animate-pulse">
      <td className="p-3 md:p-4"><div className="h-8 w-8 rounded-full bg-slate-50" /></td>
      <td className="p-3 md:p-4"><div className="h-4 w-28 rounded bg-slate-100" /></td>
      <td className="p-3 md:p-4"><div className="h-4 w-16 rounded bg-slate-50" /></td>
      <td className="p-3 md:p-4"><div className="h-4 w-16 rounded bg-slate-50" /></td>
      <td className="p-3 md:p-4"><div className="h-4 w-16 rounded bg-slate-50" /></td>
      <td className="p-3 md:p-4"><div className="h-4 w-16 rounded bg-slate-50" /></td>
      <td className="p-3 md:p-4"><div className="h-4 w-16 rounded bg-slate-50" /></td>
      <td className="p-3 md:p-4"><div className="h-2 w-full rounded bg-slate-50" /></td>
    </tr>
  );
}

export default function RevenueBudgetPage() {
  const [season, setSeason] = useState(2025);
  const [budgets, setBudgets] = useState<SchoolRevenueBudget[]>([]);
  const [loading, setLoading] = useState(true);

  // Computed league-wide KPIs
  const totalRevenue = budgets.reduce((s, b) => s + b.totalRevenue, 0);
  const totalNilSpent = budgets.reduce((s, b) => s + b.nilSpent, 0);
  const totalNilBudget = budgets.reduce((s, b) => s + b.nilBudget, 0);
  const avgCapSpace = budgets.length > 0
    ? budgets.reduce((s, b) => s + (b.nilBudget - b.nilSpent), 0) / budgets.length
    : 0;

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const params = new URLSearchParams({ season: String(season) });
        const res = await fetch(`/api/perform/revenue-budget?${params}`);
        if (res.ok) {
          const data = await res.json();
          setBudgets(data.budgets ?? data ?? []);
        }
      } catch {
        // Silently handle fetch errors
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [season]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 lg:px-8">
      {/* ── Hero ──────────────────────────────────────────── */}
      <div className="text-center mb-8">
        <h1
          className="text-2xl md:text-4xl font-bold tracking-tight"
          style={{ fontFamily: markerFont }}
        >
          Revenue Budget
        </h1>
        <p className="mt-2 text-sm md:text-base text-slate-500 max-w-xl mx-auto">
          NCAA Free Agency System. School-by-school revenue, NIL budgets, and cap space leaderboard.
        </p>
      </div>

      {/* ── KPI Strip ────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <KpiCard
          label="League Revenue"
          value={formatCurrency(totalRevenue)}
          icon={<Building2 className="w-5 h-5" />}
          color="bg-slate-100 text-slate-800"
        />
        <KpiCard
          label="Total NIL Budget"
          value={formatCurrency(totalNilBudget)}
          icon={<PiggyBank className="w-5 h-5" />}
          color="bg-gold/15 text-gold"
        />
        <KpiCard
          label="Total NIL Spent"
          value={formatCurrency(totalNilSpent)}
          icon={<DollarSign className="w-5 h-5" />}
          color="bg-emerald-400/15 text-emerald-400"
        />
        <KpiCard
          label="Avg Cap Space"
          value={formatCurrency(avgCapSpace)}
          icon={<TrendingUp className="w-5 h-5" />}
          color="bg-blue-400/15 text-blue-400"
        />
      </div>

      {/* ── Season Selector ──────────────────────────────── */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative">
          <select
            value={season}
            onChange={(e) => setSeason(Number(e.target.value))}
            className="appearance-none rounded-lg border border-slate-200 bg-slate-50/70 backdrop-blur-md px-4 py-2 pr-8 text-sm text-slate-700 focus:outline-none focus:border-gold/40 transition-colors cursor-pointer"
          >
            {SEASONS.map((s) => (
              <option key={s} value={s} className="bg-white">
                {s}-{s + 1} Season
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
        </div>
        <span className="text-xs text-slate-400 ml-auto">
          {budgets.length} school{budgets.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* ── Leaderboard Table ────────────────────────────── */}
      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 backdrop-blur-md overflow-hidden">
          <table className="w-full">
            <tbody>
              {Array.from({ length: 10 }).map((_, i) => (
                <SkeletonRow key={i} />
              ))}
            </tbody>
          </table>
        </div>
      ) : budgets.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 backdrop-blur-md p-12 text-center">
          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">No budget data found for the selected season.</p>
        </div>
      ) : (
        <>
          {/* ── Mobile Cards ─────────────────────────── */}
          <div className="md:hidden space-y-3">
            {budgets.map((budget, idx) => {
              const tierStyle = SPENDING_TIER_STYLES[budget.spendingTier] ?? SPENDING_TIER_STYLES.MID;
              const rank = budget.capRank ?? idx + 1;

              return (
                <div
                  key={budget.id}
                  className="rounded-xl border border-slate-200 bg-slate-50/70 backdrop-blur-md p-4 hover:border-slate-200 transition-all"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                          rank <= 3
                            ? "bg-gold/15 text-gold border border-gold/30"
                            : "bg-slate-50 text-slate-500"
                        }`}
                      >
                        {rank}
                      </span>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{budget.team.commonName}</p>
                        <p className="text-xs text-slate-400">{budget.team.abbreviation}</p>
                      </div>
                    </div>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${tierStyle.bg} ${tierStyle.border} ${tierStyle.text}`}
                    >
                      {tierStyle.label}
                    </span>
                  </div>

                  {/* Financials Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                    <div>
                      <p className="text-slate-400">Revenue</p>
                      <p className="font-bold text-slate-800">{formatCurrency(budget.totalRevenue)}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">NIL Budget</p>
                      <p className="font-bold text-slate-800">{formatCurrency(budget.nilBudget)}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">NIL Spent</p>
                      <p className="font-bold text-slate-800">{formatCurrency(budget.nilSpent)}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Cap Space</p>
                      <CapSpaceCell nilBudget={budget.nilBudget} nilSpent={budget.nilSpent} />
                    </div>
                  </div>

                  {/* Revenue Bar */}
                  <RevenueBar budget={budget} />
                </div>
              );
            })}
          </div>

          {/* ── Desktop Table ────────────────────────── */}
          <div className="hidden md:block rounded-xl border border-slate-200 bg-slate-50/70 backdrop-blur-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="p-3 lg:p-4 text-left text-xs uppercase tracking-wider text-slate-400 w-14">Rank</th>
                    <th className="p-3 lg:p-4 text-left text-xs uppercase tracking-wider text-slate-400">School</th>
                    <th className="p-3 lg:p-4 text-right text-xs uppercase tracking-wider text-slate-400">Total Revenue</th>
                    <th className="p-3 lg:p-4 text-right text-xs uppercase tracking-wider text-slate-400">NIL Budget</th>
                    <th className="p-3 lg:p-4 text-right text-xs uppercase tracking-wider text-slate-400">NIL Spent</th>
                    <th className="p-3 lg:p-4 text-right text-xs uppercase tracking-wider text-slate-400">Cap Space</th>
                    <th className="p-3 lg:p-4 text-center text-xs uppercase tracking-wider text-slate-400">Tier</th>
                    <th className="p-3 lg:p-4 text-left text-xs uppercase tracking-wider text-slate-400 w-48">Revenue Mix</th>
                  </tr>
                </thead>
                <tbody>
                  {budgets.map((budget, idx) => {
                    const tierStyle = SPENDING_TIER_STYLES[budget.spendingTier] ?? SPENDING_TIER_STYLES.MID;
                    const rank = budget.capRank ?? idx + 1;

                    return (
                      <tr
                        key={budget.id}
                        className="border-t border-slate-100 hover:bg-white transition-colors"
                      >
                        {/* Rank */}
                        <td className="p-3 lg:p-4">
                          <span
                            className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${
                              rank <= 3
                                ? "bg-gold/15 text-gold border border-gold/30"
                                : "bg-slate-50 text-slate-500"
                            }`}
                          >
                            {rank}
                          </span>
                        </td>

                        {/* School */}
                        <td className="p-3 lg:p-4">
                          <div>
                            <p className="text-sm font-bold text-slate-800">{budget.team.commonName}</p>
                            <p className="text-xs text-slate-400">{budget.team.schoolName}</p>
                          </div>
                        </td>

                        {/* Total Revenue */}
                        <td className="p-3 lg:p-4 text-right">
                          <span className="text-sm font-bold text-slate-800">{formatCurrency(budget.totalRevenue)}</span>
                        </td>

                        {/* NIL Budget */}
                        <td className="p-3 lg:p-4 text-right">
                          <span className="text-sm text-slate-600">{formatCurrency(budget.nilBudget)}</span>
                        </td>

                        {/* NIL Spent */}
                        <td className="p-3 lg:p-4 text-right">
                          <span className="text-sm text-slate-600">{formatCurrency(budget.nilSpent)}</span>
                        </td>

                        {/* Cap Space */}
                        <td className="p-3 lg:p-4 text-right">
                          <CapSpaceCell nilBudget={budget.nilBudget} nilSpent={budget.nilSpent} />
                        </td>

                        {/* Spending Tier */}
                        <td className="p-3 lg:p-4 text-center">
                          <span
                            className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold ${tierStyle.bg} ${tierStyle.border} ${tierStyle.text}`}
                          >
                            {tierStyle.label}
                          </span>
                        </td>

                        {/* Revenue Mix Bar */}
                        <td className="p-3 lg:p-4">
                          <RevenueBar budget={budget} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Legend ────────────────────────────────── */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
            <span>Cap Space Color:</span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
              Healthy
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-yellow-400" />
              Tight
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-amber-400" />
              Warning
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-red-400" />
              Over Budget
            </span>
          </div>
        </>
      )}
    </div>
  );
}
