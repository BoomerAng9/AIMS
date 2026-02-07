// frontend/app/dashboard/circuit-box/page.tsx
"use client";

import React from "react";

/**
 * Circuit Box — User-facing system status dashboard.
 * Shows plan details, agent allocation, system health.
 * Internal wiring (model selection, C-Suite, squad config) lives in /dashboard/admin (OWNER only).
 */

const SYSTEM_STATUS = [
  { label: "Gateway", status: "Online", ok: true },
  { label: "ORACLE Gates", status: "Active", ok: true },
  { label: "ByteRover", status: "Caching", ok: true },
  { label: "LUC Engine", status: "Ready", ok: true },
];

export default function CircuitBoxPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* ---- Hero Section ---- */}
      <section className="relative overflow-hidden rounded-3xl border border-amber-300/20 shadow-[0_0_60px_rgba(251,191,36,0.15)]">
        <div className="relative min-h-[220px] md:min-h-[280px]">
          <div className="absolute inset-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/brand/acheevy-office.png"
              alt="ACHEEVY in the office with Boomer_Angs on shelves"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
          </div>

          <div className="relative z-10 flex h-full min-h-[220px] md:min-h-[280px] flex-col justify-between p-8 md:p-10">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-amber-200/60 mb-1">
                ACHEEVY Orchestration Layer
              </p>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-amber-50 font-display">
                CIRCUIT BOX
              </h1>
            </div>
            <p className="text-sm text-amber-100/50 max-w-lg">
              Your system overview — plan usage, agent allocation, and platform health at a glance.
            </p>
          </div>
        </div>
      </section>

      {/* System Health */}
      <section className="rounded-3xl border border-white/10 bg-black/60 p-6 backdrop-blur-2xl">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-amber-200/90 font-display">
          System Health
        </h2>
        <p className="mt-1 text-[0.65rem] text-amber-100/40 uppercase tracking-wider">
          Live platform status
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {SYSTEM_STATUS.map((s) => (
            <div
              key={s.label}
              className="flex items-center justify-between rounded-2xl border border-white/5 bg-black/40 p-4"
            >
              <div>
                <p className="text-xs font-medium text-amber-50">{s.label}</p>
                <p className="text-[10px] text-amber-100/40 mt-0.5">{s.status}</p>
              </div>
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  s.ok ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]" : "bg-red-400"
                }`}
              />
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Your Plan */}
        <section className="rounded-3xl border border-white/10 bg-black/60 p-6 backdrop-blur-2xl">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-amber-200/90 font-display">
            Your Plan
          </h2>
          <p className="mt-1 text-[0.65rem] text-amber-100/40 uppercase tracking-wider">
            Current subscription details
          </p>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between rounded-xl border border-white/5 bg-black/40 p-4">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-amber-100/40">Active Tier</p>
                <p className="text-lg font-bold text-amber-50 mt-0.5">—</p>
              </div>
              <span className="rounded-full bg-amber-400/10 border border-amber-300/20 px-3 py-1 text-[10px] font-semibold text-amber-300">
                No plan yet
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-white/5 bg-black/40 p-4">
                <p className="text-[10px] uppercase tracking-wider text-amber-100/40">Tokens Used</p>
                <p className="text-xl font-bold text-amber-50 mt-1">0</p>
                <p className="text-[9px] text-amber-100/30 mt-0.5">of 0 allocated</p>
              </div>
              <div className="rounded-xl border border-white/5 bg-black/40 p-4">
                <p className="text-[10px] uppercase tracking-wider text-amber-100/40">Billing Cycle</p>
                <p className="text-xl font-bold text-amber-50 mt-1">—</p>
                <p className="text-[9px] text-amber-100/30 mt-0.5">Days remaining</p>
              </div>
            </div>
          </div>
        </section>

        {/* Agent Allocation */}
        <section className="rounded-3xl border border-white/10 bg-black/60 p-6 backdrop-blur-2xl">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-amber-200/90 font-display">
            Agent Allocation
          </h2>
          <p className="mt-1 text-[0.65rem] text-amber-100/40 uppercase tracking-wider">
            Your agent usage
          </p>
          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-white/5 bg-black/40 p-4">
                <p className="text-[10px] uppercase tracking-wider text-amber-100/40">Total Agents</p>
                <p className="text-xl font-bold text-amber-50 mt-1">0 / 0</p>
                <p className="text-[9px] text-amber-100/30 mt-0.5">Used / limit</p>
              </div>
              <div className="rounded-xl border border-white/5 bg-black/40 p-4">
                <p className="text-[10px] uppercase tracking-wider text-amber-100/40">Concurrent</p>
                <p className="text-xl font-bold text-amber-50 mt-1">0 / 0</p>
                <p className="text-[9px] text-amber-100/30 mt-0.5">Running / limit</p>
              </div>
            </div>
            <div className="rounded-xl border border-white/5 bg-black/40 p-4">
              <p className="text-[10px] uppercase tracking-wider text-amber-100/40">ByteRover Savings</p>
              <div className="mt-2 flex items-end gap-3">
                <p className="text-2xl font-bold text-emerald-400">$0.00</p>
                <p className="text-[10px] text-amber-100/30 pb-1">saved this cycle</p>
              </div>
              <div className="mt-3 h-2 w-full rounded-full bg-white/5">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-300"
                  style={{ width: "0%" }}
                />
              </div>
              <p className="text-[9px] text-amber-100/30 mt-1">0 tokens saved via pattern reuse</p>
            </div>
          </div>
        </section>
      </div>

      {/* Three Pillars Status */}
      <section className="rounded-3xl border border-white/10 bg-black/60 p-6 backdrop-blur-2xl">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-amber-200/90 font-display">
          Three Pillars
        </h2>
        <p className="mt-1 text-[0.65rem] text-amber-100/40 uppercase tracking-wider">
          Your active add-ons
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {[
            { name: "Confidence", desc: "Uptime guarantees & SLAs", levels: ["Base", "+15%", "+35%"] },
            { name: "Convenience", desc: "Priority routing & support", levels: ["Base", "+20%", "+45%"] },
            { name: "Security", desc: "Audit trails & compliance", levels: ["Base", "+25%", "+50%"] },
          ].map((pillar) => (
            <div key={pillar.name} className="rounded-2xl border border-white/5 bg-black/40 p-4">
              <p className="text-xs font-semibold text-amber-200">{pillar.name}</p>
              <p className="text-[10px] text-amber-100/40 mt-0.5">{pillar.desc}</p>
              <div className="mt-3 flex gap-1.5">
                {pillar.levels.map((lvl, i) => (
                  <span
                    key={lvl}
                    className={`rounded-full px-2 py-0.5 text-[9px] font-mono ${
                      i === 0
                        ? "bg-amber-400/10 border border-amber-300/20 text-amber-300"
                        : "border border-white/5 text-amber-100/30"
                    }`}
                  >
                    {lvl}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recent Activity */}
      <section className="rounded-3xl border border-white/10 bg-black/60 p-6 backdrop-blur-2xl">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-amber-200/90 font-display">
          Recent Activity
        </h2>
        <p className="mt-1 text-[0.65rem] text-amber-100/40 uppercase tracking-wider">
          Your latest tasks and agent executions
        </p>
        <div className="mt-4 rounded-2xl border border-dashed border-white/10 bg-black/20 p-8 text-center">
          <p className="text-sm text-amber-100/40">
            No activity yet — submit a task to ACHEEVY to get started.
          </p>
          <p className="text-[10px] text-amber-100/30 mt-2">
            Task history, agent logs, and execution traces will appear here.
          </p>
        </div>
      </section>
    </div>
  );
}
