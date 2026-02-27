// frontend/app/perform/directory/page.tsx
"use client";

/**
 * Per|Form Conference Directory
 *
 * Browsable directory of all conferences, teams, coaching staffs,
 * and stadium data. Adapted from the original /perform page.
 * Light theme per AIMS design system.
 */

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  LayoutGrid,
  RefreshCw,
  ArrowRightLeft,
  DollarSign,
  PiggyBank,
  Trophy,
  Users,
  Building2,
  MapPin,
  TrendingUp,
  ChevronRight,
  Search,
  Star,
} from "lucide-react";
import { CONFERENCES, TIER_LABELS } from "@/lib/perform/conferences";
import type { Conference, ConferenceTier } from "@/lib/perform/conferences";

// ── Quick-Link Cards ─────────────────────────────────────────

const MODULES = [
  {
    href: "/perform/coaching-carousel",
    label: "Coaching Carousel",
    icon: RefreshCw,
    desc: "Track every coaching change across college football",
    color: "text-emerald-500",
    bg: "bg-emerald-400/10",
    border: "border-emerald-400/20",
  },
  {
    href: "/perform/transfer-portal",
    label: "Transfer Portal",
    icon: ArrowRightLeft,
    desc: "Players entering, committing, and signing in the portal",
    color: "text-blue-500",
    bg: "bg-blue-400/10",
    border: "border-blue-400/20",
  },
  {
    href: "/perform/nil-tracker",
    label: "NIL Tracker",
    icon: DollarSign,
    desc: "Team rankings, top deals, and player NIL valuations",
    color: "text-amber-500",
    bg: "bg-amber-400/10",
    border: "border-amber-400/20",
  },
  {
    href: "/perform/revenue-budget",
    label: "Revenue & Budget",
    icon: PiggyBank,
    desc: "School revenue, NIL budgets, and cap space analysis",
    color: "text-amber-500",
    bg: "bg-amber-400/10",
    border: "border-amber-400/20",
  },
  {
    href: "/perform/war-room",
    label: "War Room",
    icon: Trophy,
    desc: "Bull vs Bear debates, prospect analysis, and ACHEEVY verdicts",
    color: "text-red-500",
    bg: "bg-red-400/10",
    border: "border-red-400/20",
  },
];

// ── KPI Strip ────────────────────────────────────────────────

function KpiCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 px-4 py-3 rounded-xl bg-white border border-slate-200">
      <span className="text-sm uppercase tracking-wider text-slate-400">{label}</span>
      <span className="text-xl md:text-2xl font-bold text-gold">
        {value}
      </span>
      {sub && <span className="text-xs text-slate-400">{sub}</span>}
    </div>
  );
}

// ── Conference Card ──────────────────────────────────────────

