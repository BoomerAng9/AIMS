// frontend/app/dashboard/workstreams/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/motion/variants";
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
  ArrowRight,
} from "lucide-react";

// ── Pipeline Stages ──

const STAGES = ["INTAKE", "SCOPE", "BUILD", "REVIEW", "DEPLOY"] as const;
type Stage = (typeof STAGES)[number];

const STAGE_META: Record<Stage, { label: string; color: string; bg: string }> = {
  INTAKE:  { label: "Intake",  color: "text-sky-400",     bg: "bg-sky-400" },
  SCOPE:   { label: "Scope",   color: "text-violet-400",  bg: "bg-violet-400" },
  BUILD:   { label: "Build",   color: "text-gold",        bg: "bg-gold" },
  REVIEW:  { label: "Review",  color: "text-orange-400",  bg: "bg-orange-400" },
  DEPLOY:  { label: "Deploy",  color: "text-emerald-400", bg: "bg-emerald-400" },
};

// ── Types ──

interface Workstream {
  id: string;
  name: string;
  description: string;
  currentStage: Stage;
  stageProgress: number;
  pmoOffice: string;
  director: string;
  startedAt: string;
  eta: string;
  priority: "critical" | "high" | "normal" | "low";
  completedStages: Stage[];
}

// ── Helpers ──

function stageIndex(stage: Stage): number {
  return STAGES.indexOf(stage);
}

function normalizeStage(raw?: string): Stage {
  if (!raw) return "INTAKE";
  const upper = raw.toUpperCase();
  if (STAGES.includes(upper as Stage)) return upper as Stage;
  if (upper === "BUILDING" || upper === "IN_PROGRESS") return "BUILD";
  if (upper === "COMPLETED" || upper === "DEPLOYED" || upper === "LIVE") return "DEPLOY";
  if (upper === "PENDING" || upper === "NEW") return "INTAKE";
  return "INTAKE";
}

function computeCompletedStages(currentStage: Stage): Stage[] {
  const ci = stageIndex(currentStage);
  return STAGES.slice(0, ci) as unknown as Stage[];
}

function overallProgress(ws: Workstream): number {
  const completed = ws.completedStages.length;
  const currentFraction = ws.stageProgress / 100;
  return Math.round(((completed + currentFraction) / STAGES.length) * 100);
}

const PRIORITY_STYLES: Record<string, { dot: string; label: string; text: string }> = {
  critical: { dot: "bg-red-400 animate-pulse", label: "CRITICAL", text: "text-red-400" },
  high:     { dot: "bg-orange-400", label: "HIGH", text: "text-orange-400" },
  normal:   { dot: "bg-gold/70", label: "NORMAL", text: "text-gold/70" },
  low:      { dot: "bg-white/30", label: "LOW", text: "text-white/50" },
};

// ── Component ──

