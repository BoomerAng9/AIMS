// frontend/app/dashboard/environments/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Server,
  Globe,
  Activity,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  Wifi,
  WifiOff,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type ServiceStatus = "up" | "down" | "degraded";

interface ServiceHealth {
  name: string;
  type: string;
  status: ServiceStatus;
  responseTime: number;
  lastCheck: string;
  error?: string;
}

interface HealthData {
  overall: string;
  timestamp: string;
  services: ServiceHealth[];
  summary: {
    total: number;
    up: number;
    degraded: number;
    down: number;
  };
}

/* ------------------------------------------------------------------ */
/*  Status Config                                                      */
/* ------------------------------------------------------------------ */

const STATUS_CONFIG: Record<
  ServiceStatus,
  { label: string; dot: string; badge: string }
> = {
  up: {
    label: "Online",
    dot: "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]",
    badge: "border-emerald-400/30 bg-emerald-400/10 text-emerald-400",
  },
  degraded: {
    label: "Degraded",
    dot: "bg-yellow-400 shadow-[0_0_6px_rgba(250,204,21,0.6)]",
    badge: "border-yellow-400/30 bg-yellow-400/10 text-yellow-400",
  },
  down: {
    label: "Down",
    dot: "bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.6)]",
    badge: "border-red-400/30 bg-red-400/10 text-red-400",
  },
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function EnvironmentsPage() {
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<string>("");
  const [refreshing, setRefreshing] = useState(false);

  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch("/api/circuit-box/services", { cache: "no-store" });
      if (!res.ok) return;
      const data: HealthData = await res.json();
      setHealthData(data);
      setLastRefresh(new Date().toLocaleTimeString());
    } catch {
      // Keep existing data on failure
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchHealth();
    setRefreshing(false);
  };

  const services = healthData?.services || [];
  const coreServices = services.filter((s) => s.type === "core");
  const toolServices = services.filter((s) => s.type === "tool" || s.type === "infra");
  const agentServices = services.filter((s) => s.type === "agent");

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-gold/50 mb-1">
            Infrastructure
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-100 font-display">
            ENVIRONMENTS
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Live service health from circuit-metrics — real-time monitoring.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastRefresh && (
            <span className="text-[10px] text-zinc-600 font-mono">
              Updated {lastRefresh}
            </span>
          )}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 rounded-lg border border-gold/20 bg-gold/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gold transition-all hover:bg-gold/20 disabled:opacity-50"
          >
            <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </header>

      {/* ---- Production Environment Card ---- */}
      <section className="rounded-3xl border border-gold/20 bg-[#18181B]/70 p-6 backdrop-blur-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-gold/20 to-gold/10 text-gold">
              <Globe size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-zinc-100">Production</h2>
              <p className="text-xs text-zinc-500 font-mono">76.13.96.107 / plugmein.cloud</p>
            </div>
          </div>
          {healthData && (
            <span
              className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
                STATUS_CONFIG[healthData.overall === "healthy" ? "up" : healthData.overall === "degraded" ? "degraded" : "down"]?.badge || STATUS_CONFIG.down.badge
              }`}
            >
              {healthData.overall}
            </span>
          )}
        </div>

        {/* Summary Strip */}
        {healthData?.summary && (
          <div className="grid grid-cols-4 gap-3 mb-6">
            {[
              { label: "Total Services", value: healthData.summary.total, color: "text-zinc-100" },
              { label: "Up", value: healthData.summary.up, color: "text-emerald-400" },
              { label: "Degraded", value: healthData.summary.degraded, color: "text-yellow-400" },
              { label: "Down", value: healthData.summary.down, color: "text-red-400" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-wireframe-stroke bg-[#1F1F23]/60 p-3 text-center"
              >
                <p className="text-[10px] uppercase tracking-widest text-zinc-500">
                  {stat.label}
                </p>
                <p className={`text-2xl font-semibold mt-1 ${stat.color}`}>
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12 gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-gold/30 border-t-gold" />
            <span className="text-xs text-zinc-500">Connecting to circuit-metrics...</span>
          </div>
        ) : services.length === 0 ? (
          <div className="py-12 text-center">
            <WifiOff size={24} className="mx-auto text-zinc-600 mb-2" />
            <p className="text-xs text-zinc-500">Circuit metrics unreachable</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Core Services */}
            {coreServices.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-widest text-gold mb-3">
                  Core Services
                </h3>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {coreServices.map((svc) => (
                    <ServiceCard key={svc.name} service={svc} />
                  ))}
                </div>
              </div>
            )}

            {/* Tools & Infrastructure */}
            {toolServices.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-widest text-gold mb-3">
                  Tools & Infrastructure
                </h3>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {toolServices.map((svc) => (
                    <ServiceCard key={svc.name} service={svc} />
                  ))}
                </div>
              </div>
            )}

            {/* Agent Services */}
            {agentServices.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-widest text-gold mb-3">
                  Agent Services
                </h3>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {agentServices.map((svc) => (
                    <ServiceCard key={svc.name} service={svc} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ---- Deployment Info ---- */}
      <section className="rounded-3xl border border-wireframe-stroke bg-[#18181B]/70 p-6 backdrop-blur-2xl">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-200 font-display">
            Deployment Configuration
          </h2>
          <Activity size={16} className="text-gold/40" />
        </div>
        <p className="text-[0.65rem] text-zinc-500 uppercase tracking-wider mb-4">
          Real infrastructure details from deploy.sh and docker-compose.prod.yml
        </p>

        <div className="grid gap-3 md:grid-cols-2">
          <InfoCard label="VPS Host" value="srv1328075.hstgr.cloud (Hostinger)" />
          <InfoCard label="IP Address" value="76.13.96.107" />
          <InfoCard label="Domain" value="plugmein.cloud" />
          <InfoCard label="Landing Domain" value="aimanagedsolutions.cloud" />
          <InfoCard label="Container Runtime" value="Docker Compose" />
          <InfoCard label="SSL" value="Let's Encrypt (Certbot)" />
          <InfoCard label="CI/CD" value="GitHub Actions \u2192 Cloud Build \u2192 Artifact Registry" />
          <InfoCard label="GPU Inference" value="GCP Vertex AI (L4/A100)" />
        </div>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function ServiceCard({ service }: { service: ServiceHealth }) {
  const status = STATUS_CONFIG[service.status] || STATUS_CONFIG.down;
  const displayName = service.name
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="rounded-2xl border border-wireframe-stroke bg-[#1F1F23]/60 p-4 transition-all hover:border-gold/10">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {service.status === "up" ? (
            <Wifi size={14} className="text-emerald-400" />
          ) : service.status === "degraded" ? (
            <AlertCircle size={14} className="text-yellow-400" />
          ) : (
            <WifiOff size={14} className="text-red-400/60" />
          )}
          <span className="text-sm font-medium text-zinc-100">{displayName}</span>
        </div>
        <span
          className={`h-2.5 w-2.5 rounded-full ${status.dot}`}
        />
      </div>

      <div className="flex items-center gap-3 text-[10px] text-zinc-500">
        <span className={`rounded-full border px-2 py-0.5 font-bold uppercase tracking-wider ${status.badge}`}>
          {status.label}
        </span>
        <span className="font-mono">{service.responseTime}ms</span>
        <span className="text-zinc-600">{service.type}</span>
      </div>

      {service.error && (
        <p className="mt-2 text-[10px] text-red-400/60 truncate">{service.error}</p>
      )}
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-wireframe-stroke bg-[#1F1F23]/60 p-3">
      <p className="text-[10px] uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="text-xs font-mono text-gold mt-0.5">{value}</p>
    </div>
  );
}
