// frontend/app/dashboard/plugs/page.tsx
"use client";

import React from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Circle,
  Eye,
  Layers,
  MoreVertical,
  Pause,
  Plus,
  Rocket,
  Server,
  ShoppingCart,
  Settings,
  Users,
  Layout,
  Store,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types & Data                                                       */
/* ------------------------------------------------------------------ */

type PlugStatus = "live" | "building" | "review" | "ready" | "deployed";

interface Plug {
  id: string;
  name: string;
  archetype: string;
  status: PlugStatus;
  domain?: string;
  requests?: number;
  uptime?: number;
  stage?: string;
  progress?: number;
}

const PLUGS: Plug[] = [
  {
    id: "plug-001",
    name: "RealtyVision CRM",
    archetype: "CRM",
    status: "live",
    domain: "realtyvision.com",
    requests: 1247,
    uptime: 99.9,
  },
  {
    id: "plug-002",
    name: "FitTrack Pro",
    archetype: "SaaS",
    status: "building",
    stage: "BUILD",
    progress: 65,
  },
  {
    id: "plug-003",
    name: "LegalDocs Hub",
    archetype: "Internal Tool",
    status: "review",
    stage: "REVIEW",
  },
  {
    id: "plug-004",
    name: "ArtisanMarket",
    archetype: "Marketplace",
    status: "ready",
    stage: "DEPLOY",
  },
  {
    id: "plug-005",
    name: "PortfolioX",
    archetype: "Portfolio",
    status: "deployed",
    domain: "portfoliox.dev",
    requests: 423,
    uptime: 100,
  },
];

const STATUS_CONFIG: Record<
  PlugStatus,
  { label: string; color: string; dot: string; bg: string }
> = {
  live: {
    label: "Live",
    color: "text-emerald-400",
    dot: "bg-emerald-400 animate-pulse",
    bg: "border-emerald-400/20 bg-emerald-500/5",
  },
  building: {
    label: "Building",
    color: "text-blue-400",
    dot: "bg-blue-400 animate-pulse",
    bg: "border-blue-400/20 bg-blue-500/5",
  },
  review: {
    label: "In Review",
    color: "text-amber-400",
    dot: "bg-amber-400",
    bg: "border-amber-400/20 bg-amber-500/5",
  },
  ready: {
    label: "Ready",
    color: "text-violet-400",
    dot: "bg-violet-400",
    bg: "border-violet-400/20 bg-violet-500/5",
  },
  deployed: {
    label: "Deployed",
    color: "text-emerald-400",
    dot: "bg-emerald-400",
    bg: "border-emerald-400/20 bg-emerald-500/5",
  },
};

const ARCHETYPE_ICON: Record<string, React.ElementType> = {
  CRM: Users,
  SaaS: Layers,
  "Internal Tool": Settings,
  Marketplace: Store,
  Portfolio: Layout,
  "E-commerce": ShoppingCart,
};

