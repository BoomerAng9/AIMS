// frontend/app/dashboard/workstreams/page.tsx
"use client";

import React, { useState } from "react";
import {
  GitBranch,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Play,
  ChevronRight,
  Users,
  Zap,
  BarChart3,
  Filter,
} from "lucide-react";

// ── Pipeline Stages ──

const STAGES = ["INTAKE", "SCOPE", "BUILD", "REVIEW", "DEPLOY"] as const;
type Stage = (typeof STAGES)[number];

const STAGE_META: Record<Stage, { label: string; color: string; bg: string }> = {
  INTAKE:  { label: "Intake",  color: "text-sky-400",     bg: "bg-sky-400" },
  SCOPE:   { label: "Scope",   color: "text-violet-400",  bg: "bg-violet-400" },
  BUILD:   { label: "Build",   color: "text-amber-400",   bg: "bg-amber-400" },
  REVIEW:  { label: "Review",  color: "text-orange-400",  bg: "bg-orange-400" },
  DEPLOY:  { label: "Deploy",  color: "text-emerald-400", bg: "bg-emerald-400" },
};

// ── Demo Data ──

interface Workstream {
  id: string;
  name: string;
  description: string;
  currentStage: Stage;
  stageProgress: number; // 0-100 within current stage
  pmoOffice: string;
  director: string;
  startedAt: string;
  eta: string;
  priority: "critical" | "high" | "normal" | "low";
  completedStages: Stage[];
}

const WORKSTREAMS: Workstream[] = [
  {
    id: "ws-001",
    name: "Perform Stack v2",
    description: "Sports analytics engine with real-time stat ingestion and AI commentary",
    currentStage: "BUILD",
    stageProgress: 68,
    pmoOffice: "CTO Office",
    director: "Engineer_Ang",
    startedAt: "2026-01-15",
    eta: "2026-02-28",
    priority: "critical",
    completedStages: ["INTAKE", "SCOPE"],
  },
  {
    id: "ws-002",
    name: "LUC Billing Dashboard",
    description: "Real-time usage metering UI with Stripe integration and cost projections",
    currentStage: "REVIEW",
    stageProgress: 40,
    pmoOffice: "CFO Office",
    director: "Analyst_Ang",
    startedAt: "2026-01-22",
    eta: "2026-02-14",
    priority: "high",
    completedStages: ["INTAKE", "SCOPE", "BUILD"],
  },
  {
    id: "ws-003",
    name: "Remotion Video Pipeline",
    description: "Automated video generation with Remotion + AI narration for marketing assets",
    currentStage: "SCOPE",
    stageProgress: 85,
    pmoOffice: "CMO Office",
    director: "Marketer_Ang",
    startedAt: "2026-02-01",
    eta: "2026-03-15",
    priority: "normal",
    completedStages: ["INTAKE"],
  },
  {
    id: "ws-004",
    name: "OpenClaw Sandbox Hardening",
    description: "Network isolation, resource limits, and audit logging for code execution sandbox",
    currentStage: "DEPLOY",
    stageProgress: 90,
    pmoOffice: "COO Office",
    director: "Quality_Ang",
    startedAt: "2026-01-10",
    eta: "2026-02-10",
    priority: "high",
    completedStages: ["INTAKE", "SCOPE", "BUILD", "REVIEW"],
  },
  {
    id: "ws-005",
    name: "n8n Workflow Marketplace",
    description: "Community workflow templates with one-click import and ACHEEVY orchestration",
    currentStage: "INTAKE",
    stageProgress: 30,
    pmoOffice: "CPO Office",
    director: "Chicken_Hawk",
    startedAt: "2026-02-05",
    eta: "2026-04-01",
    priority: "low",
    completedStages: [],
  },
  {
    id: "ws-006",
    name: "Design System Unification",
    description: "Glass-morphism component library with wave brand pattern and Figma tokens",
    currentStage: "BUILD",
    stageProgress: 35,
    pmoOffice: "CDO Office",
    director: "Engineer_Ang",
    startedAt: "2026-02-03",
    eta: "2026-03-01",
    priority: "normal",
    completedStages: ["INTAKE", "SCOPE"],
  },
];

// ── Helpers ──

function stageIndex(stage: Stage): number {
  return STAGES.indexOf(stage);
}

function overallProgress(ws: Workstream): number {
  const completed = ws.completedStages.length;
  const currentFraction = ws.stageProgress / 100;
  return Math.round(((completed + currentFraction) / STAGES.length) * 100);
}

