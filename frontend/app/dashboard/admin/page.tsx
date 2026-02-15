// frontend/app/dashboard/admin/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import OwnerGate from "@/components/OwnerGate";

// ── Data ────────────────────────────────────────────────────────────────────

const MODELS = [
  { id: "claude-opus-4.6", name: "Claude Opus 4.6", role: "Primary Reasoning", price: "$5/$25 per 1M", ctx: "1M" },
  { id: "claude-sonnet-4.5", name: "Claude Sonnet 4.5", role: "Default Agent Model", price: "$3/$15 per 1M", ctx: "1M" },
  { id: "gpt-5.2", name: "GPT-5.2", role: "Alternative Reasoning", price: "$5/$20 per 1M", ctx: "128K" },
  { id: "gpt-5.1", name: "GPT-5.1", role: "General Purpose", price: "$3/$12 per 1M", ctx: "128K" },
  { id: "gemini-3-pro", name: "Gemini 3 Pro", role: "Multimodal", price: "$1.25/$10 per 1M", ctx: "1M" },
  { id: "claude-haiku-4.5", name: "Claude Haiku 4.5", role: "Fast / High Volume", price: "$0.80/$4 per 1M", ctx: "200K" },
  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", role: "Economy Speed", price: "$0.30/$2.50 per 1M", ctx: "1M" },
  { id: "deepseek-v3.2", name: "DeepSeek V3.2", role: "Economy Bulk", price: "$0.30/$0.88 per 1M", ctx: "131K" },
];

const CSUITE = [
  { role: "Boomer_CTO", title: "Chief Technology Officer", agent: "DevOps Agent", scope: "Architecture, stack alignment" },
  { role: "Boomer_CFO", title: "Chief Financial Officer", agent: "Value Agent", scope: "Token efficiency, LUC governance" },
  { role: "Boomer_COO", title: "Chief Operating Officer", agent: "Flow Boss Agent", scope: "Runtime health, SLAs" },
  { role: "Boomer_CMO", title: "Chief Marketing Officer", agent: "Social Campaign Agent", scope: "Brand strategy, campaigns" },
  { role: "Boomer_CDO", title: "Chief Design Officer", agent: "Video Editing Agent", scope: "Visual identity, multimedia" },
  { role: "Boomer_CPO", title: "Chief Publication Officer", agent: "Social Agent", scope: "Content publishing, distribution" },
];

const EXEC_AGENTS = [
  { role: "Engineer_Ang", status: "Active", tasks: "Full-stack building, deployment" },
  { role: "Marketer_Ang", status: "Active", tasks: "Growth strategy, content, SEO" },
  { role: "Analyst_Ang", status: "Standby", tasks: "Market research, competitive intel" },
  { role: "Quality_Ang", status: "Standby", tasks: "ORACLE verification gates" },
  { role: "Chicken Hawk", status: "Active", tasks: "SOP enforcement, throughput regulation, escalation" },
];

const SQUADS = [
  { squad: "PREP_SQUAD_ALPHA", purpose: "Pre-Execution Intelligence", hawks: ["INTAKE", "DECOMP", "CONTEXT", "POLICY", "COST", "ROUTER"] },
  { squad: "WORKFLOW_SMITH_SQUAD", purpose: "n8n Workflow Integrity", hawks: ["AUTHOR", "VALIDATE", "FAILURE", "GATE"] },
  { squad: "VISION_SCOUT_SQUAD", purpose: "Video/Footage Assessment", hawks: ["VISION", "SIGNAL", "COMPLIANCE"] },
  { squad: "GRIDIRON_SCOUT_SQUAD", purpose: "Adversarial Prospect Scouting", hawks: ["BULL", "BEAR", "SCRAPER", "VALIDATOR"] },
];

const SYSTEM_METRICS = [
  { label: "Active Users", value: "0", note: "No DB yet" },
  { label: "Total Tasks Executed", value: "0", note: "Pending persistence" },
  { label: "Agent Uptime", value: "99.8%", note: "In-process" },
  { label: "ORACLE Gate Pass Rate", value: "87%", note: "7-gate avg" },
  { label: "ByteRover Cache Hit", value: "72%", note: "Pattern reuse" },
  { label: "Gateway Uptime", value: "100%", note: "Current session" },
];

