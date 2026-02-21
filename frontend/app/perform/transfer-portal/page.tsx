// frontend/app/perform/transfer-portal/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowRightLeft,
  Users,
  CheckCircle2,
  XCircle,
  PenLine,
  Star,
  BadgeCheck,
  ChevronDown,
  ArrowRight,
  FileText,
} from "lucide-react";
import type {
  TransferPortalEntry,
  PortalStatus,
  TransferWindow,
} from "@/lib/perform/ncaa-types";
import {
  PORTAL_STATUS_STYLES,
  WINDOW_STYLES,
} from "@/lib/perform/ncaa-types";

const markerFont = 'var(--font-marker), "Permanent Marker", cursive';

interface PortalStats {
  total: number;
  inPortal: number;
  committed: number;
  withdrawn: number;
  signed: number;
}

const SEASONS = [2024, 2025, 2026];
const STATUSES: { value: string; label: string }[] = [
  { value: "", label: "All Statuses" },
  { value: "IN_PORTAL", label: "In Portal" },
  { value: "COMMITTED", label: "Committed" },
  { value: "WITHDRAWN", label: "Withdrawn" },
  { value: "SIGNED", label: "Signed" },
];
const POSITIONS: string[] = [
  "", "QB", "RB", "WR", "TE", "OL", "DL", "LB", "CB", "S", "K", "P", "ATH",
];
const WINDOWS: { value: string; label: string }[] = [
  { value: "", label: "All Windows" },
  { value: "SPRING", label: "Spring" },
  { value: "SUMMER", label: "Summer" },
  { value: "WINTER", label: "Winter" },
];

function KpiCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/60 backdrop-blur-md p-4 flex items-center gap-3">
      <div className={`rounded-lg p-2 ${color}`}>{icon}</div>
      <div>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-xs text-white/50 uppercase tracking-wider">{label}</p>
      </div>
    </div>
  );
}

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${
            i < count ? "text-gold fill-gold" : "text-white/15"
          }`}
        />
      ))}
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="rounded-xl border border-white/10 bg-black/60 backdrop-blur-md p-4 md:p-5 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 rounded-full bg-white/10" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-1/2 rounded bg-white/10" />
          <div className="h-3 w-3/4 rounded bg-white/5" />
        </div>
        <div className="h-6 w-20 rounded-full bg-white/10" />
      </div>
    </div>
  );
}

export default function TransferPortalPage() {
  const [season, setSeason] = useState(2026);
  const [status, setStatus] = useState("");
  const [position, setPosition] = useState("");
  const [window, setWindow] = useState("");
  const [entries, setEntries] = useState<TransferPortalEntry[]>([]);
  const [stats, setStats] = useState<PortalStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const params = new URLSearchParams({ season: String(season) });
        if (status) params.set("status", status);
        if (position) params.set("position", position);
        if (window) params.set("transferWindow", window);

        const [entriesRes, statsRes] = await Promise.all([
          fetch(`/api/perform/transfer-portal?${params}`),
          fetch(`/api/perform/transfer-portal?${new URLSearchParams({ season: String(season), stats: "true" })}`),
        ]);

        if (entriesRes.ok) {
          const data = await entriesRes.json();
          setEntries(data.entries ?? data ?? []);
        }
        if (statsRes.ok) {
          const data = await statsRes.json();
          setStats(data.stats ?? data);
        }
      } catch {
        // Silently handle fetch errors
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [season, status, position, window]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 lg:px-8">
      {/* ── Hero ──────────────────────────────────────────── */}
      <div className="text-center mb-8">
        <h1
          className="text-2xl md:text-4xl font-bold tracking-tight"
          style={{ fontFamily: markerFont }}
        >
          Transfer Portal
        </h1>
        <p className="mt-2 text-sm md:text-base text-white/50 max-w-xl mx-auto">
          Every portal entry, commitment, and withdrawal tracked in real time across all NCAA D1 programs.
        </p>
      </div>

      {/* ── KPI Strip ────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
        <KpiCard
          label="Total Entries"
          value={stats?.total ?? 0}
          icon={<ArrowRightLeft className="w-5 h-5" />}
          color="bg-white/10 text-white"
        />
        <KpiCard
          label="In Portal"
          value={stats?.inPortal ?? 0}
          icon={<Users className="w-5 h-5" />}
          color="bg-amber-400/15 text-amber-400"
        />
        <KpiCard
          label="Committed"
          value={stats?.committed ?? 0}
          icon={<CheckCircle2 className="w-5 h-5" />}
          color="bg-emerald-400/15 text-emerald-400"
        />
        <KpiCard
          label="Withdrawn"
          value={stats?.withdrawn ?? 0}
          icon={<XCircle className="w-5 h-5" />}
          color="bg-zinc-400/15 text-zinc-400"
        />
        <KpiCard
          label="Signed"
          value={stats?.signed ?? 0}
          icon={<PenLine className="w-5 h-5" />}
          color="bg-blue-400/15 text-blue-400"
        />
      </div>

      {/* ── Filter Bar ───────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        {/* Season */}
        <div className="relative">
          <select
            value={season}
            onChange={(e) => setSeason(Number(e.target.value))}
            className="appearance-none rounded-lg border border-white/10 bg-black/60 backdrop-blur-md px-4 py-2 pr-8 text-sm text-white/80 focus:outline-none focus:border-gold/40 transition-colors cursor-pointer"
          >
            {SEASONS.map((s) => (
              <option key={s} value={s} className="bg-[#0A0A0A]">
                {s} Season
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40 pointer-events-none" />
        </div>

        {/* Status */}
        <div className="relative">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="appearance-none rounded-lg border border-white/10 bg-black/60 backdrop-blur-md px-4 py-2 pr-8 text-sm text-white/80 focus:outline-none focus:border-gold/40 transition-colors cursor-pointer"
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value} className="bg-[#0A0A0A]">
                {s.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40 pointer-events-none" />
        </div>

        {/* Position */}
        <div className="relative">
          <select
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            className="appearance-none rounded-lg border border-white/10 bg-black/60 backdrop-blur-md px-4 py-2 pr-8 text-sm text-white/80 focus:outline-none focus:border-gold/40 transition-colors cursor-pointer"
          >
            <option value="" className="bg-[#0A0A0A]">All Positions</option>
            {POSITIONS.filter(Boolean).map((p) => (
              <option key={p} value={p} className="bg-[#0A0A0A]">
                {p}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40 pointer-events-none" />
        </div>

        {/* Transfer Window */}
        <div className="relative">
          <select
            value={window}
            onChange={(e) => setWindow(e.target.value)}
            className="appearance-none rounded-lg border border-white/10 bg-black/60 backdrop-blur-md px-4 py-2 pr-8 text-sm text-white/80 focus:outline-none focus:border-gold/40 transition-colors cursor-pointer"
          >
            {WINDOWS.map((w) => (
              <option key={w.value} value={w.value} className="bg-[#0A0A0A]">
                {w.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40 pointer-events-none" />
        </div>

        <span className="text-xs text-white/30 ml-auto">
          {entries.length} player{entries.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* ── Player Cards / List ──────────────────────────── */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-black/60 backdrop-blur-md p-12 text-center">
          <FileText className="w-10 h-10 text-white/20 mx-auto mb-3" />
          <p className="text-white/50 text-sm">No portal entries found for the selected filters.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Table header (hidden on mobile) */}
          <div className="hidden md:grid md:grid-cols-12 gap-3 px-5 py-2 text-xs uppercase tracking-wider text-white/30">
            <div className="col-span-3">Player</div>
            <div className="col-span-1">Pos</div>
            <div className="col-span-1">Stars</div>
            <div className="col-span-3">Transfer</div>
            <div className="col-span-1 text-right">PAI</div>
            <div className="col-span-1 text-right">NIL Value</div>
            <div className="col-span-2 text-right">Status</div>
          </div>

          {entries.map((entry) => {
            const statusStyle = PORTAL_STATUS_STYLES[entry.status] ?? PORTAL_STATUS_STYLES.IN_PORTAL;
            const windowStyle = entry.transferWindow ? WINDOW_STYLES[entry.transferWindow] : null;

            return (
              <div
                key={entry.id}
                className="rounded-xl border border-white/10 bg-black/60 backdrop-blur-md p-4 md:px-5 md:py-4 hover:border-white/20 transition-all"
              >
                {/* Mobile Layout */}
                <div className="md:hidden space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-bold text-white">{entry.playerName}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-semibold text-gold/80 bg-gold/10 rounded px-1.5 py-0.5">
                          {entry.position}
                        </span>
                        {entry.stars && <StarRating count={entry.stars} />}
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyle.bg} ${statusStyle.text}`}
                    >
                      {statusStyle.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-white/70">
                      {entry.previousTeam?.commonName ?? "--"}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-gold/60 shrink-0" />
                    <span className="text-white/70">
                      {entry.newTeam?.commonName ?? "TBD"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs border-t border-white/5 pt-2">
                    <div className="flex items-center gap-3">
                      {entry.paiScore != null && (
                        <span className="text-white/50">
                          PAI: <span className="font-bold text-white">{entry.paiScore.toFixed(1)}</span>
                        </span>
                      )}
                      {entry.nilValuation && (
                        <span className="text-white/50">
                          NIL: <span className="font-bold text-white">{entry.nilValuation}</span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {windowStyle && (
                        <span className={`rounded px-1.5 py-0.5 text-xs ${windowStyle.bg} ${windowStyle.text}`}>
                          {windowStyle.label}
                        </span>
                      )}
                      {entry.verified && (
                        <BadgeCheck className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Desktop Layout */}
                <div className="hidden md:grid md:grid-cols-12 gap-3 items-center">
                  {/* Player Name */}
                  <div className="col-span-3 flex items-center gap-2 min-w-0">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white truncate">{entry.playerName}</p>
                      {entry.eligibility && (
                        <p className="text-xs text-white/40">{entry.eligibility}</p>
                      )}
                    </div>
                    {entry.verified && (
                      <BadgeCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    )}
                  </div>

                  {/* Position */}
                  <div className="col-span-1">
                    <span className="text-xs font-semibold text-gold/80 bg-gold/10 rounded px-1.5 py-0.5">
                      {entry.position}
                    </span>
                  </div>

                  {/* Stars */}
                  <div className="col-span-1">
                    {entry.stars ? <StarRating count={entry.stars} /> : <span className="text-white/20">--</span>}
                  </div>

                  {/* Transfer From -> To */}
                  <div className="col-span-3 flex items-center gap-2 text-sm min-w-0">
                    <span className="text-white/70 truncate">
                      {entry.previousTeam?.commonName ?? "--"}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-gold/60 shrink-0" />
                    <span className="text-white/70 truncate">
                      {entry.newTeam?.commonName ?? "TBD"}
                    </span>
                    {windowStyle && (
                      <span className={`shrink-0 rounded px-1.5 py-0.5 text-xs ${windowStyle.bg} ${windowStyle.text}`}>
                        {windowStyle.label}
                      </span>
                    )}
                  </div>

                  {/* PAI Score */}
                  <div className="col-span-1 text-right">
                    {entry.paiScore != null ? (
                      <span className="text-sm font-bold text-white">{entry.paiScore.toFixed(1)}</span>
                    ) : (
                      <span className="text-white/20 text-sm">--</span>
                    )}
                  </div>

                  {/* NIL Valuation */}
                  <div className="col-span-1 text-right">
                    {entry.nilValuation ? (
                      <span className="text-sm font-bold text-white">{entry.nilValuation}</span>
                    ) : (
                      <span className="text-white/20 text-sm">--</span>
                    )}
                  </div>

                  {/* Status Badge */}
                  <div className="col-span-2 text-right">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyle.bg} ${statusStyle.text}`}
                    >
                      {statusStyle.label}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
