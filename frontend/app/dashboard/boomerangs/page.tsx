// frontend/app/dashboard/boomerangs/page.tsx
"use client";

import React from "react";
import { Activity, Zap, Brain, Shield, Code, Megaphone, BarChart3 } from "lucide-react";

/**
 * Boomer_Angs page — the management-layer agents.
 *
 * Corrected canon:
 *   - Boomer_Angs are MANAGERS — they train, upskill, correct, translate strategy
 *   - They manage Chicken Hawks (who coordinate Lil_Hawk squads)
 *   - They are the ONLY layer that speaks to ACHEEVY
 *   - ACHEEVY never speaks downward except via Boomer_Angs
 *   - A boomerang (lowercase) is the tool — Boomer_Angs take its digital form
 *     when depicting task completion. They go and come back with the goods.
 */

const boomerangs = [
  {
    id: "engineer-ang",
    name: "Engineer_Ang",
    role: "Full-Stack Builder",
    icon: Code,
    status: "Active" as const,
    tasks: 12,
    successRate: 94,
    specialties: ["React / Next.js", "Node.js APIs", "Cloud Deploy"],
    lastTask: "Built CRM dashboard component",
    manages: "DevOps Agent, WORKFLOW_SMITH_SQUAD (via Chicken Hawk)",
  },
  {
    id: "marketer-ang",
    name: "Marketer_Ang",
    role: "Growth & Content Strategist",
    icon: Megaphone,
    status: "Active" as const,
    tasks: 8,
    successRate: 91,
    specialties: ["SEO Audits", "Copy Generation", "Campaign Flows"],
    lastTask: "Generated landing page copy variants",
    manages: "Social Campaign Agent, Social Agent",
  },
  {
    id: "analyst-ang",
    name: "Analyst_Ang",
    role: "Data & Intelligence Officer",
    icon: BarChart3,
    status: "Standby" as const,
    tasks: 3,
    successRate: 97,
    specialties: ["Market Research", "Data Pipelines", "Visualization"],
    lastTask: "Compiled competitor pricing analysis",
    manages: "Value Agent, PREP_SQUAD_ALPHA (via Chicken Hawk)",
  },
  {
    id: "quality-ang",
    name: "Quality_Ang",
    role: "ORACLE Gate Verifier",
    icon: Shield,
    status: "Standby" as const,
    tasks: 5,
    successRate: 100,
    specialties: ["7-Gate Checks", "Security Audits", "Code Review"],
    lastTask: "Verified deployment against ORACLE gates",
    manages: "VISION_SCOUT_SQUAD (via Chicken Hawk)",
  },
];

export default function BoomerangsPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Hero — ACHEEVY Commander with Boomer_Angs */}
      <section className="relative overflow-hidden rounded-3xl border border-amber-300/20 shadow-[0_0_60px_rgba(251,191,36,0.15)]">
        <div className="relative min-h-[240px] md:min-h-[320px]">
          <div className="absolute inset-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/brand/acheevy-commander.png"
              alt="ACHEEVY commanding Boomer_Angs with task boomerangs"
              className="h-full w-full object-cover object-top"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
          </div>

          <div className="relative z-10 flex h-full min-h-[240px] md:min-h-[320px] flex-col justify-end p-8 md:p-10">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-amber-50 font-display">
              BOOMERANGS
            </h1>
            <p className="mt-2 text-sm text-amber-100/50 max-w-xl">
              Your AI agent managers. Each Boomer_Ang trains, corrects, and translates strategy
              from ACHEEVY into operational rules. They manage Chicken Hawks and are the only layer
              that interfaces with the orchestrator.
            </p>
          </div>
        </div>
      </section>

      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-white/5 bg-black/60 px-4 py-2">
            <Activity size={14} className="text-emerald-400" />
            <span className="text-xs text-amber-100/70">
              <span className="font-semibold text-emerald-400">{boomerangs.filter(b => b.status === "Active").length}</span> Active
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-white/5 bg-black/60 px-4 py-2">
            <Zap size={14} className="text-amber-300" />
            <span className="text-xs text-amber-100/70">
              <span className="font-semibold text-amber-300">{boomerangs.reduce((s, b) => s + b.tasks, 0)}</span> Tasks Completed
            </span>
          </div>
        </div>

        {/* Chain of command reminder */}
        <div className="flex items-center gap-2 text-[10px] text-amber-100/30">
          <span className="text-amber-300/50">ACHEEVY</span>
          <span>{"\u2190"}</span>
          <span className="text-amber-50/50 font-semibold">Boomer_Angs</span>
          <span>{"\u2190"}</span>
          <span className="text-red-400/50">Chicken Hawk</span>
          <span>{"\u2190"}</span>
          <span className="text-emerald-400/50">Lil_Hawks</span>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {boomerangs.map((ang) => (
          <div
            key={ang.id}
            className="group relative overflow-hidden rounded-3xl border border-white/10 bg-black/60 p-6 backdrop-blur-2xl transition-all hover:border-amber-300/30 hover:bg-black/80"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-amber-200 group-hover:bg-amber-300 group-hover:text-black transition-colors">
                <ang.icon size={24} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-amber-50">{ang.name}</h3>
                  <div className="flex items-center gap-1.5">
                    <span className={`h-2 w-2 rounded-full ${
                      ang.status === "Active" ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
                    }`} />
                    <span className={`text-[10px] uppercase font-bold tracking-wider ${
                      ang.status === "Active" ? "text-emerald-400" : "text-amber-400"
                    }`}>
                      {ang.status}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-amber-100/50 mt-0.5">{ang.role}</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-white/5 p-3">
                <p className="text-[10px] uppercase tracking-widest text-amber-100/40">Tasks</p>
                <p className="text-lg font-semibold text-amber-50 mt-1">{ang.tasks}</p>
              </div>
              <div className="rounded-xl bg-white/5 p-3">
                <p className="text-[10px] uppercase tracking-widest text-amber-100/40">Success</p>
                <p className="text-lg font-semibold text-emerald-400 mt-1">{ang.successRate}%</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-1.5">
              {ang.specialties.map((s) => (
                <span
                  key={s}
                  className="rounded-full border border-white/5 bg-white/5 px-2.5 py-1 text-[10px] text-amber-100/60"
                >
                  {s}
                </span>
              ))}
            </div>

            {/* Chain of command */}
            <div className="mt-4 pt-3 border-t border-white/5">
              <p className="text-[9px] text-amber-100/30 uppercase tracking-wider">Manages</p>
              <p className="text-[10px] text-amber-100/50 mt-0.5">{ang.manages}</p>
            </div>

            <div className="mt-2 pt-2 border-t border-white/5">
              <p className="text-[10px] text-amber-100/40 uppercase tracking-wider">Last Task</p>
              <p className="text-xs text-amber-100/70 mt-1">{ang.lastTask}</p>
            </div>
          </div>
        ))}

        {/* Spawn New */}
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-black/20 p-8 text-center transition-all hover:border-amber-300/30 cursor-pointer group">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-dashed border-white/20 text-2xl text-amber-100/30 group-hover:border-amber-300/40 group-hover:text-amber-300 transition-all">
            <Brain size={24} />
          </div>
          <p className="mt-4 text-sm font-handwriting text-lg text-amber-200/50">
            Spawn a new Boomer_Ang
          </p>
          <p className="mt-1 text-xs text-amber-100/30">
            Define a custom agent with specific skills and routing rules.
          </p>
        </div>
      </div>
    </div>
  );
}
