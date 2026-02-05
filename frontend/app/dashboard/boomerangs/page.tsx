// frontend/app/dashboard/boomerangs/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { Activity, Zap, Brain, Shield, Code, Megaphone, BarChart3, Search, Mic, Eye, Workflow, Globe, Database, RefreshCw } from "lucide-react";

// Icon lookup for registry-loaded BoomerAngs
const ICON_MAP: Record<string, any> = {
  researcher_ang: Search,
  voice_ang: Mic,
  vision_ang: Eye,
  automation_ang: Workflow,
  sitebuilder_ang: Globe,
  coder_ang: Code,
  orchestrator_ang: Brain,
  marketer_ang: Megaphone,
  data_ang: Database,
  quality_ang: Shield,
};

interface RegistryBoomerAng {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  status: string;
  endpoint: string;
  health_check: string;
}

export default function BoomerangsPage() {
  const [agents, setAgents] = useState<RegistryBoomerAng[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<"registry" | "fallback">("fallback");

  useEffect(() => {
    fetchAgents();
  }, []);

  async function fetchAgents() {
    setLoading(true);
    try {
      const res = await fetch("/api/boomerangs");
      if (res.ok) {
        const data = await res.json();
        if (data.boomerangs?.length) {
          setAgents(data.boomerangs);
          setSource("registry");
          setLoading(false);
          return;
        }
      }
    } catch { /* fall through */ }

    // Fallback: load from static registry
    try {
      const res = await fetch("/boomerangs/registry.json");
      if (res.ok) {
        const data = await res.json();
        setAgents(data.boomerangs || []);
        setSource("fallback");
      }
    } catch { /* use empty */ }

    setLoading(false);
  }

  const activeCount = agents.filter(a => a.status === "registered" || a.status === "active").length;

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-amber-50 font-display">
            BOOMER_ANGS
          </h1>
          <p className="text-sm text-amber-100/70">
            Your AI agent team. Each Boomer_Ang specializes in a domain and reports to ACHEEVY.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-white/5 bg-black/60 px-4 py-2">
            <Activity size={14} className="text-emerald-400" />
            <span className="text-xs text-amber-100/70">
              <span className="font-semibold text-emerald-400">{activeCount}</span> Registered
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-white/5 bg-black/60 px-4 py-2">
            <span className={`text-[9px] uppercase font-bold tracking-wider ${source === "registry" ? "text-emerald-400" : "text-amber-400"}`}>
              {source === "registry" ? "Live Registry" : "Local Registry"}
            </span>
          </div>
          <button
            onClick={fetchAgents}
            className="flex items-center gap-1.5 rounded-full border border-white/10 bg-black/60 px-3 py-2 text-xs text-amber-100/60 hover:text-amber-50 hover:border-white/20 transition-colors"
          >
            <RefreshCw size={12} />
          </button>
        </div>
      </header>

      {loading ? (
        <div className="flex items-center justify-center h-48 text-amber-100/30 text-sm">
          Loading registry...
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {agents.map((ang) => {
            const IconComponent = ICON_MAP[ang.id] || Brain;
            return (
              <div
                key={ang.id}
                className="group relative overflow-hidden rounded-3xl border border-white/10 bg-black/60 p-6 backdrop-blur-2xl transition-all hover:border-amber-300/30 hover:bg-black/80"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-amber-200 group-hover:bg-amber-300 group-hover:text-black transition-colors">
                    <IconComponent size={24} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-amber-50">{ang.name}</h3>
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-amber-400" />
                        <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400">
                          {ang.status}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-amber-100/50 mt-0.5">{ang.description}</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {ang.capabilities.map((cap) => (
                    <span
                      key={cap}
                      className="rounded-full border border-white/5 bg-white/5 px-2.5 py-1 text-[10px] text-amber-100/60"
                    >
                      {cap.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>

                <div className="mt-4 pt-3 border-t border-white/5">
                  <p className="text-[10px] text-amber-100/40 uppercase tracking-wider">Endpoint</p>
                  <p className="text-xs text-amber-100/50 mt-1 font-mono truncate">{ang.endpoint}</p>
                </div>
              </div>
            );
          })}

          {/* Spawn New */}
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-black/20 p-8 text-center transition-all hover:border-amber-300/30 cursor-pointer group">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-dashed border-white/20 text-2xl text-amber-100/30 group-hover:border-amber-300/40 group-hover:text-amber-300 transition-all">
              <Brain size={24} />
            </div>
            <p className="mt-4 text-sm text-lg text-amber-200/50">
              Spawn a new Boomer_Ang
            </p>
            <p className="mt-1 text-xs text-amber-100/30">
              Define a custom agent with specific skills and routing rules.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
