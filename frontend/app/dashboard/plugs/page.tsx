// frontend/app/dashboard/plugs/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/motion";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Eye,
  Layers,
  Plus,
  Rocket,
  Server,
} from "lucide-react";

type PlugStatus = "live" | "building" | "review" | "ready" | "deployed";

interface Plug {
  id: string;
  name: string;
  archetype?: string;
  status: PlugStatus;
  domain?: string;
  requests?: number;
  uptime?: number;
  stage?: string;
  progress?: number;
}

const STATUS_CONFIG: Record<PlugStatus, { label: string; color: string; dot: string }> = {
  live:     { label: "Live",      color: "text-emerald-400", dot: "bg-emerald-400 animate-pulse" },
  building: { label: "Building",  color: "text-blue-400",    dot: "bg-blue-400 animate-pulse" },
  review:   { label: "In Review", color: "text-gold",        dot: "bg-gold" },
  ready:    { label: "Ready",     color: "text-violet-400",  dot: "bg-violet-400" },
  deployed: { label: "Deployed",  color: "text-emerald-400", dot: "bg-emerald-400" },
};

const PIPELINE_STAGES = ["INTAKE", "SCOPE", "BUILD", "REVIEW", "DEPLOY"];

export default function PlugsPage() {
  const [plugs, setPlugs] = useState<Plug[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/plugs")
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status}`);
        return res.json();
      })
      .then((data) => {
        const items = Array.isArray(data) ? data : data.plugs || [];
        setPlugs(items);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const liveCount = plugs.filter((p) => p.status === "live" || p.status === "deployed").length;

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-[0.6rem] uppercase tracking-[0.25em] text-gold/50 mb-1 font-mono">
            Plug Management
          </p>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-display uppercase tracking-wider text-white">
              Deploy Like a Champion Today
            </h1>
            <span className="flex h-5 min-w-5 items-center justify-center rounded border border-gold/20 bg-gold/5 px-1.5 text-[0.6rem] font-mono text-gold">
              {plugs.length}
            </span>
          </div>
          <p className="mt-1 text-xs text-white/40">
            Manage, monitor, and deploy your active Plugs.
          </p>
        </div>
        <Link
          href="/dashboard/build"
          className="flex items-center gap-2 rounded-xl bg-gold px-5 py-2.5 text-sm font-medium text-black transition-colors hover:bg-gold-light"
        >
          <Plus size={14} />
          Build New Plug
        </Link>
      </header>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Plugs", value: plugs.length, color: "text-white" },
          { label: "Live", value: liveCount, color: "text-emerald-400" },
          { label: "Building", value: plugs.filter((p) => p.status === "building").length, color: "text-blue-400" },
          { label: "Total Requests", value: plugs.reduce((s, p) => s + (p.requests || 0), 0).toLocaleString(), color: "text-gold" },
        ].map((stat) => (
          <motion.div key={stat.label} variants={staggerItem} whileHover={{ scale: 1.03, borderColor: "rgba(212,168,67,0.3)" }} className="wireframe-card p-4 text-center">
            <p className="text-[0.55rem] uppercase tracking-widest text-white/30 font-mono">
              {stat.label}
            </p>
            <p className={`text-xl font-display mt-1 ${stat.color}`}>{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="wireframe-card p-6 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-white/5" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-32 bg-white/5 rounded" />
                  <div className="h-2 w-20 bg-white/5 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="wireframe-card p-6 text-center">
          <p className="text-sm text-red-400/60">Failed to load plugs ({error})</p>
          <button onClick={() => window.location.reload()} className="mt-2 text-xs text-gold/60 hover:text-gold transition-colors">
            Retry
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && plugs.length === 0 && (
        <div className="wireframe-card border-dashed p-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-dashed border-white/20 text-white/30">
            <Plus size={20} />
          </div>
          <p className="mt-4 text-sm text-white/50">No plugs yet</p>
          <p className="mt-1 text-xs text-white/30">
            Use the Build Wizard to create your first Plug.
          </p>
          <Link
            href="/dashboard/build"
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-wireframe-stroke bg-white/5 px-5 py-2 text-xs text-white/60 hover:bg-gold hover:text-black hover:border-gold transition-all"
          >
            Open Build Wizard <ArrowRight size={12} />
          </Link>
        </div>
      )}

      {/* Plug Cards */}
      {!loading && plugs.length > 0 && (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="space-y-3"
        >
          {plugs.map((plug) => {
            const status = STATUS_CONFIG[plug.status] || STATUS_CONFIG.ready;

            return (
              <motion.div
                key={plug.id}
                variants={staggerItem}
                className="wireframe-card group p-5 hover:border-gold/20 transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  {/* Icon + Name */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-wireframe-stroke bg-white/[0.02] text-white/40 group-hover:border-gold/30 group-hover:text-gold transition-colors">
                      <Layers size={18} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-medium text-white truncate">
                          {plug.name}
                        </h3>
                        {plug.archetype && (
                          <span className="shrink-0 rounded border border-wireframe-stroke px-2 py-0.5 text-[0.55rem] font-mono text-white/40 uppercase">
                            {plug.archetype}
                          </span>
                        )}
                      </div>
                      <p className="text-[0.6rem] text-white/20 font-mono mt-0.5">
                        {plug.id}
                      </p>
                    </div>
                  </div>

                  {/* Status + actions */}
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                      <span className={`text-[0.6rem] uppercase font-mono tracking-wider ${status.color}`}>
                        {status.label}
                      </span>
                    </div>

                    {/* Pipeline stages */}
                    {plug.stage && (
                      <div className="flex items-center gap-0.5">
                        {PIPELINE_STAGES.map((stage, i) => {
                          const stageIndex = PIPELINE_STAGES.indexOf(plug.stage || "");
                          return (
                            <div
                              key={stage}
                              className={`h-1 w-3 rounded-full ${
                                i <= stageIndex
                                  ? i === stageIndex ? "bg-gold" : "bg-emerald-400/50"
                                  : "bg-white/10"
                              }`}
                              title={stage}
                            />
                          );
                        })}
                      </div>
                    )}

                    {/* Live stats */}
                    {(plug.status === "live" || plug.status === "deployed") && (
                      <div className="flex items-center gap-3">
                        {plug.domain && (
                          <a
                            href={`https://${plug.domain}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[0.6rem] text-white/40 hover:text-gold transition-colors font-mono"
                          >
                            {plug.domain}
                            <ArrowUpRight size={10} />
                          </a>
                        )}
                        {plug.requests !== undefined && (
                          <div className="flex items-center gap-1">
                            <Activity size={10} className="text-white/20" />
                            <span className="text-[0.6rem] text-white/40 font-mono">
                              {plug.requests.toLocaleString()} req
                            </span>
                          </div>
                        )}
                        {plug.uptime !== undefined && (
                          <div className="flex items-center gap-1">
                            <Server size={10} className="text-white/20" />
                            <span className="text-[0.6rem] text-emerald-400 font-mono">
                              {plug.uptime}%
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 ml-auto">
                      <Link
                        href={`/dashboard/plugs/${plug.id}`}
                        className="flex items-center gap-1 rounded-lg border border-wireframe-stroke px-2.5 py-1.5 text-[0.6rem] font-mono text-white/50 hover:border-gold/20 hover:text-gold transition-all"
                      >
                        <Eye size={11} /> View
                      </Link>
                      {(plug.status === "ready" || plug.status === "review") && (
                        <button className="flex items-center gap-1 rounded-lg bg-gold/10 border border-gold/20 px-2.5 py-1.5 text-[0.6rem] font-mono text-gold hover:bg-gold hover:text-black transition-all">
                          <Rocket size={11} /> Deploy
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Build CTA */}
      <div className="wireframe-card border-dashed p-8 text-center hover:border-gold/15 transition-colors group">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl border border-dashed border-white/15 text-white/20 group-hover:border-gold/30 group-hover:text-gold transition-all">
          <Plus size={18} />
        </div>
        <p className="mt-3 text-sm text-white/40 group-hover:text-white/60 transition-colors">
          Build Another Plug
        </p>
        <Link
          href="/dashboard/build"
          className="mt-3 inline-flex items-center gap-2 rounded-lg border border-wireframe-stroke bg-white/5 px-4 py-2 text-xs text-white/50 hover:bg-gold hover:text-black hover:border-gold transition-all"
        >
          Open Build Wizard <ArrowRight size={12} />
        </Link>
      </div>
    </motion.div>
  );
}