const BILLING_OVERVIEW = [
  { tier: "Garage", price: "$99/mo", tokens: "100K", agents: 3, concurrent: 1, subscribers: 0 },
  { tier: "Community", price: "$89/mo", tokens: "250K", agents: 10, concurrent: 5, subscribers: 0 },
  { tier: "Enterprise", price: "$67/mo", tokens: "500K", agents: 50, concurrent: 25, subscribers: 0 },
  { tier: "P2P", price: "Metered", tokens: "Pay-per-use", agents: "\u221E" as string, concurrent: 1, subscribers: 0 },
  { tier: "White Label (Self)", price: "From $499/mo", tokens: "Custom", agents: "All" as string, concurrent: "Custom" as unknown as number, subscribers: 0 },
  { tier: "White Label (Managed)", price: "From $999/mo", tokens: "Custom", agents: "All" as string, concurrent: "Custom" as unknown as number, subscribers: 0 },
  { tier: "White Label (Auto)", price: "From $1,499/mo", tokens: "Custom", agents: "All" as string, concurrent: "Custom" as unknown as number, subscribers: 0 },
];

// ── Component ───────────────────────────────────────────────────────────────

interface ApiKeyInfo {
  id: string;
  label: string;
  scope: string;
  configured: boolean;
  masked: string;
}

