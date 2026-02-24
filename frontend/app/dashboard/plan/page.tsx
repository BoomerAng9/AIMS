// frontend/app/dashboard/plan/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { Target, ArrowRight, Clock, CheckCircle2, Circle, Loader2, RefreshCw } from "lucide-react";

interface PipelineStep {
  stage: string;
  status: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  createdAt: string;
  pipeline?: {
    currentStage: string;
    stages: PipelineStep[];
    progress: number;
  } | null;
}

function projectStatus(p: Project): "completed" | "in_progress" | "pending" {
  if (p.status === "completed" || p.status === "deployed") return "completed";
  if (p.status === "in_progress" || p.status === "building") return "in_progress";
  return "pending";
}

function projectProgress(p: Project): number {
  if (!p.pipeline?.stages?.length) {
    if (p.status === "completed" || p.status === "deployed") return 100;
    if (p.status === "in_progress" || p.status === "building") return 50;
    return 0;
  }
  const done = p.pipeline.stages.filter(s => s.status === "complete" || s.status === "done").length;
  return Math.round((done / p.pipeline.stages.length) * 100);
}

function StatusBadge({ status }: { status: "in_progress" | "pending" | "completed" }) {
  const config = {
    in_progress: { icon: Loader2, label: "In Progress", color: "text-gold bg-gold/10 border-gold/20", spin: true },
    pending: { icon: Clock, label: "Queued", color: "text-slate-400 bg-slate-50 border-wireframe-stroke", spin: false },
    completed: { icon: CheckCircle2, label: "Complete", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30", spin: false },
  };
  const c = config[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] uppercase font-bold tracking-wider ${c.color}`}>
      <c.icon size={12} className={c.spin ? "animate-spin" : ""} />
      {c.label}
    </span>
  );
}

export default function PlanPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/projects");
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
      }
    } catch {
      // Silent — show empty state
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-800 font-display">
            MISSION PLAN
          </h1>
          <p className="text-sm text-slate-500">
            Track active objectives orchestrated by ACHEEVY and executed by your Boomer_Ang team.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchProjects}
            disabled={loading}
            className="flex items-center gap-2 rounded-full border border-wireframe-stroke px-4 py-2.5 text-xs font-semibold text-slate-500 transition-all hover:border-gold/20 hover:text-gold"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
          <button
            onClick={() => {
              const input = document.querySelector<HTMLInputElement>('input[placeholder*="ACHEEVY"]');
              if (input) { input.focus(); }
            }}
            className="flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 text-xs font-bold text-black shadow-[0_0_15px_rgba(251,191,36,0.3)] transition-all hover:scale-105 active:scale-95"
          >
            <Target size={14} />
            New Mission
          </button>
        </div>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-gold" />
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map((project) => {
            const status = projectStatus(project);
            const progress = projectProgress(project);
            const steps = project.pipeline?.stages || [];

            return (
              <div
                key={project.id}
                className="group rounded-3xl border border-wireframe-stroke bg-slate-50/70 p-6 backdrop-blur-2xl transition-all hover:border-gold/20"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-50 text-gold">
                      <Target size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-800">{project.name}</h3>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Created {new Date(project.createdAt).toLocaleDateString()}
                        {project.description && ` · ${project.description.slice(0, 60)}${project.description.length > 60 ? '...' : ''}`}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={status} />
                </div>

                {/* Progress Bar */}
                <div className="mt-5">
                  <div className="flex justify-between text-[10px] mb-1.5">
                    <span className="text-slate-400 uppercase tracking-wider">Progress</span>
                    <span className="text-gold font-semibold">{progress}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-50 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-gold to-gold transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Pipeline Steps */}
                {steps.length > 0 && (
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {steps.map((step, i) => {
                      const done = step.status === "complete" || step.status === "done";
                      return (
                        <div
                          key={i}
                          className={`flex items-center gap-2 rounded-xl p-2.5 text-xs ${
                            done
                              ? "bg-emerald-400/5 text-emerald-400"
                              : "bg-slate-50 text-slate-400"
                          }`}
                        >
                          {done ? (
                            <CheckCircle2 size={14} className="flex-shrink-0" />
                          ) : (
                            <Circle size={14} className="flex-shrink-0" />
                          )}
                          {step.stage}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* Empty state CTA */}
          {projects.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-wireframe-stroke bg-slate-50/30 p-10 text-center">
              <Target size={32} className="text-slate-300" />
              <p className="mt-3 text-sm text-slate-400">
                Start a conversation with ACHEEVY to create your next mission plan.
              </p>
              <button
                onClick={() => {
                  const input = document.querySelector<HTMLInputElement>('input[placeholder*="ACHEEVY"]');
                  if (input) { input.focus(); }
                }}
                className="mt-4 flex items-center gap-2 rounded-full border border-gold/20 px-5 py-2 text-xs font-semibold text-gold hover:bg-gold/10 transition-colors"
              >
                Open Chat <ArrowRight size={12} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
