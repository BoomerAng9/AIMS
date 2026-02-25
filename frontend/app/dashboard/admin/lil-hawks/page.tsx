"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import OwnerGate from "@/components/OwnerGate";
import Link from "next/link";
import {
  ArrowLeft,
  Bird,
  ShieldCheck,
  Loader2,
  Users,
  Shield,
  FileSearch,
  Workflow,
  Eye,
  Braces,
  ChevronDown,
  ChevronRight,
  Send,
  Terminal,
  CircleDot,
  RefreshCw,
  Sparkles,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

interface LilHawkDef {
  id: string;
  name: string;
  role: string;
  gate: boolean;
}

interface SquadDef {
  id: string;
  name: string;
  purpose: string;
  icon: React.ReactNode;
  accentColor: string;
  hawks: LilHawkDef[];
}

interface ActiveSquad {
  squad_id: string;
  shift_id: string;
  manifest_id: string;
  status: string;
  lil_hawks: Array<{
    id: string;
    moniker: string;
    persona_handle: string;
    status: string;
    task_id: string;
    output?: unknown;
    error?: string;
  }>;
  created_at: string;
}

interface RoleCard {
  name: string;
  callSign: string;
  function: string;
}

// ── Squad definitions (from backend types) ──────────────────────────────

const SQUAD_DEFS: SquadDef[] = [
  {
    id: "prep-squad-alpha",
    name: "PREP_SQUAD_ALPHA",
    purpose: "Pre-Execution Intelligence — Intake, decompose, context, policy, cost, route",
    icon: <FileSearch className="h-4 w-4" />,
    accentColor: "blue",
    hawks: [
      { id: "Lil_Intake_Hawk", name: "Lil_Intake_Hawk", role: "Intent ingestion & normalization", gate: false },
      { id: "Lil_Decomp_Hawk", name: "Lil_Decomp_Hawk", role: "Task decomposition — break into atomic objectives", gate: false },
      { id: "Lil_Context_Hawk", name: "Lil_Context_Hawk", role: "Context shaping — domains, scoped payload", gate: false },
      { id: "Lil_Policy_Hawk", name: "Lil_Policy_Hawk", role: "Governance & readiness gate — KYB, risk, sandbox", gate: true },
      { id: "Lil_Cost_Hawk", name: "Lil_Cost_Hawk", role: "Pre-cost intelligence — token class, depth estimate", gate: true },
      { id: "Lil_Router_Hawk", name: "Lil_Router_Hawk", role: "Final handoff — engine selection, Boomer_Ang assignment", gate: false },
    ],
  },
  {
    id: "workflow-smith",
    name: "WORKFLOW_SMITH_SQUAD",
    purpose: "n8n Workflow Integrity — Author, validate, hunt failures, gate",
    icon: <Workflow className="h-4 w-4" />,
    accentColor: "purple",
    hawks: [
      { id: "Lil_Author_Hawk", name: "Lil_Author_Hawk", role: "Designs n8n node graphs with params and connections", gate: false },
      { id: "Lil_Validate_Hawk", name: "Lil_Validate_Hawk", role: "Schema validator — configs, fields, type contracts", gate: true },
      { id: "Lil_Failure_Hawk", name: "Lil_Failure_Hawk", role: "Failure hunter — loops, rate-limit bombs, bad retries", gate: true },
      { id: "Lil_Gate_Hawk", name: "Lil_Gate_Hawk", role: "Final gate — deterministic + audited + versioned", gate: true },
    ],
  },
  {
    id: "vision-scout",
    name: "VISION_SCOUT_SQUAD",
    purpose: "Video/Footage Assessment — Extract observations, signal, compliance",
    icon: <Eye className="h-4 w-4" />,
    accentColor: "emerald",
    hawks: [
      { id: "Lil_Vision_Hawk", name: "Lil_Vision_Hawk", role: "Extracts observable events from footage", gate: false },
      { id: "Lil_Signal_Hawk", name: "Lil_Signal_Hawk", role: "Converts observations into structured film signals", gate: false },
      { id: "Lil_Compliance_Hawk", name: "Lil_Compliance_Hawk", role: "Safety/compliance — bad footage, wrong athlete, low confidence", gate: true },
    ],
  },
  {
    id: "json-expert",
    name: "JSON_EXPERT_SQUAD",
    purpose: "JSON Parsing/Transformation — Parse, transform, schema validation",
    icon: <Braces className="h-4 w-4" />,
    accentColor: "amber",
    hawks: [
      { id: "Lil_JSON_Parse_Hawk", name: "Lil_JSON_Parse_Hawk", role: "Validates, repairs, normalizes JSON payloads", gate: false },
      { id: "Lil_JSON_Transform_Hawk", name: "Lil_JSON_Transform_Hawk", role: "Converts between schemas, maps fields, restructures", gate: false },
      { id: "Lil_JSON_Schema_Hawk", name: "Lil_JSON_Schema_Hawk", role: "Generates JSON Schema, validates against specs", gate: true },
    ],
  },
];

const ROLE_CARDS: RoleCard[] = [
  { name: "Lil_Intake_Scribe_Hawk", callSign: "Scope it or shelve it", function: "Turns messy intent into structured intake packets" },
  { name: "Lil_Deploy_Handler_Hawk", callSign: "Green? Ship it. Red? Roll it", function: "Last mile between build and production" },
  { name: "Lil_Policy_Sentinel_Hawk", callSign: "Gate green. Cleared", function: "Stationed at every gate, enforces policy" },
  { name: "Lil_Webhook_Ferryman_Hawk", callSign: "Payload validated. Ferry departing", function: "Guardian of payload crossing" },
  { name: "Lil_Attestation_Hawk", callSign: "No proof, no done", function: "Evidence collection and attestation stamping" },
  { name: "Lil_Build_Surgeon_Hawk", callSign: "Cut clean, stitch tight", function: "Precision code surgery and build repair" },
  { name: "Lil_Chain_of_Custody_Hawk", callSign: "Tag it, track it, trust it", function: "Artifact chain-of-custody tracking" },
  { name: "Lil_Interface_Forge_Hawk", callSign: "Forge the face", function: "UI/UX component generation and styling" },
  { name: "Lil_Messenger_Hawk", callSign: "Word delivered", function: "Notification dispatch and message routing" },
  { name: "Lil_Motion_Tuner_Hawk", callSign: "Smooth like butter", function: "Animation timing and motion polish" },
  { name: "Lil_Proofrunner_Hawk", callSign: "Run it. Prove it", function: "Test execution and proof validation" },
  { name: "Lil_Secret_Keeper_Hawk", callSign: "Vault sealed", function: "Secrets management and credential rotation" },
  { name: "Lil_Workflow_Smith_Hawk", callSign: "Forge the flow", function: "Workflow authoring and pipeline assembly" },
];

const CREW_ROLES = [
  { role: "CraneOps", color: "text-blue-400", desc: "Heavy lifting — deployments, infrastructure" },
  { role: "YardOps", color: "text-emerald-400", desc: "Yard management — organizing, sorting, queuing" },
  { role: "SafetyOps", color: "text-red-400", desc: "Safety gates — compliance, validation, blocking" },
  { role: "LoadOps", color: "text-amber-400", desc: "Payload handling — data movement, transformation" },
  { role: "DispatchOps", color: "text-purple-400", desc: "Routing — dispatch decisions, handoffs" },
];

// ── Color helpers ──────────────────────────────────────────────────────────

function accentBorder(color: string) {
  const map: Record<string, string> = {
    blue: "border-blue-500/30",
    purple: "border-purple-500/30",
    emerald: "border-emerald-500/30",
    amber: "border-amber-500/30",
  };
  return map[color] || "border-wireframe-stroke";
}

function accentBg(color: string) {
  const map: Record<string, string> = {
    blue: "bg-blue-500/10",
    purple: "bg-purple-500/10",
    emerald: "bg-emerald-500/10",
    amber: "bg-amber-500/10",
  };
  return map[color] || "bg-[#1F1F23]/60";
}

function accentText(color: string) {
  const map: Record<string, string> = {
    blue: "text-blue-400",
    purple: "text-purple-400",
    emerald: "text-emerald-400",
    amber: "text-amber-400",
  };
  return map[color] || "text-zinc-400";
}

// ── Component ──────────────────────────────────────────────────────────────

function LilHawksControl() {
  const [loading, setLoading] = useState(true);
  const [activeSquads, setActiveSquads] = useState<ActiveSquad[]>([]);
  const [expandedSquads, setExpandedSquads] = useState<Set<string>>(new Set(["prep-squad-alpha"]));
  const [expandedRoleCards, setExpandedRoleCards] = useState(false);
  const [prepQuery, setPrepQuery] = useState("");
  const [prepRunning, setPrepRunning] = useState(false);
  const [prepOutput, setPrepOutput] = useState("");
  const outputRef = useRef<HTMLDivElement>(null);

  // ── Fetch active squads ─────────────────────────────────────────────────

  const fetchSquads = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/lil-hawks");
      const data = await res.json();
      setActiveSquads(data.activeSquads || []);
    } catch {
      setActiveSquads([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSquads();
    const interval = setInterval(fetchSquads, 30000);
    return () => clearInterval(interval);
  }, [fetchSquads]);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [prepOutput]);

  // ── Run PREP_SQUAD_ALPHA ────────────────────────────────────────────────

  const runPrepSquad = useCallback(async () => {
    if (!prepQuery.trim() || prepRunning) return;
    setPrepRunning(true);
    setPrepOutput("");

    try {
      const res = await fetch("/api/admin/lil-hawks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "run-prep-squad",
          query: prepQuery.trim(),
        }),
      });
      const data = await res.json();
      setPrepOutput(JSON.stringify(data, null, 2));
    } catch (err) {
      setPrepOutput(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setPrepRunning(false);
    }
  }, [prepQuery, prepRunning]);

  // ── Toggle squad ────────────────────────────────────────────────────────

  const toggleSquadDef = (id: string) => {
    setExpandedSquads((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ── Key handler ─────────────────────────────────────────────────────────

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      runPrepSquad();
    }
  };

  // ── Stats ───────────────────────────────────────────────────────────────

  const totalSquadHawks = SQUAD_DEFS.reduce((sum, s) => sum + s.hawks.length, 0);
  const totalGateHawks = SQUAD_DEFS.reduce((sum, s) => sum + s.hawks.filter((h) => h.gate).length, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Header */}
      <section className="rounded-3xl border border-cyan-500/30 bg-gradient-to-r from-cyan-500/5 to-white/80 p-6 shadow-[0_0_40px_rgba(6,182,212,0.08)]">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard/admin"
                className="rounded-full border border-wireframe-stroke p-1.5 hover:bg-white/10 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 text-zinc-400" />
              </Link>
              <span className="rounded-full bg-cyan-500/20 border border-cyan-500/30 px-2.5 py-0.5 text-[9px] font-bold text-cyan-400 uppercase tracking-wider">
                Owner Only
              </span>
              <h1 className="text-2xl font-bold text-zinc-100 font-display">
                Lil_Hawks Squad Control
              </h1>
            </div>
            <p className="mt-1 ml-[54px] text-xs text-zinc-500">
              Ephemeral task-scoped specialists — squads, role cards, crew designations.
              Gated via A.I.M.S. Gateway System.
            </p>
          </div>

          <button
            onClick={fetchSquads}
            disabled={loading}
            className="rounded-full border border-wireframe-stroke p-2 hover:bg-white/5 transition-colors disabled:opacity-40"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 text-zinc-400 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </section>

      {/* Gateway Badge */}
      <div className="flex items-center gap-2 px-1">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
        <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">
          A.I.M.S. Gateway System — OWNER access verified — Squad operations audit-logged
        </span>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-2xl border border-wireframe-stroke bg-[#18181B]/70 p-4 backdrop-blur-2xl">
          <p className="text-[10px] uppercase tracking-wider text-zinc-500">Squads</p>
          <p className="text-xl font-bold text-zinc-100 mt-1">{SQUAD_DEFS.length}</p>
          <p className="text-[9px] text-zinc-600 mt-0.5">Defined profiles</p>
        </div>
        <div className="rounded-2xl border border-wireframe-stroke bg-[#18181B]/70 p-4 backdrop-blur-2xl">
          <p className="text-[10px] uppercase tracking-wider text-zinc-500">Squad Hawks</p>
          <p className="text-xl font-bold text-zinc-100 mt-1">{totalSquadHawks}</p>
          <p className="text-[9px] text-zinc-600 mt-0.5">Across all squads</p>
        </div>
        <div className="rounded-2xl border border-wireframe-stroke bg-[#18181B]/70 p-4 backdrop-blur-2xl">
          <p className="text-[10px] uppercase tracking-wider text-zinc-500">Gate Hawks</p>
          <p className="text-xl font-bold text-red-400 mt-1">{totalGateHawks}</p>
          <p className="text-[9px] text-zinc-600 mt-0.5">Can block progression</p>
        </div>
        <div className="rounded-2xl border border-wireframe-stroke bg-[#18181B]/70 p-4 backdrop-blur-2xl">
          <p className="text-[10px] uppercase tracking-wider text-zinc-500">Role Cards</p>
          <p className="text-xl font-bold text-zinc-100 mt-1">{ROLE_CARDS.length}</p>
          <p className="text-[9px] text-zinc-600 mt-0.5">Governance roles</p>
        </div>
        <div className="rounded-2xl border border-wireframe-stroke bg-[#18181B]/70 p-4 backdrop-blur-2xl">
          <p className="text-[10px] uppercase tracking-wider text-zinc-500">Active</p>
          <p className="text-xl font-bold text-emerald-400 mt-1">{activeSquads.length}</p>
          <p className="text-[9px] text-zinc-600 mt-0.5">Running now</p>
        </div>
      </div>

      {/* Crew Roles */}
      <section className="rounded-3xl border border-wireframe-stroke bg-[#18181B]/70 p-6 backdrop-blur-2xl">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-200 font-display">
          Crew Roles
        </h2>
        <p className="mt-1 text-[0.65rem] text-zinc-500 uppercase tracking-wider">
          KYB crew role designations — each Lil_Hawk is assigned a crew role at spawn
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {CREW_ROLES.map((cr) => (
            <div key={cr.role} className="rounded-2xl border border-wireframe-stroke bg-[#1F1F23]/60 p-3 text-center">
              <p className={`text-xs font-bold ${cr.color}`}>{cr.role}</p>
              <p className="text-[9px] text-zinc-500 mt-1">{cr.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Squad Profiles */}
      <section className="rounded-3xl border border-wireframe-stroke bg-[#18181B]/70 p-6 backdrop-blur-2xl">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-200 font-display">
          Squad Profiles
        </h2>
        <p className="mt-1 text-[0.65rem] text-zinc-500 uppercase tracking-wider">
          Defined hawk squads — click to expand and see individual hawks
        </p>

        <div className="mt-4 space-y-3">
          {SQUAD_DEFS.map((squad) => (
            <div
              key={squad.id}
              className={`rounded-2xl border ${accentBorder(squad.accentColor)} bg-[#1F1F23]/60 overflow-hidden`}
            >
              <button
                onClick={() => toggleSquadDef(squad.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-[#111113] transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  {expandedSquads.has(squad.id) ? (
                    <ChevronDown className={`h-4 w-4 ${accentText(squad.accentColor)}`} />
                  ) : (
                    <ChevronRight className={`h-4 w-4 ${accentText(squad.accentColor)}`} />
                  )}
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${accentBg(squad.accentColor)} border ${accentBorder(squad.accentColor)} ${accentText(squad.accentColor)}`}>
                    {squad.icon}
                  </div>
                  <div>
                    <p className={`text-xs font-semibold ${accentText(squad.accentColor)}`}>
                      {squad.name}
                    </p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">{squad.purpose}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-zinc-500 font-mono">{squad.hawks.length} hawks</span>
                  <span className="text-[10px] text-red-400/60 font-mono">
                    {squad.hawks.filter((h) => h.gate).length} gates
                  </span>
                </div>
              </button>

              {expandedSquads.has(squad.id) && (
                <div className="border-t border-wireframe-stroke px-4 pb-4">
                  <div className="mt-3 space-y-2">
                    {squad.hawks.map((hawk, idx) => (
                      <div
                        key={hawk.id}
                        className="flex items-center justify-between rounded-xl border border-wireframe-stroke bg-[#18181B]/50 px-3 py-2.5"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#111113] border border-wireframe-stroke">
                            <span className="text-[9px] font-mono text-zinc-500">{idx + 1}</span>
                          </div>
                          <Bird className={`h-3.5 w-3.5 flex-shrink-0 ${accentText(squad.accentColor)}`} />
                          <div className="min-w-0">
                            <p className="text-[11px] font-semibold text-zinc-200">{hawk.name}</p>
                            <p className="text-[9px] text-zinc-500 mt-0.5">{hawk.role}</p>
                          </div>
                        </div>
                        {hawk.gate && (
                          <span className="flex-shrink-0 flex items-center gap-1 rounded-full bg-red-500/10 border border-red-500/20 px-2 py-0.5 text-[8px] font-bold text-red-400 uppercase">
                            <Shield className="h-2.5 w-2.5" />
                            Gate
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                  {squad.id === "prep-squad-alpha" && (
                    <div className="mt-3 rounded-xl border border-dashed border-blue-500/20 bg-blue-500/[0.03] p-3">
                      <p className="text-[10px] text-blue-400/70">
                        Execution order: Intake → Decomp → Context → Policy [GATE] → Cost [GATE] → Router
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Run PREP_SQUAD_ALPHA */}
      <section className="rounded-3xl border border-blue-500/20 bg-[#18181B]/70 p-6 backdrop-blur-2xl">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-200 font-display">
          Run PREP_SQUAD_ALPHA
        </h2>
        <p className="mt-1 text-[0.65rem] text-zinc-500 uppercase tracking-wider">
          Pre-execution intelligence pipeline — normalizes intent, decomposes tasks, checks policy, estimates cost
        </p>
        <div className="mt-3">
          <textarea
            value={prepQuery}
            onChange={(e) => setPrepQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter raw query to run through PREP_SQUAD_ALPHA..."
            disabled={prepRunning}
            rows={3}
            className="w-full rounded-2xl border border-wireframe-stroke bg-[#1F1F23]/80 px-4 py-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/20 disabled:opacity-50 resize-none"
          />
          <div className="mt-3 flex items-center justify-between">
            <span className="text-[10px] text-zinc-600 font-mono">
              {prepRunning ? "Running prep squad..." : "Cmd+Enter to run"}
            </span>
            <button
              onClick={runPrepSquad}
              disabled={prepRunning || !prepQuery.trim()}
              className="flex items-center gap-2 rounded-full bg-blue-500 px-5 py-2 text-xs font-semibold text-white shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:bg-blue-400 active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none"
            >
              {prepRunning ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              {prepRunning ? "Running..." : "Run Prep Squad"}
            </button>
          </div>
        </div>
      </section>

      {/* Prep Output */}
      {prepOutput && (
        <section className="rounded-3xl border border-wireframe-stroke bg-[#18181B]/70 p-6 backdrop-blur-2xl">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-zinc-500" />
            <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-200 font-display">
              Prep Squad Output
            </h2>
          </div>
          <div
            ref={outputRef}
            className="mt-3 max-h-[400px] overflow-y-auto rounded-2xl border border-wireframe-stroke bg-[#0D0D0F] p-4 font-mono text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap"
          >
            {prepOutput}
          </div>
        </section>
      )}

      {/* Active Squads from Chicken Hawk */}
      {activeSquads.length > 0 && (
        <section className="rounded-3xl border border-wireframe-stroke bg-[#18181B]/70 p-6 backdrop-blur-2xl">
          <div className="flex items-center gap-2">
            <CircleDot className="h-4 w-4 text-emerald-400 animate-pulse" />
            <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-200 font-display">
              Live Squads
            </h2>
          </div>
          <p className="mt-1 text-[0.65rem] text-zinc-500 uppercase tracking-wider">
            Active squads spawned by Chicken Hawk
          </p>
          <div className="mt-4 space-y-2">
            {activeSquads.map((squad) => (
              <div key={squad.squad_id} className="rounded-2xl border border-emerald-500/20 bg-[#1F1F23]/60 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-zinc-200 font-mono">{squad.squad_id}</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">
                      {squad.lil_hawks?.length || 0} hawks | Shift: {squad.shift_id}
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 text-[9px] font-bold uppercase">
                    {squad.status}
                  </span>
                </div>
                {squad.lil_hawks && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {squad.lil_hawks.map((hawk) => (
                      <span
                        key={hawk.id}
                        className={`rounded-full border px-2 py-0.5 text-[8px] font-mono ${
                          hawk.status === "executing"
                            ? "border-amber-500/20 bg-amber-500/10 text-amber-400"
                            : hawk.status === "ready"
                              ? "border-blue-500/20 bg-blue-500/10 text-blue-400"
                              : "border-wireframe-stroke bg-[#18181B]/50 text-zinc-500"
                        }`}
                      >
                        {hawk.moniker} [{hawk.status}]
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Role Cards */}
      <section className="rounded-3xl border border-wireframe-stroke bg-[#18181B]/70 p-6 backdrop-blur-2xl">
        <button
          onClick={() => setExpandedRoleCards(!expandedRoleCards)}
          className="w-full flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-zinc-400" />
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-200 font-display">
                Governance Role Cards
              </h2>
              <p className="mt-1 text-[0.65rem] text-zinc-500 uppercase tracking-wider">
                {ROLE_CARDS.length} specialized Lil_Hawk roles from chain-of-command
              </p>
            </div>
          </div>
          {expandedRoleCards ? (
            <ChevronDown className="h-4 w-4 text-zinc-500" />
          ) : (
            <ChevronRight className="h-4 w-4 text-zinc-500" />
          )}
        </button>

        {expandedRoleCards && (
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {ROLE_CARDS.map((card) => (
              <div
                key={card.name}
                className="rounded-2xl border border-wireframe-stroke bg-[#1F1F23]/60 p-3"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-cyan-400 flex-shrink-0" />
                  <p className="text-[11px] font-semibold text-zinc-200 truncate">{card.name}</p>
                </div>
                <p className="text-[9px] text-zinc-500 mt-1.5">{card.function}</p>
                <p className="text-[8px] text-cyan-400/60 font-mono mt-1 italic">
                  &ldquo;{card.callSign}&rdquo;
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Chain of Command */}
      <section className="rounded-3xl border border-dashed border-wireframe-stroke bg-[#18181B]/30 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-400 font-display">
          Chain of Command
        </h2>
        <div className="mt-4 flex items-center justify-center">
          <div className="flex items-center gap-3 text-[10px] font-mono text-zinc-500">
            <span className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-2.5 py-1 text-amber-400">ACHEEVY</span>
            <span className="text-zinc-600">→</span>
            <span className="rounded-lg border border-purple-500/20 bg-purple-500/5 px-2.5 py-1 text-purple-400">Boomer_Ang</span>
            <span className="text-zinc-600">→</span>
            <span className="rounded-lg border border-orange-500/20 bg-orange-500/5 px-2.5 py-1 text-orange-400">Chicken Hawk</span>
            <span className="text-zinc-600">→</span>
            <span className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-2.5 py-1 text-cyan-400">Lil_Hawks</span>
          </div>
        </div>
        <p className="mt-3 text-center text-[9px] text-zinc-600">
          Lil_Hawks can ONLY message Chicken Hawk — never ACHEEVY, never users directly
        </p>
      </section>
    </div>
  );
}

// ── Page Export (Owner-Gated) ──────────────────────────────────────────────

export default function LilHawksPage() {
  return (
    <OwnerGate>
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <LilHawksControl />
      </div>
    </OwnerGate>
  );
}