export default function WorkstreamsPage() {
  const [workstreams, setWorkstreams] = useState<Workstream[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | Stage>("all");

  useEffect(() => {
    fetch("/api/projects")
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status}`);
        return res.json();
      })
      .then((data) => {
        const items = Array.isArray(data) ? data : data.projects || [];
        const normalized: Workstream[] = items.map((item: Record<string, unknown>) => {
          const currentStage = normalizeStage((item.stage || item.status || item.currentStage) as string);
          return {
            id: item.id || `ws-${Math.random().toString(36).slice(2, 8)}`,
            name: (item.name || item.title || "Untitled Workstream") as string,
            description: (item.description || item.objective || "") as string,
            currentStage,
            stageProgress: (item.stageProgress || item.progress || 50) as number,
            pmoOffice: (item.pmoOffice || "CTO Office") as string,
            director: (item.director || "ACHEEVY") as string,
            startedAt: (item.startedAt || item.createdAt || new Date().toISOString().slice(0, 10)) as string,
            eta: (item.eta || "") as string,
            priority: (item.priority || "normal") as Workstream["priority"],
            completedStages: (item.completedStages as Stage[]) || computeCompletedStages(currentStage),
          };
        });
        setWorkstreams(normalized);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered =
    filter === "all"
      ? workstreams
      : workstreams.filter((ws) => ws.currentStage === filter);

  const metrics = {
    total: workstreams.length,
    inBuild: workstreams.filter((w) => w.currentStage === "BUILD").length,
    inReview: workstreams.filter((w) => w.currentStage === "REVIEW").length,
    deployed: workstreams.filter((w) => w.currentStage === "DEPLOY").length,
  };

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <header>
        <p className="text-[0.6rem] uppercase tracking-[0.25em] text-gold/50 mb-1 font-mono">
          Pipeline &amp; Delivery
        </p>
        <h1 className="text-2xl md:text-3xl font-display uppercase tracking-wider text-white">
          Workstreams
        </h1>
        <p className="mt-1 text-xs text-white/40">
          Track every project from intake to deployment across all PMO offices.
        </p>
      </header>

      {/* ── Metrics Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Active Workstreams", value: metrics.total, icon: GitBranch, accent: "text-gold" },
          { label: "In Build", value: metrics.inBuild, icon: Zap, accent: "text-gold" },
          { label: "In Review", value: metrics.inReview, icon: Clock, accent: "text-orange-400" },
          { label: "Ready to Deploy", value: metrics.deployed, icon: CheckCircle2, accent: "text-emerald-400" },
        ].map((m) => (
          <div key={m.label} className="wireframe-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <m.icon size={14} className={m.accent} />
              <p className="text-[0.55rem] uppercase tracking-widest text-white/30 font-mono">
                {m.label}
              </p>
            </div>
            <p className="text-xl font-display text-white">{m.value}</p>
          </div>
        ))}
      </div>

      {/* ── Pipeline Stage Header ── */}
      <div className="wireframe-card p-4">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 size={14} className="text-gold/70" />
          <p className="text-[0.55rem] uppercase tracking-[0.2em] text-white/40 font-mono">
            Pipeline Stages
          </p>
        </div>
        <div className="flex items-center justify-between">
          {STAGES.map((stage, i) => {
            const meta = STAGE_META[stage];
            const count = workstreams.filter((w) => w.currentStage === stage).length;
            return (
              <React.Fragment key={stage}>
                <button
                  type="button"
                  onClick={() => setFilter(filter === stage ? "all" : stage)}
                  className={`flex flex-col items-center gap-1.5 px-3 py-2 rounded-xl transition-all ${
                    filter === stage
                      ? "bg-gold/10 border border-gold/20"
                      : "hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full ${meta.bg} ${
                    count > 0 ? "shadow-[0_0_10px_currentColor]" : "opacity-30"
                  }`} />
                  <span className={`text-[10px] font-mono uppercase tracking-wider ${meta.color}`}>
                    {meta.label}
                  </span>
                  <span className="text-xs font-bold text-white">{count}</span>
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
        <Filter size={13} className="text-white/30" />
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
            filter === "all"
              ? "border-gold/30 bg-gold/10 text-gold"
              : "border-wireframe-stroke text-white/50 hover:text-white/80"
          }`}
        >
          All ({workstreams.length})
        </button>
        {STAGES.map((stage) => {
          const count = workstreams.filter((w) => w.currentStage === stage).length;
          if (count === 0) return null;
          return (
            <button
              type="button"
              key={stage}
              onClick={() => setFilter(filter === stage ? "all" : stage)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                filter === stage
                  ? "border-gold/30 bg-gold/10 text-gold"
                  : "border-wireframe-stroke text-white/50 hover:text-white/80"
              }`}
            >
              {STAGE_META[stage].label} ({count})
            </button>
          );
        })}
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="wireframe-card p-6 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 bg-white/5 rounded" />
                  <div className="h-2 w-32 bg-white/5 rounded" />
                </div>
                <div className="h-8 w-16 bg-white/5 rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div className="wireframe-card p-6 text-center">
          <p className="text-sm text-red-400/60">Failed to load workstreams ({error})</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-2 text-xs text-gold/60 hover:text-gold transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Workstream Cards ── */}
      {!loading && filtered.length > 0 && (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
          {filtered.map((ws) => {
            const progress = overallProgress(ws);
            const currentMeta = STAGE_META[ws.currentStage];
            const priorityStyle = PRIORITY_STYLES[ws.priority] || PRIORITY_STYLES.normal;

            return (
              <motion.div
                key={ws.id}
                variants={staggerItem}
                className="wireframe-card overflow-hidden transition-all hover:border-gold/20"
              >
                <div className="p-5 pb-0">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-semibold text-white">{ws.name}</h3>
                        <span className={`flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider ${priorityStyle.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${priorityStyle.dot}`} />
                          {priorityStyle.label}
                        </span>
                      </div>
                      <p className="text-xs text-white/40 leading-relaxed">{ws.description}</p>
                    </div>
                    <div className="text-right ml-4 flex-shrink-0">
                      <p className="text-2xl font-bold text-white font-display">{progress}%</p>
                      <p className="text-[9px] text-white/20 uppercase tracking-wider font-mono">Complete</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-[10px] text-white/30 font-mono mb-4">
                    <span className="flex items-center gap-1.5">
                      <Users size={10} />
                      {ws.director} &middot; {ws.pmoOffice}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Play size={10} />
                      Started {ws.startedAt}
                    </span>
                    {ws.eta && (
                      <span className="flex items-center gap-1.5">
                        <Clock size={10} />
                        ETA {ws.eta}
                      </span>
                    )}
                    <span className={`flex items-center gap-1.5 ${currentMeta.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${currentMeta.bg} animate-pulse`} />
                      {currentMeta.label} — {ws.stageProgress}%
                    </span>
                  </div>
                </div>

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
                                  width: isComplete ? "100%" : isCurrent ? `${ws.stageProgress}%` : "0%",
                                }}
                              />
                            </div>
                            <div className="flex items-center justify-between mt-1.5">
                              <span
                                className={`text-[8px] font-mono uppercase tracking-wider ${
                                  isComplete ? "text-white/40" : isCurrent ? meta.color : "text-white/15"
                                }`}
                              >
                                {meta.label}
                              </span>
                              {isComplete && <CheckCircle2 size={9} className="text-emerald-400/60" />}
                              {isCurrent && <span className={`w-1.5 h-1.5 rounded-full ${meta.bg} animate-pulse`} />}
                            </div>
                          </div>
                          {i < STAGES.length - 1 && (
                            <ChevronRight
                              size={10}
                              className={`flex-shrink-0 mx-0.5 ${isFuture ? "text-white/[0.08]" : "text-white/20"}`}
                            />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* ── Empty State ── */}
      {!loading && !error && filtered.length === 0 && (
        <div className="wireframe-card border-dashed p-10 text-center">
          <AlertTriangle size={32} className="mx-auto text-gold/30 mb-3" />
          <p className="text-sm text-white/50">
            {filter === "all"
              ? "No active workstreams. Start one from Build."
              : "No workstreams in this stage."}
          </p>
          {filter !== "all" ? (
            <button
              type="button"
              onClick={() => setFilter("all")}
              className="mt-3 text-xs text-gold/60 hover:text-gold transition-colors"
            >
              Show all workstreams
            </button>
          ) : (
            <Link
              href="/dashboard/build"
              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-wireframe-stroke bg-white/5 px-5 py-2 text-xs text-white/60 hover:bg-gold hover:text-black hover:border-gold transition-all"
            >
              Open Build Wizard <ArrowRight size={12} />
            </Link>
          )}
        </div>
      )}

      {/* ── Footer ── */}
      <div className="text-center pt-2 pb-4">
        <p className="text-[9px] font-mono text-white/15 uppercase tracking-[0.2em]">
          A.I.M.S. Workstream Pipeline &bull; {workstreams.length} active streams
        </p>
      </div>
    </div>
  );
}
