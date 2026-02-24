// frontend/app/dashboard/operations/page.tsx
"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/motion/variants";
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
  TrendingDown,
  Zap,
  Eye,
  Radio,
  ShieldCheck,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Circle,
} from "lucide-react";
import { LiveOpsTheater } from "@/components/deploy-platform/LiveOpsTheater";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
} from "recharts";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type AlertSeverity = "critical" | "warning" | "info";
type IncidentSeverity = "P1" | "P2" | "P3" | "P4";
type IncidentStatus = "open" | "investigating" | "resolved";
type TimeRange = "1h" | "6h" | "24h" | "7d" | "30d";

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
  duration?: string;
}

interface CorrelationTrace {
  correlationId: string;
  method: string;
  path: string;
  statusCode: number;
  duration: string;
  timestamp: string;
}

interface ServiceHealth {
  name: string;
  status: "healthy" | "degraded" | "down";
  uptime: number;
  latency: number;
  requests: number;
  errors: number;
  lastCheck: string;
}

/* ------------------------------------------------------------------ */
/*  Data Generation — Simulated Telemetry                              */
/* ------------------------------------------------------------------ */

function generateTimeSeriesData(points: number, baseValue: number, variance: number, trend: number = 0) {
  const now = Date.now();
  return Array.from({ length: points }, (_, i) => {
    const t = now - (points - 1 - i) * 60000;
    const noise = (Math.random() - 0.5) * variance;
    const trendValue = trend * (i / points);
    const spike = Math.random() > 0.92 ? variance * 1.5 : 0;
    return {
      time: new Date(t).toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" }),
      value: Math.max(0, Math.round((baseValue + noise + trendValue + spike) * 100) / 100),
      timestamp: t,
    };
  });
}

function generateRequestData(points: number) {
  const now = Date.now();
  return Array.from({ length: points }, (_, i) => {
    const t = now - (points - 1 - i) * 60000;
    const hour = new Date(t).getHours();
    const peakMultiplier = hour >= 9 && hour <= 17 ? 1.5 : hour >= 22 || hour <= 5 ? 0.4 : 1;
    return {
      time: new Date(t).toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" }),
      "2xx": Math.round((18 + Math.random() * 12) * peakMultiplier),
      "4xx": Math.round((1 + Math.random() * 3) * peakMultiplier),
      "5xx": Math.random() > 0.85 ? Math.round(1 + Math.random() * 2) : 0,
    };
  });
}

function generateServiceHealth(): ServiceHealth[] {
  return [
    { name: "Frontend", status: "healthy", uptime: 99.99, latency: 24, requests: 1847, errors: 2, lastCheck: "3s ago" },
    { name: "UEF Gateway", status: "healthy", uptime: 99.97, latency: 8, requests: 3241, errors: 5, lastCheck: "1s ago" },
    { name: "ACHEEVY", status: "healthy", uptime: 99.95, latency: 142, requests: 892, errors: 3, lastCheck: "2s ago" },
    { name: "House of Ang", status: "healthy", uptime: 99.98, latency: 12, requests: 456, errors: 0, lastCheck: "1s ago" },
    { name: "Agent Bridge", status: "healthy", uptime: 99.99, latency: 5, requests: 1203, errors: 1, lastCheck: "1s ago" },
    { name: "Redis", status: "healthy", uptime: 100, latency: 1, requests: 8920, errors: 0, lastCheck: "1s ago" },
    { name: "n8n", status: "degraded", uptime: 98.2, latency: 340, requests: 124, errors: 8, lastCheck: "5s ago" },
    { name: "Nginx", status: "healthy", uptime: 99.99, latency: 2, requests: 5102, errors: 0, lastCheck: "1s ago" },
    { name: "Circuit Metrics", status: "healthy", uptime: 99.9, latency: 18, requests: 2100, errors: 1, lastCheck: "2s ago" },
    { name: "ii-Agent", status: "healthy", uptime: 99.8, latency: 45, requests: 312, errors: 2, lastCheck: "4s ago" },
  ];
}

/**
 * Fetch real service health from backend, fallback to generated data.
 */
async function fetchServiceHealthFromAPI(): Promise<ServiceHealth[]> {
  try {
    const res = await fetch("/api/operations/services");
    if (res.ok) {
      const data = await res.json();
      if (data.services?.length > 0) return data.services;
    }
  } catch { /* Backend unreachable — use generated data */ }
  return generateServiceHealth();
}

/**
 * Fetch real alerts from backend, fallback to static data.
 */
async function fetchAlertsFromAPI(): Promise<{ active: ActiveAlert[]; history: unknown[] }> {
  try {
    const res = await fetch("/api/operations/alerts");
    if (res.ok) {
      const data = await res.json();
      if (!data.fallback) return data;
    }
  } catch { /* Backend unreachable */ }
  return { active: ACTIVE_ALERTS, history: [] };
}

/**
 * Hook: Periodically refreshes service health (real API → fallback).
 */
