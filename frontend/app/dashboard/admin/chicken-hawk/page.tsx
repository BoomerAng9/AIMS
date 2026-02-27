"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import OwnerGate from "@/components/OwnerGate";
import Link from "next/link";
import {
  ArrowLeft,
  Bird,
  Activity,
  ShieldCheck,
  Loader2,
  AlertTriangle,
  OctagonX,
  Layers,
  Cpu,
  Timer,
  Zap,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  CircleDot,
  Server,
  SendHorizonal,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

interface StandaloneStatus {
  connected: boolean;
  health: {
    status: string;
    service: string;
    version: string;
    uptime_seconds: number;
  } | null;
  status: {
    active_squads: Array<{
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
      }>;
      created_at: string;
    }>;
    completed_manifests: number;
    buffered_audit_events: number;
    registered_adapters: string[];
  } | null;
}

interface InProcessStatus {
  connected: boolean;
  status: unknown;
}

interface HealthData {
  standalone: StandaloneStatus;
  inProcess: InProcessStatus;
  timestamp: string;
  error?: string;
}

// ── Capabilities ─────────────────────────────────────────────────────────

const CAPABILITIES = [
  { name: "Pipeline Execution", weight: 1.0, icon: <Layers className="h-3.5 w-3.5" /> },
  { name: "Shelf Walking", weight: 1.0, icon: <Server className="h-3.5 w-3.5" /> },
  { name: "Step Sequencing", weight: 0.95, icon: <Zap className="h-3.5 w-3.5" /> },
  { name: "Cost Tracking", weight: 0.90, icon: <Timer className="h-3.5 w-3.5" /> },
  { name: "Lil_Hawk Delegation", weight: 0.95, icon: <Bird className="h-3.5 w-3.5" /> },
  { name: "Cross-Repo Operations", weight: 0.90, icon: <Cpu className="h-3.5 w-3.5" /> },
  { name: "Workflow Wiring", weight: 0.85, icon: <Activity className="h-3.5 w-3.5" /> },
  { name: "Plug Shipping", weight: 0.95, icon: <SendHorizonal className="h-3.5 w-3.5" /> },
];

// ── Component ──────────────────────────────────────────────────────────────