const PRIORITY_STYLES: Record<string, { dot: string; label: string; text: string }> = {
  critical: { dot: "bg-red-400 animate-pulse", label: "CRITICAL", text: "text-red-400" },
  high:     { dot: "bg-orange-400", label: "HIGH", text: "text-orange-400" },
  normal:   { dot: "bg-amber-300", label: "NORMAL", text: "text-amber-300" },
  low:      { dot: "bg-white/30", label: "LOW", text: "text-white/50" },
};

// ── Component ──

export default function WorkstreamsPage() {
  const [filter, setFilter] = useState<"all" | Stage>("all");

  const filtered =
    filter === "all"
      ? WORKSTREAMS
      : WORKSTREAMS.filter((ws) => ws.currentStage === filter);

  const metrics = {
    total: WORKSTREAMS.length,
    inBuild: WORKSTREAMS.filter((w) => w.currentStage === "BUILD").length,
    inReview: WORKSTREAMS.filter((w) => w.currentStage === "REVIEW").length,
    deployed: WORKSTREAMS.filter((w) => w.currentStage === "DEPLOY").length,
  };

  return (
    <div className="animate-in fade-in duration-700 space-y-6">
      {/* ── Header ── */}
      <header>
        <p className="text-[10px] uppercase tracking-[0.3em] text-amber-200/50 mb-1">
          Pipeline &amp; Delivery
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-amber-50 font-display">
          WORKSTREAMS
        </h1>
        <p className="mt-1 text-sm text-amber-100/50">
          Track every project from intake to deployment across all PMO offices.
        </p>
      </header>

      {/* ── Metrics Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Active Workstreams", value: metrics.total, icon: GitBranch, accent: "text-amber-300" },
          { label: "In Build", value: metrics.inBuild, icon: Zap, accent: "text-amber-400" },
          { label: "In Review", value: metrics.inReview, icon: Clock, accent: "text-orange-400" },
          { label: "Ready to Deploy", value: metrics.deployed, icon: CheckCircle2, accent: "text-emerald-400" },
        ].map((m) => (
          <div
            key={m.label}
            className="rounded-2xl border border-white/10 bg-black/60 p-4 backdrop-blur-2xl"
          >
            <div className="flex items-center gap-2 mb-2">
              <m.icon size={14} className={m.accent} />
              <p className="text-[10px] uppercase tracking-wider text-amber-100/40">
                {m.label}
              </p>
            </div>
            <p className="text-2xl font-bold text-amber-50 font-display">{m.value}</p>
          </div>
        ))}
      </div>

      {/* ── Pipeline Stage Header ── */}
      <div className="rounded-2xl border border-white/10 bg-black/60 p-4 backdrop-blur-2xl">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 size={14} className="text-amber-300/70" />
          <p className="text-[10px] uppercase tracking-[0.2em] text-amber-200/60">
            Pipeline Stages
          </p>
        </div>
        <div className="flex items-center justify-between">
          {STAGES.map((stage, i) => {
            const meta = STAGE_META[stage];
            const count = WORKSTREAMS.filter((w) => w.currentStage === stage).length;
            return (
              <React.Fragment key={stage}>
                <button
                  onClick={() => setFilter(filter === stage ? "all" : stage)}
                  className={`flex flex-col items-center gap-1.5 px-3 py-2 rounded-xl transition-all ${
                    filter === stage
                      ? "bg-white/10 border border-white/20"
                      : "hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full ${meta.bg} ${
                    count > 0 ? "shadow-[0_0_10px_currentColor]" : "opacity-30"
                  }`} />
                  <span className={`text-[10px] font-mono uppercase tracking-wider ${meta.color}`}>
                    {meta.label}
                  </span>
                  <span className="text-xs font-bold text-amber-50">{count}</span>
                </button>
                {i < STAGES.length - 1 && (
                  <ChevronRight size={14} className="text-white/15 flex-shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className="flex items-center gap-3">
        <Filter size={13} className="text-amber-100/40" />
        <button
          onClick={() => setFilter("all")}
          className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
            filter === "all"
              ? "border-amber-300/30 bg-amber-300/10 text-amber-300"
              : "border-white/10 text-white/50 hover:text-white/80"
          }`}
        >
          All ({WORKSTREAMS.length})
        </button>
        {STAGES.map((stage) => {
          const count = WORKSTREAMS.filter((w) => w.currentStage === stage).length;
          if (count === 0) return null;
          return (
            <button
              key={stage}
              onClick={() => setFilter(filter === stage ? "all" : stage)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                filter === stage
                  ? "border-amber-300/30 bg-amber-300/10 text-amber-300"
                  : "border-white/10 text-white/50 hover:text-white/80"
              }`}
            >
              {STAGE_META[stage].label} ({count})
            </button>
          );
        })}
      </div>

      {/* ── Workstream Cards ── */}
      <div className="space-y-4">
        {filtered.map((ws) => {
          const progress = overallProgress(ws);
          const currentMeta = STAGE_META[ws.currentStage];
          const priorityStyle = PRIORITY_STYLES[ws.priority];

          return (
            <div
              key={ws.id}
              className="rounded-3xl border border-white/10 bg-black/60 backdrop-blur-2xl overflow-hidden transition-all hover:border-amber-300/20"
            >
              {/* Card Header */}
              <div className="p-5 pb-0">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-semibold text-amber-50">{ws.name}</h3>
                      <span className={`flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider ${priorityStyle.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${priorityStyle.dot}`} />
                        {priorityStyle.label}
                      </span>
                    </div>
                    <p className="text-xs text-amber-100/50 leading-relaxed">{ws.description}</p>
                  </div>
                  <div className="text-right ml-4 flex-shrink-0">
                    <p className="text-2xl font-bold text-amber-50 font-display">{progress}%</p>
                    <p className="text-[9px] text-amber-100/30 uppercase tracking-wider">Complete</p>
                  </div>
                </div>

                {/* Meta Row */}
                <div className="flex flex-wrap items-center gap-4 text-[10px] text-amber-100/40 mb-4">
                  <span className="flex items-center gap-1.5">
                    <Users size={10} />
                    {ws.director} &middot; {ws.pmoOffice}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Play size={10} />
                    Started {ws.startedAt}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock size={10} />
                    ETA {ws.eta}
                  </span>
                  <span className={`flex items-center gap-1.5 ${currentMeta.color}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${currentMeta.bg} animate-pulse`} />
                    {currentMeta.label} — {ws.stageProgress}%
                  </span>
                </div>
              </div>

              {/* Pipeline Progress Bar */}
              <div className="px-5 pb-5">
                <div className="flex items-center gap-1">
                  {STAGES.map((stage, i) => {
                    const si = stageIndex(stage);
                    const ci = stageIndex(ws.currentStage);
                    const meta = STAGE_META[stage];
                    const isComplete = si < ci;
                    const isCurrent = si === ci;
                    const isFuture = si > ci;

                    return (
                      <React.Fragment key={stage}>
                        {/* Stage segment */}
                        <div className="flex-1 relative">
                          <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ${
                                isComplete
                                  ? `${meta.bg} opacity-80`
                                  : isCurrent
                                  ? `${meta.bg} opacity-60`
                                  : ""
                              }`}
                              style={{
                                width: isComplete
                                  ? "100%"
                                  : isCurrent
                                  ? `${ws.stageProgress}%`
                                  : "0%",
                              }}
                            />
                          </div>
                          <div className="flex items-center justify-between mt-1.5">
                            <span
                              className={`text-[8px] font-mono uppercase tracking-wider ${
                                isComplete
                                  ? "text-white/40"
                                  : isCurrent
                                  ? meta.color
                                  : "text-white/15"
                              }`}
                            >
                              {meta.label}
                            </span>
                            {isComplete && (
                              <CheckCircle2 size={9} className="text-emerald-400/60" />
                            )}
                            {isCurrent && (
                              <span className={`w-1.5 h-1.5 rounded-full ${meta.bg} animate-pulse`} />
                            )}
                          </div>
                        </div>
                        {i < STAGES.length - 1 && (
                          <ChevronRight
                            size={10}
                            className={`flex-shrink-0 mx-0.5 ${
                              isFuture ? "text-white/8" : "text-white/20"
                            }`}
                          />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Empty State ── */}
      {filtered.length === 0 && (
        <div className="rounded-3xl border border-white/5 bg-black/40 p-12 text-center">
          <AlertTriangle size={32} className="mx-auto text-amber-300/30 mb-3" />
          <p className="text-sm text-amber-100/50">No workstreams in this stage.</p>
          <button
            onClick={() => setFilter("all")}
            className="mt-3 text-xs text-amber-300/70 hover:text-amber-300 transition-colors"
          >
            Show all workstreams
          </button>
        </div>
      )}

      {/* ── Footer ── */}
      <div className="text-center pt-2 pb-4">
        <p className="text-[9px] font-mono text-white/15 uppercase tracking-[0.2em]">
          A.I.M.S. Workstream Pipeline &bull; {WORKSTREAMS.length} active streams
        </p>
      </div>
    </div>
  );
}
