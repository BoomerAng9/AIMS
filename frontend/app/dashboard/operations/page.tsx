// frontend/app/dashboard/operations/page.tsx
"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/motion";
import {
  Activity,
  Bell,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Server,
  Cpu,
  HardDrive,
  Wifi,
  BarChart3,
  TrendingUp,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type AlertSeverity = "critical" | "warning" | "info";
type IncidentSeverity = "P1" | "P2" | "P3" | "P4";
type IncidentStatus = "open" | "investigating" | "resolved";

interface ActiveAlert {
  id: string;
  severity: AlertSeverity;
  metric: string;
  threshold: string;
  current: string;
  fired: string;
}

interface Incident {
  id: string;
  severity: IncidentSeverity;
  title: string;
  status: IncidentStatus;
  created: string;
}

interface CorrelationTrace {
  correlationId: string;
  method: string;
  path: string;
  statusCode: number;
  duration: string;
}

/* ------------------------------------------------------------------ */
/*  Mock Data                                                          */
/* ------------------------------------------------------------------ */

const TOP_METRICS = [
  {
    label: "Uptime",
    value: "99.97%",
    sub: "Last 30 days",
    icon: Activity,
    color: "text-emerald-400",
    glow: "shadow-[0_0_20px_rgba(52,211,153,0.08)]",
    border: "border-emerald-400/20",
    bg: "bg-emerald-400/5",
  },
  {
    label: "Response Time",
    value: "142ms",
    sub: "Avg (p50)",
    icon: Clock,
    color: "text-gold",
    glow: "shadow-[0_0_20px_rgba(251,191,36,0.08)]",
    border: "border-gold/20",
    bg: "bg-gold/10",
  },
  {
    label: "Active Alerts",
    value: "1",
    sub: "1 warning, 0 critical",
    icon: Bell,
    color: "text-gold",
    glow: "shadow-[0_0_20px_rgba(251,191,36,0.08)]",
    border: "border-gold/20",
    bg: "bg-gold/10",
  },
  {
    label: "Requests / Min",
    value: "24",
    sub: "Current RPM",
    icon: BarChart3,
    color: "text-emerald-400",
    glow: "shadow-[0_0_20px_rgba(52,211,153,0.08)]",
    border: "border-emerald-400/20",
    bg: "bg-emerald-400/5",
  },
];

const ACTIVE_ALERTS: ActiveAlert[] = [
  {
    id: "ALR-0042",
    severity: "warning",
    metric: "Slow Response Time",
    threshold: "2000ms",
    current: "2300ms",
    fired: "2026-02-07T09:14:00Z",
  },
  {
    id: "ALR-0041",
    severity: "info",
    metric: "High Memory Usage",
    threshold: "80%",
    current: "72%",
    fired: "2026-02-07T08:30:00Z",
  },
];

const INCIDENTS: Incident[] = [
  {
    id: "INC-0019",
    severity: "P4",
    title: "Intermittent 502 on /api/health during deploy",
    status: "open",
    created: "2026-02-07T08:45:00Z",
  },
  {
    id: "INC-0018",
    severity: "P3",
    title: "Elevated latency on agent routing endpoint",
    status: "resolved",
    created: "2026-02-06T14:22:00Z",
  },
  {
    id: "INC-0017",
    severity: "P2",
    title: "Certificate renewal failed on secondary domain",
    status: "resolved",
    created: "2026-02-05T03:10:00Z",
  },
];

const CORRELATION_TRACES: CorrelationTrace[] = [
  { correlationId: "crr-a7f3e1d0-4b9c", method: "POST", path: "/api/agents/route", statusCode: 200, duration: "134ms" },
  { correlationId: "crr-b8d2c4e1-7a3f", method: "GET", path: "/api/health", statusCode: 200, duration: "12ms" },
  { correlationId: "crr-c9e5f2a3-8b1d", method: "POST", path: "/api/chat/completions", statusCode: 200, duration: "2301ms" },
  { correlationId: "crr-d0f6a3b4-9c2e", method: "GET", path: "/api/admin/models", statusCode: 200, duration: "45ms" },
  { correlationId: "crr-e1a7b4c5-0d3f", method: "POST", path: "/api/agents/route", statusCode: 429, duration: "8ms" },
  { correlationId: "crr-f2b8c5d6-1e4a", method: "GET", path: "/api/verticals", statusCode: 200, duration: "67ms" },
];

const SYSTEM_HEALTH = {
  cpu: { label: "CPU Usage", value: 23, unit: "%", icon: Cpu },
  memory: { label: "Memory", value: 512, max: 2048, unit: "MB", icon: Server },
  disk: { label: "Disk", value: 4.2, max: 40, unit: "GB", icon: HardDrive },
  network: { label: "Network", status: "Healthy", icon: Wifi },
};

const BACKUP_STATUS = {
  lastBackup: "2026-02-07T04:00:00Z",
  nextScheduled: "2026-02-08T04:00:00Z",
  integrityCheck: "passed",
  backupSize: "1.8 GB",
  retention: "30 days",
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function severityBadge(severity: AlertSeverity) {
  const map: Record<AlertSeverity, { bg: string; text: string; dot: string }> = {
    critical: { bg: "bg-red-500/10 border-red-500/20", text: "text-red-400", dot: "bg-red-400" },
    warning: { bg: "bg-gold/10 border-gold/20", text: "text-gold", dot: "bg-gold" },
    info: { bg: "bg-sky-400/10 border-sky-400/20", text: "text-sky-400", dot: "bg-sky-400" },
  };
  const s = map[severity];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${s.bg} ${s.text}`}>
      <span className={`h-1 w-1 rounded-full ${s.dot}`} />
      {severity}
    </span>
  );
}

function incidentSeverityBadge(severity: IncidentSeverity) {
  const map: Record<IncidentSeverity, string> = {
    P1: "bg-red-500/10 border-red-500/20 text-red-400",
    P2: "bg-orange-400/10 border-orange-400/20 text-orange-400",
    P3: "bg-gold/10 border-gold/20 text-gold",
    P4: "bg-sky-400/10 border-sky-400/20 text-sky-400",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${map[severity]}`}>
      {severity}
    </span>
  );
}