function AdminPanel() {
  const [primaryModel, setPrimaryModel] = useState("claude-opus-4.6");
  const [systemPrompt, setSystemPrompt] = useState(
    "You are ACHEEVY, the lead orchestrator for A.I.M.S. Your primary goal is to maintain business architecture integrity while delegating discrete tasks to Boomer_Angs. All tasks pass through PREP_SQUAD_ALPHA before execution. Activity breeds Activity."
  );
  const [apiKeys, setApiKeys] = useState<ApiKeyInfo[]>([]);
  const [keysLoading, setKeysLoading] = useState(true);
  const [keysError, setKeysError] = useState<string | null>(null);

  const fetchApiKeys = useCallback(async () => {
    setKeysLoading(true);
    setKeysError(null);
    try {
      const res = await fetch("/api/admin/api-keys");
      if (!res.ok) throw new Error(`Failed to load keys (${res.status})`);
      const data = await res.json();
      setApiKeys(data.keys || []);
    } catch (err) {
      setKeysError(err instanceof Error ? err.message : "Failed to load keys");
    } finally {
      setKeysLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApiKeys();
  }, [fetchApiKeys]);

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Header */}
      <section className="rounded-3xl border border-red-500/30 bg-gradient-to-r from-red-500/5 to-black/80 p-6 shadow-[0_0_40px_rgba(239,68,68,0.1)]">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-red-500/20 border border-red-500/30 px-2.5 py-0.5 text-[9px] font-bold text-red-400 uppercase tracking-wider">
                Owner Only
              </span>
              <h1 className="text-2xl font-bold text-white font-display">Super Admin</h1>
            </div>
            <p className="mt-1 text-xs text-white/30">
              Full system control — agents, billing, models, squads, and platform metrics.
              This panel is not visible to regular users.
            </p>
          </div>
          <button className="rounded-full bg-gold px-4 py-2 text-xs font-semibold text-black shadow-[0_0_15px_rgba(251,191,36,0.4)] hover:scale-105 active:scale-95 transition-transform">
            Save All
          </button>
        </div>
      </section>

      {/* System Metrics */}
      <section className="rounded-3xl border border-wireframe-stroke bg-black/60 p-6 backdrop-blur-2xl">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-white/80 font-display">
          Platform Metrics
        </h2>
        <p className="mt-1 text-[0.65rem] text-white/30 uppercase tracking-wider">Real-time system health</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {SYSTEM_METRICS.map((m) => (
            <div key={m.label} className="rounded-2xl border border-wireframe-stroke bg-black/40 p-4">
              <p className="text-[10px] uppercase tracking-wider text-white/30">{m.label}</p>
              <p className="text-xl font-bold text-white mt-1">{m.value}</p>
              <p className="text-[9px] text-white/20 mt-0.5">{m.note}</p>
            </div>
          ))}
        </div>
      </section>

      {/* API Key Manager */}
      <section className="rounded-3xl border border-wireframe-stroke bg-black/60 p-6 backdrop-blur-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-widest text-white/80 font-display">
              API Key Manager
            </h2>
            <p className="mt-1 text-[0.65rem] text-white/30 uppercase tracking-wider">
              Service credentials — masked for security
            </p>
          </div>
          <button
            onClick={fetchApiKeys}
            disabled={keysLoading}
            className="rounded-full border border-wireframe-stroke px-3 py-1.5 text-[10px] font-semibold text-gold hover:bg-white/5 transition-colors disabled:opacity-40"
          >
            {keysLoading ? "Loading..." : "Refresh"}
          </button>
        </div>

        <div className="mt-4">
          {keysError ? (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
              <p className="text-xs text-red-400">{keysError}</p>
              <p className="text-[10px] text-red-400/60 mt-1">
                Ensure the UEF Gateway is running and INTERNAL_API_KEY is configured.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-wireframe-stroke">
                    <th className="p-3 text-left text-[10px] uppercase tracking-widest text-white/30">Service</th>
                    <th className="p-3 text-left text-[10px] uppercase tracking-widest text-white/30">Scope</th>
                    <th className="p-3 text-left text-[10px] uppercase tracking-widest text-white/30">Key</th>
                    <th className="p-3 text-center text-[10px] uppercase tracking-widest text-white/30">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {keysLoading ? (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-xs text-white/30">
                        Loading key status...
                      </td>
                    </tr>
                  ) : apiKeys.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-xs text-white/30">
                        No keys returned. Backend may not support /admin/api-keys yet.
                      </td>
                    </tr>
                  ) : (
                    apiKeys.map((k) => (
                      <tr key={k.id} className="border-t border-wireframe-stroke hover:bg-white/[0.02] transition-colors">
                        <td className="p-3">
                          <p className="text-xs font-semibold text-white">{k.label}</p>
                          <p className="text-[9px] font-mono text-white/20 mt-0.5">{k.id}</p>
                        </td>
                        <td className="p-3 text-xs text-white/50">{k.scope}</td>
                        <td className="p-3">
                          {k.configured ? (
                            <code className="rounded bg-black/60 border border-wireframe-stroke px-2 py-1 text-[10px] font-mono text-gold">
                              {k.masked}
                            </code>
                          ) : (
                            <span className="text-[10px] text-white/20 italic">Not set</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[9px] font-semibold uppercase ${
                            k.configured
                              ? "bg-emerald-400/10 border border-emerald-400/20 text-emerald-400"
                              : "bg-red-400/10 border border-red-400/20 text-red-400"
                          }`}>
                            <span className={`h-1 w-1 rounded-full ${k.configured ? "bg-emerald-400" : "bg-red-400"}`} />
                            {k.configured ? "Active" : "Missing"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-4 rounded-2xl border border-dashed border-gold/20 bg-gold/[0.02] p-4">
          <p className="text-[10px] text-white/30">
            Keys are managed via environment variables on the VPS. Update them in{" "}
            <code className="text-gold">infra/.env.production</code> (for Docker services) or{" "}
            <code className="text-gold">~/.bashrc</code> (for CLI tools), then restart.
            Keys are never stored in the database or transmitted in plaintext.
          </p>
        </div>
      </section>

      {/* Billing Overview */}
      <section className="rounded-3xl border border-wireframe-stroke bg-black/60 p-6 backdrop-blur-2xl">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-white/80 font-display">
          Billing Overview
        </h2>
        <p className="mt-1 text-[0.65rem] text-white/30 uppercase tracking-wider">3-6-9 tier subscriptions + revenue</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-wireframe-stroke">
                <th className="p-3 text-left text-[10px] uppercase tracking-widest text-white/30">Tier</th>
                <th className="p-3 text-center text-[10px] uppercase tracking-widest text-white/30">Price</th>
                <th className="p-3 text-center text-[10px] uppercase tracking-widest text-white/30">Tokens</th>
                <th className="p-3 text-center text-[10px] uppercase tracking-widest text-white/30">Agents</th>
                <th className="p-3 text-center text-[10px] uppercase tracking-widest text-white/30">Concurrent</th>
                <th className="p-3 text-center text-[10px] uppercase tracking-widest text-white/30">Subscribers</th>
                <th className="p-3 text-center text-[10px] uppercase tracking-widest text-white/30">MRR</th>
              </tr>
            </thead>
            <tbody>
              {BILLING_OVERVIEW.map((t) => (
                <tr key={t.tier} className="border-t border-wireframe-stroke">
                  <td className="p-3 text-xs font-semibold text-white">{t.tier}</td>
                  <td className="p-3 text-xs text-center text-white/50">{t.price}</td>
                  <td className="p-3 text-xs text-center text-white/50">{t.tokens}</td>
                  <td className="p-3 text-xs text-center text-emerald-400">{t.agents}</td>
                  <td className="p-3 text-xs text-center text-emerald-400">{t.concurrent}</td>
                  <td className="p-3 text-xs text-center text-white font-semibold">{t.subscribers}</td>
                  <td className="p-3 text-xs text-center text-gold font-semibold">$0</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-gold/20 bg-gold/[0.03]">
                <td className="p-3 text-xs font-bold text-gold" colSpan={5}>Total MRR</td>
                <td className="p-3 text-xs text-center font-bold text-white">0</td>
                <td className="p-3 text-xs text-center font-bold text-gold">$0</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      {/* Verticals — II Agent, II Commons */}
      <section className="rounded-3xl border border-wireframe-stroke bg-black/60 p-6 backdrop-blur-2xl">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-white/80 font-display">
          Verticals
        </h2>
        <p className="mt-1 text-[0.65rem] text-white/30 uppercase tracking-wider">
          II Agent &middot; II Commons — External tool integrations (Plugs)
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {/* Agent Verticals */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gold mb-3">Agent</p>
            <div className="space-y-2">
              {[
                { id: "agent-zero", name: "Agent Zero", desc: "Computer-as-tool framework — Docker sandbox, web UI", url: "https://agent-zero.ai", cap: "computer-use, multi-agent, code execution" },
              ].map((v) => (
                <div key={v.id} className="rounded-2xl border border-wireframe-stroke bg-black/40 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-white">{v.name}</p>
                      <p className="text-[10px] text-white/30 mt-0.5">{v.desc}</p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-gold/10 border border-gold/20 px-2 py-0.5 text-[9px] font-semibold text-gold uppercase">
                      <span className="h-1 w-1 rounded-full bg-gold" />
                      Available
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {v.cap.split(", ").map((c) => (
                      <span key={c} className="rounded-full border border-wireframe-stroke bg-black/60 px-2 py-0.5 text-[8px] font-mono text-white/40">{c}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Commons Verticals */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400/80 mb-3">Commons</p>
            <div className="space-y-2">
              {[
                { id: "claude-code", name: "Claude Code", desc: "Anthropic CLI — agentic coding, git, terminal", invoke: "claude", cap: "code-gen, file-ops, git" },
                { id: "gemini-cli", name: "Gemini CLI", desc: "Google CLI — YOLO mode auto-approves all actions", invoke: "gemini -y", cap: "shell, web-search, automated-ops" },
              ].map((v) => (
                <div key={v.id} className="rounded-2xl border border-wireframe-stroke bg-black/40 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-white">{v.name}</p>
                      <p className="text-[10px] text-white/30 mt-0.5">{v.desc}</p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 text-[9px] font-semibold text-emerald-400 uppercase">
                      <span className="h-1 w-1 rounded-full bg-emerald-400" />
                      Installed
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <code className="rounded bg-black/60 border border-wireframe-stroke px-2 py-0.5 text-[9px] font-mono text-gold">$ {v.invoke}</code>
                    <div className="flex flex-wrap gap-1">
                      {v.cap.split(", ").map((c) => (
                        <span key={c} className="rounded-full border border-wireframe-stroke bg-black/60 px-2 py-0.5 text-[8px] font-mono text-white/40">{c}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        {/* The Park — Model Selection */}
        <section className="rounded-3xl border border-wireframe-stroke bg-black/60 p-6 backdrop-blur-2xl">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-white/80 font-display">
            The Park
          </h2>
          <p className="mt-1 text-[0.65rem] text-white/30 uppercase tracking-wider">Model Selection</p>
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <label className="text-xs text-white/50 uppercase tracking-wider">Primary Reasoning Model</label>
              <select
                value={primaryModel}
                onChange={(e) => setPrimaryModel(e.target.value)}
                className="w-full rounded-xl border border-wireframe-stroke bg-black/80 p-2.5 text-sm text-white outline-none focus:border-gold/30"
              >
                {MODELS.map((m) => (
                  <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-white/50 uppercase tracking-wider">System Instructions</label>
              <textarea
                className="w-full h-32 rounded-xl border border-wireframe-stroke bg-black/80 p-3 text-sm text-white outline-none focus:border-gold/30"
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* C-Suite Directors */}
        <section className="rounded-3xl border border-wireframe-stroke bg-black/60 p-6 backdrop-blur-2xl">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-white/80 font-display">
            C-Suite Directors
          </h2>
          <p className="mt-1 text-[0.65rem] text-white/30 uppercase tracking-wider">PMO governance layer</p>
          <div className="mt-4 space-y-2">
            {CSUITE.map((ang) => (
              <div key={ang.role} className="flex items-center justify-between rounded-xl border border-wireframe-stroke bg-black/40 p-3">
                <div>
                  <p className="text-xs font-medium text-white">{ang.role}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-[10px] text-white/30">{ang.scope}</p>
                    <span className="rounded-full bg-gold/10 border border-gold/20 px-2 py-0.5 text-[9px] font-mono text-gold">
                      {ang.agent}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span className="text-[9px] uppercase font-semibold text-white/50">Active</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Execution Agents */}
      <section className="rounded-3xl border border-wireframe-stroke bg-black/60 p-6 backdrop-blur-2xl">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-white/80 font-display">
          Execution Agents
        </h2>
        <p className="mt-1 text-[0.65rem] text-white/30 uppercase tracking-wider">Boomer_Ang routing + status</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {EXEC_AGENTS.map((ang) => (
            <div key={ang.role} className="flex items-center justify-between rounded-2xl border border-wireframe-stroke bg-black/40 p-4">
              <div>
                <p className="text-sm font-medium text-white">{ang.role}</p>
                <p className="text-xs text-white/40">{ang.tasks}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`h-1.5 w-1.5 rounded-full ${ang.status === 'Active' ? 'bg-emerald-400' : 'bg-gold'}`} />
                <span className="text-[10px] uppercase font-semibold text-white">{ang.status}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Lil_Hawk Squads */}
      <section className="rounded-3xl border border-wireframe-stroke bg-black/60 p-6 backdrop-blur-2xl">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-white/80 font-display">
          Lil_Hawk Squads
        </h2>
        <p className="mt-1 text-[0.65rem] text-white/30 uppercase tracking-wider">Ephemeral task-scoped specialists</p>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {SQUADS.map((squad) => (
            <div key={squad.squad} className="rounded-2xl border border-wireframe-stroke bg-black/40 p-4">
              <p className="text-xs font-semibold text-gold">{squad.squad}</p>
              <p className="text-[10px] text-white/30 mt-0.5">{squad.purpose}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {squad.hawks.map((hawk) => (
                  <span key={hawk} className="rounded-full border border-wireframe-stroke bg-gold/10 px-2 py-0.5 text-[9px] font-mono text-white/50">
                    {hawk}_LIL_HAWK
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* User Management Placeholder */}
      <section className="rounded-3xl border border-wireframe-stroke bg-black/60 p-6 backdrop-blur-2xl">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-white/80 font-display">
          User Management
        </h2>
        <p className="mt-1 text-[0.65rem] text-white/30 uppercase tracking-wider">Requires database persistence layer</p>
        <div className="mt-4 rounded-2xl border border-dashed border-wireframe-stroke bg-black/20 p-8 text-center">
          <p className="text-sm text-white/30">
            User table, subscription status, usage metrics, and account actions
            will be available once the persistence layer (PostgreSQL) is wired.
          </p>
          <p className="text-[10px] text-white/20 mt-2">
            Planned: User list, search, tier assignment, usage graphs, suspension, impersonation
          </p>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="rounded-3xl border border-red-500/20 bg-red-500/5 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-red-400/90 font-display">
          Danger Zone
        </h2>
        <p className="mt-1 text-[0.65rem] text-red-400/40 uppercase tracking-wider">Destructive actions — proceed with caution</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button className="rounded-full border border-red-500/30 px-4 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10 transition-colors">
            Reset All Agent State
          </button>
          <button className="rounded-full border border-red-500/30 px-4 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10 transition-colors">
            Flush ByteRover Cache
          </button>
          <button className="rounded-full border border-red-500/30 px-4 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10 transition-colors">
            Clear Rate Limits
          </button>
        </div>
      </section>
    </div>
  );
}

export default function AdminPage() {
  return (
    <OwnerGate>
      <AdminPanel />
    </OwnerGate>
  );
}
