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
  ChevronDown,
  ChevronRight,
  ArrowDown,
} from "lucide-react";
import {
  DELEGATION_CHAIN,
  EVOLUTION_STAGES,
  LIL_HAWK_SQUADS,
  PROMOTION_PATHS,
  CHICKEN_HAWK_IMAGE,
} from "@/lib/governance";

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
  { name: "Boomer_CTO", title: "Chief Technology Officer", pmo: "TECH OFFICE", status: "DEPLOYED" },
  { name: "Boomer_CFO", title: "Chief Financial Officer", pmo: "FINANCE OFFICE", status: "DEPLOYED" },
  { name: "Boomer_COO", title: "Chief Operating Officer", pmo: "OPS OFFICE", status: "DEPLOYED" },
  { name: "Boomer_CMO", title: "Chief Marketing Officer", pmo: "MARKETING OFFICE", status: "DEPLOYED" },
  { name: "Boomer_CDO", title: "Chief Design Officer", pmo: "DESIGN OFFICE", status: "DEPLOYED" },
  { name: "Boomer_CPO", title: "Chief Publication Officer", pmo: "PUBLISHING OFFICE", status: "DEPLOYED" },
  { name: "DevOps Agent", title: "DevOps Specialist", pmo: "TECH OFFICE", status: "DEPLOYED" },
  { name: "Value Agent", title: "Financial Analyst", pmo: "FINANCE OFFICE", status: "DEPLOYED" },
  { name: "Flow Boss Agent", title: "Workflow Orchestrator", pmo: "OPS OFFICE", status: "DEPLOYED" },
  { name: "Social Campaign Agent", title: "Campaign Manager", pmo: "MARKETING OFFICE", status: "DEPLOYED" },
  { name: "Video Editing Agent", title: "Multimedia Producer", pmo: "DESIGN OFFICE", status: "DEPLOYED" },
  { name: "Social Agent", title: "Content Publisher", pmo: "PUBLISHING OFFICE", status: "DEPLOYED" },
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
    name: "Engineer_Ang",
    role: "Full-Stack Builder",
    icon: Code,
    status: "DEPLOYED",
    tasks: 12,
    successRate: 94,
    specialties: ["React / Next.js", "Node.js APIs", "Cloud Deploy"],
  },
  {
    id: "marketer-ang",
    name: "Marketer_Ang",
    role: "Growth Strategist",
    icon: Megaphone,
    status: "DEPLOYED",
    tasks: 8,
    successRate: 91,
    specialties: ["SEO Audits", "Copy Generation", "Campaign Flows"],
  },
  {
    id: "analyst-ang",
    name: "Analyst_Ang",
    role: "Data & Intelligence",
    icon: BarChart3,
    status: "STANDBY",
    tasks: 3,
    successRate: 97,
    specialties: ["Market Research", "Data Pipelines", "Visualization"],
  },
  {
    id: "quality-ang",
    name: "Quality_Ang",
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
    role: "Coordinator / Enforcer",
    icon: Zap,
    status: "DEPLOYED",
    tasks: 28,
    successRate: 96,
    specialties: ["SOP Enforcement", "Throughput Regulation", "Escalation"],
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
const TOTAL_LIL_HAWKS = LIL_HAWK_SQUADS.reduce((s, sq) => s + sq.hawks.length, 0);

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

export default function HouseOfAngPage() {
  const [spawnOpen, setSpawnOpen] = useState(false);
  const [chainOpen, setChainOpen] = useState(false);
  const [evolutionOpen, setEvolutionOpen] = useState(false);

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* ---- Hero Section: Boomer_Angs at Port ---- */}
      <section className="relative overflow-hidden rounded-3xl border border-amber-300/20 shadow-[0_0_60px_rgba(251,191,36,0.15)]">
        <div className="relative min-h-[280px] md:min-h-[380px]">
          <div className="absolute inset-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/brand/boomerangs-port.png"
              alt="Boomer_Angs managing containers at the port"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
          </div>

          <div className="relative z-10 flex h-full min-h-[280px] md:min-h-[380px] flex-col justify-end p-8 md:p-10">
            <div className="flex items-center gap-2 mb-3">
              <Building2 size={14} className="text-amber-300" />
              <span className="text-[10px] uppercase font-bold text-amber-300 tracking-widest">
                Factory Online
              </span>
            </div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-amber-200/60 mb-1">
              Boomer_Ang Factory &amp; Deployment Center
            </p>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-amber-50 font-display">
              HOUSE OF ANG
            </h1>
            <p className="mt-2 text-sm text-amber-100/50 max-w-lg">
              The birthplace and command center for all Boomer_Angs.
              Authority flows upward. Accountability flows downward.
              Activity breeds Activity.
            </p>
          </div>
        </div>
      </section>

      {/* ---- Stats Bar ---- */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
        {[
          { label: "Total Angs", value: TOTAL_ANGS, color: "text-amber-50" },
          { label: "Deployed", value: DEPLOYED, color: "text-emerald-400" },
          { label: "Standby", value: STANDBY, color: "text-amber-400" },
          { label: "Supervisory", value: SUPERVISORY_COUNT, color: "text-amber-200" },
          { label: "Execution", value: EXECUTION_COUNT, color: "text-amber-200" },
          { label: "Lil_Hawks", value: TOTAL_LIL_HAWKS, color: "text-emerald-300" },
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

      {/* ---- Delegation Chain ---- */}
      <section className="rounded-3xl border border-white/10 bg-black/60 p-6 backdrop-blur-2xl">
        <button
          onClick={() => setChainOpen(!chainOpen)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <ArrowDown size={16} className="text-amber-200" />
            <div className="text-left">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-amber-200/90 font-display">
                Chain of Command
              </h2>
              <p className="text-[0.65rem] text-amber-100/40 uppercase tracking-wider">
                Hard rule — no shortcuts, no exceptions
              </p>
            </div>
          </div>
          {chainOpen ? <ChevronDown size={16} className="text-amber-200/60" /> : <ChevronRight size={16} className="text-amber-200/60" />}
        </button>

        {chainOpen && (
          <div className="mt-6 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex flex-col items-center gap-2">
              {DELEGATION_CHAIN.slice().reverse().map((level, i) => (
                <React.Fragment key={level.role}>
                  <div className={`w-full max-w-md rounded-2xl border p-4 text-center transition-all ${
                    level.rank === 4
                      ? "border-amber-300/30 bg-amber-300/5 shadow-[0_0_20px_rgba(251,191,36,0.08)]"
                      : level.rank === 3
                        ? "border-amber-300/20 bg-amber-300/[0.02]"
                        : level.rank === 2
                          ? "border-red-400/20 bg-red-400/[0.02]"
                          : "border-white/10 bg-black/40"
                  }`}>
                    <p className="text-xs font-bold text-amber-50">{level.role}</p>
                    <p className="text-[10px] text-amber-100/40 mt-0.5">{level.label}</p>
                    <p className="text-[9px] text-amber-100/30 mt-1">
                      Speaks to: {level.speaks_to}
                    </p>
                  </div>
                  {i < DELEGATION_CHAIN.length - 1 && (
                    <ArrowDown size={14} className="text-amber-300/30" />
                  )}
                </React.Fragment>
              ))}
            </div>
            <p className="mt-4 text-[10px] text-amber-100/30 text-center max-w-lg mx-auto">
              Lil_Hawks only speak to their Squad Leader or Chicken Hawk.
              Chicken Hawks only speak to Boomer_Angs.
              Boomer_Angs are the only ones that speak to ACHEEVY.
              ACHEEVY rarely speaks downward — and only via Boomer_Angs.
            </p>
          </div>
        )}
      </section>

      {/* ---- Chicken Hawk + Lil_Hawk Evolution ---- */}
      <section className="rounded-3xl border border-white/10 bg-black/60 p-6 backdrop-blur-2xl">
        <button
          onClick={() => setEvolutionOpen(!evolutionOpen)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <Zap size={16} className="text-amber-200" />
            <div className="text-left">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-amber-200/90 font-display">
                Hawk Evolution &amp; Squads
              </h2>
              <p className="text-[0.65rem] text-amber-100/40 uppercase tracking-wider">
                Lil_Hawks evolve through discipline — Chicken Hawk enforces order
              </p>
            </div>
          </div>
          {evolutionOpen ? <ChevronDown size={16} className="text-amber-200/60" /> : <ChevronRight size={16} className="text-amber-200/60" />}
        </button>

        {evolutionOpen && (
          <div className="mt-6 space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
            {/* Chicken Hawk */}
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="w-32 h-32 rounded-2xl border border-red-400/20 bg-black/40 overflow-hidden shrink-0 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={CHICKEN_HAWK_IMAGE}
                  alt="Chicken Hawk — Coordinator and Enforcer"
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-bold text-red-400">Chicken Hawk</h3>
                  <span className="rounded-full bg-red-400/10 border border-red-400/20 px-2 py-0.5 text-[8px] font-bold text-red-400 uppercase tracking-wider">
                    Coordinator
                  </span>
                </div>
                <p className="text-xs text-amber-100/50 leading-relaxed">
                  Coordinators, disciplinarians, throughput regulators, and escalation points.
                  Chicken Hawks do <strong className="text-amber-100/70">not</strong> mentor — they assign work, enforce SOP,
                  monitor performance, and relay structured updates to Boomer_Angs.
                  They must themselves respond well to mentorship coming down from Boomer_Angs.
                </p>
              </div>
            </div>

            {/* Evolution Stages */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-amber-200/60 mb-4">
                Lil_Hawk Evolution Stages
              </h3>
              <div className="grid gap-4 md:grid-cols-3">
                {EVOLUTION_STAGES.map((stage) => (
                  <div key={stage.id} className="rounded-2xl border border-white/10 bg-black/40 p-4">
                    <div className="h-24 rounded-xl border border-white/5 bg-black/20 mb-3 flex items-center justify-center overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={stage.image}
                        alt={stage.visual}
                        className="h-full object-contain"
                      />
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className={`text-xs font-bold ${stage.color}`}>{stage.name}</p>
                      {stage.canRegress && (
                        <span className="rounded-full bg-amber-400/10 border border-amber-400/20 px-1.5 py-0.5 text-[7px] font-bold text-amber-400 uppercase">
                          Can Regress
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-amber-100/40 mb-2">{stage.description}</p>
                    <ul className="space-y-1">
                      {stage.criteria.map((c, i) => (
                        <li key={i} className="text-[9px] text-amber-100/30 flex items-start gap-1.5">
                          <span className="text-amber-300/40 mt-0.5 shrink-0">{"\u2022"}</span>
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Promotion Paths */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-amber-200/60 mb-3">
                Promotion Criteria
              </h3>
              <div className="space-y-3">
                {PROMOTION_PATHS.map((path) => (
                  <div key={`${path.from}-${path.to}`} className="rounded-2xl border border-white/5 bg-black/30 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] text-amber-100/40">{path.from}</span>
                      <span className="text-amber-300/40">{"\u2192"}</span>
                      <span className="text-[10px] font-semibold text-amber-50">{path.to}</span>
                      {path.reversible && (
                        <span className="rounded-full bg-amber-400/10 px-1.5 py-0.5 text-[7px] text-amber-400 uppercase">
                          Reversible
                        </span>
                      )}
                    </div>
                    <div className="grid md:grid-cols-2 gap-3">
                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-emerald-400/60 mb-1">Required</p>
                        <ul className="space-y-0.5">
                          {path.criteria.map((c, i) => (
                            <li key={i} className="text-[9px] text-amber-100/30 flex items-start gap-1">
                              <span className="text-emerald-400/40 shrink-0">{"\u2713"}</span>{c}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-red-400/60 mb-1">Blockers</p>
                        <ul className="space-y-0.5">
                          {path.blockers.map((b, i) => (
                            <li key={i} className="text-[9px] text-amber-100/30 flex items-start gap-1">
                              <span className="text-red-400/40 shrink-0">{"\u2717"}</span>{b}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Lil_Hawk Squads */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-amber-200/60 mb-3">
                Lil_Hawk Squads
              </h3>
              <div className="grid gap-4 lg:grid-cols-3">
                {LIL_HAWK_SQUADS.map((squad) => (
                  <div key={squad.name} className="rounded-2xl border border-white/5 bg-black/40 p-4">
                    <p className="text-xs font-semibold text-amber-200">{squad.name}</p>
                    <p className="text-[10px] text-amber-100/40 mt-0.5">{squad.purpose}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-[8px] uppercase tracking-wider text-amber-100/30">Squad Leader:</span>
                      <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[8px] font-bold text-emerald-400">
                        {squad.leaderRole}_LIL_HAWK
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-[8px] uppercase tracking-wider text-amber-100/30">Reports to:</span>
                      <span className="text-[9px] text-red-400/70 font-mono">{squad.reportsTo}</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {squad.hawks.map((hawk) => (
                        <span
                          key={hawk}
                          className={`rounded-full border px-2 py-0.5 text-[9px] font-mono ${
                            hawk === squad.leaderRole
                              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                              : "border-amber-50/10 bg-amber-400/5 text-amber-100/60"
                          }`}
                        >
                          {hawk}_LIL_HAWK
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ---- Section 1: Supervisory Roster ---- */}
      <section className="rounded-3xl border border-white/10 bg-black/60 p-6 backdrop-blur-2xl">
        <div className="flex items-center gap-3 mb-1">
          <Users size={16} className="text-amber-200" />
          <h2 className="text-sm font-semibold uppercase tracking-widest text-amber-200/90 font-display">
            Supervisory Roster
          </h2>
        </div>
        <p className="text-[0.65rem] text-amber-100/40 uppercase tracking-wider mb-4">
          C-Suite Boomer_Angs &amp; departmental agents — the only layer that speaks to ACHEEVY
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5">
                <th className="pb-2 text-[10px] uppercase tracking-widest text-amber-100/40 font-semibold">Agent</th>
                <th className="pb-2 text-[10px] uppercase tracking-widest text-amber-100/40 font-semibold">Title</th>
                <th className="pb-2 text-[10px] uppercase tracking-widest text-amber-100/40 font-semibold">PMO</th>
                <th className="pb-2 text-[10px] uppercase tracking-widest text-amber-100/40 font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {SUPERVISORY_ROSTER.map((ang) => (
                <tr
                  key={ang.name}
                  className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors"
                >
                  <td className="py-3 text-sm font-medium text-amber-50 font-mono">{ang.name}</td>
                  <td className="py-3 text-xs text-amber-100/60">{ang.title}</td>
                  <td className="py-3">
                    <span className="rounded-full border border-white/5 bg-white/5 px-2.5 py-1 text-[10px] text-amber-300 font-mono">
                      {ang.pmo}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      <span className="text-[9px] uppercase font-bold tracking-wider text-emerald-400">{ang.status}</span>
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
          Task-level Boomer_Angs &amp; Chicken Hawk — manage, train, coordinate, verify
        </p>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {EXECUTION_ROSTER.map((ang) => (
            <div
              key={ang.id}
              className={`group relative overflow-hidden rounded-3xl border p-6 backdrop-blur-2xl transition-all hover:bg-black/80 ${
                ang.id === "chicken-hawk"
                  ? "border-red-400/20 bg-red-400/[0.02] hover:border-red-400/40"
                  : "border-white/10 bg-black/60 hover:border-amber-300/30"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-colors ${
                  ang.id === "chicken-hawk"
                    ? "bg-red-400/10 text-red-400 group-hover:bg-red-400 group-hover:text-black"
                    : "bg-white/5 text-amber-200 group-hover:bg-amber-300 group-hover:text-black"
                }`}>
                  <ang.icon size={24} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-amber-50">{ang.name}</h3>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          ang.status === "DEPLOYED" ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
                        }`}
                      />
                      <span
                        className={`text-[10px] uppercase font-bold tracking-wider ${
                          ang.status === "DEPLOYED" ? "text-emerald-400" : "text-amber-400"
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
            </div>
          ))}
        </div>
      </section>

      {/* ---- Section 3: Forged Boomerang + Canon ---- */}
      <section className="rounded-3xl border border-white/10 bg-black/60 p-6 backdrop-blur-2xl">
        <div className="flex flex-col md:flex-row gap-6 items-center">
          <div className="w-40 h-40 rounded-2xl border border-amber-300/20 bg-black/40 overflow-hidden shrink-0 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/brand/boomerang-forged.png"
              alt="The Forged Boomerang — tool of the Angs"
              className="h-full w-full object-contain"
            />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-amber-200/90 font-display mb-2">
              The Canon
            </h3>
            <p className="text-xs text-amber-100/40 leading-relaxed max-w-xl">
              Lil_Hawks are workers who prove themselves through discipline, teamwork, and responsiveness
              to guidance. They do not lead, teach, or mentor — they execute and adapt. Some earn the
              right to coordinate as Squad Leaders, and a few rise to become Chicken Hawks, whose role
              is not to mentor but to enforce order and relay performance upward. Chicken Hawks answer to
              Boomer_Angs, who train, correct, and translate strategy from ACHEEVY. Growth in A.I.M.S.
              is earned through consistency, not power. Authority flows upward. Accountability flows
              downward. And Activity breeds Activity — only when discipline holds.
            </p>
          </div>
        </div>
      </section>

      {/* ---- Section 4: Spawn Bay ---- */}
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
            Define a custom agent with specific skills and routing rules.
            New Angs deploy from the House and integrate into the delegation chain.
          </p>

          {spawnOpen && (
            <div className="mt-6 w-full max-w-lg space-y-4 text-left animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-wider text-amber-100/50">Agent Name</label>
                <input
                  type="text"
                  placeholder="e.g. DesignerAng"
                  className="w-full rounded-xl border border-white/5 bg-black/80 p-2.5 text-sm text-amber-50 outline-none focus:border-amber-300 placeholder:text-amber-100/20"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-wider text-amber-100/50">Role / Specialization</label>
                <input
                  type="text"
                  placeholder="e.g. UI/UX Design Specialist"
                  className="w-full rounded-xl border border-white/5 bg-black/80 p-2.5 text-sm text-amber-50 outline-none focus:border-amber-300 placeholder:text-amber-100/20"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-wider text-amber-100/50">Routing Rules</label>
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
