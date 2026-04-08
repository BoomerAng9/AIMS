"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import OwnerGate from "@/components/OwnerGate";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Activity,
  ShieldCheck,
  Loader2,
  AlertTriangle,
  XOctagon,
  Zap,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Radio,
  Eye,
  EyeOff,
  Gauge,
  Shield,
  Timer,
  Layers,
  Cpu,
  Server,
  SendHorizonal,
  Bird,
} from "lucide-react";
import { duration, easing } from "@/lib/motion/tokens";

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
    memory_agents?: number;
    llm_provider?: string;
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

interface SSEEvent {
  id: string;
  type: string;
  ts: string;
  data: Record<string, unknown>;
}

// ── Motion ─────────────────────────────────────────────────────────────────

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: duration.slow, ease: easing.enter },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.06 } },
};

// ── Capabilities ─────────────────────────────────────────────────────────

const CAPABILITIES = [
  { name: "Pipeline Execution", weight: 1.0, icon: Layers },
  { name: "Code Ang Sandbox", weight: 1.0, icon: Cpu },
  { name: "Lil_Hawk Delegation", weight: 0.95, icon: Bird },
  { name: "Job Deployment", weight: 0.90, icon: Server },
  { name: "Persistent Memory", weight: 0.85, icon: Activity },
  { name: "Plug Shipping", weight: 0.95, icon: SendHorizonal },
  { name: "Cost Tracking", weight: 0.90, icon: Timer },
  { name: "ORACLE 7-Gate", weight: 1.0, icon: ShieldCheck },
];

// ── Event colors ─────────────────────────────────────────────────────────

function eventColor(type: string): string {
  if (["connected", "heartbeat"].includes(type)) return "border-zinc-700/60 text-zinc-500";
  if (["squad_spawned", "lil_hawk_spawned"].includes(type)) return "border-signal-blue/30 text-signal-blue";
  if (["task_started", "manifest_received"].includes(type)) return "border-gold/30 text-gold-light";
  if (["task_completed", "shift_completed"].includes(type)) return "border-signal-green/30 text-signal-green";
  if (type === "oracle_verification") return "border-purple-500/30 text-purple-400";
  if (["task_failed", "shift_failed", "budget_exceeded", "error"].includes(type)) return "border-signal-red/30 text-signal-red";
  return "border-wireframe-stroke text-muted";
}

// ── Status dot ────────────────────────────────────────────────────────────

function Dot({ on, pulse }: { on: boolean; pulse?: boolean }) {
  return (
    <span className="relative flex h-2 w-2">
      {on && pulse && (
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-signal-green opacity-40" />
      )}
      <span className={`relative inline-flex h-2 w-2 rounded-full ${on ? "bg-signal-green" : "bg-zinc-600"}`} />
    </span>
  );
}

// ── Glass card ────────────────────────────────────────────────────────────