const PIPELINE_STAGES = ["INTAKE", "SCOPE", "BUILD", "REVIEW", "DEPLOY"];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function PlugsPage() {
  const liveCount = PLUGS.filter(
    (p) => p.status === "live" || p.status === "deployed"
  ).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-amber-200/50 mb-1">
            Plug Management
          </p>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-amber-50 font-display">
              YOUR PLUGS
            </h1>
            <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-amber-400/10 border border-amber-400/20 px-2 text-[10px] font-bold text-amber-300">
              {PLUGS.length}
            </span>
          </div>
          <p className="mt-1 text-sm text-amber-100/50">
            Manage, monitor, and deploy your active Plugs.
          </p>
        </div>
        <Link
          href="/dashboard/build"
          className="flex items-center gap-2 rounded-full bg-amber-400 px-6 py-3 text-sm font-bold text-black shadow-[0_0_20px_rgba(251,191,36,0.3)] transition-all hover:scale-105 active:scale-95"
        >
          <Plus size={16} />
          Build New Plug
        </Link>
      </header>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "Total Plugs",
            value: PLUGS.length,
            color: "text-amber-50",
          },
          { label: "Live", value: liveCount, color: "text-emerald-400" },
          {
            label: "Building",
            value: PLUGS.filter((p) => p.status === "building").length,
            color: "text-blue-400",
          },
          {
            label: "Total Requests",
            value: PLUGS.reduce((s, p) => s + (p.requests || 0), 0).toLocaleString(),
            color: "text-amber-200",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-white/10 bg-black/60 p-4 backdrop-blur-2xl text-center"
          >
            <p className="text-[10px] uppercase tracking-widest text-amber-100/40">
              {stat.label}
            </p>
            <p className={`text-2xl font-semibold mt-1 ${stat.color}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Plug Cards */}
      <div className="space-y-4">
        {PLUGS.map((plug) => {
          const status = STATUS_CONFIG[plug.status];
          const ArchetypeIcon = ARCHETYPE_ICON[plug.archetype] || Layers;

          return (
            <div
              key={plug.id}
              className="group relative overflow-hidden rounded-3xl border border-white/10 bg-black/60 p-6 backdrop-blur-2xl transition-all hover:border-amber-300/20 hover:bg-black/80"
            >
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                {/* Icon + Name */}
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/5 text-amber-200 group-hover:bg-amber-300 group-hover:text-black transition-colors">
                    <ArchetypeIcon size={22} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-amber-50 truncate">
                        {plug.name}
                      </h3>
                      <span className="shrink-0 rounded-full border border-white/5 bg-white/5 px-2.5 py-0.5 text-[9px] font-medium text-amber-100/60 uppercase tracking-wider">
                        {plug.archetype}
                      </span>
                    </div>
                    <p className="text-[10px] text-amber-100/30 font-mono mt-0.5">
                      {plug.id}
                    </p>
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center gap-6 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${status.dot}`} />
                    <span
                      className={`text-[10px] uppercase font-bold tracking-wider ${status.color}`}
                    >
                      {status.label}
                    </span>
                  </div>

                  {/* Building Progress */}
                  {plug.status === "building" && plug.progress !== undefined && (
                    <div className="flex items-center gap-3 min-w-[160px]">
                      <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-blue-400 transition-all"
                          style={{ width: `${plug.progress}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-blue-400">
                        {plug.progress}%
                      </span>
                    </div>
                  )}

                  {/* Stage Badge */}
                  {plug.stage && (
                    <div className="flex items-center gap-1">
                      {PIPELINE_STAGES.map((stage, i) => {
                        const stageIndex = PIPELINE_STAGES.indexOf(
                          plug.stage || ""
                        );
                        return (
                          <div
                            key={stage}
                            className={`h-1.5 w-4 rounded-full transition-all ${
                              i <= stageIndex
                                ? i === stageIndex
                                  ? "bg-amber-400"
                                  : "bg-emerald-400/60"
                                : "bg-white/10"
                            }`}
                            title={stage}
                          />
                        );
                      })}
                      <span className="ml-1.5 text-[9px] font-mono text-amber-100/40">
                        {plug.stage}
                      </span>
                    </div>
                  )}

                  {/* Live Stats */}
                  {(plug.status === "live" || plug.status === "deployed") && (
                    <div className="flex items-center gap-4">
                      {plug.domain && (
                        <a
                          href={`https://${plug.domain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[10px] text-amber-200/60 hover:text-amber-200 transition-colors"
                        >
                          {plug.domain}
                          <ArrowUpRight size={10} />
                        </a>
                      )}
                      <div className="flex items-center gap-1.5">
                        <Activity size={10} className="text-amber-100/30" />
                        <span className="text-[10px] text-amber-100/50 font-mono">
                          {plug.requests?.toLocaleString()} req
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Server size={10} className="text-amber-100/30" />
                        <span className="text-[10px] text-emerald-400 font-mono">
                          {plug.uptime}% up
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 ml-auto">
                    <Link
                      href={`/dashboard/plugs/${plug.id}`}
                      className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-medium text-amber-100/60 transition-all hover:border-amber-300/30 hover:text-amber-50"
                    >
                      <Eye size={12} /> View
                    </Link>
                    {(plug.status === "ready" || plug.status === "review") && (
                      <button className="flex items-center gap-1.5 rounded-xl bg-amber-400/10 border border-amber-400/20 px-3 py-2 text-[10px] font-bold text-amber-300 transition-all hover:bg-amber-400 hover:text-black">
                        <Rocket size={12} /> Deploy
                      </button>
                    )}
                    {(plug.status === "live" || plug.status === "deployed") && (
                      <button className="flex items-center gap-1.5 rounded-xl border border-red-400/20 bg-red-400/5 px-3 py-2 text-[10px] font-medium text-red-400/60 transition-all hover:bg-red-400/10 hover:text-red-400">
                        <Pause size={12} /> Stop
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State / Build CTA */}
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-black/20 p-10 text-center transition-all hover:border-amber-300/20 group">
        <div className="flex h-14 w-14 items-center justify-center rounded-full border border-dashed border-white/20 text-amber-100/30 group-hover:border-amber-300/40 group-hover:text-amber-300 transition-all">
          <Plus size={24} />
        </div>
        <p className="mt-4 text-sm font-semibold text-amber-200/50 group-hover:text-amber-200 transition-colors">
          Build Another Plug
        </p>
        <p className="mt-1 text-xs text-amber-100/30 max-w-sm">
          Use the Build Wizard to create a new Plug from a template or start a custom build.
        </p>
        <Link
          href="/dashboard/build"
          className="mt-4 flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-5 py-2 text-xs font-medium text-amber-200/60 transition-all hover:bg-amber-300 hover:text-black hover:border-amber-300"
        >
          Open Build Wizard <ArrowRight size={12} />
        </Link>
      </div>
    </div>
  );
}
