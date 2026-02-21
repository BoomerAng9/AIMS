// frontend/app/perform/nil-tracker/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Minus,
  BadgeCheck,
  Trophy,
  Briefcase,
  Users,
  FileText,
} from "lucide-react";
import type {
  NilDeal,
  NilTeamRanking,
  NilDealType,
} from "@/lib/perform/ncaa-types";
import { NIL_DEAL_TYPE_STYLES } from "@/lib/perform/ncaa-types";

const markerFont = 'var(--font-marker), "Permanent Marker", cursive';

type TabId = "team-rankings" | "top-deals" | "player-rankings";

interface NilPlayerRanking {
  id: string;
  rank: number;
  playerName: string;
  position?: string;
  team?: { id: string; schoolName: string; commonName: string };
  totalNilValue: number;
  dealCount: number;
  season: number;
}

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "team-rankings", label: "Team Rankings", icon: <Trophy className="w-4 h-4" /> },
  { id: "top-deals", label: "Top Deals", icon: <Briefcase className="w-4 h-4" /> },
  { id: "player-rankings", label: "Player Rankings", icon: <Users className="w-4 h-4" /> },
];

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toLocaleString()}`;
}

function TrendIcon({ trend }: { trend: string }) {
  if (trend === "UP") return <TrendingUp className="w-4 h-4 text-emerald-400" />;
  if (trend === "DOWN") return <TrendingDown className="w-4 h-4 text-red-400" />;
  return <Minus className="w-4 h-4 text-white/30" />;
}

function SkeletonTable() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-14 rounded-lg bg-white/5 animate-pulse" />
      ))}
    </div>
  );
}

function SkeletonCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-white/10 bg-black/60 p-5 animate-pulse">
          <div className="h-4 w-2/3 rounded bg-white/10 mb-3" />
          <div className="h-3 w-1/2 rounded bg-white/5 mb-2" />
          <div className="h-6 w-1/3 rounded bg-white/10" />
        </div>
      ))}
    </div>
  );
}

export default function NilTrackerPage() {
  const [activeTab, setActiveTab] = useState<TabId>("team-rankings");
  const [teamRankings, setTeamRankings] = useState<NilTeamRanking[]>([]);
  const [topDeals, setTopDeals] = useState<NilDeal[]>([]);
  const [playerRankings, setPlayerRankings] = useState<NilPlayerRanking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        let endpoint = "/api/perform/nil?view=";
        if (activeTab === "team-rankings") {
          endpoint += "team-rankings";
          const res = await fetch(endpoint);
          if (res.ok) {
            const data = await res.json();
            setTeamRankings(data.rankings ?? data ?? []);
          }
        } else if (activeTab === "top-deals") {
          endpoint += "top-deals";
          const res = await fetch(endpoint);
          if (res.ok) {
            const data = await res.json();
            setTopDeals(data.deals ?? data ?? []);
          }
        } else {
          endpoint += "player-rankings";
          const res = await fetch(endpoint);
          if (res.ok) {
            const data = await res.json();
            setPlayerRankings(data.rankings ?? data ?? []);
          }
        }
      } catch {
        // Silently handle fetch errors
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [activeTab]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 lg:px-8">
      {/* ── Hero ──────────────────────────────────────────── */}
      <div className="text-center mb-8">
        <h1
          className="text-2xl md:text-4xl font-bold tracking-tight"
          style={{ fontFamily: markerFont }}
        >
          NIL Rankings &amp; Tracker
        </h1>
        <p className="mt-2 text-sm md:text-base text-white/50 max-w-xl mx-auto">
          Comprehensive Name, Image &amp; Likeness data across NCAA D1 football. Team totals, top deals, and player rankings.
        </p>
      </div>

      {/* ── Tab Switcher ─────────────────────────────────── */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-gold/15 text-gold border border-gold/30"
                : "text-white/50 hover:text-white/80 hover:bg-white/5 border border-transparent"
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── Team Rankings Tab ────────────────────────────── */}
      {activeTab === "team-rankings" && (
        <>
          {loading ? (
            <SkeletonTable />
          ) : teamRankings.length === 0 ? (
            <EmptyState message="No team ranking data available." />
          ) : (
            <div className="rounded-xl border border-white/10 bg-black/60 backdrop-blur-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="p-3 md:p-4 text-left text-xs uppercase tracking-wider text-white/30 w-16">Rank</th>
                      <th className="p-3 md:p-4 text-left text-xs uppercase tracking-wider text-white/30">Team</th>
                      <th className="p-3 md:p-4 text-right text-xs uppercase tracking-wider text-white/30">Total NIL</th>
                      <th className="p-3 md:p-4 text-right text-xs uppercase tracking-wider text-white/30">Avg/Player</th>
                      <th className="p-3 md:p-4 text-right text-xs uppercase tracking-wider text-white/30">Top Deal</th>
                      <th className="p-3 md:p-4 text-center text-xs uppercase tracking-wider text-white/30">Deals</th>
                      <th className="p-3 md:p-4 text-center text-xs uppercase tracking-wider text-white/30 w-16">Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamRankings.map((team, idx) => (
                      <tr
                        key={team.id}
                        className="border-t border-white/5 hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="p-3 md:p-4">
                          <span
                            className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${
                              idx < 3
                                ? "bg-gold/15 text-gold border border-gold/30"
                                : "bg-white/5 text-white/50"
                            }`}
                          >
                            {team.rank}
                          </span>
                        </td>
                        <td className="p-3 md:p-4">
                          <div>
                            <p className="text-sm font-bold text-white">{team.team.commonName}</p>
                            <p className="text-xs text-white/40">{team.team.schoolName}</p>
                          </div>
                        </td>
                        <td className="p-3 md:p-4 text-right">
                          <span className="text-sm font-bold text-white">
                            {formatCurrency(team.totalNilValue)}
                          </span>
                        </td>
                        <td className="p-3 md:p-4 text-right">
                          <span className="text-sm text-white/70">
                            {formatCurrency(team.avgPerPlayer)}
                          </span>
                        </td>
                        <td className="p-3 md:p-4 text-right">
                          <span className="text-sm font-bold text-gold">
                            {formatCurrency(team.topDealValue)}
                          </span>
                        </td>
                        <td className="p-3 md:p-4 text-center">
                          <span className="text-sm text-white/70">{team.dealCount}</span>
                        </td>
                        <td className="p-3 md:p-4 text-center">
                          <div className="flex items-center justify-center">
                            <TrendIcon trend={team.trend} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Top Deals Tab ────────────────────────────────── */}
      {activeTab === "top-deals" && (
        <>
          {loading ? (
            <SkeletonCards />
          ) : topDeals.length === 0 ? (
            <EmptyState message="No NIL deals found." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {topDeals.map((deal) => {
                const dealStyle = NIL_DEAL_TYPE_STYLES[deal.dealType] ?? NIL_DEAL_TYPE_STYLES.OTHER;

                return (
                  <div
                    key={deal.id}
                    className="rounded-xl border border-white/10 bg-black/60 backdrop-blur-md p-4 md:p-6 hover:border-white/20 transition-all"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-bold text-white truncate">{deal.playerName}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          {deal.team && (
                            <span className="text-xs text-white/40">{deal.team.commonName}</span>
                          )}
                          {deal.position && (
                            <span className="text-xs text-gold/60 bg-gold/10 rounded px-1 py-0.5">{deal.position}</span>
                          )}
                        </div>
                      </div>
                      <span className={`shrink-0 ml-2 rounded-full px-2.5 py-0.5 text-xs font-semibold ${dealStyle.bg} ${dealStyle.text}`}>
                        {dealStyle.label}
                      </span>
                    </div>

                    {/* Brand */}
                    {deal.brandOrCollective && (
                      <div className="mb-3">
                        <p className="text-xs text-white/40 uppercase tracking-wider">Brand / Collective</p>
                        <p className="text-sm font-semibold text-white/80">{deal.brandOrCollective}</p>
                      </div>
                    )}

                    {/* Value */}
                    <div className="flex items-baseline gap-2 mb-3">
                      <DollarSign className="w-4 h-4 text-gold" />
                      <span className="text-2xl font-bold text-white">
                        {deal.estimatedValue ? formatCurrency(deal.estimatedValue) : "Undisclosed"}
                      </span>
                    </div>

                    {/* Meta Row */}
                    <div className="flex items-center justify-between border-t border-white/5 pt-3 text-xs">
                      <div className="flex items-center gap-3">
                        {deal.duration && (
                          <span className="text-white/40">
                            Duration: <span className="text-white/70">{deal.duration}</span>
                          </span>
                        )}
                      </div>
                      {deal.verified && (
                        <span className="flex items-center gap-1 text-emerald-400">
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
        </>
      )}

      {/* ── Player Rankings Tab ──────────────────────────── */}
      {activeTab === "player-rankings" && (
        <>
          {loading ? (
            <SkeletonTable />
          ) : playerRankings.length === 0 ? (
            <EmptyState message="No player ranking data available." />
          ) : (
            <div className="rounded-xl border border-white/10 bg-black/60 backdrop-blur-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="p-3 md:p-4 text-left text-xs uppercase tracking-wider text-white/30 w-16">Rank</th>
                      <th className="p-3 md:p-4 text-left text-xs uppercase tracking-wider text-white/30">Player</th>
                      <th className="p-3 md:p-4 text-left text-xs uppercase tracking-wider text-white/30">Team</th>
                      <th className="p-3 md:p-4 text-center text-xs uppercase tracking-wider text-white/30">Pos</th>
                      <th className="p-3 md:p-4 text-right text-xs uppercase tracking-wider text-white/30">Total NIL</th>
                      <th className="p-3 md:p-4 text-center text-xs uppercase tracking-wider text-white/30">Deals</th>
                    </tr>
                  </thead>
                  <tbody>
                    {playerRankings.map((player, idx) => (
                      <tr
                        key={player.id}
                        className="border-t border-white/5 hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="p-3 md:p-4">
                          <span
                            className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${
                              idx < 3
                                ? "bg-gold/15 text-gold border border-gold/30"
                                : "bg-white/5 text-white/50"
                            }`}
                          >
                            {player.rank}
                          </span>
                        </td>
                        <td className="p-3 md:p-4">
                          <p className="text-sm font-bold text-white">{player.playerName}</p>
                        </td>
                        <td className="p-3 md:p-4">
                          <p className="text-sm text-white/70">
                            {player.team?.commonName ?? "--"}
                          </p>
                        </td>
                        <td className="p-3 md:p-4 text-center">
                          {player.position ? (
                            <span className="text-xs font-semibold text-gold/80 bg-gold/10 rounded px-1.5 py-0.5">
                              {player.position}
                            </span>
                          ) : (
                            <span className="text-white/20">--</span>
                          )}
                        </td>
                        <td className="p-3 md:p-4 text-right">
                          <span className="text-sm font-bold text-white">
                            {formatCurrency(player.totalNilValue)}
                          </span>
                        </td>
                        <td className="p-3 md:p-4 text-center">
                          <span className="text-sm text-white/70">{player.dealCount}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/60 backdrop-blur-md p-12 text-center">
      <FileText className="w-10 h-10 text-white/20 mx-auto mb-3" />
      <p className="text-white/50 text-sm">{message}</p>
    </div>
  );
}
