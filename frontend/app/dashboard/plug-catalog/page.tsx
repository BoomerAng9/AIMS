// frontend/app/dashboard/plug-catalog/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { staggerContainer, staggerItem, fadeUp } from "@/lib/motion/variants";
import {
  Bot,
  Cpu,
  Globe,
  Mic,
  Monitor,
  PenTool,
  Search,
  Terminal,
  Trophy,
  Wind,
  Workflow,
  Plus,
  ArrowRight,
  Zap,
  Shield,
  Download,
  Cloud,
  Filter,
  Sparkles,
  ClipboardList,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────

interface CatalogPlug {
  id: string;
  name: string;
  tagline: string;
  category: string;
  tags: string[];
  tier: string;
  icon: string;
  accentColor: string;
  featured: boolean;
  comingSoon: boolean;
  resources: { cpu: string; memory: string; gpu: boolean };
  delivery: string[];
}

type CategoryKey =
  | "all"
  | "agent-framework"
  | "code-execution"
  | "workflow-automation"
  | "research-agent"
  | "computer-use"
  | "voice-agent"
  | "content-engine"
  | "data-pipeline"
  | "custom-vertical"
  | "dev-tools";

// ── Icon Map ─────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ComponentType<{ size?: string | number; className?: string }>> = {
  Bot, Cpu, Globe, Mic, Monitor, PenTool, Search, Terminal, Trophy, Wind, Workflow,
};

const CATEGORY_LABELS: Record<string, string> = {
  all: "All Tools",
  "agent-framework": "Agent Frameworks",
  "code-execution": "Code Execution",
  "workflow-automation": "Workflow Automation",
  "research-agent": "Research Agents",
  "computer-use": "Computer Use",
  "voice-agent": "Voice Agents",
  "content-engine": "Content Engines",
  "data-pipeline": "Data Pipelines",
  "custom-vertical": "Custom Verticals",
  "dev-tools": "Dev Tools",
};

const TIER_BADGES: Record<string, { label: string; color: string; border: string }> = {
  free: { label: "Free", color: "text-emerald-400", border: "border-emerald-400/20" },
  starter: { label: "Starter", color: "text-blue-400", border: "border-blue-400/20" },
  pro: { label: "Pro", color: "text-violet-400", border: "border-violet-400/20" },
  enterprise: { label: "Enterprise", color: "text-gold", border: "border-gold/20" },
};

// ── Page ──────────────────────────────────────────────────────────────────