function statusBadge(status: IncidentStatus) {
  const map: Record<IncidentStatus, { bg: string; text: string; dot: string }> = {
    open: { bg: "bg-red-500/10 border-red-500/20", text: "text-red-400", dot: "bg-red-400 animate-pulse" },
    investigating: { bg: "bg-gold/10 border-gold/20", text: "text-gold", dot: "bg-gold animate-pulse" },
    resolved: { bg: "bg-emerald-400/10 border-emerald-400/20", text: "text-emerald-400", dot: "bg-emerald-400" },
  };
  const s = map[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${s.bg} ${s.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {status}
    </span>
  );
}

function httpStatusColor(code: number): string {
  if (code >= 200 && code < 300) return "text-emerald-400";
  if (code >= 300 && code < 400) return "text-sky-400";
  if (code >= 400 && code < 500) return "text-gold";
  return "text-red-400";
}

/* ------------------------------------------------------------------ */
/*  Progress Bar                                                       */
/* ------------------------------------------------------------------ */

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100);
  const barColor =
    pct > 80 ? "bg-red-400" : pct > 60 ? "bg-gold" : color;
  return (
    <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ${barColor}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

export default function OperationsPage() {
  const [activeTab, setActiveTab] = useState<"alerts" | "incidents" | "traces">("alerts");

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* ---- Header ---- */}
      <motion.section variants={staggerItem} className="rounded-3xl border border-gold/20 bg-gradient-to-r from-gold/10 via-black/80 to-black/60 p-6 shadow-[0_0_40px_rgba(251,191,36,0.08)]">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/10 border border-gold/20">
                <Activity size={14} className="text-gold" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white font-display">Operations</h1>
                <p className="text-[0.65rem] text-white/30 uppercase tracking-wider">
                  Platform health, alerts, incidents &amp; observability
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                All Systems Operational
              </span>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ---- Top Metrics Row ---- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {TOP_METRICS.map((metric) => (
          <motion.div
            key={metric.label}
            variants={staggerItem}
            whileHover={{ scale: 1.03, y: -2 }}
            className={`rounded-2xl border ${metric.border} ${metric.bg} p-5 ${metric.glow} backdrop-blur-2xl transition-all`}
          >
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40">
                {metric.label}
              </p>
              <metric.icon size={16} className={metric.color} />
            </div>
            <p className={`text-3xl font-bold mt-2 ${metric.color}`}>
              {metric.value}
            </p>
            <p className="text-[10px] text-white/20 mt-1">{metric.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* ---- Tabbed Section: Alerts / Incidents / Traces ---- */}
      <section className="rounded-3xl border border-wireframe-stroke bg-black/60 p-6 backdrop-blur-2xl">
        {/* Tab Navigation */}
        <div className="flex items-center gap-1 border-b border-wireframe-stroke pb-4 mb-6">
          {[
            { key: "alerts" as const, label: "Active Alerts", icon: AlertTriangle, count: ACTIVE_ALERTS.length },
            { key: "incidents" as const, label: "Incidents", icon: Bell, count: INCIDENTS.filter((i) => i.status !== "resolved").length },
            { key: "traces" as const, label: "Correlation IDs", icon: TrendingUp, count: CORRELATION_TRACES.length },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all ${
                activeTab === tab.key
                  ? "bg-gold/10 border border-gold/20 text-gold"
                  : "text-white/30 hover:text-white/50 hover:bg-white/5"
              }`}
            >
              <tab.icon size={14} />
              {tab.label}
              <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                activeTab === tab.key
                  ? "bg-gold/10 text-gold"
                  : "bg-white/5 text-white/20"
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Alerts Tab */}
        {activeTab === "alerts" && (
          <div className="space-y-3 animate-in fade-in duration-300">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={14} className="text-gold" />
              <h2 className="text-sm font-semibold uppercase tracking-widest text-white/80 font-display">
                Active Alerts
              </h2>
            </div>
            {ACTIVE_ALERTS.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-emerald-400/20 bg-emerald-400/5 p-8 text-center">
                <CheckCircle2 size={24} className="text-emerald-400 mx-auto mb-2" />
                <p className="text-sm text-emerald-400">No active alerts</p>
                <p className="text-[10px] text-white/20 mt-1">All metrics within thresholds</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-wireframe-stroke">
                      <th className="p-3 text-left text-[10px] uppercase tracking-widest text-white/30 font-semibold">ID</th>
                      <th className="p-3 text-left text-[10px] uppercase tracking-widest text-white/30 font-semibold">Severity</th>
                      <th className="p-3 text-left text-[10px] uppercase tracking-widest text-white/30 font-semibold">Metric</th>
                      <th className="p-3 text-left text-[10px] uppercase tracking-widest text-white/30 font-semibold">Threshold</th>
                      <th className="p-3 text-left text-[10px] uppercase tracking-widest text-white/30 font-semibold">Current</th>
                      <th className="p-3 text-left text-[10px] uppercase tracking-widest text-white/30 font-semibold">Fired</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ACTIVE_ALERTS.map((alert) => (
                      <tr key={alert.id} className="border-t border-wireframe-stroke hover:bg-white/[0.02] transition-colors">
                        <td className="p-3">
                          <code className="text-[10px] font-mono text-gold">{alert.id}</code>
                        </td>
                        <td className="p-3">{severityBadge(alert.severity)}</td>
                        <td className="p-3 text-xs font-medium text-white">{alert.metric}</td>
                        <td className="p-3">
                          <code className="rounded bg-black/60 border border-wireframe-stroke px-2 py-0.5 text-[10px] font-mono text-white/40">
                            {alert.threshold}
                          </code>
                        </td>
                        <td className="p-3">
                          <code className={`rounded bg-black/60 border border-wireframe-stroke px-2 py-0.5 text-[10px] font-mono ${
                            alert.severity === "critical" ? "text-red-400" : alert.severity === "warning" ? "text-gold" : "text-sky-400"
                          }`}>
                            {alert.current}
                          </code>
                        </td>
                        <td className="p-3 text-[10px] text-white/30">{formatTimestamp(alert.fired)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Incidents Tab */}
        {activeTab === "incidents" && (
          <div className="space-y-3 animate-in fade-in duration-300">
            <div className="flex items-center gap-2 mb-4">
              <Bell size={14} className="text-gold" />
              <h2 className="text-sm font-semibold uppercase tracking-widest text-white/80 font-display">
                Recent Incidents
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-wireframe-stroke">
                    <th className="p-3 text-left text-[10px] uppercase tracking-widest text-white/30 font-semibold">ID</th>
                    <th className="p-3 text-left text-[10px] uppercase tracking-widest text-white/30 font-semibold">Severity</th>
                    <th className="p-3 text-left text-[10px] uppercase tracking-widest text-white/30 font-semibold">Title</th>
                    <th className="p-3 text-left text-[10px] uppercase tracking-widest text-white/30 font-semibold">Status</th>
                    <th className="p-3 text-left text-[10px] uppercase tracking-widest text-white/30 font-semibold">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {INCIDENTS.map((inc) => (
                    <tr key={inc.id} className="border-t border-wireframe-stroke hover:bg-white/[0.02] transition-colors">
                      <td className="p-3">
                        <code className="text-[10px] font-mono text-gold">{inc.id}</code>
                      </td>
                      <td className="p-3">{incidentSeverityBadge(inc.severity)}</td>
                      <td className="p-3 text-xs font-medium text-white">{inc.title}</td>
                      <td className="p-3">{statusBadge(inc.status)}</td>
                      <td className="p-3 text-[10px] text-white/30">{formatTimestamp(inc.created)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Correlation IDs Tab */}
        {activeTab === "traces" && (
          <div className="space-y-3 animate-in fade-in duration-300">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={14} className="text-gold" />
              <h2 className="text-sm font-semibold uppercase tracking-widest text-white/80 font-display">
                Recent Request Traces
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-wireframe-stroke">
                    <th className="p-3 text-left text-[10px] uppercase tracking-widest text-white/30 font-semibold">Correlation ID</th>
                    <th className="p-3 text-left text-[10px] uppercase tracking-widest text-white/30 font-semibold">Method</th>
                    <th className="p-3 text-left text-[10px] uppercase tracking-widest text-white/30 font-semibold">Path</th>
                    <th className="p-3 text-center text-[10px] uppercase tracking-widest text-white/30 font-semibold">Status</th>
                    <th className="p-3 text-right text-[10px] uppercase tracking-widest text-white/30 font-semibold">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {CORRELATION_TRACES.map((trace) => (
                    <tr key={trace.correlationId} className="border-t border-wireframe-stroke hover:bg-white/[0.02] transition-colors">
                      <td className="p-3">
                        <code className="rounded bg-black/60 border border-wireframe-stroke px-2 py-0.5 text-[10px] font-mono text-gold">
                          {trace.correlationId}
                        </code>
                      </td>
                      <td className="p-3">
                        <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                          trace.method === "GET"
                            ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-400"
                            : trace.method === "POST"
                              ? "border-sky-400/20 bg-sky-400/10 text-sky-400"
                              : "border-gold/20 bg-gold/10 text-gold"
                        }`}>
                          {trace.method}
                        </span>
                      </td>
                      <td className="p-3">
                        <code className="text-xs font-mono text-white/50">{trace.path}</code>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`text-xs font-bold font-mono ${httpStatusColor(trace.statusCode)}`}>
                          {trace.statusCode}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <span className={`text-xs font-mono ${
                          parseInt(trace.duration) > 2000 ? "text-red-400" : parseInt(trace.duration) > 500 ? "text-gold" : "text-emerald-400"
                        }`}>
                          {trace.duration}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* ---- System Health + Backup ---- */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* System Health */}
        <section className="rounded-3xl border border-wireframe-stroke bg-black/60 p-6 backdrop-blur-2xl">
          <div className="flex items-center gap-2 mb-1">
            <Server size={14} className="text-gold" />
            <h2 className="text-sm font-semibold uppercase tracking-widest text-white/80 font-display">
              System Health
            </h2>
          </div>
          <p className="text-[0.65rem] text-white/30 uppercase tracking-wider mb-5">
            Infrastructure resource utilization
          </p>

          <div className="space-y-5">
            {/* CPU */}
            <div className="rounded-2xl border border-wireframe-stroke bg-black/40 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Cpu size={14} className="text-emerald-400" />
                  <span className="text-xs font-medium text-white">{SYSTEM_HEALTH.cpu.label}</span>
                </div>
                <span className="text-sm font-bold text-emerald-400">
                  {SYSTEM_HEALTH.cpu.value}{SYSTEM_HEALTH.cpu.unit}
                </span>
              </div>
              <ProgressBar value={SYSTEM_HEALTH.cpu.value} max={100} color="bg-emerald-400" />
              <p className="text-[9px] text-white/20 mt-1.5">4 vCPU cores available</p>
            </div>

            {/* Memory */}
            <div className="rounded-2xl border border-wireframe-stroke bg-black/40 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Server size={14} className="text-emerald-400" />
                  <span className="text-xs font-medium text-white">{SYSTEM_HEALTH.memory.label}</span>
                </div>
                <span className="text-sm font-bold text-emerald-400">
                  {SYSTEM_HEALTH.memory.value} / {SYSTEM_HEALTH.memory.max} {SYSTEM_HEALTH.memory.unit}
                </span>
              </div>
              <ProgressBar value={SYSTEM_HEALTH.memory.value} max={SYSTEM_HEALTH.memory.max} color="bg-emerald-400" />
              <p className="text-[9px] text-white/20 mt-1.5">
                {((SYSTEM_HEALTH.memory.value / SYSTEM_HEALTH.memory.max) * 100).toFixed(0)}% utilized
              </p>
            </div>

            {/* Disk */}
            <div className="rounded-2xl border border-wireframe-stroke bg-black/40 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <HardDrive size={14} className="text-emerald-400" />
                  <span className="text-xs font-medium text-white">{SYSTEM_HEALTH.disk.label}</span>
                </div>
                <span className="text-sm font-bold text-emerald-400">
                  {SYSTEM_HEALTH.disk.value} / {SYSTEM_HEALTH.disk.max} {SYSTEM_HEALTH.disk.unit}
                </span>
              </div>
              <ProgressBar value={SYSTEM_HEALTH.disk.value} max={SYSTEM_HEALTH.disk.max} color="bg-emerald-400" />
              <p className="text-[9px] text-white/20 mt-1.5">
                {((SYSTEM_HEALTH.disk.value / SYSTEM_HEALTH.disk.max) * 100).toFixed(1)}% utilized
              </p>
            </div>

            {/* Network */}
            <div className="rounded-2xl border border-wireframe-stroke bg-black/40 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wifi size={14} className="text-emerald-400" />
                  <span className="text-xs font-medium text-white">{SYSTEM_HEALTH.network.label}</span>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/10 border border-emerald-400/20 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {SYSTEM_HEALTH.network.status}
                </span>
              </div>
              <p className="text-[9px] text-white/20 mt-2">Latency: 1.2ms (internal), 24ms (edge)</p>
            </div>
          </div>
        </section>

        {/* Backup Status */}
        <section className="rounded-3xl border border-wireframe-stroke bg-black/60 p-6 backdrop-blur-2xl">
          <div className="flex items-center gap-2 mb-1">
            <HardDrive size={14} className="text-gold" />
            <h2 className="text-sm font-semibold uppercase tracking-widest text-white/80 font-display">
              Backup Status
            </h2>
          </div>
          <p className="text-[0.65rem] text-white/30 uppercase tracking-wider mb-5">
            Data protection &amp; disaster recovery
          </p>

          <div className="space-y-4">
            {/* Last Backup */}
            <div className="rounded-2xl border border-emerald-400/10 bg-emerald-400/5 p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 size={14} className="text-emerald-400" />
                <span className="text-xs font-semibold text-emerald-400">Last Backup Successful</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-white/30 mb-1">Completed</p>
                  <p className="text-sm font-medium text-white">{formatTimestamp(BACKUP_STATUS.lastBackup)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-white/30 mb-1">Size</p>
                  <p className="text-sm font-medium text-white">{BACKUP_STATUS.backupSize}</p>
                </div>
              </div>
            </div>

            {/* Next Scheduled */}
            <div className="rounded-2xl border border-wireframe-stroke bg-black/40 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock size={14} className="text-gold" />
                <span className="text-xs font-semibold text-gold">Next Scheduled</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-white/30 mb-1">Scheduled</p>
                  <p className="text-sm font-medium text-white">{formatTimestamp(BACKUP_STATUS.nextScheduled)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-white/30 mb-1">Retention</p>
                  <p className="text-sm font-medium text-white">{BACKUP_STATUS.retention}</p>
                </div>
              </div>
            </div>

            {/* Integrity Check */}
            <div className="rounded-2xl border border-wireframe-stroke bg-black/40 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-white/30 mb-1">Integrity Check</p>
                  <p className="text-xs text-white/40">SHA-256 checksum verification on latest snapshot</p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/10 border border-emerald-400/20 px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-emerald-400">
                  <CheckCircle2 size={10} />
                  {BACKUP_STATUS.integrityCheck}
                </span>
              </div>
            </div>

            {/* Backup Schedule Info */}
            <div className="rounded-2xl border border-dashed border-gold/20 bg-gold/[0.02] p-4">
              <p className="text-[10px] text-white/30 leading-relaxed">
                Automated daily backups run at <code className="text-gold">04:00 UTC</code> via cron.
                Snapshots include SQLite WAL checkpoints, configuration files, and agent state.
                Backups are retained for {BACKUP_STATUS.retention} with incremental deduplication.
                Restore procedure documented in <code className="text-gold">infra/runbooks/backup-restore.md</code>.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* ---- SOP Pillar Reference (P10, P12) ---- */}
      <section className="rounded-3xl border border-wireframe-stroke bg-black/60 p-6 backdrop-blur-2xl">
        <div className="flex items-center gap-2 mb-1">
          <BarChart3 size={14} className="text-gold" />
          <h2 className="text-sm font-semibold uppercase tracking-widest text-white/80 font-display">
            SOP Compliance
          </h2>
        </div>
        <p className="text-[0.65rem] text-white/30 uppercase tracking-wider mb-5">
          Operations pillars status
        </p>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { pillar: "P8", name: "Smoke Tests", status: "passing", detail: "31 tests, 3 suites" },
            { pillar: "P10", name: "Observability", status: "active", detail: "Alerts + Correlation IDs + Prometheus" },
            { pillar: "P11", name: "Release Management", status: "active", detail: "GitHub Actions CI/CD + rollback" },
            { pillar: "P12", name: "Backup & Incidents", status: "active", detail: "Daily backups + incident tracking" },
          ].map((p) => (
            <div key={p.pillar} className="rounded-2xl border border-wireframe-stroke bg-black/40 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="rounded-full bg-gold/10 border border-gold/20 px-2 py-0.5 text-[9px] font-bold text-gold uppercase tracking-wider">
                  {p.pillar}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 text-[9px] font-bold text-emerald-400 uppercase tracking-wider">
                  <span className="h-1 w-1 rounded-full bg-emerald-400" />
                  {p.status}
                </span>
              </div>
              <p className="text-xs font-semibold text-white">{p.name}</p>
              <p className="text-[10px] text-white/30 mt-0.5">{p.detail}</p>
            </div>
          ))}
        </div>
      </section>
    </motion.div>
  );
}