function useServiceHealth() {
  const [services, setServices] = useState<ServiceHealth[]>(() => generateServiceHealth());
  const [isLiveData, setIsLiveData] = useState(false);

  useEffect(() => {
    let mounted = true;
    const refresh = async () => {
      const result = await fetchServiceHealthFromAPI();
      if (mounted) {
        setServices(result);
        // Check if we got real data (latency field set by real check will differ from static)
        setIsLiveData(result.some(s => s.lastCheck === "just now"));
      }
    };
    refresh();
    const interval = setInterval(refresh, 15000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  return { services, isLiveData };
}

/**
 * Hook: Fetches real alerts from backend with periodic refresh.
 */
function useLiveAlerts() {
  const [alerts, setAlerts] = useState<ActiveAlert[]>(ACTIVE_ALERTS);

  useEffect(() => {
    let mounted = true;
    const refresh = async () => {
      const data = await fetchAlertsFromAPI();
      if (mounted && data.active.length > 0) setAlerts(data.active);
    };
    refresh();
    const interval = setInterval(refresh, 10000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  return alerts;
}

/* ------------------------------------------------------------------ */
/*  Live Data Hooks                                                    */
/* ------------------------------------------------------------------ */

function useLiveTelemetry() {
  const [responseTimeData, setResponseTimeData] = useState(() => generateTimeSeriesData(60, 142, 80, -5));
  const [requestRateData, setRequestRateData] = useState(() => generateRequestData(60));
  const [cpuData, setCpuData] = useState(() => generateTimeSeriesData(60, 23, 15));
  const [memoryData, setMemoryData] = useState(() => generateTimeSeriesData(60, 512, 120, 10));
  const [errorRateData, setErrorRateData] = useState(() => generateTimeSeriesData(60, 0.8, 1.5));

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const timeStr = new Date(now).toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" });

      setResponseTimeData(prev => [...prev.slice(1), {
        time: timeStr,
        value: Math.max(20, Math.round((142 + (Math.random() - 0.5) * 80 + (Math.random() > 0.92 ? 200 : 0)) * 100) / 100),
        timestamp: now,
      }]);

      const hour = new Date(now).getHours();
      const peak = hour >= 9 && hour <= 17 ? 1.5 : 0.8;
      setRequestRateData(prev => [...prev.slice(1), {
        time: timeStr,
        "2xx": Math.round((18 + Math.random() * 12) * peak),
        "4xx": Math.round((1 + Math.random() * 3) * peak),
        "5xx": Math.random() > 0.85 ? Math.round(1 + Math.random() * 2) : 0,
      }]);

      setCpuData(prev => [...prev.slice(1), {
        time: timeStr,
        value: Math.max(5, Math.min(95, Math.round((23 + (Math.random() - 0.5) * 15) * 100) / 100)),
        timestamp: now,
      }]);

      setMemoryData(prev => [...prev.slice(1), {
        time: timeStr,
        value: Math.max(200, Math.min(1900, Math.round((prev[prev.length - 1].value + (Math.random() - 0.48) * 30) * 100) / 100)),
        timestamp: now,
      }]);

      setErrorRateData(prev => [...prev.slice(1), {
        time: timeStr,
        value: Math.max(0, Math.round((0.8 + (Math.random() - 0.5) * 1.5 + (Math.random() > 0.95 ? 3 : 0)) * 100) / 100),
        timestamp: now,
      }]);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return { responseTimeData, requestRateData, cpuData, memoryData, errorRateData };
}

function useLiveEvents() {
  const [events, setEvents] = useState<Array<{ id: string; time: string; type: string; source: string; message: string; severity: "info" | "warn" | "error" | "success" }>>(() => [
    { id: "1", time: "14:23:01", type: "ROUTE", source: "ACHEEVY", message: "Prompt classified → Engineer_Ang (code generation)", severity: "info" },
    { id: "2", time: "14:22:58", type: "SECURITY", source: "Agent Bridge", message: "Blocked payment tool call from Seller_Ang (policy: deny)", severity: "warn" },
    { id: "3", time: "14:22:45", type: "BUILD", source: "Chicken Hawk", message: "Lil_Hawk #4821 completed — 3 files modified, tests passing", severity: "success" },
    { id: "4", time: "14:22:30", type: "HEALTH", source: "Circuit Metrics", message: "n8n response time elevated (340ms avg, threshold: 200ms)", severity: "warn" },
    { id: "5", time: "14:22:12", type: "SOCIAL", source: "Telegram Bot", message: "Inbound message processed — user linked successfully", severity: "info" },
    { id: "6", time: "14:21:55", type: "MODEL", source: "OpenRouter", message: "Claude Opus 4.6 — 12,500 tokens consumed ($0.45)", severity: "info" },
    { id: "7", time: "14:21:40", type: "DEPLOY", source: "Nginx", message: "SSL cert renewal — 47 days remaining", severity: "success" },
    { id: "8", time: "14:21:22", type: "RATE", source: "UEF Gateway", message: "Rate limit check passed (42/100 rpm)", severity: "info" },
  ]);

  useEffect(() => {
    const templates = [
      { type: "ROUTE", source: "ACHEEVY", messages: ["Prompt classified → Researcher_Ang (analysis)", "Intent resolved → Engineer_Ang (refactor)", "Task queued for Quality_Ang (review)"], severity: "info" as const },
      { type: "HEALTH", source: "Circuit Metrics", messages: ["All services responding within SLA", "Memory usage stable at 25%", "Heartbeat OK — 10/10 services"], severity: "success" as const },
      { type: "BUILD", source: "Chicken Hawk", messages: ["Lil_Hawk spawned for task #4822", "Build pipeline started — ETA 45s", "Unit tests: 31/31 passing"], severity: "info" as const },
      { type: "SECURITY", source: "Agent Bridge", messages: ["Sandbox boundary enforced", "Rate limit: 58/100 rpm", "API key rotation reminder (7d)"], severity: "warn" as const },
    ];

    const interval = setInterval(() => {
      const template = templates[Math.floor(Math.random() * templates.length)];
      const message = template.messages[Math.floor(Math.random() * template.messages.length)];
      const time = new Date().toLocaleTimeString("en-US", { hour12: false });
      setEvents(prev => [{
        id: `evt_${Date.now()}`,
        time, type: template.type, source: template.source, message,
        severity: template.severity,
      }, ...prev].slice(0, 50));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return events;
}

/* ------------------------------------------------------------------ */
/*  Mock Data                                                          */
/* ------------------------------------------------------------------ */

const ACTIVE_ALERTS: ActiveAlert[] = [
  { id: "ALR-0042", severity: "warning", metric: "n8n Response Time", threshold: "200ms", current: "340ms", fired: "2026-02-21T09:14:00Z" },
  { id: "ALR-0041", severity: "info", metric: "Memory Trend", threshold: "80%", current: "72%", fired: "2026-02-21T08:30:00Z" },
];

const INCIDENTS: Incident[] = [
  { id: "INC-0019", severity: "P4", title: "Intermittent 502 on /api/health during deploy", status: "open", created: "2026-02-21T08:45:00Z", duration: "5h 38m" },
  { id: "INC-0018", severity: "P3", title: "Elevated latency on agent routing endpoint", status: "resolved", created: "2026-02-20T14:22:00Z", duration: "2h 15m" },
  { id: "INC-0017", severity: "P2", title: "Certificate renewal failed on secondary domain", status: "resolved", created: "2026-02-19T03:10:00Z", duration: "45m" },
];

const CORRELATION_TRACES: CorrelationTrace[] = [
  { correlationId: "crr-a7f3e1d0", method: "POST", path: "/api/agents/route", statusCode: 200, duration: "134ms", timestamp: "14:23:01" },
  { correlationId: "crr-b8d2c4e1", method: "GET", path: "/api/health", statusCode: 200, duration: "12ms", timestamp: "14:22:58" },
  { correlationId: "crr-c9e5f2a3", method: "POST", path: "/api/chat/completions", statusCode: 200, duration: "2301ms", timestamp: "14:22:45" },
  { correlationId: "crr-d0f6a3b4", method: "GET", path: "/api/admin/models", statusCode: 200, duration: "45ms", timestamp: "14:22:30" },
  { correlationId: "crr-e1a7b4c5", method: "POST", path: "/api/agents/route", statusCode: 429, duration: "8ms", timestamp: "14:22:12" },
  { correlationId: "crr-f2b8c5d6", method: "GET", path: "/api/verticals", statusCode: 200, duration: "67ms", timestamp: "14:21:55" },
  { correlationId: "crr-a3c7d8e9", method: "POST", path: "/api/telegram/webhook", statusCode: 200, duration: "89ms", timestamp: "14:21:40" },
  { correlationId: "crr-b4d8e9f0", method: "GET", path: "/api/circuit-box/policy", statusCode: 200, duration: "23ms", timestamp: "14:21:22" },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false });
}

/* ------------------------------------------------------------------ */
/*  Custom Tooltip                                                     */
/* ------------------------------------------------------------------ */

function ChartTooltip({ active, payload, label, unit = "" }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string; unit?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-wireframe-stroke bg-[#111113]/95 backdrop-blur-xl px-3 py-2 shadow-xl">
      <p className="text-[10px] text-zinc-500 mb-1 font-mono">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-xs font-semibold" style={{ color: entry.color }}>
          {entry.name}: {entry.value}{unit}
        </p>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sparkline (inline mini-chart for KPI cards)                        */
/* ------------------------------------------------------------------ */

function Sparkline({ data, color, height = 32 }: { data: Array<{ value: number }>; color: string; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`spark-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="value" stroke={color} strokeWidth={1.5} fill={`url(#spark-${color.replace("#", "")})`} dot={false} isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/* ------------------------------------------------------------------ */
/*  Radial Gauge                                                       */
/* ------------------------------------------------------------------ */

function RadialGauge({ value, max, label, color, icon: Icon }: { value: number; max: number; label: string; color: string; icon: React.ElementType }) {
  const pct = Math.round((value / max) * 100);
  const data = [{ value: pct, fill: color }];
  const thresholdColor = pct > 80 ? "#EF4444" : pct > 60 ? "#F59E0B" : color;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart cx="50%" cy="50%" innerRadius="75%" outerRadius="100%" startAngle={225} endAngle={-45} data={data} barSize={6}>
            <RadialBar background={{ fill: "rgba(255,255,255,0.05)" }} dataKey="value" cornerRadius={4} fill={thresholdColor} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Icon size={14} style={{ color: thresholdColor }} />
          <span className="text-lg font-bold mt-0.5" style={{ color: thresholdColor }}>{pct}%</span>
        </div>
      </div>
      <span className="text-[10px] text-zinc-500 mt-1 uppercase tracking-wider">{label}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Status Badge Components                                            */
/* ------------------------------------------------------------------ */

function SeverityBadge({ severity }: { severity: AlertSeverity }) {
  const styles: Record<AlertSeverity, { bg: string; text: string; dot: string }> = {
    critical: { bg: "bg-red-500/10 border-red-500/20", text: "text-red-400", dot: "bg-red-400" },
    warning: { bg: "bg-gold/10 border-gold/20", text: "text-gold", dot: "bg-gold" },
    info: { bg: "bg-sky-400/10 border-sky-400/20", text: "text-sky-400", dot: "bg-sky-400" },
  };
  const s = styles[severity];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${s.bg} ${s.text}`}>
      <span className={`h-1 w-1 rounded-full ${s.dot}`} />
      {severity}
    </span>
  );
}

function IncidentBadge({ severity }: { severity: IncidentSeverity }) {
  const styles: Record<IncidentSeverity, string> = {
    P1: "bg-red-500/10 border-red-500/20 text-red-400",
    P2: "bg-orange-400/10 border-orange-400/20 text-orange-400",
    P3: "bg-gold/10 border-gold/20 text-gold",
    P4: "bg-sky-400/10 border-sky-400/20 text-sky-400",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${styles[severity]}`}>
      {severity}
    </span>
  );
}

function StatusBadge({ status }: { status: IncidentStatus }) {
  const styles: Record<IncidentStatus, { bg: string; text: string; dot: string }> = {
    open: { bg: "bg-red-500/10 border-red-500/20", text: "text-red-400", dot: "bg-red-400 animate-pulse" },
    investigating: { bg: "bg-gold/10 border-gold/20", text: "text-gold", dot: "bg-gold animate-pulse" },
    resolved: { bg: "bg-emerald-400/10 border-emerald-400/20", text: "text-emerald-400", dot: "bg-emerald-400" },
  };
  const s = styles[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${s.bg} ${s.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {status}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Service Health Grid                                                */
/* ------------------------------------------------------------------ */

function ServiceHealthGrid({ services }: { services: ServiceHealth[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
      {services.map((svc) => {
        const statusColor = svc.status === "healthy" ? "text-emerald-400" : svc.status === "degraded" ? "text-gold" : "text-red-400";
        const borderColor = svc.status === "healthy" ? "border-emerald-400/10" : svc.status === "degraded" ? "border-gold/20" : "border-red-500/20";
        const dotColor = svc.status === "healthy" ? "bg-emerald-400" : svc.status === "degraded" ? "bg-gold" : "bg-red-400";
        return (
          <motion.div
            key={svc.name}
            whileHover={{ scale: 1.02 }}
            className={`rounded-xl border ${borderColor} bg-[#1F1F23]/60 p-3 cursor-default transition-all hover:bg-[#111113]`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className={`h-2 w-2 rounded-full ${dotColor} ${svc.status !== "healthy" ? "animate-pulse" : ""}`} />
              <span className="text-xs font-semibold text-zinc-100 truncate">{svc.name}</span>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1">
              <div>
                <p className="text-[9px] text-zinc-500">Latency</p>
                <p className={`text-xs font-mono font-semibold ${svc.latency > 200 ? "text-gold" : statusColor}`}>{svc.latency}ms</p>
              </div>
              <div>
                <p className="text-[9px] text-zinc-500">Uptime</p>
                <p className={`text-xs font-mono font-semibold ${statusColor}`}>{svc.uptime}%</p>
              </div>
              <div>
                <p className="text-[9px] text-zinc-500">Req/hr</p>
                <p className="text-xs font-mono text-zinc-400">{svc.requests.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[9px] text-zinc-500">Errors</p>
                <p className={`text-xs font-mono ${svc.errors > 5 ? "text-red-400" : "text-zinc-500"}`}>{svc.errors}</p>
              </div>
            </div>
            <p className="text-[8px] text-zinc-600 mt-2 text-right">{svc.lastCheck}</p>
          </motion.div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

export default function OperationsPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "alerts" | "incidents" | "traces">("overview");
  const [timeRange, setTimeRange] = useState<TimeRange>("1h");
  const [isLive, setIsLive] = useState(true);
  const [theaterOpen, setTheaterOpen] = useState(false);
  const { responseTimeData, requestRateData, cpuData, memoryData, errorRateData } = useLiveTelemetry();
  const liveEvents = useLiveEvents();
  const { services, isLiveData } = useServiceHealth();
  const alerts = useLiveAlerts();

  // KPI calculations from live data
  const currentResponseTime = responseTimeData[responseTimeData.length - 1]?.value ?? 0;
  const prevResponseTime = responseTimeData[responseTimeData.length - 10]?.value ?? currentResponseTime;
  const responseTimeTrend = currentResponseTime - prevResponseTime;

  const currentErrorRate = errorRateData[errorRateData.length - 1]?.value ?? 0;
  const totalRequests = requestRateData.reduce((sum, d) => sum + (d["2xx"] || 0) + (d["4xx"] || 0) + (d["5xx"] || 0), 0);

  const currentCpu = cpuData[cpuData.length - 1]?.value ?? 0;
  const currentMemory = memoryData[memoryData.length - 1]?.value ?? 0;

  // Status distribution for pie chart
  const statusDistribution = [
    { name: "2xx", value: requestRateData.reduce((s, d) => s + d["2xx"], 0), color: "#22C55E" },
    { name: "4xx", value: requestRateData.reduce((s, d) => s + d["4xx"], 0), color: "#F59E0B" },
    { name: "5xx", value: requestRateData.reduce((s, d) => s + d["5xx"], 0), color: "#EF4444" },
  ];

  const healthyCount = services.filter(s => s.status === "healthy").length;

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-4"
    >
      {/* ── Header Strip ── */}
      <motion.section variants={staggerItem} className="rounded-2xl border border-gold/20 bg-gradient-to-r from-gold/10 via-white/80 to-white/60 p-4 shadow-[0_0_40px_rgba(251,191,36,0.06)]">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10 border border-gold/20">
              <Activity size={18} className="text-gold" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-zinc-100 font-display">Operations Command</h1>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Platform Telemetry &amp; Observability</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Live indicator */}
            <button onClick={() => setIsLive(!isLive)} className="flex items-center gap-2 rounded-lg border border-wireframe-stroke bg-[#1F1F23]/60 px-3 py-1.5 transition-all hover:border-gold/20">
              <span className={`relative flex h-2 w-2 ${isLive ? "" : "opacity-30"}`}>
                {isLive && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isLive ? "bg-emerald-400" : "bg-white/30"}`} />
              </span>
              <span className={`text-[10px] font-bold uppercase tracking-widest ${isLive ? "text-emerald-400" : "text-zinc-500"}`}>
                {isLive ? "LIVE" : "PAUSED"}
              </span>
            </button>

            {/* Backend data indicator */}
            {isLiveData && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-blue-500/20 bg-blue-500/10 text-[9px] font-bold uppercase tracking-widest text-blue-400">
                <Wifi size={10} />
                API
              </span>
            )}

            {/* Time range selector */}
            <div className="flex items-center rounded-lg border border-wireframe-stroke bg-[#1F1F23]/60 p-0.5">
              {(["1h", "6h", "24h", "7d", "30d"] as TimeRange[]).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${
                    timeRange === range ? "bg-gold/10 text-gold border border-gold/20" : "text-zinc-500 hover:text-zinc-400"
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>

            {/* Live Ops Theater */}
            <button
              onClick={() => setTheaterOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-gold/20 bg-gold/5 px-3 py-1.5 transition-all hover:bg-gold/10"
            >
              <Eye size={12} className="text-gold" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-gold">
                Live Ops
              </span>
            </button>

            {/* System status */}
            <div className="flex items-center gap-1.5 rounded-lg bg-emerald-400/5 border border-emerald-400/20 px-3 py-1.5">
              <ShieldCheck size={12} className="text-emerald-400" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                {healthyCount}/{services.length} Healthy
              </span>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ── KPI Strip with Sparklines ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          {
            label: "Response Time",
            value: `${Math.round(currentResponseTime)}ms`,
            trend: responseTimeTrend,
            trendLabel: `${responseTimeTrend > 0 ? "+" : ""}${Math.round(responseTimeTrend)}ms`,
            sparkData: responseTimeData.slice(-20),
            color: currentResponseTime > 200 ? "#F59E0B" : "#22C55E",
            icon: Clock,
          },
          {
            label: "Request Rate",
            value: `${requestRateData[requestRateData.length - 1]?.["2xx"] ?? 0} rpm`,
            trend: -2,
            trendLabel: "Normal",
            sparkData: requestRateData.slice(-20).map(d => ({ value: d["2xx"] })),
            color: "#22D3EE",
            icon: Zap,
          },
          {
            label: "Error Rate",
            value: `${currentErrorRate.toFixed(1)}%`,
            trend: currentErrorRate > 2 ? 1 : -1,
            trendLabel: currentErrorRate > 2 ? "Elevated" : "Normal",
            sparkData: errorRateData.slice(-20),
            color: currentErrorRate > 2 ? "#EF4444" : "#22C55E",
            icon: AlertTriangle,
          },
          {
            label: "CPU",
            value: `${Math.round(currentCpu)}%`,
            trend: 0,
            trendLabel: "Stable",
            sparkData: cpuData.slice(-20),
            color: currentCpu > 70 ? "#EF4444" : currentCpu > 50 ? "#F59E0B" : "#22C55E",
            icon: Cpu,
          },
          {
            label: "Memory",
            value: `${Math.round(currentMemory)} MB`,
            trend: 10,
            trendLabel: `${Math.round((currentMemory / 2048) * 100)}% of 2GB`,
            sparkData: memoryData.slice(-20),
            color: currentMemory > 1600 ? "#EF4444" : currentMemory > 1200 ? "#F59E0B" : "#22C55E",
            icon: Server,
          },
        ].map((kpi) => (
          <motion.div
            key={kpi.label}
            variants={staggerItem}
            className="rounded-xl border border-wireframe-stroke bg-[#18181B]/70 p-4 backdrop-blur-xl hover:border-white/10 transition-all"
          >
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">{kpi.label}</p>
              <kpi.icon size={14} style={{ color: kpi.color }} />
            </div>
            <p className="text-2xl font-bold" style={{ color: kpi.color }}>{kpi.value}</p>
            <div className="flex items-center gap-1 mt-0.5">
              {kpi.trend > 0 ? (
                <ArrowUpRight size={10} className={kpi.color === "#22C55E" ? "text-emerald-400" : "text-red-400"} />
              ) : kpi.trend < 0 ? (
                <ArrowDownRight size={10} className="text-emerald-400" />
              ) : (
                <Activity size={10} className="text-zinc-600" />
              )}
              <span className="text-[10px] text-zinc-500">{kpi.trendLabel}</span>
            </div>
            <div className="mt-2 -mx-1">
              <Sparkline data={kpi.sparkData} color={kpi.color} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Navigation Tabs ── */}
      <div className="flex items-center gap-1 border-b border-wireframe-stroke pb-0">
        {[
          { key: "overview" as const, label: "Overview", icon: Eye },
          { key: "alerts" as const, label: "Alerts", icon: AlertTriangle, count: alerts.length },
          { key: "incidents" as const, label: "Incidents", icon: Bell, count: INCIDENTS.filter(i => i.status !== "resolved").length },
          { key: "traces" as const, label: "Traces", icon: Radio, count: CORRELATION_TRACES.length },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all border-b-2 -mb-[1px] ${
              activeTab === tab.key
                ? "border-gold text-gold"
                : "border-transparent text-zinc-500 hover:text-zinc-400"
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
            {tab.count !== undefined && (
              <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                activeTab === tab.key ? "bg-gold/10 text-gold" : "bg-[#18181B] text-zinc-600"
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {/* ═══ OVERVIEW TAB ═══ */}
          {activeTab === "overview" && (
            <div className="space-y-4">
              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Response Time Chart */}
                <div className="rounded-2xl border border-wireframe-stroke bg-[#18181B]/70 p-5 backdrop-blur-xl">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-gold" />
                      <h3 className="text-sm font-semibold text-zinc-100">Response Time (p50)</h3>
                    </div>
                    <span className="text-xs text-zinc-500 font-mono">{timeRange}</span>
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={responseTimeData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gradResponseTime" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#D4AF37" stopOpacity={0.25} />
                          <stop offset="100%" stopColor="#D4AF37" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="time" tick={{ fontSize: 9, fill: "rgba(255,255,255,0.2)" }} tickLine={false} axisLine={false} interval={9} />
                      <YAxis tick={{ fontSize: 9, fill: "rgba(255,255,255,0.2)" }} tickLine={false} axisLine={false} width={40} />
                      <Tooltip content={<ChartTooltip unit="ms" />} />
                      <Area type="monotone" dataKey="value" name="p50" stroke="#D4AF37" strokeWidth={2} fill="url(#gradResponseTime)" dot={false} isAnimationActive={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Request Rate Chart */}
                <div className="rounded-2xl border border-wireframe-stroke bg-[#18181B]/70 p-5 backdrop-blur-xl">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <BarChart3 size={14} className="text-cb-cyan" />
                      <h3 className="text-sm font-semibold text-zinc-100">Request Rate (by Status)</h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-[9px] text-emerald-400"><Circle size={6} fill="#22C55E" />2xx</span>
                      <span className="flex items-center gap-1 text-[9px] text-gold"><Circle size={6} fill="#F59E0B" />4xx</span>
                      <span className="flex items-center gap-1 text-[9px] text-red-400"><Circle size={6} fill="#EF4444" />5xx</span>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={requestRateData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="time" tick={{ fontSize: 9, fill: "rgba(255,255,255,0.2)" }} tickLine={false} axisLine={false} interval={9} />
                      <YAxis tick={{ fontSize: 9, fill: "rgba(255,255,255,0.2)" }} tickLine={false} axisLine={false} width={30} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="2xx" stackId="status" fill="#22C55E" radius={[0, 0, 0, 0]} opacity={0.8} />
                      <Bar dataKey="4xx" stackId="status" fill="#F59E0B" radius={[0, 0, 0, 0]} opacity={0.8} />
                      <Bar dataKey="5xx" stackId="status" fill="#EF4444" radius={[2, 2, 0, 0]} opacity={0.9} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Service Health + System Gauges Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Service Health Grid */}
                <div className="lg:col-span-2 rounded-2xl border border-wireframe-stroke bg-[#18181B]/70 p-5 backdrop-blur-xl">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Server size={14} className="text-emerald-400" />
                      <h3 className="text-sm font-semibold text-zinc-100">Service Health Matrix</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-zinc-500">{healthyCount}/{services.length} services healthy</span>
                      <RefreshCw size={12} className="text-zinc-600 animate-spin" style={{ animationDuration: "3s" }} />
                    </div>
                  </div>
                  <ServiceHealthGrid services={services} />
                </div>

                {/* System Gauges + Status Distribution */}
                <div className="space-y-4">
                  {/* Radial Gauges */}
                  <div className="rounded-2xl border border-wireframe-stroke bg-[#18181B]/70 p-5 backdrop-blur-xl">
                    <h3 className="text-sm font-semibold text-zinc-100 mb-4 flex items-center gap-2">
                      <Cpu size={14} className="text-gold" />
                      Resource Utilization
                    </h3>
                    <div className="flex items-center justify-around">
                      <RadialGauge value={currentCpu} max={100} label="CPU" color="#22C55E" icon={Cpu} />
                      <RadialGauge value={currentMemory} max={2048} label="Memory" color="#22D3EE" icon={Server} />
                      <RadialGauge value={4.2} max={40} label="Disk" color="#22C55E" icon={HardDrive} />
                    </div>
                  </div>

                  {/* Status Distribution Donut */}
                  <div className="rounded-2xl border border-wireframe-stroke bg-[#18181B]/70 p-5 backdrop-blur-xl">
                    <h3 className="text-sm font-semibold text-zinc-100 mb-3 flex items-center gap-2">
                      <BarChart3 size={14} className="text-cb-cyan" />
                      Response Distribution
                    </h3>
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={statusDistribution}
                              cx="50%"
                              cy="50%"
                              innerRadius={22}
                              outerRadius={36}
                              dataKey="value"
                              strokeWidth={0}
                            >
                              {statusDistribution.map((entry, i) => (
                                <Cell key={i} fill={entry.color} opacity={0.85} />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex-1 space-y-1.5">
                        {statusDistribution.map((entry) => (
                          <div key={entry.name} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                              <span className="text-xs text-zinc-400">{entry.name}</span>
                            </div>
                            <span className="text-xs font-mono font-semibold" style={{ color: entry.color }}>
                              {entry.value.toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Live Event Stream + Error Rate */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Live Event Feed */}
                <div className="lg:col-span-2 rounded-2xl border border-wireframe-stroke bg-[#18181B]/70 backdrop-blur-xl overflow-hidden">
                  <div className="flex items-center justify-between p-4 border-b border-wireframe-stroke">
                    <div className="flex items-center gap-2">
                      <Radio size={14} className="text-cb-cyan" />
                      <h3 className="text-sm font-semibold text-zinc-100">Live Event Stream</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cb-cyan opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-cb-cyan" />
                      </span>
                      <span className="text-[10px] text-cb-cyan font-mono uppercase tracking-wider">STREAMING</span>
                    </div>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    {liveEvents.map((evt, i) => {
                      const sevColors = {
                        info: "text-cb-cyan",
                        warn: "text-gold",
                        error: "text-red-400",
                        success: "text-emerald-400",
                      };
                      const dotColors = {
                        info: "bg-cb-cyan",
                        warn: "bg-gold",
                        error: "bg-red-400",
                        success: "bg-emerald-400",
                      };
                      return (
                        <motion.div
                          key={evt.id}
                          initial={i === 0 ? { opacity: 0, x: -8 } : false}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-start gap-3 px-4 py-2.5 border-b border-wireframe-stroke/30 hover:bg-[#111113] transition-colors"
                        >
                          <span className={`h-2 w-2 rounded-full mt-1.5 flex-shrink-0 ${dotColors[evt.severity]}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-zinc-600 font-mono">{evt.time}</span>
                              <span className={`text-[9px] font-bold uppercase tracking-wider ${sevColors[evt.severity]}`}>{evt.type}</span>
                            </div>
                            <p className="text-xs text-zinc-300 mt-0.5">
                              <span className="text-gold font-medium">{evt.source}</span>
                              <span className="text-zinc-600 mx-1.5">—</span>
                              {evt.message}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Error Rate Chart */}
                <div className="rounded-2xl border border-wireframe-stroke bg-[#18181B]/70 p-5 backdrop-blur-xl">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle size={14} className="text-red-400" />
                    <h3 className="text-sm font-semibold text-zinc-100">Error Rate</h3>
                  </div>
                  <ResponsiveContainer width="100%" height={240}>
                    <AreaChart data={errorRateData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gradError" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#EF4444" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#EF4444" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="time" tick={{ fontSize: 9, fill: "rgba(255,255,255,0.2)" }} tickLine={false} axisLine={false} interval={14} />
                      <YAxis tick={{ fontSize: 9, fill: "rgba(255,255,255,0.2)" }} tickLine={false} axisLine={false} width={30} domain={[0, "auto"]} />
                      <Tooltip content={<ChartTooltip unit="%" />} />
                      <Area type="monotone" dataKey="value" name="Error %" stroke="#EF4444" strokeWidth={2} fill="url(#gradError)" dot={false} isAnimationActive={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* ═══ ALERTS TAB ═══ */}
          {activeTab === "alerts" && (
            <div className="rounded-2xl border border-wireframe-stroke bg-[#18181B]/70 p-5 backdrop-blur-xl">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle size={14} className="text-gold" />
                <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-200">Active Alerts</h2>
              </div>
              {alerts.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-emerald-400/20 bg-emerald-400/5 p-8 text-center">
                  <CheckCircle2 size={24} className="text-emerald-400 mx-auto mb-2" />
                  <p className="text-sm text-emerald-400">No active alerts</p>
                  <p className="text-[10px] text-zinc-600 mt-1">All metrics within thresholds</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-wireframe-stroke">
                        {["ID", "Severity", "Metric", "Threshold", "Current", "Fired"].map(h => (
                          <th key={h} className="p-3 text-left text-[10px] uppercase tracking-widest text-zinc-500 font-semibold">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {alerts.map((alert) => (
                        <tr key={alert.id} className="border-t border-wireframe-stroke hover:bg-[#111113] transition-colors">
                          <td className="p-3"><code className="text-[10px] font-mono text-gold">{alert.id}</code></td>
                          <td className="p-3"><SeverityBadge severity={alert.severity} /></td>
                          <td className="p-3 text-xs font-medium text-zinc-100">{alert.metric}</td>
                          <td className="p-3"><code className="rounded bg-[#18181B]/70 border border-wireframe-stroke px-2 py-0.5 text-[10px] font-mono text-zinc-500">{alert.threshold}</code></td>
                          <td className="p-3">
                            <code className={`rounded bg-[#18181B]/70 border border-wireframe-stroke px-2 py-0.5 text-[10px] font-mono ${
                              alert.severity === "critical" ? "text-red-400" : alert.severity === "warning" ? "text-gold" : "text-sky-400"
                            }`}>{alert.current}</code>
                          </td>
                          <td className="p-3 text-[10px] text-zinc-500">{formatTimestamp(alert.fired)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ═══ INCIDENTS TAB ═══ */}
          {activeTab === "incidents" && (
            <div className="rounded-2xl border border-wireframe-stroke bg-[#18181B]/70 p-5 backdrop-blur-xl">
              <div className="flex items-center gap-2 mb-4">
                <Bell size={14} className="text-gold" />
                <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-200">Incident Timeline</h2>
              </div>
              {/* Timeline view */}
              <div className="relative pl-6 space-y-4">
                <div className="absolute left-[11px] top-0 bottom-0 w-px bg-wireframe-stroke" />
                {INCIDENTS.map((inc) => {
                  const isOpen = inc.status !== "resolved";
                  return (
                    <div key={inc.id} className="relative">
                      <div className={`absolute left-[-17px] top-3 h-3 w-3 rounded-full border-2 ${
                        isOpen ? "border-red-400 bg-red-400/20 animate-pulse" : "border-emerald-400 bg-emerald-400/20"
                      }`} />
                      <div className={`rounded-xl border ${isOpen ? "border-red-500/20 bg-red-500/5" : "border-wireframe-stroke bg-[#1F1F23]/60"} p-4`}>
                        <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <code className="text-[10px] font-mono text-gold">{inc.id}</code>
                            <IncidentBadge severity={inc.severity} />
                            <StatusBadge status={inc.status} />
                          </div>
                          <div className="flex items-center gap-3 text-[10px] text-zinc-500">
                            {inc.duration && <span>Duration: <span className="text-zinc-400 font-mono">{inc.duration}</span></span>}
                            <span>{formatTimestamp(inc.created)}</span>
                          </div>
                        </div>
                        <p className="text-sm text-zinc-100">{inc.title}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ═══ TRACES TAB ═══ */}
          {activeTab === "traces" && (
            <div className="rounded-2xl border border-wireframe-stroke bg-[#18181B]/70 p-5 backdrop-blur-xl">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={14} className="text-gold" />
                <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-200">Request Traces</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-wireframe-stroke">
                      {["Correlation ID", "Time", "Method", "Path", "Status", "Duration"].map(h => (
                        <th key={h} className={`p-3 text-[10px] uppercase tracking-widest text-zinc-500 font-semibold ${h === "Status" || h === "Duration" ? "text-center" : "text-left"}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {CORRELATION_TRACES.map((trace) => {
                      const dur = parseInt(trace.duration);
                      const durColor = dur > 2000 ? "text-red-400" : dur > 500 ? "text-gold" : "text-emerald-400";
                      const statusColor = trace.statusCode >= 200 && trace.statusCode < 300 ? "text-emerald-400" :
                        trace.statusCode >= 400 && trace.statusCode < 500 ? "text-gold" : "text-red-400";
                      const durPct = Math.min((dur / 3000) * 100, 100);

                      return (
                        <tr key={trace.correlationId} className="border-t border-wireframe-stroke hover:bg-[#111113] transition-colors">
                          <td className="p-3">
                            <code className="rounded bg-[#18181B]/70 border border-wireframe-stroke px-2 py-0.5 text-[10px] font-mono text-gold">{trace.correlationId}</code>
                          </td>
                          <td className="p-3">
                            <span className="text-[10px] font-mono text-zinc-500">{trace.timestamp}</span>
                          </td>
                          <td className="p-3">
                            <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                              trace.method === "GET" ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-400" :
                              trace.method === "POST" ? "border-sky-400/20 bg-sky-400/10 text-sky-400" :
                              "border-gold/20 bg-gold/10 text-gold"
                            }`}>
                              {trace.method}
                            </span>
                          </td>
                          <td className="p-3"><code className="text-xs font-mono text-zinc-400">{trace.path}</code></td>
                          <td className="p-3 text-center">
                            <span className={`text-xs font-bold font-mono ${statusColor}`}>{trace.statusCode}</span>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 rounded-full bg-[#18181B] overflow-hidden">
                                <div className={`h-full rounded-full ${dur > 2000 ? "bg-red-400" : dur > 500 ? "bg-gold" : "bg-emerald-400"}`} style={{ width: `${durPct}%` }} />
                              </div>
                              <span className={`text-xs font-mono font-semibold min-w-[50px] text-right ${durColor}`}>{trace.duration}</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Live Ops Theater Overlay */}
      <LiveOpsTheater
        shiftId="SH-OPS-LIVE"
        isOpen={theaterOpen}
        onClose={() => setTheaterOpen(false)}
      />
    </motion.div>
  );
}