function Glass({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      variants={fadeUp}
      className={`rounded-2xl border border-wireframe-stroke bg-surface-raised/70 backdrop-blur-2xl ${className}`}
    >
      {children}
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────────────────────

function ChickenHawkControl() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [taskQuery, setTaskQuery] = useState("");
  const [taskOutput, setTaskOutput] = useState("");
  const [showRawOutput, setShowRawOutput] = useState(false);
  const [expandedSquads, setExpandedSquads] = useState<Set<string>>(new Set());
  const [emergencyStopping, setEmergencyStopping] = useState(false);
  const [sseConnected, setSSEConnected] = useState(false);
  const [liveEvents, setLiveEvents] = useState<SSEEvent[]>([]);
  const outputRef = useRef<HTMLDivElement>(null);
  const eventFeedRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const eventIdCounter = useRef(0);

  // ── Fetch health ──────────────────────────────────────────────────────

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

  // ── SSE ───────────────────────────────────────────────────────────────

  useEffect(() => {
    fetchHealth();
    const es = new EventSource("/api/admin/chicken-hawk/events");
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        eventIdCounter.current++;
        const sseEvent: SSEEvent = {
          id: `evt-${eventIdCounter.current}`,
          type: data.type || "unknown",
          ts: data.ts || new Date().toISOString(),
          data,
        };
        setLiveEvents((prev) => [...prev, sseEvent].slice(-100));
        if (data.type === "connected") setSSEConnected(true);
      } catch { /* non-JSON */ }
    };

    es.onerror = () => setSSEConnected(false);
    return () => { es.close(); eventSourceRef.current = null; };
  }, [fetchHealth]);

  // ── Auto-scroll feeds ─────────────────────────────────────────────────

  useEffect(() => { eventFeedRef.current?.scrollTo(0, eventFeedRef.current.scrollHeight); }, [liveEvents]);
  useEffect(() => { outputRef.current?.scrollTo(0, outputRef.current.scrollHeight); }, [taskOutput]);

  // ── Execute ───────────────────────────────────────────────────────────

  const executeTask = useCallback(async () => {
    if (!taskQuery.trim() || executing) return;
    setExecuting(true);
    setTaskOutput("");
    try {
      const res = await fetch("/api/admin/chicken-hawk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "execute", query: taskQuery.trim(), intent: "AGENTIC_WORKFLOW" }),
      });
      const data = await res.json();
      setTaskOutput(JSON.stringify(data, null, 2));
      fetchHealth();
    } catch (err) {
      setTaskOutput(`Error: ${err instanceof Error ? err.message : "Unknown"}`);
    } finally {
      setExecuting(false);
    }
  }, [taskQuery, executing, fetchHealth]);

  // ── Emergency stop ────────────────────────────────────────────────────

  const emergencyStop = useCallback(async () => {
    if (!window.confirm("EMERGENCY STOP — Terminate ALL active squads and Lil_Hawks. Proceed?")) return;
    setEmergencyStopping(true);
    try {
      const res = await fetch("/api/admin/chicken-hawk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "emergency-stop" }),
      });
      const data = await res.json();
      setTaskOutput(`EMERGENCY STOP:\n${JSON.stringify(data, null, 2)}`);
      fetchHealth();
    } catch (err) {
      setTaskOutput(`Stop error: ${err instanceof Error ? err.message : "Unknown"}`);
    } finally {
      setEmergencyStopping(false);
    }
  }, [fetchHealth]);

  // ── Helpers ───────────────────────────────────────────────────────────

  const toggleSquad = (id: string) => {
    setExpandedSquads((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); executeTask(); }
  };

  // ── Derived ───────────────────────────────────────────────────────────

  const standaloneOn = health?.standalone?.connected === true;
  const inProcessOn = health?.inProcess?.connected === true;
  const uptime = health?.standalone?.health?.uptime_seconds;
  const squads = health?.standalone?.status?.active_squads || [];
  const completedManifests = health?.standalone?.status?.completed_manifests || 0;
  const bufferedEvents = health?.standalone?.status?.buffered_audit_events || 0;
  const adapters = health?.standalone?.status?.registered_adapters || [];
  const memoryAgents = health?.standalone?.status?.memory_agents || 0;
  const llmProvider = health?.standalone?.status?.llm_provider || "—";

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <motion.div
      className="space-y-6"
      initial="initial"
      animate="animate"
      variants={stagger}
    >
      {/* ─── Hero Header ─────────────────────────────────────────────── */}
      <motion.section
        variants={fadeUp}
        className="relative overflow-hidden rounded-3xl border border-gold/20 bg-gradient-to-br from-gold-dim via-surface-raised to-surface p-6 md:p-8"
      >
        {/* Glow accent */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gold/5 blur-3xl" />

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          {/* Left: mascot + title */}
          <div className="flex items-center gap-5">
            <div className="relative flex-shrink-0">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-gold/30 to-gold-dark/10 blur-md" />
              <Image
                src="/images/chicken-hawk.png"
                alt="Chicken Hawk"
                width={80}
                height={80}
                className="relative rounded-2xl"
                priority
              />
            </div>

            <div>
              <div className="flex items-center gap-2.5">
                <Link
                  href="/dashboard/admin"
                  className="rounded-full border border-wireframe-stroke p-1.5 transition-colors hover:border-wireframe-hover"
                >
                  <ArrowLeft className="h-3.5 w-3.5 text-muted" />
                </Link>
                <h1 className="text-xl font-bold text-frosty-white font-display tracking-wide sm:text-2xl">
                  Chicken Hawk
                </h1>
                <span className="rounded-full border border-gold/30 bg-gold-dim px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-gold-light">
                  Owner
                </span>
              </div>
              <p className="mt-1 text-xs text-muted max-w-md">
                Execution engine — pipeline orchestration, squad management, ORACLE-verified output.
              </p>
            </div>
          </div>

          {/* Right: status lights + refresh */}
          <div className="flex items-center gap-4 self-start sm:self-center">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <Dot on={standaloneOn} />
                <span className="text-[10px] font-mono uppercase text-muted">Core</span>
              </div>
              <div className="flex items-center gap-2">
                <Dot on={inProcessOn} />
                <span className="text-[10px] font-mono uppercase text-muted">In-Process</span>
              </div>
              <div className="flex items-center gap-2">
                <Dot on={sseConnected} pulse />
                <span className="text-[10px] font-mono uppercase text-muted">SSE Live</span>
              </div>
            </div>

            <button
              onClick={fetchHealth}
              disabled={loading}
              className="rounded-xl border border-wireframe-stroke p-2.5 transition-colors hover:border-wireframe-hover disabled:opacity-40"
              title="Refresh"
            >
              <RefreshCw className={`h-4 w-4 text-muted ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Gateway badge */}
        <div className="mt-4 flex items-center gap-2">
          <ShieldCheck className="h-3 w-3 text-signal-green" />
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted">
            A.I.M.S. Gateway — Owner verified — Audit-logged
          </span>
        </div>
      </motion.section>

      {/* ─── Metric Strip ────────────────────────────────────────────── */}
      <motion.div variants={stagger} className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Uptime", value: uptime != null ? `${Math.floor(uptime / 60)}m ${Math.round(uptime % 60)}s` : "—", sub: standaloneOn ? "Running" : "Offline" },
          { label: "Active Squads", value: String(squads.length), sub: "Currently executing" },
          { label: "Completed", value: String(completedManifests), sub: "Manifests done" },
          { label: "Audit Buffer", value: String(bufferedEvents), sub: "Events queued" },
        ].map((m) => (
          <Glass key={m.label} className="p-4">
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted">{m.label}</p>
            <p className="mt-1 text-2xl font-bold text-frosty-white font-display">{m.value}</p>
            <p className="mt-0.5 text-[10px] text-zinc-600">{m.sub}</p>
          </Glass>
        ))}
      </motion.div>

      {/* ─── Policy Snapshot ─────────────────────────────────────────── */}
      <Glass className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Gauge className="h-4 w-4 text-gold-light" />
          <h2 className="text-xs font-bold uppercase tracking-widest text-frosty-white font-display">
            Circuit Box — Policy
          </h2>
        </div>

        <div className="grid gap-2.5 grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Shield, color: "text-gold-light", label: "Autonomy", value: "Supervised" },
            { icon: Timer, color: "text-signal-green", label: "Budget Cap", value: "$10.00" },
            { icon: Layers, color: "text-signal-blue", label: "Concurrency", value: "5 tasks" },
            { icon: XOctagon, color: "text-signal-green", label: "Kill Switch", value: "Inactive" },
          ].map((p) => (
            <div key={p.label} className="rounded-xl border border-wireframe-stroke bg-surface/60 p-3">
              <div className="flex items-center gap-2">
                <p.icon className={`h-3.5 w-3.5 ${p.color}`} />
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted">{p.label}</span>
              </div>
              <p className="mt-1.5 text-sm font-semibold text-frosty-white">{p.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-2.5 grid gap-2.5 grid-cols-2">
          <div className="rounded-xl border border-wireframe-stroke bg-surface/60 p-3">
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted">LLM Provider</span>
            <p className="mt-1 text-sm font-mono text-zinc-300">{llmProvider}</p>
          </div>
          <div className="rounded-xl border border-wireframe-stroke bg-surface/60 p-3">
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted">Memory Agents</span>
            <p className="mt-1 text-sm font-mono text-zinc-300">{memoryAgents} stored</p>
          </div>
        </div>
      </Glass>

      {/* ─── Live Event Feed ─────────────────────────────────────────── */}
      <Glass className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Radio className={`h-4 w-4 ${sseConnected ? "text-signal-green animate-pulse" : "text-zinc-600"}`} />
            <h2 className="text-xs font-bold uppercase tracking-widest text-frosty-white font-display">
              Live Feed
            </h2>
            <span className="rounded-full bg-surface px-2 py-0.5 text-[9px] font-mono text-muted">
              {liveEvents.length}
            </span>
          </div>
          {liveEvents.length > 0 && (
            <button onClick={() => setLiveEvents([])} className="text-[10px] text-muted hover:text-zinc-300 transition-colors uppercase tracking-wider">
              Clear
            </button>
          )}
        </div>

        <div ref={eventFeedRef} className="max-h-64 overflow-y-auto space-y-1">
          {liveEvents.length === 0 ? (
            <div className="rounded-xl border border-dashed border-wireframe-stroke p-8 text-center">
              <Radio className="h-5 w-5 text-zinc-700 mx-auto mb-2" />
              <p className="text-xs text-zinc-600">
                {sseConnected ? "Listening for events..." : "Connecting to SSE stream..."}
              </p>
            </div>
          ) : (
            liveEvents.map((evt) => (
              <div key={evt.id} className={`flex items-center gap-3 rounded-lg border px-3 py-1.5 bg-surface/40 ${eventColor(evt.type)}`}>
                <span className="text-[9px] font-mono text-zinc-600 whitespace-nowrap">
                  {new Date(evt.ts).toLocaleTimeString()}
                </span>
                <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider ${eventColor(evt.type)} bg-transparent`}>
                  {evt.type.replace(/_/g, " ")}
                </span>
                <span className="text-[11px] text-zinc-400 truncate">
                  {evt.type === "heartbeat"
                    ? `squads: ${evt.data.active_squads ?? "?"}, buffered: ${evt.data.buffered_events ?? "?"}`
                    : evt.type === "connected"
                      ? `Connected to ${String(evt.data.service || "core")}`
                      : evt.data.lil_hawk_id
                        ? `${String(evt.data.moniker || evt.data.lil_hawk_id)} — ${String(evt.data.status || "")}`
                        : evt.data.squad_id
                          ? `${String(evt.data.squad_id)} — ${String(evt.data.status || "")}`
                          : String(evt.data.message || JSON.stringify(evt.data).slice(0, 80))
                  }
                </span>
              </div>
            ))
          )}
        </div>
      </Glass>

      {/* ─── Capabilities ────────────────────────────────────────────── */}
      <Glass className="p-5">
        <h2 className="text-xs font-bold uppercase tracking-widest text-frosty-white font-display">
          Capabilities
        </h2>
        <p className="mt-1 text-[10px] text-muted uppercase tracking-wider">
          Confidence-weighted skill profile
        </p>

        <div className="mt-4 grid gap-2 grid-cols-2 lg:grid-cols-4">
          {CAPABILITIES.map((cap) => {
            const Icon = cap.icon;
            return (
              <div key={cap.name} className="flex items-center gap-3 rounded-xl border border-wireframe-stroke bg-surface/60 p-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gold/20 bg-gold-dim text-gold-light">
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-medium text-zinc-200 truncate">{cap.name}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="h-1 flex-1 rounded-full bg-surface">
                      <div className="h-1 rounded-full bg-gradient-to-r from-gold to-gold-light" style={{ width: `${cap.weight * 100}%` }} />
                    </div>
                    <span className="text-[9px] font-mono text-muted">{Math.round(cap.weight * 100)}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Glass>

      {/* ─── Adapters ────────────────────────────────────────────────── */}
      {adapters.length > 0 && (
        <Glass className="p-5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-frosty-white font-display mb-3">
            Registered Adapters
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {adapters.map((a) => (
              <span key={a} className="rounded-full border border-wireframe-stroke bg-surface/60 px-2.5 py-1 text-[10px] font-mono text-zinc-400">
                {a}
              </span>
            ))}
          </div>
        </Glass>
      )}

      {/* ─── Active Squads ───────────────────────────────────────────── */}
      <Glass className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-frosty-white font-display">
              Active Squads
            </h2>
            <p className="mt-0.5 text-[10px] text-muted">
              Live Lil_Hawk squads under Chicken Hawk command
            </p>
          </div>
          {squads.length > 0 && (
            <button
              onClick={emergencyStop}
              disabled={emergencyStopping}
              className="flex items-center gap-1.5 rounded-xl border border-signal-red/30 bg-signal-red/5 px-3 py-2 text-[11px] font-semibold text-signal-red transition-colors hover:bg-signal-red/10 disabled:opacity-40"
            >
              {emergencyStopping ? <Loader2 className="h-3 w-3 animate-spin" /> : <XOctagon className="h-3 w-3" />}
              Stop All
            </button>
          )}
        </div>

        {squads.length === 0 ? (
          <div className="rounded-xl border border-dashed border-wireframe-stroke p-10 text-center">
            <Image
              src="/images/chicken-hawk.png"
              alt="Chicken Hawk idle"
              width={56}
              height={56}
              className="mx-auto mb-3 opacity-30 grayscale"
            />
            <p className="text-sm text-muted">No active squads</p>
            <p className="mt-1 text-[10px] text-zinc-600">
              Squads spawn when manifests are submitted for execution
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {squads.map((squad) => (
              <div key={squad.squad_id} className="rounded-xl border border-wireframe-stroke bg-surface/60 overflow-hidden">
                <button
                  onClick={() => toggleSquad(squad.squad_id)}
                  className="flex w-full items-center justify-between p-3.5 text-left transition-colors hover:bg-surface-elevated/40"
                >
                  <div className="flex items-center gap-2.5">
                    {expandedSquads.has(squad.squad_id)
                      ? <ChevronDown className="h-3.5 w-3.5 text-muted" />
                      : <ChevronRight className="h-3.5 w-3.5 text-muted" />}
                    <div>
                      <p className="text-[11px] font-semibold text-zinc-200 font-mono">{squad.squad_id}</p>
                      <p className="text-[10px] text-zinc-600 mt-0.5">
                        {squad.manifest_id} · {squad.shift_id}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-[10px] text-muted font-mono">{squad.lil_hawks?.length || 0} hawks</span>
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase border ${
                      squad.status === "active"
                        ? "border-signal-green/30 bg-signal-green/10 text-signal-green"
                        : squad.status === "completed"
                          ? "border-signal-blue/30 bg-signal-blue/10 text-signal-blue"
                          : "border-signal-red/30 bg-signal-red/10 text-signal-red"
                    }`}>
                      {squad.status}
                    </span>
                  </div>
                </button>

                <AnimatePresence>
                  {expandedSquads.has(squad.squad_id) && squad.lil_hawks && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: duration.normal, ease: easing.standard }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-wireframe-stroke px-3.5 pb-3.5 pt-2 space-y-1.5">
                        {squad.lil_hawks.map((hawk) => (
                          <div key={hawk.id} className="flex items-center justify-between rounded-lg border border-wireframe-stroke bg-surface/50 px-3 py-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <Bird className="h-3 w-3 text-gold-light shrink-0" />
                              <div className="min-w-0">
                                <p className="text-[11px] font-semibold text-zinc-200 truncate">{hawk.moniker}</p>
                                <p className="text-[9px] text-zinc-600 font-mono truncate">
                                  {hawk.persona_handle} · {hawk.task_id}
                                </p>
                              </div>
                            </div>
                            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[8px] font-bold uppercase ${
                              hawk.status === "executing"
                                ? "bg-gold-dim text-gold-light border border-gold/20"
                                : hawk.status === "ready"
                                  ? "bg-signal-blue/10 text-signal-blue border border-signal-blue/20"
                                  : hawk.status === "terminated"
                                    ? "bg-zinc-800 text-zinc-500 border border-zinc-700"
                                    : "bg-signal-green/10 text-signal-green border border-signal-green/20"
                            }`}>
                              {hawk.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        )}
      </Glass>

      {/* ─── Direct Execution ────────────────────────────────────────── */}
      <Glass className="p-5">
        <h2 className="text-xs font-bold uppercase tracking-widest text-frosty-white font-display">
          Direct Execution
        </h2>
        <p className="mt-1 text-[10px] text-muted uppercase tracking-wider mb-3">
          Route a task through Chicken Hawk
        </p>

        <textarea
          value={taskQuery}
          onChange={(e) => setTaskQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe the workflow or pipeline to execute..."
          disabled={executing}
          rows={3}
          className="w-full rounded-xl border border-wireframe-stroke bg-surface px-4 py-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-gold/40 focus:outline-none focus:ring-1 focus:ring-gold/20 disabled:opacity-50 resize-none"
        />

        <div className="mt-3 flex items-center justify-between">
          <span className="text-[10px] text-zinc-600 font-mono">
            {executing ? "Executing..." : "Ctrl+Enter to send"}
          </span>
          <button
            onClick={executeTask}
            disabled={executing || !taskQuery.trim()}
            className="flex h-10 items-center gap-2 rounded-xl bg-gold px-5 text-xs font-bold text-obsidian shadow-[0_0_20px_rgba(217,119,6,0.25)] transition-all hover:bg-gold-light active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none"
          >
            {executing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
            {executing ? "Running..." : "Execute"}
          </button>
        </div>
      </Glass>

      {/* ─── Output Panel ────────────────────────────────────────────── */}
      <AnimatePresence>
        {taskOutput && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: duration.normal, ease: easing.enter }}
          >
            <Glass className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-bold uppercase tracking-widest text-frosty-white font-display">
                  Execution Output
                </h2>
                <button
                  onClick={() => setShowRawOutput(!showRawOutput)}
                  className="flex items-center gap-1.5 text-[10px] text-muted hover:text-zinc-300 transition-colors uppercase tracking-wider"
                >
                  {showRawOutput ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  {showRawOutput ? "Parsed" : "Raw"}
                </button>
              </div>

              {showRawOutput ? (
                <div ref={outputRef} className="max-h-96 overflow-y-auto rounded-xl border border-wireframe-stroke bg-obsidian p-4 font-mono text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed">
                  {taskOutput}
                </div>
              ) : (() => {
                try {
                  const p = JSON.parse(taskOutput);
                  return (
                    <div className="space-y-2">
                      {p.status && (
                        <div className={`rounded-xl border px-3 py-2 text-xs font-semibold uppercase tracking-wider ${
                          p.status === "completed" || p.status === "success"
                            ? "border-signal-green/30 bg-signal-green/5 text-signal-green"
                            : p.status === "failed"
                              ? "border-signal-red/30 bg-signal-red/5 text-signal-red"
                              : "border-gold/30 bg-gold-dim text-gold-light"
                        }`}>
                          Status: {p.status}
                        </div>
                      )}
                      {p.wave_results?.map((wave: { wave_id: number; status: string; duration_ms: number; task_results: Array<{ task_id: string; status: string; duration_ms: number; luc_cost_usd: number }> }, i: number) => (
                        <div key={i} className="rounded-xl border border-wireframe-stroke bg-surface/40 p-3">
                          <p className="text-[11px] font-semibold text-zinc-300">
                            Wave {wave.wave_id} — <span className={wave.status === "success" ? "text-signal-green" : "text-signal-red"}>{wave.status}</span> ({wave.duration_ms}ms)
                          </p>
                          <div className="mt-2 space-y-1">
                            {wave.task_results?.map((t) => (
                              <div key={t.task_id} className="flex items-center justify-between text-[10px]">
                                <span className="font-mono text-zinc-400">{t.task_id}</span>
                                <div className="flex items-center gap-3">
                                  <span className="text-zinc-600">{t.duration_ms}ms</span>
                                  <span className="text-zinc-600">${t.luc_cost_usd?.toFixed(4)}</span>
                                  <span className={`font-bold uppercase ${t.status === "success" ? "text-signal-green" : "text-signal-red"}`}>
                                    {t.status}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                      {p.total_luc_cost_usd !== undefined && (
                        <div className="flex items-center justify-between rounded-xl border border-wireframe-stroke bg-surface/40 px-3 py-2 text-xs">
                          <span className="text-muted uppercase tracking-wider">Total Cost</span>
                          <span className="font-mono text-frosty-white">${p.total_luc_cost_usd?.toFixed(4)}</span>
                        </div>
                      )}
                      {p.error && (
                        <div className="rounded-xl border border-signal-red/30 bg-signal-red/5 px-3 py-2 text-xs text-signal-red">
                          {p.error}
                        </div>
                      )}
                    </div>
                  );
                } catch {
                  return (
                    <div className="rounded-xl border border-wireframe-stroke bg-obsidian p-4 font-mono text-xs text-zinc-300 whitespace-pre-wrap">
                      {taskOutput}
                    </div>
                  );
                }
              })()}
            </Glass>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Emergency Controls ───────────────────────────────────────── */}
      <motion.section
        variants={fadeUp}
        className="rounded-2xl border border-signal-red/15 bg-signal-red/[0.03] p-5"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-signal-red/80 font-display">
              Emergency Controls
            </h2>
            <p className="mt-0.5 text-[10px] text-signal-red/30 uppercase tracking-wider">
              Kill switch — terminates all squads and Lil_Hawks
            </p>
          </div>
          <button
            onClick={emergencyStop}
            disabled={emergencyStopping}
            className="flex h-10 items-center gap-2 rounded-xl border border-signal-red/30 px-4 text-xs font-semibold text-signal-red transition-colors hover:bg-signal-red/10 disabled:opacity-40"
          >
            {emergencyStopping ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <AlertTriangle className="h-3.5 w-3.5" />}
            Emergency Stop All
          </button>
        </div>
      </motion.section>
    </motion.div>
  );
}

// ── Page Export ──────────────────────────────────────────────────────────────

export default function ChickenHawkPage() {
  return (
    <OwnerGate>
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:py-8">
        <ChickenHawkControl />
      </div>
    </OwnerGate>
  );
}
