// frontend/app/dashboard/house-of-ang/page.tsx
"use client";

import React, { useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Building2,
  Users,
  Zap,
  Shield,
  Code,
  Megaphone,
  BarChart3,
  Activity,
  Brain,
  Factory,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

interface SupervisoryAng {
  name: string;
  title: string;
  pmo: string;
  status: "DEPLOYED";
}

const SUPERVISORY_ROSTER: SupervisoryAng[] = [
  { name: "CDTO_Ang", title: "Chief Digital Transformation Officer", pmo: "DT-PMO", status: "DEPLOYED" },
  { name: "CSO_Ang", title: "Chief Strategy Officer", pmo: "STRAT-PMO", status: "DEPLOYED" },
  { name: "COO_Ang", title: "Chief Operating Officer", pmo: "OPS-PMO", status: "DEPLOYED" },
  { name: "CIO_Ang", title: "Chief Innovation Officer", pmo: "INNOV-PMO", status: "DEPLOYED" },
  { name: "CISO_Ang", title: "Chief Information Security Officer", pmo: "COMPLY-PMO", status: "DEPLOYED" },
  { name: "CGO_Ang", title: "Chief Growth Officer", pmo: "GROWTH-PMO", status: "DEPLOYED" },
  { name: "CTO_Ang", title: "Chief Technology Officer", pmo: "DT-PMO", status: "DEPLOYED" },
  { name: "CFO_Ang", title: "Chief Financial Officer", pmo: "DT-PMO", status: "DEPLOYED" },
  { name: "QA_Ang", title: "Quality Assurance Lead", pmo: "DT-PMO", status: "DEPLOYED" },
];

interface ExecutionAng {
  id: string;
  name: string;
  role: string;
  icon: LucideIcon;
  status: "DEPLOYED" | "STANDBY";
  tasks: number;
  successRate: number;
  specialties: string[];
}

const EXECUTION_ROSTER: ExecutionAng[] = [
  {
    id: "engineer-ang",
    name: "EngineerAng",
    role: "Full-Stack Builder",
    icon: Code,
    status: "DEPLOYED",
    tasks: 12,
    successRate: 94,
    specialties: ["React / Next.js", "Node.js APIs", "Cloud Deploy"],
  },
  {
    id: "marketer-ang",
    name: "MarketerAng",
    role: "Growth Strategist",
    icon: Megaphone,
    status: "DEPLOYED",
    tasks: 8,
    successRate: 91,
    specialties: ["SEO Audits", "Copy Generation", "Campaign Flows"],
  },
  {
    id: "analyst-ang",
    name: "AnalystAng",
    role: "Data & Intelligence",
    icon: BarChart3,
    status: "STANDBY",
    tasks: 3,
    successRate: 97,
    specialties: ["Market Research", "Data Pipelines", "Visualization"],
  },
  {
    id: "quality-ang",
    name: "QualityAng",
    role: "ORACLE Verifier",
    icon: Shield,
    status: "STANDBY",
    tasks: 5,
    successRate: 100,
    specialties: ["7-Gate Checks", "Security Audits", "Code Review"],
  },
  {
    id: "chicken-hawk",
    name: "Chicken Hawk",
    role: "Pipeline Executor",
    icon: Zap,
    status: "DEPLOYED",
    tasks: 28,
    successRate: 96,
    specialties: ["Multi-Agent Orchestration", "Step Sequencing", "Delegation"],
  },
];

/* ------------------------------------------------------------------ */
/*  Computed Stats                                                     */
/* ------------------------------------------------------------------ */

const TOTAL_ANGS = SUPERVISORY_ROSTER.length + EXECUTION_ROSTER.length;
const DEPLOYED = SUPERVISORY_ROSTER.filter((a) => a.status === "DEPLOYED").length +
  EXECUTION_ROSTER.filter((a) => a.status === "DEPLOYED").length;
const STANDBY = TOTAL_ANGS - DEPLOYED;
const SUPERVISORY_COUNT = SUPERVISORY_ROSTER.length;
const EXECUTION_COUNT = EXECUTION_ROSTER.length;

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

export default function HouseOfAngPage() {
  const [spawnOpen, setSpawnOpen] = useState(false);

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* ---- Header ---- */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-amber-200">
            <Factory size={24} />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-amber-200/50 mb-1">
              Boomer_Ang Factory &amp; Deployment Center
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-amber-50 font-display">
              HOUSE OF ANG
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Building2 size={14} className="text-amber-300" />
          <span className="text-[10px] uppercase font-bold text-amber-300 tracking-widest">
            Factory Online
          </span>
        </div>
      </header>

      {/* ---- Stats Bar ---- */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Total Angs", value: TOTAL_ANGS, color: "text-amber-50" },
          { label: "Deployed", value: DEPLOYED, color: "text-emerald-400" },
          { label: "Standby", value: STANDBY, color: "text-amber-400" },
          { label: "Supervisory", value: SUPERVISORY_COUNT, color: "text-amber-200" },
          { label: "Execution", value: EXECUTION_COUNT, color: "text-amber-200" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-white/10 bg-black/60 p-4 backdrop-blur-2xl text-center"
          >
            <p className="text-[10px] uppercase tracking-widest text-amber-100/50">
              {stat.label}
            </p>
            <p className={`text-2xl font-semibold mt-1 ${stat.color}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* ---- Section 1: Supervisory Roster ---- */}
      <section className="rounded-3xl border border-white/10 bg-black/60 p-6 backdrop-blur-2xl">
        <div className="flex items-center gap-3 mb-1">
          <Users size={16} className="text-amber-200" />
          <h2 className="text-sm font-semibold uppercase tracking-widest text-amber-200/90 font-display">
            Supervisory Roster
          </h2>
        </div>
        <p className="text-[0.65rem] text-amber-100/40 uppercase tracking-wider mb-4">
          C-Suite governance agents assigned to PMO offices
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5">
                <th className="pb-2 text-[10px] uppercase tracking-widest text-amber-100/40 font-semibold">
                  Agent
                </th>
                <th className="pb-2 text-[10px] uppercase tracking-widest text-amber-100/40 font-semibold">
                  Title
                </th>
                <th className="pb-2 text-[10px] uppercase tracking-widest text-amber-100/40 font-semibold">
                  PMO
                </th>
                <th className="pb-2 text-[10px] uppercase tracking-widest text-amber-100/40 font-semibold text-right">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {SUPERVISORY_ROSTER.map((ang) => (
                <tr
                  key={ang.name}
                  className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors"
                >
                  <td className="py-3 text-sm font-medium text-amber-50 font-mono">
                    {ang.name}
                  </td>
                  <td className="py-3 text-xs text-amber-100/60">
                    {ang.title}
                  </td>
                  <td className="py-3">
                    <span className="rounded-full border border-white/5 bg-white/5 px-2.5 py-1 text-[10px] text-amber-300 font-mono">
                      {ang.pmo}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      <span className="text-[9px] uppercase font-bold tracking-wider text-emerald-400">
                        {ang.status}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ---- Section 2: Execution Roster ---- */}
      <section>
        <div className="flex items-center gap-3 mb-1">
          <Activity size={16} className="text-amber-200" />
          <h2 className="text-sm font-semibold uppercase tracking-widest text-amber-200/90 font-display">
            Execution Roster
          </h2>
        </div>
        <p className="text-[0.65rem] text-amber-100/40 uppercase tracking-wider mb-4">
          Task-level Boomer_Angs &mdash; build, market, analyze, verify, execute
        </p>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {EXECUTION_ROSTER.map((ang) => (
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
                    <h3 className="text-lg font-semibold text-amber-50">
                      {ang.name}
                    </h3>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          ang.status === "DEPLOYED"
                            ? "bg-emerald-400 animate-pulse"
                            : "bg-amber-400"
                        }`}
                      />
                      <span
                        className={`text-[10px] uppercase font-bold tracking-wider ${
                          ang.status === "DEPLOYED"
                            ? "text-emerald-400"
                            : "text-amber-400"
                        }`}
                      >
                        {ang.status}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-amber-100/50 mt-0.5">{ang.role}</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-white/5 p-3">
                  <p className="text-[10px] uppercase tracking-widest text-amber-100/40">
                    Tasks
                  </p>
                  <p className="text-lg font-semibold text-amber-50 mt-1">
                    {ang.tasks}
                  </p>
                </div>
                <div className="rounded-xl bg-white/5 p-3">
                  <p className="text-[10px] uppercase tracking-widest text-amber-100/40">
                    Success
                  </p>
                  <p className="text-lg font-semibold text-emerald-400 mt-1">
                    {ang.successRate}%
                  </p>
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
            </div>
          ))}
        </div>
      </section>

      {/* ---- Section 3: Spawn Bay ---- */}
      <section>
        <div className="flex items-center gap-3 mb-1">
          <Brain size={16} className="text-amber-200" />
          <h2 className="text-sm font-semibold uppercase tracking-widest text-amber-200/90 font-display">
            Spawn Bay
          </h2>
        </div>
        <p className="text-[0.65rem] text-amber-100/40 uppercase tracking-wider mb-4">
          Agent fabrication &amp; deployment
        </p>

        <div
          className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-black/20 p-10 text-center transition-all hover:border-amber-300/30 cursor-pointer group"
          onClick={() => setSpawnOpen(!spawnOpen)}
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-dashed border-white/20 text-amber-100/30 group-hover:border-amber-300/40 group-hover:text-amber-300 transition-all">
            <Brain size={24} />
          </div>
          <p className="mt-4 text-lg font-semibold text-amber-200/50 group-hover:text-amber-200 transition-colors">
            Spawn New Boomer_Ang
          </p>
          <p className="mt-2 text-xs text-amber-100/30 max-w-md">
            Define a custom agent with specific skills and routing rules. New Angs deploy from the House and report to ACHEEVY.
          </p>

          {spawnOpen && (
            <div className="mt-6 w-full max-w-lg space-y-4 text-left animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-wider text-amber-100/50">
                  Agent Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. DesignerAng"
                  className="w-full rounded-xl border border-white/5 bg-black/80 p-2.5 text-sm text-amber-50 outline-none focus:border-amber-300 placeholder:text-amber-100/20"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-wider text-amber-100/50">
                  Role / Specialization
                </label>
                <input
                  type="text"
                  placeholder="e.g. UI/UX Design Specialist"
                  className="w-full rounded-xl border border-white/5 bg-black/80 p-2.5 text-sm text-amber-50 outline-none focus:border-amber-300 placeholder:text-amber-100/20"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-wider text-amber-100/50">
                  Routing Rules
                </label>
                <textarea
                  rows={3}
                  placeholder="Define when this agent should be invoked..."
                  className="w-full rounded-xl border border-white/5 bg-black/80 p-2.5 text-sm text-amber-50 outline-none focus:border-amber-300 placeholder:text-amber-100/20"
                />
              </div>
              <button className="rounded-full bg-amber-300 px-6 py-2.5 text-xs font-bold text-black shadow-[0_0_15px_rgba(251,191,36,0.3)] transition-all hover:scale-105 active:scale-95">
                Deploy Agent
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