function ChickenHawkControl() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [taskQuery, setTaskQuery] = useState("");
  const [taskOutput, setTaskOutput] = useState("");
  const [expandedSquads, setExpandedSquads] = useState<Set<string>>(new Set());
  const [emergencyStopping, setEmergencyStopping] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);

  // ── Fetch health ────────────────────────────────────────────────────────

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/chicken-hawk");
      const data = await res.json();
      setHealth(data);
    } catch {
      setHealth({
        standalone: { connected: false, health: null, status: null },
        inProcess: { connected: false, status: null },
        timestamp: new Date().toISOString(),
        error: "Cannot reach API",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  // ── Auto-scroll ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [taskOutput]);

  // ── Execute task ────────────────────────────────────────────────────────

  const executeTask = useCallback(async () => {
    if (!taskQuery.trim() || executing) return;
    setExecuting(true);
    setTaskOutput("");

    try {
      const res = await fetch("/api/admin/chicken-hawk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "execute",
          query: taskQuery.trim(),
          intent: "AGENTIC_WORKFLOW",
        }),
      });

      const data = await res.json();
      setTaskOutput(JSON.stringify(data, null, 2));
      fetchHealth();
    } catch (err) {
      setTaskOutput(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setExecuting(false);
    }
  }, [taskQuery, executing, fetchHealth]);

  // ── Emergency stop ──────────────────────────────────────────────────────

  const emergencyStop = useCallback(async () => {
    if (!window.confirm("EMERGENCY STOP — This will terminate ALL active squads and running tasks. Proceed?")) return;
    setEmergencyStopping(true);
    try {
      const res = await fetch("/api/admin/chicken-hawk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "emergency-stop" }),
      });
      const data = await res.json();
      setTaskOutput(`EMERGENCY STOP executed:\n${JSON.stringify(data, null, 2)}`);
      fetchHealth();
    } catch (err) {
      setTaskOutput(`Emergency stop error: ${err instanceof Error ? err.message : "Unknown"}`);
    } finally {
      setEmergencyStopping(false);
    }
  }, [fetchHealth]);

  // ── Toggle squad expand ─────────────────────────────────────────────────

  const toggleSquad = (squadId: string) => {
    setExpandedSquads((prev) => {
      const next = new Set(prev);
      if (next.has(squadId)) next.delete(squadId);
      else next.add(squadId);
      return next;
    });
  };

  // ── Key handler ─────────────────────────────────────────────────────────

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      executeTask();
    }
  };

  // ── Derived state ───────────────────────────────────────────────────────

  const standaloneConnected = health?.standalone?.connected === true;
  const inProcessConnected = health?.inProcess?.connected === true;
  const uptime = health?.standalone?.health?.uptime_seconds;
  const activeSquads = health?.standalone?.status?.active_squads || [];
  const completedManifests = health?.standalone?.status?.completed_manifests || 0;
  const bufferedEvents = health?.standalone?.status?.buffered_audit_events || 0;
  const adapters = health?.standalone?.status?.registered_adapters || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Header */}
      <section className="rounded-3xl border border-orange-500/30 bg-gradient-to-r from-orange-500/5 to-white/80 p-6 shadow-[0_0_40px_rgba(249,115,22,0.08)]">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard/admin"
                className="rounded-full border border-wireframe-stroke p-1.5 hover:bg-white/10 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 text-zinc-400" />
              </Link>
              <span className="rounded-full bg-orange-500/20 border border-orange-500/30 px-2.5 py-0.5 text-[9px] font-bold text-orange-400 uppercase tracking-wider">
                Owner Only
              </span>
              <h1 className="text-2xl font-bold text-zinc-100 font-display">
                Chicken Hawk Control
              </h1>
            </div>
            <p className="mt-1 ml-[54px] text-xs text-zinc-500">
              Major Executor — Pipeline execution, squad management, shelf walking.
              Gated via A.I.M.S. Gateway System.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchHealth}
              disabled={loading}
              className="rounded-full border border-wireframe-stroke p-2 hover:bg-white/5 transition-colors disabled:opacity-40"
              title="Refresh status"
            >
              <RefreshCw className={`h-4 w-4 text-zinc-400 ${loading ? "animate-spin" : ""}`} />
            </button>

            {/* Connection indicators */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${standaloneConnected ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" : "bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.5)]"}`} />
                <span className="text-[9px] font-mono text-zinc-500 uppercase">Standalone</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${inProcessConnected ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" : "bg-zinc-600"}`} />
                <span className="text-[9px] font-mono text-zinc-500 uppercase">In-Process</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Gateway Badge */}
      <div className="flex items-center gap-2 px-1">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
        <span className="text-xs text-zinc-500 uppercase tracking-wider font-mono">
          A.I.M.S. Gateway System — OWNER access verified — All operations audit-logged
        </span>
      </div>

      {/* Status Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-wireframe-stroke bg-[#18181B]/70 p-4 backdrop-blur-2xl">
          <p className="text-xs uppercase tracking-wider text-zinc-500">Uptime</p>
          <p className="text-xl font-bold text-zinc-100 mt-1">
            {uptime != null ? `${Math.floor(uptime / 60)}m ${uptime % 60}s` : "—"}
          </p>
          <p className="text-[9px] text-zinc-600 mt-0.5">
            {standaloneConnected ? "Service running" : "Not connected"}
          </p>
        </div>
        <div className="rounded-2xl border border-wireframe-stroke bg-[#18181B]/70 p-4 backdrop-blur-2xl">
          <p className="text-xs uppercase tracking-wider text-zinc-500">Active Squads</p>
          <p className="text-xl font-bold text-zinc-100 mt-1">{activeSquads.length}</p>
          <p className="text-[9px] text-zinc-600 mt-0.5">Currently running</p>
        </div>
        <div className="rounded-2xl border border-wireframe-stroke bg-[#18181B]/70 p-4 backdrop-blur-2xl">
          <p className="text-xs uppercase tracking-wider text-zinc-500">Completed</p>
          <p className="text-xl font-bold text-zinc-100 mt-1">{completedManifests}</p>
          <p className="text-[9px] text-zinc-600 mt-0.5">Manifests executed</p>
        </div>
        <div className="rounded-2xl border border-wireframe-stroke bg-[#18181B]/70 p-4 backdrop-blur-2xl">
          <p className="text-xs uppercase tracking-wider text-zinc-500">Audit Buffer</p>
          <p className="text-xl font-bold text-zinc-100 mt-1">{bufferedEvents}</p>
          <p className="text-[9px] text-zinc-600 mt-0.5">Events queued</p>
        </div>
      </div>

      {/* Capabilities */}
      <section className="rounded-3xl border border-wireframe-stroke bg-[#18181B]/70 p-6 backdrop-blur-2xl">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-200 font-display">
          Capabilities
        </h2>
        <p className="mt-1 text-[0.65rem] text-zinc-500 uppercase tracking-wider">
          Confidence-weighted skill profile
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {CAPABILITIES.map((cap) => (
            <div key={cap.name} className="flex items-center gap-3 rounded-2xl border border-wireframe-stroke bg-[#1F1F23]/60 p-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
                {cap.icon}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-zinc-200 truncate">{cap.name}</p>
                <div className="mt-1 flex items-center gap-2">
                  <div className="h-1 flex-1 rounded-full bg-[#111113]">
                    <div
                      className="h-1 rounded-full bg-gradient-to-r from-orange-500 to-amber-400"
                      style={{ width: `${cap.weight * 100}%` }}
                    />
                  </div>
                  <span className="text-[9px] font-mono text-zinc-500">{Math.round(cap.weight * 100)}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Registered Adapters */}
      {adapters.length > 0 && (
        <section className="rounded-3xl border border-wireframe-stroke bg-[#18181B]/70 p-6 backdrop-blur-2xl">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-200 font-display">
            Registered Adapters
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {adapters.map((adapter) => (
              <span
                key={adapter}
                className="rounded-full border border-wireframe-stroke bg-[#1F1F23]/60 px-3 py-1 text-xs font-mono text-zinc-400"
              >
                {adapter}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Active Squads */}
      <section className="rounded-3xl border border-wireframe-stroke bg-[#18181B]/70 p-6 backdrop-blur-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-200 font-display">
              Active Squads
            </h2>
            <p className="mt-1 text-[0.65rem] text-zinc-500 uppercase tracking-wider">
              Live Lil_Hawk squads under Chicken Hawk command
            </p>
          </div>
          {activeSquads.length > 0 && (
            <button
              onClick={emergencyStop}
              disabled={emergencyStopping}
              className="flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-40"
            >
              {emergencyStopping ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <OctagonX className="h-3 w-3" />
              )}
              Emergency Stop
            </button>
          )}
        </div>

        <div className="mt-4">
          {activeSquads.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-wireframe-stroke bg-[#18181B]/30 p-8 text-center">
              <Bird className="h-8 w-8 text-zinc-600 mx-auto mb-2" />
              <p className="text-sm text-zinc-500">No active squads</p>
              <p className="text-xs text-zinc-600 mt-1">
                Squads are spawned when manifests are submitted for execution
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeSquads.map((squad) => (
                <div
                  key={squad.squad_id}
                  className="rounded-2xl border border-wireframe-stroke bg-[#1F1F23]/60 overflow-hidden"
                >
                  <button
                    onClick={() => toggleSquad(squad.squad_id)}
                    className="w-full flex items-center justify-between p-4 hover:bg-[#111113] transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      {expandedSquads.has(squad.squad_id) ? (
                        <ChevronDown className="h-4 w-4 text-zinc-500" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-zinc-500" />
                      )}
                      <div>
                        <p className="text-xs font-semibold text-zinc-200 font-mono">{squad.squad_id}</p>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          Manifest: {squad.manifest_id} | Shift: {squad.shift_id}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-zinc-500 font-mono">
                        {squad.lil_hawks?.length || 0} hawks
                      </span>
                      <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                        squad.status === "active"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : squad.status === "completed"
                            ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                            : "bg-red-500/10 text-red-400 border border-red-500/20"
                      }`}>
                        {squad.status}
                      </span>
                    </div>
                  </button>

                  {expandedSquads.has(squad.squad_id) && squad.lil_hawks && (
                    <div className="border-t border-wireframe-stroke px-4 pb-4">
                      <div className="mt-3 space-y-2">
                        {squad.lil_hawks.map((hawk) => (
                          <div
                            key={hawk.id}
                            className="flex items-center justify-between rounded-xl border border-wireframe-stroke bg-[#18181B]/50 px-3 py-2"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <Bird className="h-3.5 w-3.5 text-orange-400 flex-shrink-0" />
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-zinc-200 truncate">{hawk.moniker}</p>
                                <p className="text-[9px] text-zinc-600 font-mono truncate">
                                  {hawk.persona_handle} | Task: {hawk.task_id}
                                </p>
                              </div>
                            </div>
                            <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[8px] font-bold uppercase ${
                              hawk.status === "executing"
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                : hawk.status === "ready"
                                  ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                  : hawk.status === "terminated"
                                    ? "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20"
                                    : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            }`}>
                              {hawk.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Direct Execution */}
      <section className="rounded-3xl border border-wireframe-stroke bg-[#18181B]/70 p-6 backdrop-blur-2xl">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-200 font-display">
          Direct Execution
        </h2>
        <p className="mt-1 text-[0.65rem] text-zinc-500 uppercase tracking-wider">
          Route a task through the in-process Chicken Hawk agent
        </p>
        <div className="mt-3">
          <textarea
            value={taskQuery}
            onChange={(e) => setTaskQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe the workflow or pipeline to execute..."
            disabled={executing}
            rows={3}
            className="w-full rounded-2xl border border-wireframe-stroke bg-[#1F1F23]/80 px-4 py-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-orange-500/50 focus:outline-none focus:ring-1 focus:ring-orange-500/20 disabled:opacity-50 resize-none"
          />
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-zinc-600 font-mono">
              {executing ? "Executing pipeline..." : "Cmd+Enter to execute"}
            </span>
            <button
              onClick={executeTask}
              disabled={executing || !taskQuery.trim()}
              className="flex items-center gap-2 rounded-full bg-orange-500 px-5 py-2 text-xs font-semibold text-black shadow-[0_0_15px_rgba(249,115,22,0.3)] hover:bg-orange-400 active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none"
            >
              {executing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Zap className="h-3.5 w-3.5" />
              )}
              {executing ? "Running..." : "Execute"}
            </button>
          </div>
        </div>
      </section>

      {/* Output Panel */}
      {taskOutput && (
        <section className="rounded-3xl border border-wireframe-stroke bg-[#18181B]/70 p-6 backdrop-blur-2xl">
          <div className="flex items-center gap-2">
            <CircleDot className="h-4 w-4 text-zinc-500" />
            <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-200 font-display">
              Execution Output
            </h2>
          </div>
          <div
            ref={outputRef}
            className="mt-3 max-h-[400px] overflow-y-auto rounded-2xl border border-wireframe-stroke bg-[#0D0D0F] p-4 font-mono text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap"
          >
            {taskOutput}
          </div>
        </section>
      )}

      {/* Emergency Stop (standalone section) */}
      <section className="rounded-3xl border border-red-500/20 bg-red-500/5 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-widest text-red-400/90 font-display">
              Emergency Controls
            </h2>
            <p className="mt-1 text-[0.65rem] text-red-400/40 uppercase tracking-wider">
              Kill switch — terminates all active squads and running Lil_Hawks
            </p>
          </div>
          <button
            onClick={emergencyStop}
            disabled={emergencyStopping}
            className="flex items-center gap-2 rounded-full border border-red-500/30 px-4 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40"
          >
            {emergencyStopping ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <AlertTriangle className="h-3.5 w-3.5" />
            )}
            Emergency Stop All
          </button>
        </div>
      </section>
    </div>
  );
}

// ── Page Export (Owner-Gated) ──────────────────────────────────────────────

export default function ChickenHawkPage() {
  return (
    <OwnerGate>
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <ChickenHawkControl />
      </div>
    </OwnerGate>
  );
}
