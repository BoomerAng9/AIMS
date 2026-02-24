// frontend/app/dashboard/house-of-ang/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  Building2,
  Users,
  Zap,
  Shield,
  Code,
  Activity,
  Brain,
  ChevronDown,
  ChevronRight,
  ArrowDown,
  Wifi,
  WifiOff,
} from "lucide-react";
import {
  DELEGATION_CHAIN,
  EVOLUTION_STAGES,
  LIL_HAWK_SQUADS,
  PROMOTION_PATHS,
  CHICKEN_HAWK_IMAGE,
} from "@/lib/governance";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface RegisteredAgent {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  healthStatus: "online" | "offline" | "degraded";
}

/* ------------------------------------------------------------------ */
/*  Real data hook — fetches from House of Ang registry                */
/* ------------------------------------------------------------------ */

function useRegisteredAgents() {
  const [agents, setAgents] = useState<RegisteredAgent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/circuit-box/boomerangs", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (data.agents && Array.isArray(data.agents)) {
          setAgents(data.agents);
        }
      } catch {
        // API unreachable — show empty state
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { agents, loading };
}

const TOTAL_LIL_HAWKS = LIL_HAWK_SQUADS.reduce((s, sq) => s + sq.hawks.length, 0);

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

export default function HouseOfAngPage() {
  const [spawnOpen, setSpawnOpen] = useState(false);
  const [chainOpen, setChainOpen] = useState(false);
  const [evolutionOpen, setEvolutionOpen] = useState(false);
  const { agents, loading } = useRegisteredAgents();

  const onlineAgents = agents.filter((a) => a.healthStatus === "online").length;
  const offlineAgents = agents.filter((a) => a.healthStatus === "offline").length;

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* ---- Hero Section: Boomer_Angs at Port ---- */}
      <section className="relative overflow-hidden rounded-3xl border border-gold/20 shadow-[0_0_60px_rgba(251,191,36,0.15)]">
        <div className="relative min-h-[280px] md:min-h-[380px]">
          <div className="absolute inset-0">
            <Image
              src="/images/acheevy/acheevy-office-plug.png"
              alt="Boomer_Angs managing containers at the port"
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-transparent to-white/30" />
          </div>

          <div className="relative z-10 flex h-full min-h-[280px] md:min-h-[380px] flex-col justify-end p-8 md:p-10">
            <div className="flex items-center gap-2 mb-3">
              <Building2 size={14} className="text-gold" />
              <span className="text-[10px] uppercase font-bold text-gold tracking-widest">
                Factory Online
              </span>
            </div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-gold mb-1">
              Boomer_Ang Factory &amp; Deployment Center
            </p>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-800 font-display">
              HOUSE OF ANG
            </h1>
            <p className="mt-2 text-sm text-slate-400 max-w-lg">
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
          { label: "Registered", value: agents.length, color: "text-slate-800" },
          { label: "Online", value: onlineAgents, color: "text-emerald-400" },
          { label: "Offline", value: offlineAgents, color: "text-red-400" },
          { label: "Registry", value: "v3.0", color: "text-gold" },
          { label: "Source", value: "Live", color: "text-gold" },
          { label: "Lil_Hawks", value: TOTAL_LIL_HAWKS, color: "text-emerald-300" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-wireframe-stroke bg-slate-50/70 p-4 backdrop-blur-2xl text-center"
          >
            <p className="text-[10px] uppercase tracking-widest text-slate-400">
              {stat.label}
            </p>
            <p className={`text-2xl font-semibold mt-1 ${stat.color}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* ---- Delegation Chain ---- */}
      <section className="rounded-3xl border border-wireframe-stroke bg-slate-50/70 p-6 backdrop-blur-2xl">
        <button
          onClick={() => setChainOpen(!chainOpen)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <ArrowDown size={16} className="text-gold" />
            <div className="text-left">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-700 font-display">
                Chain of Command
              </h2>
              <p className="text-[0.65rem] text-slate-400 uppercase tracking-wider">
                Hard rule — no shortcuts, no exceptions
              </p>
            </div>
          </div>
          {chainOpen ? <ChevronDown size={16} className="text-gold" /> : <ChevronRight size={16} className="text-gold" />}
        </button>

        {chainOpen && (
          <div className="mt-6 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex flex-col items-center gap-2">
              {DELEGATION_CHAIN.slice().reverse().map((level, i) => (
                <React.Fragment key={level.role}>
                  <div className={`w-full max-w-md rounded-2xl border p-4 text-center transition-all ${
                    level.rank === 4
                      ? "border-gold/20 bg-gold/10 shadow-[0_0_20px_rgba(251,191,36,0.08)]"
                      : level.rank === 3
                        ? "border-gold/20 bg-gold/[0.02]"
                        : level.rank === 2
                          ? "border-red-400/20 bg-red-400/[0.02]"
                          : "border-wireframe-stroke bg-slate-100/60"
                  }`}>
                    <p className="text-xs font-bold text-slate-800">{level.role}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{level.label}</p>
                    <p className="text-[9px] text-slate-300 mt-1">
                      Speaks to: {level.speaks_to}
                    </p>
                  </div>
                  {i < DELEGATION_CHAIN.length - 1 && (
                    <ArrowDown size={14} className="text-gold/30" />
                  )}
                </React.Fragment>
              ))}
            </div>
            <p className="mt-4 text-[10px] text-slate-300 text-center max-w-lg mx-auto">
              Lil_Hawks only speak to their Squad Leader or Chicken Hawk.
              Chicken Hawks only speak to Boomer_Angs.
              Boomer_Angs are the only ones that speak to ACHEEVY.
              ACHEEVY rarely speaks downward — and only via Boomer_Angs.
            </p>
          </div>
        )}
      </section>

      {/* ---- Chicken Hawk + Lil_Hawk Evolution ---- */}
      <section className="rounded-3xl border border-wireframe-stroke bg-slate-50/70 p-6 backdrop-blur-2xl">
        <button
          onClick={() => setEvolutionOpen(!evolutionOpen)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <Zap size={16} className="text-gold" />
            <div className="text-left">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-700 font-display">
                Hawk Evolution &amp; Squads
              </h2>
              <p className="text-[0.65rem] text-slate-400 uppercase tracking-wider">
                Lil_Hawks evolve through discipline — Chicken Hawk enforces order
              </p>
            </div>
          </div>
          {evolutionOpen ? <ChevronDown size={16} className="text-gold" /> : <ChevronRight size={16} className="text-gold" />}
        </button>

        {evolutionOpen && (
          <div className="mt-6 space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
            {/* Chicken Hawk */}
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="w-32 h-32 rounded-2xl border border-red-400/20 bg-slate-100/60 overflow-hidden shrink-0 flex items-center justify-center relative">
                <Image
                  src={CHICKEN_HAWK_IMAGE}
                  alt="Chicken Hawk — Coordinator and Enforcer"
                  width={128}
                  height={128}
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
                <p className="text-xs text-slate-400 leading-relaxed">
                  Coordinators, disciplinarians, throughput regulators, and escalation points.
                  Chicken Hawks do <strong className="text-slate-500">not</strong> mentor — they assign work, enforce SOP,
                  monitor performance, and relay structured updates to Boomer_Angs.
                  They must themselves respond well to mentorship coming down from Boomer_Angs.
                </p>
              </div>
            </div>

            {/* Evolution Stages */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-gold mb-4">
                Lil_Hawk Evolution Stages
              </h3>
              <div className="grid gap-4 md:grid-cols-3">
                {EVOLUTION_STAGES.map((stage) => (
                  <div key={stage.id} className="rounded-2xl border border-wireframe-stroke bg-slate-100/60 p-4">
                    <div className="h-24 rounded-xl border border-wireframe-stroke bg-slate-50/30 mb-3 flex items-center justify-center overflow-hidden relative">
                      <Image
                        src={stage.image}
                        alt={stage.visual}
                        fill
                        className="object-contain p-2"
                        sizes="(max-width: 768px) 100vw, 300px"
                      />
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className={`text-xs font-bold ${stage.color}`}>{stage.name}</p>
                      {stage.canRegress && (
                        <span className="rounded-full bg-gold/10 border border-gold/20 px-1.5 py-0.5 text-[7px] font-bold text-gold uppercase">
                          Can Regress
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 mb-2">{stage.description}</p>
                    <ul className="space-y-1">
                      {stage.criteria.map((c, i) => (
                        <li key={i} className="text-[9px] text-slate-300 flex items-start gap-1.5">
                          <span className="text-gold mt-0.5 shrink-0">{"\u2022"}</span>
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
              <h3 className="text-xs font-semibold uppercase tracking-widest text-gold mb-3">
                Promotion Criteria
              </h3>
              <div className="space-y-3">
                {PROMOTION_PATHS.map((path) => (
                  <div key={`${path.from}-${path.to}`} className="rounded-2xl border border-wireframe-stroke bg-slate-100/40 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] text-slate-400">{path.from}</span>
                      <span className="text-gold">{"\u2192"}</span>
                      <span className="text-[10px] font-semibold text-slate-800">{path.to}</span>
                      {path.reversible && (
                        <span className="rounded-full bg-gold/10 px-1.5 py-0.5 text-[7px] text-gold uppercase">
                          Reversible
                        </span>
                      )}
                    </div>
                    <div className="grid md:grid-cols-2 gap-3">
                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-emerald-400/60 mb-1">Required</p>
                        <ul className="space-y-0.5">
                          {path.criteria.map((c, i) => (
                            <li key={i} className="text-[9px] text-slate-300 flex items-start gap-1">
                              <span className="text-emerald-400/40 shrink-0">{"\u2713"}</span>{c}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-red-400/60 mb-1">Blockers</p>
                        <ul className="space-y-0.5">
                          {path.blockers.map((b, i) => (
                            <li key={i} className="text-[9px] text-slate-300 flex items-start gap-1">
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
              <h3 className="text-xs font-semibold uppercase tracking-widest text-gold mb-3">
                Lil_Hawk Squads
              </h3>
              <div className="grid gap-4 lg:grid-cols-3">
                {LIL_HAWK_SQUADS.map((squad) => (
                  <div key={squad.name} className="rounded-2xl border border-wireframe-stroke bg-slate-100/60 p-4">
                    <p className="text-xs font-semibold text-gold">{squad.name}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{squad.purpose}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-[8px] uppercase tracking-wider text-slate-300">Squad Leader:</span>
                      <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[8px] font-bold text-emerald-400">
                        {squad.leaderRole}_LIL_HAWK
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-[8px] uppercase tracking-wider text-slate-300">Reports to:</span>
                      <span className="text-[9px] text-red-400/70 font-mono">{squad.reportsTo}</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {squad.hawks.map((hawk) => (
                        <span
                          key={hawk}
                          className={`rounded-full border px-2 py-0.5 text-[9px] font-mono ${
                            hawk === squad.leaderRole
                              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                              : "border-amber-50/10 bg-gold/10 text-slate-500"
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

      {/* ---- Section 1: Registered Agents (Live from House of Ang API) ---- */}
      <section className="rounded-3xl border border-wireframe-stroke bg-slate-50/70 p-6 backdrop-blur-2xl">
        <div className="flex items-center gap-3 mb-1">
          <Users size={16} className="text-gold" />
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-700 font-display">
            Registered Agents
          </h2>
        </div>
        <p className="text-[0.65rem] text-slate-400 uppercase tracking-wider mb-4">
          Live from House of Ang registry — real agents with real containers
        </p>

        {loading ? (
          <div className="flex items-center gap-2 py-8 justify-center">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-gold/30 border-t-gold" />
            <span className="text-xs text-slate-400">Loading registry...</span>
          </div>
        ) : agents.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-xs text-slate-400">No agents registered or House of Ang unreachable</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-wireframe-stroke">
                  <th className="pb-2 text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Agent</th>
                  <th className="pb-2 text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Description</th>
                  <th className="pb-2 text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Capabilities</th>
                  <th className="pb-2 text-[10px] uppercase tracking-widest text-slate-400 font-semibold text-right">Health</th>
                </tr>
              </thead>
              <tbody>
                {agents.map((ang) => (
                  <tr
                    key={ang.id}
                    className="border-b border-wireframe-stroke last:border-0 hover:bg-white transition-colors"
                  >
                    <td className="py-3 text-sm font-medium text-slate-800 font-mono">{ang.name}</td>
                    <td className="py-3 text-xs text-slate-500 max-w-xs truncate">{ang.description}</td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-1">
                        {ang.capabilities.slice(0, 3).map((cap) => (
                          <span key={cap} className="rounded-full border border-wireframe-stroke bg-slate-50 px-2 py-0.5 text-[9px] text-gold font-mono">
                            {cap}
                          </span>
                        ))}
                        {ang.capabilities.length > 3 && (
                          <span className="text-[9px] text-slate-300">+{ang.capabilities.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {ang.healthStatus === "online" ? (
                          <>
                            <Wifi size={12} className="text-emerald-400" />
                            <span className="text-[9px] uppercase font-bold tracking-wider text-emerald-400">Online</span>
                          </>
                        ) : (
                          <>
                            <WifiOff size={12} className="text-red-400/60" />
                            <span className="text-[9px] uppercase font-bold tracking-wider text-red-400/60">Offline</span>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ---- Section 2: Agent Cards (live from registry) ---- */}
      <section>
        <div className="flex items-center gap-3 mb-1">
          <Activity size={16} className="text-gold" />
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-700 font-display">
            Agent Detail Cards
          </h2>
        </div>
        <p className="text-[0.65rem] text-slate-400 uppercase tracking-wider mb-4">
          Live health + capability view for each registered Boomer_Ang
        </p>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {agents.map((ang) => (
            <div
              key={ang.id}
              className="group relative overflow-hidden rounded-3xl border border-wireframe-stroke bg-slate-50/70 p-6 backdrop-blur-2xl transition-all hover:bg-white/80 hover:border-gold/20"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-gold group-hover:bg-gold group-hover:text-black transition-colors">
                  <Code size={24} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-800">{ang.name}</h3>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          ang.healthStatus === "online" ? "bg-emerald-400 animate-pulse" : "bg-red-400/60"
                        }`}
                      />
                      <span
                        className={`text-[10px] uppercase font-bold tracking-wider ${
                          ang.healthStatus === "online" ? "text-emerald-400" : "text-red-400/60"
                        }`}
                      >
                        {ang.healthStatus}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{ang.description}</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {ang.capabilities.map((cap) => (
                  <span
                    key={cap}
                    className="rounded-full border border-wireframe-stroke bg-slate-50 px-2.5 py-1 text-[10px] text-slate-500"
                  >
                    {cap.replace(/_/g, " ")}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---- Section 3: Forged Boomerang + Canon ---- */}
      <section className="rounded-3xl border border-wireframe-stroke bg-slate-50/70 p-6 backdrop-blur-2xl">
        <div className="flex flex-col md:flex-row gap-6 items-center">
          <div className="w-40 h-40 rounded-2xl border border-gold/20 bg-slate-100/60 overflow-hidden shrink-0 flex items-center justify-center relative">
            <Image
              src="/images/acheevy/acheevy-helmet.png"
              alt="The Forged Boomerang — tool of the Angs"
              width={160}
              height={160}
              className="h-full w-full object-contain"
            />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-700 font-display mb-2">
              The Canon
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
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
          <Brain size={16} className="text-gold" />
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-700 font-display">
            Spawn Bay
          </h2>
        </div>
        <p className="text-[0.65rem] text-slate-400 uppercase tracking-wider mb-4">
          Agent fabrication &amp; deployment
        </p>

        <div
          className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-wireframe-stroke bg-slate-50/30 p-10 text-center transition-all hover:border-gold/20 cursor-pointer group"
          onClick={() => setSpawnOpen(!spawnOpen)}
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-dashed border-slate-200 text-slate-300 group-hover:border-gold/30 group-hover:text-gold transition-all">
            <Brain size={24} />
          </div>
          <p className="mt-4 text-lg font-semibold text-gold/50 group-hover:text-gold transition-colors">
            Spawn New Boomer_Ang
          </p>
          <p className="mt-2 text-xs text-slate-300 max-w-md">
            Define a custom agent with specific skills and routing rules.
            New Angs deploy from the House and integrate into the delegation chain.
          </p>

          {spawnOpen && (
            <div className="mt-6 w-full max-w-lg space-y-4 text-left animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-wider text-slate-400">Agent Name</label>
                <input
                  type="text"
                  placeholder="e.g. DesignerAng"
                  className="w-full rounded-xl border border-wireframe-stroke bg-white/80 p-2.5 text-sm text-slate-800 outline-none focus:border-gold/30 placeholder:text-slate-300"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-wider text-slate-400">Role / Specialization</label>
                <input
                  type="text"
                  placeholder="e.g. UI/UX Design Specialist"
                  className="w-full rounded-xl border border-wireframe-stroke bg-white/80 p-2.5 text-sm text-slate-800 outline-none focus:border-gold/30 placeholder:text-slate-300"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-wider text-slate-400">Routing Rules</label>
                <textarea
                  rows={3}
                  placeholder="Define when this agent should be invoked..."
                  className="w-full rounded-xl border border-wireframe-stroke bg-white/80 p-2.5 text-sm text-slate-800 outline-none focus:border-gold/30 placeholder:text-slate-300"
                />
              </div>
              <button className="rounded-full bg-gold px-6 py-2.5 text-xs font-bold text-black shadow-[0_0_15px_rgba(251,191,36,0.3)] transition-all hover:scale-105 active:scale-95">
                Deploy Agent
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
