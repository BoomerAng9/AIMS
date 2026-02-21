// frontend/app/perform/coaching-carousel/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  RefreshCw,
  UserPlus,
  UserMinus,
  LogOut,
  Clock,
  BadgeCheck,
  ChevronDown,
  ArrowRight,
  FileText,
} from "lucide-react";
import type { CoachingChange, CoachChangeType } from "@/lib/perform/ncaa-types";
import { CHANGE_TYPE_STYLES } from "@/lib/perform/ncaa-types";

const markerFont = 'var(--font-marker), "Permanent Marker", cursive';

interface CarouselStats {
  total: number;
  hired: number;
  fired: number;
  resigned: number;
  retired: number;
}

const SEASONS = [2024, 2025, 2026];
const CHANGE_TYPES: { value: string; label: string }[] = [
  { value: "", label: "All Types" },
  { value: "HIRED", label: "Hired" },
  { value: "FIRED", label: "Fired" },
  { value: "RESIGNED", label: "Resigned" },
  { value: "RETIRED", label: "Retired" },
  { value: "INTERIM", label: "Interim" },
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

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-white/10 bg-black/60 backdrop-blur-md p-4 md:p-6 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-full bg-white/10" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 rounded bg-white/10" />
          <div className="h-3 w-1/2 rounded bg-white/5" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full rounded bg-white/5" />
        <div className="h-3 w-2/3 rounded bg-white/5" />
      </div>
    </div>
  );
}

