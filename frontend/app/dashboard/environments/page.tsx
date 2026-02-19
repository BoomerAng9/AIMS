// frontend/app/dashboard/environments/page.tsx
"use client";

import React, { useState } from "react";
import {
  Server,
  Globe,
  GitBranch,
  Activity,
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type EnvironmentStatus = "healthy" | "degraded" | "down";
type DeployStatus = "success" | "in_progress" | "failed" | "rolled_back";

interface ServiceHealth {
  name: string;
  status: EnvironmentStatus;
}

interface Environment {
  id: string;
  name: string;
  url: string;
  status: EnvironmentStatus;
  lastDeploy: string;
  version: string;
  branch: string;
  commitsBehind: number;
  services: ServiceHealth[];
}

interface Deployment {
  id: string;
  version: string;
  environment: string;
  timestamp: string;
  status: DeployStatus;
  author: string;
  message: string;
}

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const ENVIRONMENTS: Environment[] = [
  {
    id: "dev",
    name: "Development",
    url: "http://localhost:3000",
    status: "healthy",
    lastDeploy: "2026-02-07T14:32:00Z",
    version: "v0.1.1-dev.47",
    branch: "main",
    commitsBehind: 0,
    services: [
      { name: "Frontend", status: "healthy" },
      { name: "Backend", status: "healthy" },
      { name: "Nginx", status: "healthy" },
    ],
  },
  {
    id: "staging",
    name: "Staging",
    url: "staging.aims.example.com",
    status: "degraded",
    lastDeploy: "2026-02-06T22:15:00Z",
    version: "v0.1.0-rc.3",
    branch: "main",
    commitsBehind: 2,
    services: [
      { name: "Frontend", status: "healthy" },
      { name: "Backend", status: "degraded" },
      { name: "Nginx", status: "healthy" },
    ],
  },
  {
    id: "production",
    name: "Production",
    url: "76.13.96.107",
    status: "healthy",
    lastDeploy: "2026-02-05T10:00:00Z",
    version: "v0.1.0",
    branch: "main",
    commitsBehind: 5,
    services: [
      { name: "Frontend", status: "healthy" },
      { name: "Backend", status: "healthy" },
      { name: "Nginx", status: "healthy" },
    ],
  },
];

const RECENT_DEPLOYMENTS: Deployment[] = [
  {
    id: "dep-001",
    version: "v0.1.1-dev.47",
    environment: "Development",
    timestamp: "2026-02-07T14:32:00Z",
    status: "success",
    author: "Engineer_Ang",
    message: "Add environments dashboard page",
  },
  {
    id: "dep-002",
    version: "v0.1.0-rc.3",
    environment: "Staging",
    timestamp: "2026-02-06T22:15:00Z",
    status: "success",
    author: "Engineer_Ang",
    message: "Bump API gateway to latest",
  },
  {
    id: "dep-003",
    version: "v0.1.0-rc.2",
    environment: "Staging",
    timestamp: "2026-02-06T18:44:00Z",
    status: "rolled_back",
    author: "Quality_Ang",
    message: "ORACLE gate 4 failure — automatic rollback",
  },
  {
    id: "dep-004",
    version: "v0.1.0",
    environment: "Production",
    timestamp: "2026-02-05T10:00:00Z",
    status: "success",
    author: "Chicken Hawk",
    message: "Release v0.1.0 — initial production deploy",
  },
  {
    id: "dep-005",
    version: "v0.1.0-rc.1",
    environment: "Staging",
    timestamp: "2026-02-04T16:30:00Z",
    status: "success",
    author: "Engineer_Ang",
    message: "Pre-release candidate for v0.1.0",
  },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const STATUS_CONFIG: Record<
  EnvironmentStatus,
  { label: string; dot: string; badge: string }
> = {
  healthy: {
    label: "Healthy",
    dot: "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]",
    badge:
      "border-emerald-400/30 bg-emerald-400/10 text-emerald-400",
  },
  degraded: {
    label: "Degraded",
    dot: "bg-yellow-400 shadow-[0_0_6px_rgba(250,204,21,0.6)]",
    badge:
      "border-yellow-400/30 bg-yellow-400/10 text-yellow-400",
  },
  down: {
    label: "Down",
    dot: "bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.6)]",
    badge: "border-red-400/30 bg-red-400/10 text-red-400",
  },
};

const DEPLOY_STATUS_CONFIG: Record<
  DeployStatus,
  { label: string; icon: React.ElementType; cls: string }
> = {
  success: {
    label: "Success",
    icon: CheckCircle2,
    cls: "text-emerald-400",
  },
  in_progress: {
    label: "In Progress",
    icon: Clock,
    cls: "text-gold animate-pulse",
  },
  failed: {
    label: "Failed",
    icon: AlertCircle,
    cls: "text-red-400",
  },
  rolled_back: {
    label: "Rolled Back",
    icon: AlertCircle,
    cls: "text-yellow-400",
  },
};

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function EnvironmentsPage() {
  const [promoting, setPromoting] = useState<string | null>(null);

  const handlePromote = async (fromId: string, toId: string) => {
    const key = `${fromId}-${toId}`;
    setPromoting(key);
    // Simulate promotion delay
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setPromoting(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Header */}
      <header>
        <p className="text-[10px] uppercase tracking-[0.3em] text-gold/50 mb-1">
          Infrastructure
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-white font-display">
          ENVIRONMENTS
        </h1>
        <p className="mt-1 text-sm text-white/40">
          Deployment pipeline and environment health across the A.I.M.S.
          platform.
        </p>
      </header>

      {/* ---- Pipeline Visualization ---- */}
      <section className="rounded-3xl border border-wireframe-stroke bg-black/60 p-6 backdrop-blur-2xl">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-white/80 font-display">
          Promotion Pipeline
        </h2>
        <p className="mt-1 text-[0.65rem] text-white/30 uppercase tracking-wider">
          Promote builds across environments
        </p>

        <div className="mt-6 flex flex-col lg:flex-row items-stretch lg:items-center gap-4 lg:gap-0">
          {ENVIRONMENTS.map((env, i) => (
            <React.Fragment key={env.id}>
              {/* Environment Node */}
              <div className="flex-1 min-w-0">
                <div
                  className={`rounded-2xl border p-5 transition-all ${
                    env.status === "healthy"
                      ? "border-emerald-400/20 bg-emerald-400/[0.03]"
                      : env.status === "degraded"
                        ? "border-yellow-400/20 bg-yellow-400/[0.03]"
                        : "border-red-400/20 bg-red-400/[0.03]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 text-gold">
                        {i === 0 ? (
                          <Server size={16} />
                        ) : i === 1 ? (
                          <GitBranch size={16} />
                        ) : (
                          <Globe size={16} />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white">
                          {env.name}
                        </p>
                        <p className="text-[10px] text-white/30 font-mono">
                          {env.url}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${STATUS_CONFIG[env.status].dot}`}
                    />
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${STATUS_CONFIG[env.status].badge}`}
                    >
                      {STATUS_CONFIG[env.status].label}
                    </span>
                    <span className="rounded-full border border-gold/20 bg-gold/10 px-2 py-0.5 text-[9px] font-mono text-gold">
                      {env.version}
                    </span>
                  </div>

                  {/* Services */}
                  <div className="mt-3 flex items-center gap-3">
                    {env.services.map((svc) => (
                      <div key={svc.name} className="flex items-center gap-1.5">
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${STATUS_CONFIG[svc.status].dot}`}
                        />
                        <span className="text-[10px] text-white/40">
                          {svc.name}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 flex items-center gap-3 text-[10px] text-white/20">
                    <span className="flex items-center gap-1">
                      <Clock size={10} />
                      {formatTimestamp(env.lastDeploy)}
                    </span>
                    {env.commitsBehind > 0 && (
                      <span className="flex items-center gap-1">
                        <GitBranch size={10} />
                        {env.commitsBehind} commit
                        {env.commitsBehind > 1 ? "s" : ""} behind
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Arrow + Promote Button */}
              {i < ENVIRONMENTS.length - 1 && (
                <div className="flex flex-col items-center justify-center px-3 py-2 lg:py-0">
                  <div className="hidden lg:flex flex-col items-center gap-2">
                    <ArrowRight
                      size={18}
                      className="text-gold/40"
                    />
                    <button
                      onClick={() =>
                        handlePromote(env.id, ENVIRONMENTS[i + 1].id)
                      }
                      disabled={
                        promoting ===
                        `${env.id}-${ENVIRONMENTS[i + 1].id}`
                      }
                      className="rounded-lg border border-gold/20 bg-gold/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gold transition-all hover:bg-gold/10 hover:border-gold/20 hover:shadow-[0_0_15px_rgba(251,191,36,0.1)] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {promoting ===
                      `${env.id}-${ENVIRONMENTS[i + 1].id}` ? (
                        <span className="flex items-center gap-1.5">
                          <span className="h-3 w-3 animate-spin rounded-full border border-gold/30 border-t-gold" />
                          Promoting
                        </span>
                      ) : (
                        "Promote"
                      )}
                    </button>
                  </div>

                  {/* Mobile: vertical arrow */}
                  <div className="flex lg:hidden items-center gap-3">
                    <div className="h-px flex-1 bg-gold/10" />
                    <button
                      onClick={() =>
                        handlePromote(env.id, ENVIRONMENTS[i + 1].id)
                      }
                      disabled={
                        promoting ===
                        `${env.id}-${ENVIRONMENTS[i + 1].id}`
                      }
                      className="flex items-center gap-2 rounded-lg border border-gold/20 bg-gold/10 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gold transition-all hover:bg-gold/10 hover:border-gold/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {promoting ===
                      `${env.id}-${ENVIRONMENTS[i + 1].id}` ? (
                        <span className="flex items-center gap-1.5">
                          <span className="h-3 w-3 animate-spin rounded-full border border-gold/30 border-t-gold" />
                          Promoting
                        </span>
                      ) : (
                        <>
                          Promote to {ENVIRONMENTS[i + 1].name}
                          <ArrowRight size={12} />
                        </>
                      )}
                    </button>
                    <div className="h-px flex-1 bg-gold/10" />
                  </div>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </section>

      {/* ---- Environment Detail Cards ---- */}
      <div className="grid gap-6 md:grid-cols-3">
        {ENVIRONMENTS.map((env, i) => (
          <section
            key={env.id}
            className="rounded-2xl border border-gold/20 bg-black/60 p-5 backdrop-blur-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                    i === 2
                      ? "bg-gradient-to-br from-gold/20 to-gold/10 text-gold"
                      : "bg-white/5 text-gold"
                  }`}
                >
                  {i === 0 ? (
                    <Server size={16} />
                  ) : i === 1 ? (
                    <GitBranch size={16} />
                  ) : (
                    <Globe size={16} />
                  )}
                </div>
                <h3 className="text-sm font-semibold text-white">
                  {env.name}
                </h3>
              </div>
              <span
                className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${STATUS_CONFIG[env.status].badge}`}
              >
                {STATUS_CONFIG[env.status].label}
              </span>
            </div>

            <div className="space-y-3">
              <div className="rounded-xl border border-wireframe-stroke bg-black/40 p-3">
                <p className="text-[10px] uppercase tracking-wider text-white/30">
                  URL
                </p>
                <p className="text-xs font-mono text-gold mt-0.5 truncate">
                  {env.url}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-wireframe-stroke bg-black/40 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-white/30">
                    Version
                  </p>
                  <p className="text-xs font-mono text-white mt-0.5">
                    {env.version}
                  </p>
                </div>
                <div className="rounded-xl border border-wireframe-stroke bg-black/40 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-white/30">
                    Last Deploy
                  </p>
                  <p className="text-xs text-white mt-0.5">
                    {formatTimestamp(env.lastDeploy)}
                  </p>
                </div>
              </div>

              {/* Service Health */}
              <div className="rounded-xl border border-wireframe-stroke bg-black/40 p-3">
                <p className="text-[10px] uppercase tracking-wider text-white/30 mb-2">
                  Services ({env.services.length})
                </p>
                <div className="space-y-2">
                  {env.services.map((svc) => (
                    <div
                      key={svc.name}
                      className="flex items-center justify-between"
                    >
                      <span className="text-[11px] text-white/50">
                        {svc.name}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] text-white/20">
                          {STATUS_CONFIG[svc.status].label}
                        </span>
                        <span
                          className={`h-2 w-2 rounded-full ${STATUS_CONFIG[svc.status].dot}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {env.commitsBehind > 0 && (
                <div className="flex items-center gap-2 rounded-xl border border-yellow-400/10 bg-yellow-400/[0.03] p-3">
                  <GitBranch size={12} className="text-yellow-400/60" />
                  <span className="text-[10px] text-yellow-400/80">
                    {env.commitsBehind} commit
                    {env.commitsBehind > 1 ? "s" : ""} behind{" "}
                    <span className="font-mono">main</span>
                  </span>
                </div>
              )}
            </div>
          </section>
        ))}
      </div>

      {/* ---- Recent Deployments Table ---- */}
      <section className="rounded-3xl border border-wireframe-stroke bg-black/60 p-6 backdrop-blur-2xl">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-white/80 font-display">
            Recent Deployments
          </h2>
          <Activity size={16} className="text-gold/40" />
        </div>
        <p className="text-[0.65rem] text-white/30 uppercase tracking-wider mb-4">
          Latest promotion and deployment activity
        </p>

        {/* Table Header */}
        <div className="hidden sm:grid grid-cols-12 gap-4 px-4 py-2 text-[10px] uppercase tracking-wider text-white/20 border-b border-wireframe-stroke">
          <span className="col-span-1">Status</span>
          <span className="col-span-2">Version</span>
          <span className="col-span-2">Environment</span>
          <span className="col-span-3">Message</span>
          <span className="col-span-2">Author</span>
          <span className="col-span-2 text-right">Timestamp</span>
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-white/5">
          {RECENT_DEPLOYMENTS.map((dep) => {
            const statusCfg = DEPLOY_STATUS_CONFIG[dep.status];
            const StatusIcon = statusCfg.icon;

            return (
              <div
                key={dep.id}
                className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 px-4 py-3 hover:bg-white/[0.02] transition-colors"
              >
                {/* Status */}
                <div className="col-span-1 flex items-center gap-2 sm:gap-0">
                  <StatusIcon size={14} className={statusCfg.cls} />
                  <span
                    className={`sm:hidden text-[10px] font-medium ${statusCfg.cls}`}
                  >
                    {statusCfg.label}
                  </span>
                </div>

                {/* Version */}
                <div className="col-span-2 flex items-center">
                  <span className="rounded-full border border-gold/20 bg-gold/10 px-2 py-0.5 text-[10px] font-mono text-gold">
                    {dep.version}
                  </span>
                </div>

                {/* Environment */}
                <div className="col-span-2 flex items-center">
                  <span className="text-xs text-white/50">
                    {dep.environment}
                  </span>
                </div>

                {/* Message */}
                <div className="col-span-3 flex items-center">
                  <span className="text-xs text-white/40 truncate">
                    {dep.message}
                  </span>
                </div>

                {/* Author */}
                <div className="col-span-2 flex items-center">
                  <span className="text-[11px] text-gold/50 font-medium">
                    {dep.author}
                  </span>
                </div>

                {/* Timestamp */}
                <div className="col-span-2 flex items-center justify-end">
                  <span className="text-[10px] text-white/20 font-mono">
                    {formatDate(dep.timestamp)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
