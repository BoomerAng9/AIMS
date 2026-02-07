// frontend/app/dashboard/plugs/[id]/page.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowUpRight,
  Check,
  Clock,
  Container,
  ExternalLink,
  File,
  Folder,
  Globe,
  Layers,
  Layout,
  MoreVertical,
  Pause,
  Play,
  RefreshCw,
  Rocket,
  Server,
  Settings,
  Shield,
  ShoppingCart,
  Store,
  Terminal,
  Trash2,
  Users,
  Wifi,
  Zap,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types & Data                                                       */
/* ------------------------------------------------------------------ */

type PlugStatus = "live" | "building" | "review" | "ready" | "deployed";

interface PlugDetail {
  id: string;
  name: string;
  archetype: string;
  status: PlugStatus;
  domain?: string;
  requests?: number;
  errors?: number;
  uptime?: number;
  avgResponseTime?: string;
  stage: string;
  containerId?: string;
  port?: number;
  progress?: number;
  createdAt: string;
  files: { path: string; type: "file" | "folder" }[];
  integrations: { name: string; status: "active" | "inactive" }[];
}

const MOCK_PLUGS: Record<string, PlugDetail> = {
  "plug-001": {
    id: "plug-001",
    name: "RealtyVision CRM",
    archetype: "CRM",
    status: "live",
    domain: "realtyvision.com",
    requests: 1247,
    errors: 3,
    uptime: 99.9,
    avgResponseTime: "142ms",
    stage: "LIVE",
    containerId: "ctr-8f3a2b1c",
    port: 3000,
    createdAt: "2025-11-14",
    files: [
      { path: "/app", type: "folder" },
      { path: "/app/layout.tsx", type: "file" },
      { path: "/app/page.tsx", type: "file" },
      { path: "/app/dashboard/page.tsx", type: "file" },
      { path: "/app/api/contacts/route.ts", type: "file" },
      { path: "/app/api/deals/route.ts", type: "file" },
      { path: "/components/Pipeline.tsx", type: "file" },
      { path: "/components/ContactCard.tsx", type: "file" },
      { path: "/lib/db.ts", type: "file" },
      { path: "/tailwind.config.ts", type: "file" },
      { path: "/package.json", type: "file" },
    ],
    integrations: [
      { name: "Stripe Payments", status: "active" },
      { name: "SendGrid Email", status: "active" },
      { name: "Google OAuth", status: "active" },
      { name: "Twilio SMS", status: "inactive" },
    ],
  },
  "plug-002": {
    id: "plug-002",
    name: "FitTrack Pro",
    archetype: "SaaS",
    status: "building",
    stage: "BUILD",
    progress: 65,
    createdAt: "2025-12-02",
    files: [
      { path: "/app", type: "folder" },
      { path: "/app/layout.tsx", type: "file" },
      { path: "/app/page.tsx", type: "file" },
      { path: "/app/workouts/page.tsx", type: "file" },
      { path: "/app/api/auth/route.ts", type: "file" },
      { path: "/components/WorkoutLog.tsx", type: "file" },
      { path: "/package.json", type: "file" },
    ],
    integrations: [
      { name: "Stripe Subscriptions", status: "active" },
      { name: "Auth0", status: "active" },
    ],
  },
  "plug-003": {
    id: "plug-003",
    name: "LegalDocs Hub",
    archetype: "Internal Tool",
    status: "review",
    stage: "REVIEW",
    createdAt: "2025-12-08",
    files: [
      { path: "/app", type: "folder" },
      { path: "/app/layout.tsx", type: "file" },
      { path: "/app/page.tsx", type: "file" },
      { path: "/app/documents/page.tsx", type: "file" },
      { path: "/app/api/docs/route.ts", type: "file" },
      { path: "/components/DocViewer.tsx", type: "file" },
      { path: "/components/TemplateList.tsx", type: "file" },
      { path: "/package.json", type: "file" },
    ],
    integrations: [
      { name: "DocuSign", status: "active" },
      { name: "AWS S3", status: "active" },
      { name: "OpenAI Summarizer", status: "inactive" },
    ],
  },
  "plug-004": {
    id: "plug-004",
    name: "ArtisanMarket",
    archetype: "Marketplace",
    status: "ready",
    stage: "DEPLOY",
    createdAt: "2025-12-10",
    files: [
      { path: "/app", type: "folder" },
      { path: "/app/layout.tsx", type: "file" },
      { path: "/app/page.tsx", type: "file" },
      { path: "/app/listings/page.tsx", type: "file" },
      { path: "/app/vendors/page.tsx", type: "file" },
      { path: "/app/api/listings/route.ts", type: "file" },
      { path: "/app/api/payments/route.ts", type: "file" },
      { path: "/components/ListingCard.tsx", type: "file" },
      { path: "/components/VendorProfile.tsx", type: "file" },
      { path: "/package.json", type: "file" },
    ],
    integrations: [
      { name: "Stripe Connect", status: "active" },
      { name: "Algolia Search", status: "active" },
      { name: "Cloudinary", status: "active" },
    ],
  },
  "plug-005": {
    id: "plug-005",
    name: "PortfolioX",
    archetype: "Portfolio",
    status: "deployed",
    domain: "portfoliox.dev",
    requests: 423,
    errors: 0,
    uptime: 100,
    avgResponseTime: "89ms",
    stage: "LIVE",
    containerId: "ctr-2d7f9e4a",
    port: 3001,
    createdAt: "2025-10-28",
    files: [
      { path: "/app", type: "folder" },
      { path: "/app/layout.tsx", type: "file" },
      { path: "/app/page.tsx", type: "file" },
      { path: "/app/projects/page.tsx", type: "file" },
      { path: "/app/about/page.tsx", type: "file" },
      { path: "/components/ProjectGrid.tsx", type: "file" },
      { path: "/components/Hero.tsx", type: "file" },
      { path: "/public/images", type: "folder" },
      { path: "/package.json", type: "file" },
    ],
    integrations: [
      { name: "Google Analytics", status: "active" },
      { name: "Vercel Hosting", status: "active" },
    ],
  },
};