export default function CoachingCarouselPage() {
  const [season, setSeason] = useState(2025);
  const [changeType, setChangeType] = useState("");
  const [changes, setChanges] = useState<CoachingChange[]>([]);
  const [stats, setStats] = useState<CarouselStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const params = new URLSearchParams({ season: String(season) });
        if (changeType) params.set("changeType", changeType);

        const [changesRes, statsRes] = await Promise.all([
          fetch(`/api/perform/coaching-carousel?${params}`),
          fetch(`/api/perform/coaching-carousel?${new URLSearchParams({ season: String(season), stats: "true" })}`),
        ]);

        if (changesRes.ok) {
          const data = await changesRes.json();
          setChanges(data.changes ?? data ?? []);
        }
        if (statsRes.ok) {
          const data = await statsRes.json();
          setStats(data.stats ?? data);
        }
      } catch {
        // Silently handle fetch errors — data will remain empty
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [season, changeType]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 lg:px-8">
      {/* ── Hero ──────────────────────────────────────────── */}
      <div className="text-center mb-8">
        <h1
          className="text-2xl md:text-4xl font-bold tracking-tight"
          style={{ fontFamily: markerFont }}
        >
          Coaching Carousel
        </h1>
        <p className="mt-2 text-sm md:text-base text-white/50 max-w-xl mx-auto">
          Track every head coach hiring, firing, resignation, and retirement across NCAA Division I football.
        </p>
      </div>

      {/* ── KPI Strip ────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
        <KpiCard
          label="Total Changes"
          value={stats?.total ?? 0}
          icon={<RefreshCw className="w-5 h-5" />}
          color="bg-white/10 text-white"
        />
        <KpiCard
          label="Hired"
          value={stats?.hired ?? 0}
          icon={<UserPlus className="w-5 h-5" />}
          color="bg-emerald-400/15 text-emerald-400"
        />
        <KpiCard
          label="Fired"
          value={stats?.fired ?? 0}
          icon={<UserMinus className="w-5 h-5" />}
          color="bg-red-400/15 text-red-400"
        />
        <KpiCard
          label="Resigned"
          value={stats?.resigned ?? 0}
          icon={<LogOut className="w-5 h-5" />}
          color="bg-amber-400/15 text-amber-400"
        />
        <KpiCard
          label="Retired"
          value={stats?.retired ?? 0}
          icon={<Clock className="w-5 h-5" />}
          color="bg-blue-400/15 text-blue-400"
        />
      </div>

      {/* ── Filter Bar ───────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        {/* Season Selector */}
        <div className="relative">
          <select
            value={season}
            onChange={(e) => setSeason(Number(e.target.value))}
            className="appearance-none rounded-lg border border-white/10 bg-black/60 backdrop-blur-md px-4 py-2 pr-8 text-sm text-white/80 focus:outline-none focus:border-gold/40 transition-colors cursor-pointer"
          >
            {SEASONS.map((s) => (
              <option key={s} value={s} className="bg-[#0A0A0A]">
                {s}-{s + 1} Season
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40 pointer-events-none" />
        </div>

        {/* Change Type Dropdown */}
        <div className="relative">
          <select
            value={changeType}
            onChange={(e) => setChangeType(e.target.value)}
            className="appearance-none rounded-lg border border-white/10 bg-black/60 backdrop-blur-md px-4 py-2 pr-8 text-sm text-white/80 focus:outline-none focus:border-gold/40 transition-colors cursor-pointer"
          >
            {CHANGE_TYPES.map((ct) => (
              <option key={ct.value} value={ct.value} className="bg-[#0A0A0A]">
                {ct.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40 pointer-events-none" />
        </div>

        <span className="text-xs text-white/30 ml-auto">
          {changes.length} result{changes.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* ── Cards Grid ───────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : changes.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-black/60 backdrop-blur-md p-12 text-center">
          <FileText className="w-10 h-10 text-white/20 mx-auto mb-3" />
          <p className="text-white/50 text-sm">No coaching changes found for this season and filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {changes.map((change) => {
            const style = CHANGE_TYPE_STYLES[change.changeType] ?? CHANGE_TYPE_STYLES.HIRED;

            return (
              <div
                key={change.id}
                className="rounded-xl border border-white/10 bg-black/60 backdrop-blur-md p-4 md:p-6 hover:border-white/20 transition-all"
              >
                {/* Header Row */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base md:text-lg font-bold text-white truncate">
                      {change.coachName}
                    </h3>
                    {change.previousRole && (
                      <p className="text-xs text-white/40 truncate">{change.previousRole}</p>
                    )}
                  </div>
                  <span
                    className={`shrink-0 ml-2 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${style.bg} ${style.border} ${style.text}`}
                  >
                    {style.label}
                  </span>
                </div>

                {/* From / To */}
                <div className="flex items-center gap-2 text-sm mb-3">
                  {change.previousTeam ? (
                    <span className="text-white/70">{change.previousTeam.commonName}</span>
                  ) : (
                    <span className="text-white/30 italic">--</span>
                  )}
                  <ArrowRight className="w-3.5 h-3.5 text-gold/60 shrink-0" />
                  {change.newTeam ? (
                    <span className="text-white/70">{change.newTeam.commonName}</span>
                  ) : (
                    <span className="text-white/30 italic">--</span>
                  )}
                </div>

                {/* Contract Details */}
                {(change.contractYears || change.contractValue) && (
                  <div className="flex flex-wrap gap-3 text-xs mb-3">
                    {change.contractYears && (
                      <span className="text-white/50">
                        <span className="font-bold text-white">{change.contractYears}</span> yr
                      </span>
                    )}
                    {change.contractValue && (
                      <span className="text-white/50">
                        <span className="font-bold text-white">{change.contractValue}</span>
                      </span>
                    )}
                    {change.buyout && (
                      <span className="text-white/50">
                        Buyout: <span className="font-bold text-white">{change.buyout}</span>
                      </span>
                    )}
                  </div>
                )}

                {/* Record + Verified */}
                <div className="flex items-center justify-between border-t border-white/5 pt-3">
                  {change.record ? (
                    <span className="text-xs text-white/40">
                      Record: <span className="font-semibold text-white/70">{change.record}</span>
                    </span>
                  ) : (
                    <span />
                  )}
                  {change.verified && (
                    <span className="flex items-center gap-1 text-xs text-emerald-400">
                      <BadgeCheck className="w-3.5 h-3.5" />
                      Verified
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