export default function PlugCatalogPage() {
  const [plugs, setPlugs] = useState<CatalogPlug[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<CategoryKey>("all");
  const [categories, setCategories] = useState<Record<string, number>>({});

  // Deploy state
  const [deploying, setDeploying] = useState<string | null>(null);
  const [deployResult, setDeployResult] = useState<{ plugId: string; success: boolean; message: string; instanceId?: string } | null>(null);

  // Instance management state
  const [instances, setInstances] = useState<Array<{ instanceId: string; plugId: string; name: string; status: string; assignedPort: number; healthStatus: string }>>([]);
  const [showInstances, setShowInstances] = useState(false);

  useEffect(() => {
    fetch("/api/plug-catalog")
      .then((res) => res.json())
      .then((data) => {
        setPlugs(data.plugs || []);
        setCategories(data.categories || {});
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  // Load running instances
  const loadInstances = useCallback(() => {
    fetch("/api/plug-instances?userId=web-user")
      .then((res) => res.json())
      .then((data) => setInstances(data.instances || []))
      .catch(() => { });
  }, []);

  useEffect(() => { loadInstances(); }, [loadInstances]);

  // Deploy a plug
  const handleSpinUp = async (plugId: string, plugName: string) => {
    setDeploying(plugId);
    setDeployResult(null);
    try {
      const res = await fetch("/api/plug-catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plugId,
          userId: "web-user",
          instanceName: `${plugName.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Date.now().toString(36).slice(-4)}`,
          deliveryMode: "hosted",
        }),
      });
      const data = await res.json();
      if (res.ok && data.instance) {
        setDeployResult({ plugId, success: true, message: `${plugName} deployed successfully`, instanceId: data.instance.instanceId });
        loadInstances();
      } else {
        setDeployResult({ plugId, success: false, message: data.error || "Deploy failed" });
      }
    } catch (err) {
      setDeployResult({ plugId, success: false, message: "Network error — gateway unreachable" });
    } finally {
      setDeploying(null);
    }
  };

  // Stop an instance
  const handleInstanceAction = async (instanceId: string, action: "stop" | "restart" | "remove") => {
    try {
      await fetch("/api/plug-instances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instanceId, action }),
      });
      loadInstances();
    } catch { }
  };

  // Filter
  const filtered = plugs.filter((p) => {
    if (activeCategory !== "all" && p.category !== activeCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.tagline.toLowerCase().includes(q) ||
        p.tags.some((t) => t.includes(q))
      );
    }
    return true;
  });

  const featuredPlugs = plugs.filter((p) => p.featured && !p.comingSoon);
  const availableCount = plugs.filter((p) => !p.comingSoon).length;

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-[0.6rem] uppercase tracking-[0.25em] text-gold/50 mb-1 font-mono">
            Plug Catalog
          </p>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-display uppercase tracking-wider text-zinc-100">
              Plug It In
            </h1>
            <span className="flex h-5 min-w-5 items-center justify-center rounded border border-gold/20 bg-gold/5 px-1.5 text-[0.6rem] font-mono text-gold">
              {availableCount}
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            Browse AI tools, agents, and platforms. One click to spin up. One click to ship.
          </p>
        </div>
        <Link
          href="/dashboard/needs-analysis"
          className="flex items-center gap-2 rounded-xl bg-gold px-5 py-2.5 text-sm font-medium text-black transition-colors hover:bg-gold-light"
        >
          <ClipboardList size={14} />
          Business Needs Analysis
        </Link>
      </header>

      {/* ── Stats Strip ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Available Tools", value: availableCount, color: "text-zinc-100" },
          { label: "Featured", value: featuredPlugs.length, color: "text-gold" },
          { label: "Categories", value: Object.keys(categories).length, color: "text-blue-400" },
          { label: "Coming Soon", value: plugs.filter((p) => p.comingSoon).length, color: "text-violet-400" },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            variants={staggerItem}
            whileHover={{ scale: 1.03, borderColor: "rgba(212,168,67,0.3)" }}
            className="wireframe-card p-4 text-center"
          >
            <p className="text-[0.55rem] uppercase tracking-widest text-zinc-500 font-mono">
              {stat.label}
            </p>
            <p className={`text-xl font-display mt-1 ${stat.color}`}>{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* ── Search + Category Filter ───────────────────────────────────── */}
      <motion.div variants={staggerItem} className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tools, agents, platforms..."
            className="input-field w-full pl-9"
          />
        </div>

        {/* Category pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-thin pb-1">
          <Filter size={12} className="text-zinc-600 shrink-0" />
          {(["all", ...Object.keys(CATEGORY_LABELS).filter((k) => k !== "all")] as CategoryKey[]).map(
            (cat) => {
              const isActive = activeCategory === cat;
              const count = cat === "all" ? availableCount : categories[cat] || 0;
              if (cat !== "all" && count === 0) return null;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`shrink-0 flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[0.6rem] font-mono uppercase tracking-wider transition-all ${isActive
                      ? "bg-gold/10 border border-gold/30 text-gold"
                      : "border border-wireframe-stroke text-zinc-500 hover:border-white/10 hover:text-zinc-400"
                    }`}
                >
                  {CATEGORY_LABELS[cat] || cat}
                  {count > 0 && (
                    <span className={`text-[0.5rem] ${isActive ? "text-gold/60" : "text-zinc-600"}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            }
          )}
        </div>
      </motion.div>

      {/* ── Loading ────────────────────────────────────────────────────── */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="wireframe-card p-6 animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-[#18181B]" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-24 bg-[#18181B] rounded" />
                  <div className="h-2 w-16 bg-[#18181B] rounded" />
                </div>
              </div>
              <div className="h-2 w-full bg-[#18181B] rounded mb-2" />
              <div className="h-2 w-2/3 bg-[#18181B] rounded" />
            </div>
          ))}
        </div>
      )}

      {/* ── Plug Grid ──────────────────────────────────────────────────── */}
      {!loading && (
        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeCategory}-${searchQuery}`}
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {filtered.map((plug) => {
              const IconComp = ICON_MAP[plug.icon] || Zap;
              const tier = TIER_BADGES[plug.tier] || TIER_BADGES.starter;

              return (
                <motion.div
                  key={plug.id}
                  variants={staggerItem}
                  whileHover={{ y: -4, borderColor: `${plug.accentColor}33` }}
                  className={`wireframe-card group p-5 flex flex-col transition-all ${plug.comingSoon ? "opacity-60" : ""
                    }`}
                >
                  {/* Top: Icon + Name + Tier */}
                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors"
                      style={{
                        borderColor: `${plug.accentColor}30`,
                        backgroundColor: `${plug.accentColor}08`,
                        color: plug.accentColor,
                      }}
                    >
                      <IconComp size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-medium text-zinc-100 truncate">
                          {plug.name}
                        </h3>
                        {plug.comingSoon && (
                          <span className="shrink-0 rounded border border-violet-400/20 bg-violet-400/5 px-1.5 py-0.5 text-[0.5rem] font-mono text-violet-400 uppercase">
                            Soon
                          </span>
                        )}
                      </div>
                      <span className={`text-[0.55rem] font-mono uppercase ${tier.color}`}>
                        {tier.label}
                      </span>
                    </div>
                  </div>

                  {/* Tagline */}
                  <p className="text-xs text-zinc-400 mb-3 flex-1">
                    {plug.tagline}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {plug.tags.slice(0, 4).map((tag) => (
                      <span
                        key={tag}
                        className="rounded border border-wireframe-stroke px-1.5 py-0.5 text-[0.5rem] font-mono text-zinc-500"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Resources + Delivery */}
                  <div className="flex items-center gap-3 mb-4 text-[0.55rem] text-zinc-500 font-mono">
                    <span>{plug.resources.cpu} CPU</span>
                    <span className="text-zinc-600">|</span>
                    <span>{plug.resources.memory}</span>
                    {plug.resources.gpu && (
                      <>
                        <span className="text-zinc-600">|</span>
                        <span className="text-amber-400">GPU</span>
                      </>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-auto">
                    {plug.comingSoon ? (
                      <button
                        disabled
                        className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-wireframe-stroke px-3 py-2 text-[0.6rem] font-mono text-zinc-500 cursor-not-allowed"
                      >
                        <Sparkles size={11} />
                        Coming Soon
                      </button>
                    ) : (
                      <>
                        <Link
                          href={`/dashboard/plug-catalog/${plug.id}`}
                          className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-wireframe-stroke px-3 py-2 text-[0.6rem] font-mono text-zinc-400 hover:border-gold/20 hover:text-gold transition-all"
                        >
                          Details <ArrowRight size={10} />
                        </Link>
                        {plug.delivery.includes("hosted") && (
                          <button
                            onClick={() => handleSpinUp(plug.id, plug.name)}
                            disabled={deploying === plug.id}
                            className={`flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-[0.6rem] font-mono transition-all ${
                              deploying === plug.id
                                ? "bg-gold/5 border-gold/10 text-gold/50 cursor-wait"
                                : deployResult?.plugId === plug.id && deployResult.success
                                ? "bg-emerald-400/10 border-emerald-400/20 text-emerald-400"
                                : deployResult?.plugId === plug.id && !deployResult.success
                                ? "bg-red-400/10 border-red-400/20 text-red-400"
                                : "bg-gold/10 border-gold/20 text-gold hover:bg-gold hover:text-black"
                            }`}
                          >
                            {deploying === plug.id ? (
                              <><Zap size={11} className="animate-pulse" /> Deploying...</>
                            ) : deployResult?.plugId === plug.id && deployResult.success ? (
                              <><Shield size={11} /> Running</>
                            ) : deployResult?.plugId === plug.id && !deployResult.success ? (
                              <><Cloud size={11} /> Retry</>
                            ) : (
                              <><Cloud size={11} /> Spin Up</>
                            )}
                          </button>
                        )}
                        {plug.delivery.includes("exported") && (
                          <button
                            className="flex items-center justify-center gap-1.5 rounded-lg border border-wireframe-stroke px-3 py-2 text-[0.6rem] font-mono text-zinc-500 hover:border-emerald-400/20 hover:text-emerald-400 transition-all"
                            title="Export for self-hosting"
                          >
                            <Download size={11} />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </motion.div>
              );
            })}

            {/* Empty filter state */}
            {filtered.length === 0 && (
              <div className="col-span-full wireframe-card border-dashed p-10 text-center">
                <Search size={24} className="mx-auto text-zinc-600 mb-3" />
                <p className="text-sm text-zinc-500">No tools match your search</p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setActiveCategory("all");
                  }}
                  className="mt-3 text-xs text-gold/60 hover:text-gold transition-colors"
                >
                  Clear filters
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {/* ── Deploy Result Toast ────────────────────────────────────────── */}
      {deployResult && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`wireframe-card p-4 flex items-center justify-between ${
            deployResult.success ? "border-emerald-400/20" : "border-red-400/20"
          }`}
        >
          <div className="flex items-center gap-3">
            {deployResult.success ? (
              <Shield size={16} className="text-emerald-400" />
            ) : (
              <Zap size={16} className="text-red-400" />
            )}
            <div>
              <p className={`text-xs font-medium ${deployResult.success ? "text-emerald-400" : "text-red-400"}`}>
                {deployResult.message}
              </p>
              {deployResult.instanceId && (
                <p className="text-[0.55rem] text-zinc-500 font-mono mt-0.5">
                  Instance: {deployResult.instanceId}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => setDeployResult(null)}
            className="text-zinc-500 hover:text-zinc-400 text-xs"
          >
            Dismiss
          </button>
        </motion.div>
      )}

      {/* ── Running Instances ────────────────────────────────────────── */}
      {instances.length > 0 && (
        <motion.div variants={staggerItem}>
          <button
            onClick={() => setShowInstances(!showInstances)}
            className="flex items-center gap-2 text-xs font-mono text-zinc-500 hover:text-gold transition-colors mb-3"
          >
            <Terminal size={12} />
            Running Instances ({instances.length})
            <ArrowRight size={10} className={`transition-transform ${showInstances ? "rotate-90" : ""}`} />
          </button>

          {showInstances && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {instances.map((inst) => {
                const plug = plugs.find((p) => p.id === inst.plugId);
                return (
                  <div
                    key={inst.instanceId}
                    className="wireframe-card p-4 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-medium text-zinc-100">{inst.name || inst.plugId}</p>
                      <p className="text-[0.55rem] font-mono text-zinc-500 mt-0.5">
                        Port {inst.assignedPort} &middot; {inst.status} &middot;{" "}
                        <span className={inst.healthStatus === "healthy" ? "text-emerald-400" : "text-amber-400"}>
                          {inst.healthStatus || "unknown"}
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleInstanceAction(inst.instanceId, "restart")}
                        className="rounded border border-wireframe-stroke px-2 py-1 text-[0.5rem] font-mono text-zinc-500 hover:text-blue-400 hover:border-blue-400/20 transition-all"
                      >
                        Restart
                      </button>
                      <button
                        onClick={() => handleInstanceAction(inst.instanceId, "stop")}
                        className="rounded border border-wireframe-stroke px-2 py-1 text-[0.5rem] font-mono text-zinc-500 hover:text-amber-400 hover:border-amber-400/20 transition-all"
                      >
                        Stop
                      </button>
                      <button
                        onClick={() => handleInstanceAction(inst.instanceId, "remove")}
                        className="rounded border border-wireframe-stroke px-2 py-1 text-[0.5rem] font-mono text-zinc-500 hover:text-red-400 hover:border-red-400/20 transition-all"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      )}

      {/* ── Needs Analysis CTA ─────────────────────────────────────────── */}
      <motion.div
        variants={staggerItem}
        className="wireframe-card border-dashed p-8 text-center hover:border-gold/15 transition-colors group"
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-dashed border-white/10 text-zinc-600 group-hover:border-gold/30 group-hover:text-gold transition-all">
          <Shield size={20} />
        </div>
        <p className="mt-3 text-sm text-zinc-400 group-hover:text-zinc-300 transition-colors">
          Not sure which tools you need?
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          Our Needs Analysis will assess your business, security, and delivery requirements.
        </p>
        <Link
          href="/dashboard/needs-analysis"
          className="mt-4 inline-flex items-center gap-2 rounded-xl border border-wireframe-stroke bg-[#18181B] px-5 py-2 text-xs text-zinc-400 hover:bg-gold hover:text-black hover:border-gold transition-all"
        >
          Start Needs Analysis <ArrowRight size={12} />
        </Link>
      </motion.div>
    </motion.div>
  );
}
