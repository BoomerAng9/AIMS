// frontend/app/dashboard/plan/page.tsx
"use client";

import React from "react";
import { Target, ArrowRight, Clock, CheckCircle2, Circle, Loader2 } from "lucide-react";

const missions = [
  {
    id: "m-001",
    title: "CRM Plug for Real Estate Agents",
    status: "in_progress" as const,
    progress: 45,
    steps: [
      { label: "Intent Analysis (AVVA NOON)", done: true },
      { label: "Schema Design (Engineer_Ang)", done: true },
      { label: "API Endpoints", done: false },
      { label: "Frontend Dashboard", done: false },
      { label: "ORACLE Verification", done: false },
    ],
    estimatedCost: "$18.40",
    created: "2026-02-03",
  },
  {
    id: "m-002",
    title: "Automated Outreach Sequence",
    status: "pending" as const,
    progress: 0,
    steps: [
      { label: "Campaign Strategy (Marketer_Ang)", done: false },
      { label: "Copy Generation", done: false },
      { label: "Scheduling Integration", done: false },
      { label: "Analytics Hook-up", done: false },
    ],
    estimatedCost: "$7.20",
    created: "2026-02-04",
  },
];

function StatusBadge({ status }: { status: "in_progress" | "pending" | "completed" }) {
  const config = {
    in_progress: { icon: Loader2, label: "In Progress", color: "text-gold bg-gold/10 border-gold/20", spin: true },
    pending: { icon: Clock, label: "Queued", color: "text-white/40 bg-white/5 border-wireframe-stroke", spin: false },
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
  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white font-display">
            MISSION PLAN
          </h1>
          <p className="text-sm text-white/50">
            Track active objectives orchestrated by ACHEEVY and executed by your Boomer_Ang team.
          </p>
        </div>
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
      </header>

      <div className="space-y-4">
        {missions.map((mission) => (
          <div
            key={mission.id}
            className="group rounded-3xl border border-wireframe-stroke bg-black/60 p-6 backdrop-blur-2xl transition-all hover:border-gold/20"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5 text-gold">
                  <Target size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">{mission.title}</h3>
                  <p className="text-[10px] text-white/30 mt-0.5">
                    Created {mission.created} &middot; Est. {mission.estimatedCost}
                  </p>
                </div>
              </div>
              <StatusBadge status={mission.status} />
            </div>

            {/* Progress Bar */}
            <div className="mt-5">
              <div className="flex justify-between text-[10px] mb-1.5">
                <span className="text-white/40 uppercase tracking-wider">Progress</span>
                <span className="text-gold font-semibold">{mission.progress}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-gold to-gold transition-all"
                  style={{ width: `${mission.progress}%` }}
                />
              </div>
            </div>

            {/* Steps */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {mission.steps.map((step, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-2 rounded-xl p-2.5 text-xs ${
                    step.done
                      ? "bg-emerald-400/5 text-emerald-400"
                      : "bg-white/5 text-white/40"
                  }`}
                >
                  {step.done ? (
                    <CheckCircle2 size={14} className="flex-shrink-0" />
                  ) : (
                    <Circle size={14} className="flex-shrink-0" />
                  )}
                  {step.label}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Empty state CTA */}
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-wireframe-stroke bg-black/20 p-10 text-center">
          <Target size={32} className="text-white/20" />
          <p className="mt-3 text-sm text-white/30">
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
      </div>
    </div>
  );
}