const PIPELINE_STAGES = ["INTAKE", "SCOPE", "BUILD", "REVIEW", "DEPLOY", "LIVE"];

const STATUS_CONFIG: Record<
  PlugStatus,
  { label: string; color: string; dot: string }
> = {
  live: { label: "Live", color: "text-emerald-400", dot: "bg-emerald-400 animate-pulse" },
  building: { label: "Building", color: "text-blue-400", dot: "bg-blue-400 animate-pulse" },
  review: { label: "In Review", color: "text-amber-400", dot: "bg-amber-400" },
  ready: { label: "Ready to Deploy", color: "text-violet-400", dot: "bg-violet-400" },
  deployed: { label: "Deployed", color: "text-emerald-400", dot: "bg-emerald-400" },
};

const ARCHETYPE_ICON: Record<string, React.ElementType> = {
  CRM: Users,
  SaaS: Layers,
  "Internal Tool": Settings,
  Marketplace: Store,
  Portfolio: Layout,
  "E-commerce": ShoppingCart,
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function PlugDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Find plug data, fallback to default if id not found
  const plug = MOCK_PLUGS[id] || {
    id,
    name: `Plug ${id}`,
    archetype: "Custom",
    status: "building" as PlugStatus,
    stage: "BUILD",
    progress: 30,
    createdAt: "2025-12-01",
    files: [
      { path: "/app", type: "folder" as const },
      { path: "/app/page.tsx", type: "file" as const },
      { path: "/package.json", type: "file" as const },
    ],
    integrations: [],
  };

  const status = STATUS_CONFIG[plug.status];
  const ArchetypeIcon = ARCHETYPE_ICON[plug.archetype] || Layers;
  const isLive = plug.status === "live" || plug.status === "deployed";
  const currentStageIndex = PIPELINE_STAGES.indexOf(plug.stage);

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Back Link */}
      <Link
        href="/dashboard/plugs"
        className="inline-flex items-center gap-2 text-xs text-amber-100/40 hover:text-amber-200 transition-colors"
      >
        <ArrowLeft size={12} /> Back to Plugs
      </Link>

      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/5 text-amber-200">
            <ArchetypeIcon size={28} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-amber-50 font-display">
                {plug.name}
              </h1>
              <span className="rounded-full border border-white/5 bg-white/5 px-3 py-0.5 text-[10px] font-medium text-amber-100/60 uppercase tracking-wider">
                {plug.archetype}
              </span>
            </div>
            <div className="mt-1.5 flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${status.dot}`} />
                <span className={`text-[10px] uppercase font-bold tracking-wider ${status.color}`}>
                  {status.label}
                </span>
              </div>
              <span className="text-[10px] text-amber-100/20">|</span>
              <span className="text-[10px] text-amber-100/30 font-mono">{plug.id}</span>
              <span className="text-[10px] text-amber-100/20">|</span>
              <span className="text-[10px] text-amber-100/30">
                Created {plug.createdAt}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {isLive && (
            <button className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-medium text-amber-100/60 transition-all hover:border-amber-300/30 hover:text-amber-50">
              <RefreshCw size={12} /> Redeploy
            </button>
          )}
          {isLive && (
            <button className="flex items-center gap-1.5 rounded-xl border border-amber-400/20 bg-amber-400/5 px-4 py-2.5 text-xs font-medium text-amber-300 transition-all hover:bg-amber-400/10">
              <Pause size={12} /> Stop
            </button>
          )}
          {plug.status === "ready" && (
            <button className="flex items-center gap-1.5 rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-bold text-black shadow-[0_0_15px_rgba(251,191,36,0.2)] transition-all hover:scale-105 active:scale-95">
              <Rocket size={12} /> Deploy Now
            </button>
          )}
          <button
            onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
            className="flex items-center gap-1.5 rounded-xl border border-red-400/20 bg-red-400/5 px-4 py-2.5 text-xs font-medium text-red-400/60 transition-all hover:bg-red-400/10 hover:text-red-400"
          >
            <Trash2 size={12} /> Delete
          </button>
          {isLive && (
            <button className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-medium text-amber-100/60 transition-all hover:border-amber-300/30 hover:text-amber-50">
              <Terminal size={12} /> View Logs
            </button>
          )}
        </div>
      </header>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="rounded-2xl border border-red-400/30 bg-red-400/5 p-4 flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-3">
            <AlertTriangle size={16} className="text-red-400" />
            <p className="text-xs text-red-400">
              Are you sure? This will permanently delete <strong>{plug.name}</strong> and all associated data.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-[10px] text-amber-100/60 hover:text-amber-50 transition-colors"
            >
              Cancel
            </button>
            <button className="rounded-lg bg-red-500 px-3 py-1.5 text-[10px] font-bold text-white hover:bg-red-600 transition-colors">
              Confirm Delete
            </button>
          </div>
        </div>
      )}

      {/* Pipeline Progress */}
      <div className="rounded-3xl border border-white/10 bg-black/60 p-6 backdrop-blur-2xl">
        <p className="text-[10px] uppercase tracking-wider text-amber-100/40 mb-4">
          Build Pipeline
        </p>
        <div className="flex items-center justify-between">
          {PIPELINE_STAGES.map((stage, i) => (
            <React.Fragment key={stage}>
              <div className="flex flex-col items-center gap-2">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full border text-[10px] font-bold transition-all ${
                    i < currentStageIndex
                      ? "border-emerald-400/30 bg-emerald-500/20 text-emerald-400"
                      : i === currentStageIndex
                        ? "border-amber-300/30 bg-amber-400/10 text-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.15)]"
                        : "border-white/10 bg-white/5 text-amber-100/30"
                  }`}
                >
                  {i < currentStageIndex ? <Check size={14} /> : i + 1}
                </div>
                <span
                  className={`text-[9px] uppercase tracking-wider font-bold ${
                    i < currentStageIndex
                      ? "text-emerald-400/60"
                      : i === currentStageIndex
                        ? "text-amber-300"
                        : "text-amber-100/20"
                  }`}
                >
                  {stage}
                </span>
              </div>
              {i < PIPELINE_STAGES.length - 1 && (
                <div className="flex-1 mx-1">
                  <div
                    className={`h-[2px] rounded-full ${
                      i < currentStageIndex ? "bg-emerald-400/40" : "bg-white/5"
                    }`}
                  />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Building Progress Bar */}
        {plug.status === "building" && plug.progress !== undefined && (
          <div className="mt-4 pt-4 border-t border-white/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-amber-100/40">Build Progress</span>
              <span className="text-xs font-mono text-blue-400">{plug.progress}%</span>
            </div>
            <div className="h-2 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all"
                style={{ width: `${plug.progress}%` }}
              />
            </div>
            <p className="mt-2 text-[10px] text-amber-100/30">
              Engineer_Ang is building your Plug. Quality_Ang will review upon completion.
            </p>
          </div>
        )}
      </div>

      {/* Stats Grid (if live) */}
      {isLive && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "Requests",
              value: plug.requests?.toLocaleString() || "0",
              icon: Activity,
              color: "text-amber-50",
            },
            {
              label: "Errors",
              value: String(plug.errors || 0),
              icon: AlertTriangle,
              color: (plug.errors || 0) > 0 ? "text-red-400" : "text-emerald-400",
            },
            {
              label: "Uptime",
              value: `${plug.uptime || 0}%`,
              icon: Server,
              color: "text-emerald-400",
            },
            {
              label: "Avg Response",
              value: plug.avgResponseTime || "N/A",
              icon: Clock,
              color: "text-amber-200",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-white/10 bg-black/60 p-5 backdrop-blur-2xl"
            >
              <div className="flex items-center gap-2 mb-2">
                <stat.icon size={12} className="text-amber-100/30" />
                <p className="text-[10px] uppercase tracking-widest text-amber-100/40">
                  {stat.label}
                </p>
              </div>
              <p className={`text-2xl font-semibold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* File Manifest */}
        <div className="rounded-3xl border border-white/10 bg-black/60 p-6 backdrop-blur-2xl">
          <div className="flex items-center gap-2 mb-4">
            <File size={14} className="text-amber-200" />
            <h2 className="text-sm font-semibold uppercase tracking-widest text-amber-200/90 font-display">
              File Manifest
            </h2>
            <span className="rounded-full bg-white/5 border border-white/5 px-2 py-0.5 text-[9px] text-amber-100/40 ml-auto">
              {plug.files.length} items
            </span>
          </div>
          <div className="space-y-1 max-h-[320px] overflow-y-auto scrollbar-thin">
            {plug.files.map((file) => (
              <div
                key={file.path}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs hover:bg-white/[0.03] transition-colors"
              >
                {file.type === "folder" ? (
                  <Folder size={12} className="text-amber-300/60 shrink-0" />
                ) : (
                  <File size={12} className="text-amber-100/30 shrink-0" />
                )}
                <span
                  className={`font-mono ${
                    file.type === "folder"
                      ? "text-amber-200/70 font-medium"
                      : "text-amber-100/50"
                  }`}
                >
                  {file.path}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Deployment Info + Integrations */}
        <div className="space-y-6">
          {/* Deployment Info */}
          {isLive && (
            <div className="rounded-3xl border border-white/10 bg-black/60 p-6 backdrop-blur-2xl">
              <div className="flex items-center gap-2 mb-4">
                <Globe size={14} className="text-amber-200" />
                <h2 className="text-sm font-semibold uppercase tracking-widest text-amber-200/90 font-display">
                  Deployment
                </h2>
              </div>
              <div className="space-y-3">
                {plug.domain && (
                  <div className="flex items-center justify-between rounded-xl bg-white/[0.03] p-3">
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-amber-100/30">
                        URL
                      </p>
                      <a
                        href={`https://${plug.domain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-amber-200 hover:text-amber-100 transition-colors flex items-center gap-1 mt-0.5"
                      >
                        https://{plug.domain} <ArrowUpRight size={10} />
                      </a>
                    </div>
                    <ExternalLink size={14} className="text-amber-100/20" />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  {plug.containerId && (
                    <div className="rounded-xl bg-white/[0.03] p-3">
                      <p className="text-[9px] uppercase tracking-wider text-amber-100/30">
                        Container ID
                      </p>
                      <p className="text-xs text-amber-100/60 font-mono mt-0.5">
                        {plug.containerId}
                      </p>
                    </div>
                  )}
                  {plug.port && (
                    <div className="rounded-xl bg-white/[0.03] p-3">
                      <p className="text-[9px] uppercase tracking-wider text-amber-100/30">
                        Port
                      </p>
                      <p className="text-xs text-amber-100/60 font-mono mt-0.5">
                        :{plug.port}
                      </p>
                    </div>
                  )}
                </div>
                <div className="rounded-xl bg-white/[0.03] p-3">
                  <p className="text-[9px] uppercase tracking-wider text-amber-100/30">
                    Domain
                  </p>
                  <p className="text-xs text-amber-100/60 font-mono mt-0.5">
                    {plug.domain || "Not configured"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Integrations */}
          <div className="rounded-3xl border border-white/10 bg-black/60 p-6 backdrop-blur-2xl">
            <div className="flex items-center gap-2 mb-4">
              <Zap size={14} className="text-amber-200" />
              <h2 className="text-sm font-semibold uppercase tracking-widest text-amber-200/90 font-display">
                Integrations
              </h2>
              <span className="rounded-full bg-white/5 border border-white/5 px-2 py-0.5 text-[9px] text-amber-100/40 ml-auto">
                {plug.integrations.length}
              </span>
            </div>
            {plug.integrations.length > 0 ? (
              <div className="space-y-2">
                {plug.integrations.map((integration) => (
                  <div
                    key={integration.name}
                    className="flex items-center justify-between rounded-xl bg-white/[0.03] p-3"
                  >
                    <div className="flex items-center gap-2">
                      <Wifi size={12} className="text-amber-100/30" />
                      <span className="text-xs text-amber-100/60">
                        {integration.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          integration.status === "active"
                            ? "bg-emerald-400"
                            : "bg-amber-100/20"
                        }`}
                      />
                      <span
                        className={`text-[9px] uppercase font-bold tracking-wider ${
                          integration.status === "active"
                            ? "text-emerald-400"
                            : "text-amber-100/30"
                        }`}
                      >
                        {integration.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-amber-100/30 text-center py-6">
                No integrations configured yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