function ConferenceCard({ conf }: { conf: Conference }) {
  const tier = TIER_LABELS[conf.tier];
  const totalCapacity = conf.teams.reduce((s, t) => s + t.stadiumCapacity, 0);

  return (
    <div className="group rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 transition-all p-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-lg font-bold text-slate-800">{conf.abbreviation}</h3>
          <p className="text-xs text-slate-400">{conf.name}</p>
        </div>
        <span
          className={`text-xs uppercase tracking-wider px-2 py-0.5 rounded-full ${tier.bg} ${tier.border} border ${tier.color}`}
        >
          {tier.label}
        </span>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="text-center py-1.5 rounded-lg bg-slate-50">
          <div className="text-sm font-bold text-slate-700">{conf.teams.length}</div>
          <div className="text-xs text-slate-400">Teams</div>
        </div>
        <div className="text-center py-1.5 rounded-lg bg-slate-50">
          <div className="text-sm font-bold text-slate-700">{(totalCapacity / 1000).toFixed(0)}K</div>
          <div className="text-xs text-slate-400">Total Seats</div>
        </div>
        <div className="text-center py-1.5 rounded-lg bg-slate-50">
          <div className="text-sm font-bold text-slate-700">{conf.founded}</div>
          <div className="text-xs text-slate-400">Founded</div>
        </div>
      </div>

      {/* Team Grid */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {conf.teams.slice(0, 12).map((team) => (
          <span
            key={team.id}
            className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200 transition-colors cursor-default"
            title={`${team.schoolName} ${team.mascot} — ${team.headCoach}`}
          >
            {team.abbreviation}
          </span>
        ))}
        {conf.teams.length > 12 && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-50 text-slate-400">
            +{conf.teams.length - 12}
          </span>
        )}
      </div>

      {/* Commissioner */}
      <div className="flex items-center justify-between text-sm text-slate-400">
        <span>Commissioner: {conf.commissioner}</span>
        <span>
          {conf.hqCity}, {conf.hqState}
        </span>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────

export default function DirectoryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [tierFilter, setTierFilter] = useState<ConferenceTier | "">("");

  // Aggregate stats
  const stats = useMemo(() => {
    const allTeams = CONFERENCES.flatMap((c) => c.teams);
    const totalCapacity = allTeams.reduce((s, t) => s + t.stadiumCapacity, 0);
    const power4Count = CONFERENCES.filter((c) => c.tier === "power4").flatMap((c) => c.teams).length;
    const g5Count = CONFERENCES.filter((c) => c.tier === "group_of_5").flatMap((c) => c.teams).length;
    const largestStadium = allTeams.reduce((max, t) => (t.stadiumCapacity > max.stadiumCapacity ? t : max), allTeams[0]);

    return {
      conferences: CONFERENCES.length,
      teams: allTeams.length,
      totalCapacity,
      power4Count,
      g5Count,
      largestStadium,
    };
  }, []);

  // Filtered conferences
  const filteredConferences = useMemo(() => {
    let confs = [...CONFERENCES];

    if (tierFilter) {
      confs = confs.filter((c) => c.tier === tierFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      confs = confs.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.abbreviation.toLowerCase().includes(q) ||
          c.teams.some(
            (t) =>
              t.schoolName.toLowerCase().includes(q) ||
              t.commonName.toLowerCase().includes(q) ||
              t.abbreviation.toLowerCase().includes(q) ||
              t.headCoach.toLowerCase().includes(q) ||
              t.mascot.toLowerCase().includes(q)
          )
      );
    }

    return confs;
  }, [tierFilter, searchQuery]);

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-8 md:py-12">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <LayoutGrid className="w-7 h-7 text-gold" />
          <h1 className="text-3xl md:text-4xl font-black text-slate-800">
            Conference Directory
          </h1>
        </div>
        <p className="text-sm md:text-base text-slate-500 max-w-2xl">
          Your command center for college football intelligence. Conferences, teams, coaching
          changes, the transfer portal, NIL valuations, and draft prospects — all in one place.
        </p>
      </div>

      {/* ── KPI Strip ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-10">
        <KpiCard label="Conferences" value={stats.conferences} />
        <KpiCard label="Teams" value={stats.teams} />
        <KpiCard label="Power 4" value={stats.power4Count} sub="teams" />
        <KpiCard label="Group of 5" value={stats.g5Count} sub="teams" />
        <KpiCard
          label="Largest Stadium"
          value={`${(stats.largestStadium.stadiumCapacity / 1000).toFixed(0)}K`}
          sub={stats.largestStadium.abbreviation}
        />
      </div>

      {/* ── Module Quick Links ───────────────────────────────── */}
      <div className="mb-10">
        <h2 className="text-xs uppercase tracking-wider text-slate-400 mb-3">Intelligence Modules</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {MODULES.map((mod) => {
            const Icon = mod.icon;
            return (
              <Link
                key={mod.href}
                href={mod.href}
                className={`group flex flex-col gap-2 rounded-xl p-4 border ${mod.border} ${mod.bg} hover:scale-[1.02] transition-all`}
              >
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${mod.color}`} />
                  <span className={`text-sm font-semibold ${mod.color}`}>{mod.label}</span>
                  <ChevronRight className="w-3 h-3 text-slate-300 ml-auto group-hover:text-slate-500 transition-colors" />
                </div>
                <p className="text-sm text-slate-400 leading-relaxed">{mod.desc}</p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Filters ──────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search teams, coaches, conferences..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-gold/30 focus:ring-1 focus:ring-gold/20 transition-all"
          />
        </div>

        <div className="flex gap-2">
          {(["", "power4", "group_of_5", "independent"] as const).map((tier) => {
            const isActive = tierFilter === tier;
            const label = tier === "" ? "All" : TIER_LABELS[tier as ConferenceTier]?.label || tier;
            return (
              <button
                key={tier}
                onClick={() => setTierFilter(tier)}
                className={`text-xs px-3 py-2 rounded-lg border transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-gold/15 text-gold border-gold/30"
                    : "bg-white text-slate-500 border-slate-200 hover:text-slate-700"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Conference Grid ──────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        {filteredConferences.map((conf) => (
          <ConferenceCard key={conf.id} conf={conf} />
        ))}
      </div>

      {filteredConferences.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <Search className="w-8 h-8 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No conferences match your search.</p>
        </div>
      )}

      {/* ── Biggest Stadiums Leaderboard ─────────────────────── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="w-5 h-5 text-gold" />
          <h2 className="text-lg font-bold text-slate-800">
            Top 10 Stadiums by Capacity
          </h2>
        </div>

        <div className="space-y-2">
          {CONFERENCES.flatMap((c) => c.teams.map((t) => ({ ...t, conferenceName: c.abbreviation })))
            .sort((a, b) => b.stadiumCapacity - a.stadiumCapacity)
            .slice(0, 10)
            .map((team, idx) => (
              <div
                key={team.id}
                className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    idx < 3 ? "bg-gold/20 text-gold" : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-800 truncate">
                      {team.commonName} {team.mascot}
                    </span>
                    <span className="text-xs text-slate-400">{team.conferenceName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">{team.stadium}</span>
                  </div>
                </div>
                <span className="text-sm font-bold text-slate-700 tabular-nums">
                  {team.stadiumCapacity.toLocaleString()}
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
