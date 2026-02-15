// frontend/app/pricing/page.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import Footer from "@/components/landing/Footer";
import {
  BASE_TIERS,
  GROUP_STRUCTURES,
  TASK_MULTIPLIERS,
  USAGE_MODIFIERS,
  PILLARS,
  WHITE_LABEL_PLANS,
  calculateBill,
  type FrequencyId,
  type GroupId,
  type TaskTypeId,
  type PillarLevel,
  type PillarSelection,
} from "@/lib/stripe";

const markerFont = 'var(--font-marker), "Permanent Marker", cursive';

export default function PricingPage() {
  const [selectedTier, setSelectedTier] = useState<FrequencyId>("3mo");
  const [selectedGroup, setSelectedGroup] = useState<GroupId>("individual");
  const [seatCount, setSeatCount] = useState(1);
  const [taskWeights, setTaskWeights] = useState<Partial<Record<TaskTypeId, number>>>({
    code_gen: 60,
    workflow_auto: 25,
    agent_swarm: 15,
  });
  const [pillars, setPillars] = useState<PillarSelection>({
    confidence: "standard",
    convenience: "standard",
    security: "standard",
  });

  const bill = calculateBill(selectedTier, selectedGroup, seatCount, taskWeights, pillars);

  const updateWeight = (id: TaskTypeId, value: number) => {
    setTaskWeights((prev) => {
      const next = { ...prev };
      if (value === 0) delete next[id];
      else next[id] = value;
      return next;
    });
  };

  const updatePillar = (pillarId: keyof PillarSelection, level: PillarLevel) => {
    setPillars((prev) => ({ ...prev, [pillarId]: level }));
  };

  // Pre-calculate matrix cells
  const subscriptionTiers = BASE_TIERS.filter((t) => t.id !== "p2p");
  const matrixData = subscriptionTiers.map((tier) =>
    GROUP_STRUCTURES.map((group) => {
      const seats =
        group.id === "individual" ? 1 : group.id === "family" ? 4 : group.id === "team" ? 5 : 25;
      return calculateBill(tier.id, group.id, seats, taskWeights, pillars);
    })
  );

  // Token markup rates by tier
  const tokenMarkupRates: Record<string, string> = {
    p2p: "25%",
    "3mo": "20%",
    "6mo": "15%",
    "9mo": "10%",
  };

  // Competitive comparison — 3 clusters of agentic platforms
  type Cluster = "coding" | "builder" | "workspace";
  interface Competitor {
    name: string; price: string; unit: string; allocation: string; agents: string; concurrent: string; security: string; cluster: Cluster;
  }

  const competitors: Competitor[] = [
    // Cluster A — Coding Agents
    { name: "Cursor Pro",       price: "$20/mo",     unit: "Usage",   allocation: "1x usage",      agents: "N/A",       concurrent: "1",  security: "Basic",  cluster: "coding" },
    { name: "Windsurf Pro",     price: "$15/mo",     unit: "Credits", allocation: "500 credits",    agents: "N/A",       concurrent: "1",  security: "Basic",  cluster: "coding" },
    { name: "Bolt.new Pro",     price: "$20/mo",     unit: "Tokens",  allocation: "10M tokens",     agents: "N/A",       concurrent: "1",  security: "Basic",  cluster: "coding" },
    { name: "Factory.ai Pro",   price: "$20/mo",     unit: "Tokens",  allocation: "10M tokens",     agents: "N/A",       concurrent: "1",  security: "Basic",  cluster: "coding" },
    { name: "Amp (Sourcegraph)", price: "$10/day",   unit: "Credits", allocation: "$300/mo grant",  agents: "N/A",       concurrent: "1",  security: "Basic",  cluster: "coding" },
    // Cluster B — App Builders
    { name: "v0 Premium",       price: "$20/mo",     unit: "Credits", allocation: "$20 credits",    agents: "N/A",       concurrent: "1",  security: "Basic",  cluster: "builder" },
    { name: "Lovable Pro",      price: "$25/mo",     unit: "Credits", allocation: "100 credits",    agents: "N/A",       concurrent: "1",  security: "Basic",  cluster: "builder" },
    { name: "Pythagora",        price: "Free",       unit: "Tokens",  allocation: "600K tokens",    agents: "N/A",       concurrent: "1",  security: "Basic",  cluster: "builder" },
    { name: "Replit Core",      price: "$25/mo",     unit: "Credits", allocation: "$25 credits",    agents: "1",         concurrent: "1",  security: "Basic",  cluster: "builder" },
    // Cluster C — Agentic Workspaces (primary competitor set)
    { name: "Devin Core",       price: "$20+ PAYG",  unit: "ACUs",    allocation: "$2.25/ACU",      agents: "1",         concurrent: "1",  security: "Basic",  cluster: "workspace" },
    { name: "Devin Team",       price: "$500/mo",    unit: "ACUs",    allocation: "250 ACUs",       agents: "Multiple",  concurrent: "10", security: "Basic",  cluster: "workspace" },
    { name: "Manus",            price: "$39/mo",     unit: "Credits", allocation: "3,900 credits",  agents: "Multiple",  concurrent: "2",  security: "Basic",  cluster: "workspace" },
    { name: "Genspark Team",    price: "$30/seat",   unit: "Credits", allocation: "12K credits",    agents: "Multiple",  concurrent: "N/A", security: "Basic", cluster: "workspace" },
    { name: "CrewAI",           price: "$99/mo",     unit: "Exec",    allocation: "50 exec",        agents: "1 crew",    concurrent: "1",  security: "Basic",  cluster: "workspace" },
    { name: "Lindy Pro",        price: "$49/mo",     unit: "Credits", allocation: "5K credits",     agents: "Unlimited", concurrent: "1",  security: "Basic",  cluster: "workspace" },
    { name: "Bardeen Starter",  price: "$129/mo",    unit: "Credits", allocation: "Credit-based",   agents: "Unlimited", concurrent: "1",  security: "SOC 2",  cluster: "workspace" },
    // Automation Platforms
    { name: "Zapier Pro",       price: "$30/mo",     unit: "Tasks",   allocation: "750 tasks",      agents: "N/A",       concurrent: "1",  security: "Basic",  cluster: "workspace" },
    { name: "Make.com Core",    price: "$29/mo",     unit: "Ops",     allocation: "10K ops",        agents: "N/A",       concurrent: "1",  security: "Basic",  cluster: "workspace" },
    { name: "n8n Pro",          price: "$60/mo",     unit: "Exec",    allocation: "10K exec",       agents: "N/A",       concurrent: "2",  security: "Basic",  cluster: "workspace" },
  ];

  const clusterLabels: Record<Cluster, string> = {
    coding: "Coding Agents",
    builder: "App Builders",
    workspace: "Agentic Workspaces",
  };

  return (
    <main className="min-h-screen bg-obsidian text-white">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {/* ──────────────────────── Header ──────────────────────── */}
        <div className="text-center mb-14">
          <h1
            className="text-4xl md:text-5xl font-bold tracking-tight"
            style={{ fontFamily: markerFont }}
          >
            Pick Your Plan
          </h1>
          <p className="mt-4 text-sm text-white/70 max-w-2xl mx-auto">
            Choose 3, 6, or 9 month intervals — or pay per use
          </p>
          <div className="mt-6 flex justify-center gap-4">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/20 bg-gold/5 px-3 py-1 text-xs text-gold uppercase tracking-wider">
              <span className="text-base">&#9672;</span> Confidence
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/20 bg-gold/5 px-3 py-1 text-xs text-gold uppercase tracking-wider">
              <span className="text-base">&#9673;</span> Convenience
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/20 bg-gold/5 px-3 py-1 text-xs text-gold uppercase tracking-wider">
              <span className="text-base">&#9670;</span> Security
            </span>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            MATRIX 1 — Base Frequency x Group Structure (with Agent Info)
            ═══════════════════════════════════════════════════════════════ */}
        <section className="mb-14">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px flex-1 bg-gradient-to-r from-gold/20 to-transparent" />
            <h2
              className="text-base uppercase tracking-[0.3em] text-amber-400 font-display whitespace-nowrap"
              style={{ fontFamily: markerFont }}
            >
              Base Frequency x Group — Agent Allocation
            </h2>
            <div className="h-px flex-1 bg-gradient-to-l from-gold/20 to-transparent" />
          </div>

          <div className="overflow-x-auto rounded-3xl border border-wireframe-stroke bg-black/60 backdrop-blur-2xl">
            <table className="w-full min-w-[750px]">
              <thead>
                <tr>
                  <th className="p-4 text-left text-xs uppercase tracking-widest text-white/30 border-b border-wireframe-stroke">
                    Group \ Frequency
                  </th>
                  {subscriptionTiers.map((tier) => (
                    <th
                      key={tier.id}
                      className={`p-4 text-center border-b border-wireframe-stroke cursor-pointer transition-colors ${
                        selectedTier === tier.id ? "bg-gold/5" : "hover:bg-white/[0.02]"
                      }`}
                      onClick={() => setSelectedTier(tier.id)}
                    >
                      <p className="text-sm font-bold text-white">{tier.name}</p>
                      <p className="text-xs text-white/30 mt-0.5">
                        {tier.commitmentMonths}-month
                        {tier.id === "9mo" && " \u2192 12 delivered"}
                      </p>
                      <p className="text-lg font-bold text-gold mt-1">
                        ${tier.monthlyPrice}
                        <span className="text-xs text-white/30 font-normal">/mo</span>
                      </p>
                      <div className="mt-1.5 flex flex-col gap-0.5">
                        <p className="text-[9px] text-white/30">
                          {(tier.tokensIncluded / 1000).toFixed(0)}K tokens
                        </p>
                        <p className="text-[9px] text-emerald-400/70 font-semibold">
                          {tier.agents} agents &middot; {tier.concurrent} concurrent
                        </p>
                        <p className="text-[9px] text-gold/60 font-semibold">
                          {tokenMarkupRates[tier.id]} token markup
                        </p>
                      </div>
                      {tier.id === "9mo" && (
                        <span className="inline-block mt-1.5 rounded-full bg-gold px-2 py-0.5 text-[8px] font-bold text-black uppercase tracking-wider">
                          V.I.B.E.
                        </span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {GROUP_STRUCTURES.map((group, gi) => (
                  <tr
                    key={group.id}
                    className={`cursor-pointer transition-colors ${
                      selectedGroup === group.id
                        ? "bg-gold/[0.03]"
                        : "hover:bg-white/[0.015]"
                    }`}
                    onClick={() => {
                      setSelectedGroup(group.id);
                      if (group.id === "individual") setSeatCount(1);
                      else if (group.id === "family") setSeatCount(4);
                      else if (group.id === "team") setSeatCount(5);
                      else setSeatCount(25);
                    }}
                  >
                    <td className="p-4 border-t border-wireframe-stroke">
                      <p className="text-sm font-semibold text-white">{group.name}</p>
                      <p className="text-xs text-white/30">{group.seats} seats</p>
                      {group.multiplier > 0 && (
                        <p className="text-[9px] text-gold/50 mt-0.5">
                          {group.multiplier}x base
                          {group.perSeatAddon > 0 && ` + $${group.perSeatAddon}/seat`}
                        </p>
                      )}
                    </td>
                    {matrixData.map((tierRow, ti) => {
                      const cell = tierRow[gi];
                      const isActive =
                        selectedTier === cell.baseTier.id && selectedGroup === group.id;
                      return (
                        <td
                          key={`${ti}-${gi}`}
                          className={`p-4 text-center border-t border-wireframe-stroke transition-colors ${
                            isActive
                              ? "bg-gold/10 ring-1 ring-inset ring-gold/30"
                              : ""
                          }`}
                        >
                          {group.id === "enterprise-group" ? (
                            <span className="text-xs text-white/30 italic">Custom</span>
                          ) : (
                            <>
                              <p className="text-lg font-bold text-white">
                                ${cell.monthlyEstimate}
                              </p>
                              <p className="text-[9px] text-white/30">/mo w/ pillars</p>
                            </>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* P2P row */}
          <div className="mt-3 rounded-2xl border border-wireframe-stroke bg-black/60 p-4 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSelectedTier("p2p")}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                  selectedTier === "p2p"
                    ? "bg-gold/10 border border-gold/30 text-gold"
                    : "border border-wireframe-stroke text-white/70 hover:border-white/20"
                }`}
              >
                Pay-per-Use
              </button>
              <span className="text-xs text-white/70">No commitment &middot; {tokenMarkupRates["p2p"]} token markup</span>
            </div>
            <div className="flex items-center gap-6 text-xs">
              <span className="text-white/70">
                100 tokens / <span className="text-white font-semibold">$1</span>
              </span>
              <span className="text-emerald-400/70 font-semibold">Unlimited agents &middot; 1 concurrent</span>
              <span className="text-white/70">Pay-as-you-go</span>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            MATRIX 2 — Three Pillars: Confidence . Convenience . Security
            ═══════════════════════════════════════════════════════════════ */}
        <section className="mb-14">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px flex-1 bg-gradient-to-r from-gold/20 to-transparent" />
            <h2
              className="text-base uppercase tracking-[0.3em] text-amber-400 font-display whitespace-nowrap"
              style={{ fontFamily: markerFont }}
            >
              Three Pillars — Confidence &middot; Convenience &middot; Security
            </h2>
            <div className="h-px flex-1 bg-gradient-to-l from-gold/20 to-transparent" />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {PILLARS.map((pillar) => {
              const currentLevel = pillars[pillar.id];
              return (
                <div key={pillar.id} className="rounded-3xl border border-wireframe-stroke bg-black/60 backdrop-blur-2xl overflow-hidden">
                  {/* Pillar Header */}
                  <div className="p-5 border-b border-wireframe-stroke bg-gradient-to-r from-gold/5 to-transparent">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{pillar.icon}</span>
                      <h3 className="text-base font-bold text-white">{pillar.name}</h3>
                    </div>
                    <p className="text-xs text-white/70 mt-1">{pillar.tagline}</p>
                  </div>

                  {/* Level Options */}
                  {pillar.options.map((option) => {
                    const isSelected = currentLevel === option.id;
                    return (
                      <button
                        key={option.id}
                        onClick={() => updatePillar(pillar.id, option.id)}
                        className={`w-full text-left p-4 border-t border-wireframe-stroke transition-all ${
                          isSelected
                            ? "bg-gold/10 border-l-2 border-l-gold"
                            : "hover:bg-white/[0.02] border-l-2 border-l-transparent"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-sm font-semibold ${isSelected ? "text-gold" : "text-white"}`}>
                            {option.name}
                          </span>
                          <span className={`text-xs font-mono rounded-full px-2 py-0.5 ${
                            option.addon === 0
                              ? "text-emerald-400/70 bg-emerald-500/10"
                              : "text-gold bg-gold/10 border border-gold/20"
                          }`}>
                            {option.addon === 0 ? "Included" : `+${(option.addon * 100).toFixed(0)}%`}
                          </span>
                        </div>
                        <ul className="space-y-1">
                          {option.features.map((f, i) => (
                            <li key={i} className="text-xs text-white/70 flex items-start gap-1.5">
                              <span className={`mt-0.5 ${isSelected ? "text-gold/60" : "text-white/30"}`}>
                                {isSelected ? "\u2713" : "\u2022"}
                              </span>
                              {f}
                            </li>
                          ))}
                        </ul>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Pillar addon summary */}
          {bill.pillarAddons.total > 0 && (
            <div className="mt-3 rounded-2xl border border-gold/20 bg-gold/5 p-4 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-4 text-xs">
                {bill.pillarAddons.confidence > 0 && (
                  <span className="text-white/70">
                    Confidence: <span className="text-gold font-semibold">+{(bill.pillarAddons.confidence * 100).toFixed(0)}%</span>
                  </span>
                )}
                {bill.pillarAddons.convenience > 0 && (
                  <span className="text-white/70">
                    Convenience: <span className="text-gold font-semibold">+{(bill.pillarAddons.convenience * 100).toFixed(0)}%</span>
                  </span>
                )}
                {bill.pillarAddons.security > 0 && (
                  <span className="text-white/70">
                    Security: <span className="text-gold font-semibold">+{(bill.pillarAddons.security * 100).toFixed(0)}%</span>
                  </span>
                )}
              </div>
              <span className="text-sm font-bold text-gold">
                Total Pillar Addon: +{(bill.pillarAddons.total * 100).toFixed(0)}%
              </span>
            </div>
          )}
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            MATRIX 3 — Task-Based Multipliers
            ═══════════════════════════════════════════════════════════════ */}
        <section className="mb-14">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px flex-1 bg-gradient-to-r from-gold/20 to-transparent" />
            <h2
              className="text-base uppercase tracking-[0.3em] text-amber-400 font-display whitespace-nowrap"
              style={{ fontFamily: markerFont }}
            >
              Task & Automation Multipliers
            </h2>
            <div className="h-px flex-1 bg-gradient-to-l from-gold/20 to-transparent" />
          </div>

          <div className="overflow-x-auto rounded-3xl border border-wireframe-stroke bg-black/60 backdrop-blur-2xl">
            <table className="w-full">
              <thead>
                <tr className="border-b border-wireframe-stroke">
                  <th className="p-4 text-left text-xs uppercase tracking-widest text-white/30">
                    Task / Automation Type
                  </th>
                  <th className="p-4 text-center text-xs uppercase tracking-widest text-white/30">
                    Multiplier
                  </th>
                  <th className="p-4 text-left text-xs uppercase tracking-widest text-white/30">
                    Description
                  </th>
                  <th className="p-4 text-center text-xs uppercase tracking-widest text-white/30 w-48">
                    Your Weight
                  </th>
                </tr>
              </thead>
              <tbody>
                {TASK_MULTIPLIERS.map((task) => {
                  const weight = taskWeights[task.id] || 0;
                  const isAutomation = ["workflow_auto", "agent_swarm", "full_autonomous", "biz_intel"].includes(task.id);
                  return (
                    <tr key={task.id} className="border-t border-wireframe-stroke hover:bg-white/[0.015]">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-white">{task.name}</p>
                          {isAutomation && (
                            <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[8px] font-bold text-emerald-400 uppercase tracking-wider">
                              Bot
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-block rounded-full border px-3 py-1 text-sm font-mono font-bold ${
                          task.multiplier >= 2.0
                            ? "border-red-400/30 bg-red-400/5 text-red-400"
                            : task.multiplier >= 1.4
                              ? "border-gold/20 bg-gold/5 text-gold"
                              : "border-emerald-400/20 bg-emerald-400/5 text-emerald-400"
                        }`}>
                          {task.multiplier}x
                        </span>
                      </td>
                      <td className="p-4">
                        <p className="text-xs text-white/70">{task.description}</p>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={weight}
                            onChange={(e) => updateWeight(task.id, parseInt(e.target.value))}
                            className="flex-1 accent-gold h-1.5"
                          />
                          <span className="w-10 text-right text-xs font-mono text-white/70">
                            {weight}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t border-gold/10 bg-gold/[0.03]">
                  <td className="p-4 text-xs font-semibold text-gold" colSpan={1}>
                    Effective Multiplier
                  </td>
                  <td className="p-4 text-center">
                    <span className="text-lg font-bold text-gold">
                      {bill.effectiveMultiplier}x
                    </span>
                  </td>
                  <td className="p-4 text-xs text-white/70" colSpan={2}>
                    Weighted average applied to your monthly estimate
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            MATRIX 4 — Usage Modifiers
            ═══════════════════════════════════════════════════════════════ */}
        <section className="mb-14">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px flex-1 bg-gradient-to-r from-gold/20 to-transparent" />
            <h2
              className="text-base uppercase tracking-[0.3em] text-amber-400 font-display whitespace-nowrap"
              style={{ fontFamily: markerFont }}
            >
              Usage Modifiers
            </h2>
            <div className="h-px flex-1 bg-gradient-to-l from-gold/20 to-transparent" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-wireframe-stroke bg-black/60 p-5">
              <p className="text-xs uppercase tracking-widest text-white/70 mb-2">
                Overage Rate
              </p>
              <p className="text-xl font-bold text-white">
                ${USAGE_MODIFIERS.overageRatePer1K}
                <span className="text-xs text-white/70 font-normal"> / 1K tokens</span>
              </p>
              <p className="text-xs text-white/30 mt-1">
                Beyond included + overdraft buffer
              </p>
            </div>
            <div className="rounded-2xl border border-wireframe-stroke bg-black/60 p-5">
              <p className="text-xs uppercase tracking-widest text-white/70 mb-2">
                Token Markup by Plan
              </p>
              <div className="space-y-1 mt-2">
                <p className="text-sm text-white/70">
                  <span className="text-white font-semibold">25%</span> Pay-per-Use
                </p>
                <p className="text-sm text-white/70">
                  <span className="text-white font-semibold">20%</span> 3-Month
                </p>
                <p className="text-sm text-white/70">
                  <span className="text-white font-semibold">15%</span> 6-Month
                </p>
                <p className="text-sm text-gold font-semibold">
                  <span className="text-gold font-bold">10%</span> 9-Month (best)
                </p>
              </div>
            </div>
            <div className="rounded-2xl border border-wireframe-stroke bg-black/60 p-5">
              <p className="text-xs uppercase tracking-widest text-white/70 mb-2">
                Real-Time LUC Top-Up
              </p>
              <p className="text-xl font-bold text-white">
                +{USAGE_MODIFIERS.realTimeLucConvenience * 100}%
                <span className="text-xs text-white/70 font-normal"> convenience</span>
              </p>
              <p className="text-xs text-white/30 mt-1">On-demand during high demand</p>
            </div>
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
              <p className="text-xs uppercase tracking-widest text-emerald-400/60 mb-2">
                LUC Calculator
              </p>
              <p className="text-xl font-bold text-emerald-400">Included</p>
              <p className="text-xs text-white/30 mt-1">
                Pre-action cost transparency — always on
              </p>
            </div>
          </div>

          {/* Free models note */}
          <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
            <p className="text-sm font-semibold text-emerald-400 mb-1">Free models included</p>
            <p className="text-xs text-white/70 leading-relaxed">
              Free LLMs (via Open Router) are available for chat and exploration at no cost.
              Use them for conversations, brainstorming, and basic tasks without consuming your token allocation.
              When you are ready to build, Opus 4.6 is the default model for app generation and advanced tasks — standard token rates apply.
            </p>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            COMPETITIVE COMPARISON
            ═══════════════════════════════════════════════════════════════ */}
        <section className="mb-14">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px flex-1 bg-gradient-to-r from-gold/20 to-transparent" />
            <h2
              className="text-base uppercase tracking-[0.3em] text-amber-400 font-display whitespace-nowrap"
              style={{ fontFamily: markerFont }}
            >
              How We Compare
            </h2>
            <div className="h-px flex-1 bg-gradient-to-l from-gold/20 to-transparent" />
          </div>

          <div className="overflow-x-auto rounded-3xl border border-wireframe-stroke bg-black/60 backdrop-blur-2xl">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-wireframe-stroke">
                  <th className="p-3 text-left text-xs uppercase tracking-widest text-white/30">Platform</th>
                  <th className="p-3 text-center text-xs uppercase tracking-widest text-white/30">Price</th>
                  <th className="p-3 text-center text-xs uppercase tracking-widest text-white/30">Unit</th>
                  <th className="p-3 text-center text-xs uppercase tracking-widest text-white/30">Allocation</th>
                  <th className="p-3 text-center text-xs uppercase tracking-widest text-white/30">Agents</th>
                  <th className="p-3 text-center text-xs uppercase tracking-widest text-white/30">Concurrent</th>
                  <th className="p-3 text-center text-xs uppercase tracking-widest text-white/30">Security</th>
                </tr>
              </thead>
              <tbody>
                {(["workspace", "coding", "builder"] as Cluster[]).map((cluster) => (
                  <React.Fragment key={cluster}>
                    {/* Cluster header */}
                    <tr className="border-t border-wireframe-stroke bg-white/[0.02]">
                      <td colSpan={7} className="p-2 text-xs uppercase tracking-[0.3em] text-gold/60 font-semibold">
                        {clusterLabels[cluster]}
                      </td>
                    </tr>
                    {competitors.filter((c) => c.cluster === cluster).map((c) => (
                      <tr key={c.name} className="border-t border-wireframe-stroke text-white/70">
                        <td className="p-2.5 text-xs">{c.name}</td>
                        <td className="p-2.5 text-xs text-center">{c.price}</td>
                        <td className="p-2.5 text-xs text-center">
                          <span className="rounded-full bg-white/5 px-1.5 py-0.5 text-[9px]">{c.unit}</span>
                        </td>
                        <td className="p-2.5 text-xs text-center">{c.allocation}</td>
                        <td className="p-2.5 text-xs text-center">{c.agents}</td>
                        <td className="p-2.5 text-xs text-center">{c.concurrent}</td>
                        <td className="p-2.5 text-xs text-center">{c.security}</td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
                {/* A.I.M.S. rows — highlighted */}
                <tr className="border-t-2 border-gold/30 bg-gold/[0.02]">
                  <td colSpan={7} className="p-2 text-xs uppercase tracking-[0.3em] text-gold/60 font-bold">
                    A.I.M.S. — AI Managed Solutions
                  </td>
                </tr>
                {subscriptionTiers.map((tier) => (
                  <tr key={tier.id} className="border-t border-gold/20 bg-gold/[0.03]">
                    <td className="p-2.5 text-xs font-bold text-gold">
                      {tier.name}
                    </td>
                    <td className="p-2.5 text-xs text-center font-semibold text-white">
                      ${tier.monthlyPrice}/mo
                    </td>
                    <td className="p-2.5 text-xs text-center">
                      <span className="rounded-full bg-gold/10 px-1.5 py-0.5 text-[9px] text-gold font-semibold">Tokens</span>
                    </td>
                    <td className="p-2.5 text-xs text-center text-white">
                      {(tier.tokensIncluded / 1000).toFixed(0)}K tokens
                    </td>
                    <td className="p-2.5 text-xs text-center font-semibold text-emerald-400">
                      {tier.agents}
                    </td>
                    <td className="p-2.5 text-xs text-center font-semibold text-emerald-400">
                      {tier.concurrent}
                    </td>
                    <td className="p-2.5 text-xs text-center text-white">
                      3-Pillar + ByteRover
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-3 text-xs text-white/30 text-center">
            A.I.M.S. anchors on <strong className="text-white/70">tokens</strong> — transparent, measurable, and optimized by ByteRover pattern reuse (15-40% savings).
            No opaque credits. No hidden ACUs. You see exactly what you consume.
          </p>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            WHITE LABEL — Enterprise Solution
            ═══════════════════════════════════════════════════════════════ */}
        <section className="mb-14">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px flex-1 bg-gradient-to-r from-gold/20 to-transparent" />
            <h2
              className="text-lg uppercase tracking-[0.3em] text-amber-400 font-display whitespace-nowrap"
              style={{ fontFamily: markerFont }}
            >
              White Label — Run A.I.M.S. as Your Own
            </h2>
            <div className="h-px flex-1 bg-gradient-to-l from-gold/20 to-transparent" />
          </div>

          <p className="text-sm text-white/70 max-w-3xl mx-auto text-center mb-8">
            Deploy A.I.M.S. under your brand as a full enterprise solution.
            Choose how much you want to manage — do it yourself, hire us, or let
            ACHEEVY and the Boomer_Angs run everything autonomously.
          </p>

          <div className="grid gap-4 lg:grid-cols-3">
            {WHITE_LABEL_PLANS.map((plan, i) => (
              <div
                key={plan.id}
                className={`relative rounded-3xl border p-6 backdrop-blur-2xl transition-all hover:scale-[1.01] ${
                  i === 2
                    ? "border-gold/30 bg-gradient-to-br from-gold/5 to-black/80 shadow-[0_0_40px_rgba(251,191,36,0.08)]"
                    : "border-wireframe-stroke bg-black/60"
                }`}
              >
                {i === 2 && (
                  <span className="absolute -top-3 left-6 rounded-full bg-gold px-3 py-0.5 text-[9px] font-bold text-black uppercase tracking-wider">
                    Most Popular
                  </span>
                )}
                <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                <p className="text-xs text-white/70 mt-0.5 uppercase tracking-wider">
                  {plan.tagline}
                </p>
                <p className="text-2xl font-bold text-gold mt-4">{plan.startingPrice}</p>
                <p className="text-[9px] text-white/30 mt-0.5">Custom quote based on scale</p>

                <ul className="mt-5 space-y-2">
                  {plan.features.map((f, fi) => (
                    <li key={fi} className="flex items-start gap-2 text-xs text-white/70">
                      <span className="text-gold/60 mt-0.5 shrink-0">{"\u2713"}</span>
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/dashboard"
                  className={`mt-6 block w-full text-center rounded-full py-2.5 text-xs font-semibold transition-all ${
                    i === 2
                      ? "bg-gold text-black hover:shadow-[0_0_20px_rgba(251,191,36,0.4)]"
                      : "border border-gold/30 text-gold hover:bg-gold/10"
                  }`}
                >
                  Talk to Sales
                </Link>
              </div>
            ))}
          </div>

          <p className="mt-4 text-xs text-white/30 text-center max-w-2xl mx-auto">
            All White Label plans include dedicated infrastructure, custom branding, and full access to the A.I.M.S.
            agent ecosystem — ACHEEVY, Boomer_Angs, Chicken Hawk, and Lil_Hawk squads.
            Volume discounts available for multi-instance deployments.
          </p>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            YOUR BILL — Live Estimate
            ═══════════════════════════════════════════════════════════════ */}
        <section className="rounded-3xl border border-gold/30 bg-gradient-to-br from-gold/5 to-black/80 p-8 shadow-[0_0_60px_rgba(251,191,36,0.1)]">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <h2
              className="text-lg uppercase tracking-[0.3em] text-amber-400 font-display"
              style={{ fontFamily: markerFont }}
            >
              Your Bill Estimate
            </h2>
            {(selectedGroup === "team" || selectedGroup === "enterprise-group") && (
              <div className="flex items-center gap-2">
                <label className="text-xs text-white/70 uppercase tracking-wider">
                  Seats:
                </label>
                <input
                  type="number"
                  value={seatCount}
                  onChange={(e) => setSeatCount(Math.max(1, parseInt(e.target.value) || 1))}
                  min={1}
                  className="w-16 rounded-lg border border-wireframe-stroke bg-black/60 px-2 py-1 text-sm text-white text-center outline-none focus:border-gold"
                />
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            {/* Frequency */}
            <div className="rounded-2xl border border-wireframe-stroke bg-black/40 p-4">
              <p className="text-xs uppercase tracking-wider text-white/70">Frequency</p>
              <p className="text-lg font-bold text-white mt-1">{bill.baseTier.name}</p>
              <p className="text-xs text-white/30 mt-0.5">
                {bill.baseTier.commitmentMonths > 0
                  ? `${bill.baseTier.commitmentMonths}-mo commit`
                  : "No commit"}
              </p>
            </div>

            {/* Group */}
            <div className="rounded-2xl border border-wireframe-stroke bg-black/40 p-4">
              <p className="text-xs uppercase tracking-wider text-white/70">Group</p>
              <p className="text-lg font-bold text-white mt-1">{bill.group.name}</p>
              <p className="text-xs text-white/30 mt-0.5">
                {seatCount} seat{seatCount > 1 ? "s" : ""}
              </p>
            </div>

            {/* Agents */}
            <div className="rounded-2xl border border-emerald-500/10 bg-emerald-500/5 p-4">
              <p className="text-xs uppercase tracking-wider text-emerald-400/60">Agents</p>
              <p className="text-lg font-bold text-emerald-400 mt-1">
                {bill.agents === 0 ? "\u221E" : bill.agents}
              </p>
              <p className="text-xs text-white/30 mt-0.5">
                {bill.concurrent} concurrent
              </p>
            </div>

            {/* Task Mix */}
            <div className="rounded-2xl border border-wireframe-stroke bg-black/40 p-4">
              <p className="text-xs uppercase tracking-wider text-white/70">Task Mix</p>
              <p className="text-lg font-bold text-white mt-1">{bill.effectiveMultiplier}x</p>
              <p className="text-xs text-white/30 mt-0.5">Effective multiplier</p>
            </div>

            {/* Pillars */}
            <div className="rounded-2xl border border-wireframe-stroke bg-black/40 p-4">
              <p className="text-xs uppercase tracking-wider text-white/70">Pillars</p>
              <p className="text-lg font-bold text-white mt-1">
                {bill.pillarAddons.total > 0 ? `+${(bill.pillarAddons.total * 100).toFixed(0)}%` : "Base"}
              </p>
              <p className="text-xs text-white/30 mt-0.5">
                C&middot;C&middot;S addon
              </p>
            </div>

            {/* Monthly Estimate */}
            <div className="rounded-2xl border border-gold/30 bg-gold/5 p-4 shadow-[0_0_20px_rgba(251,191,36,0.08)]">
              <p className="text-xs uppercase tracking-wider text-gold/60">Monthly</p>
              <p className="text-2xl font-bold text-gold mt-1">
                {selectedGroup === "enterprise-group" ? "Custom" : `$${bill.monthlyEstimate}`}
              </p>
              <p className="text-xs text-white/30 mt-0.5">
                /mo estimate
              </p>
            </div>

            {/* Commitment Total */}
            <div className="rounded-2xl border border-wireframe-stroke bg-black/40 p-4">
              <p className="text-xs uppercase tracking-wider text-white/70">Commitment</p>
              <p className="text-lg font-bold text-white mt-1">
                {bill.commitmentTotal > 0 ? `$${bill.commitmentTotal}` : "\u2014"}
              </p>
              <p className="text-xs text-white/30 mt-0.5">
                {bill.tokensPerMonth > 0
                  ? `${(bill.tokensPerMonth / 1000).toFixed(0)}K tok/mo`
                  : "Metered"}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-4">
            {selectedGroup === "enterprise-group" ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-full bg-gold px-8 py-3 text-sm font-bold text-black hover:shadow-[0_0_30px_rgba(251,191,36,0.5)] transition-all hover:scale-105 active:scale-95"
              >
                Contact Sales
              </Link>
            ) : (
              <Link
                href="/sign-up"
                className="inline-flex items-center justify-center rounded-full bg-gold px-8 py-3 text-sm font-bold text-black hover:shadow-[0_0_30px_rgba(251,191,36,0.5)] transition-all hover:scale-105 active:scale-95"
              >
                Get Started — ${bill.monthlyEstimate}/mo
              </Link>
            )}
            <Link
              href="/sign-in"
              className="inline-flex items-center justify-center rounded-full border border-gold/30 px-8 py-3 text-sm font-semibold text-gold hover:bg-gold/10 transition-all"
            >
              Sign In
            </Link>
          </div>
        </section>

        {/* ──────────────────────── V.I.B.E. Philosophy ──────────────────────── */}
        <section className="mt-16 text-center">
          <p
            className="text-base uppercase tracking-[0.3em] text-amber-400 mb-3"
            style={{ fontFamily: markerFont }}
          >
            The Frequency Philosophy
          </p>
          <p className="text-base text-white/70 max-w-lg mx-auto leading-relaxed">
            The 3-6-9 model aligns with Tesla&apos;s vortex mathematics.
            <strong className="text-white/90"> 3</strong> is the entry point.
            <strong className="text-white/90"> 6</strong> is the axis of balance.
            <strong className="text-white/90"> 9</strong> is completion —
            V.I.B.E. (Vibration, Intelligence, Balance, Energy).
            Pay for 9, receive 12. Activity breeds Activity.
          </p>
          <p className="text-sm text-white/70 mt-4 max-w-lg mx-auto leading-relaxed">
            Every bill is tuned by three pillars — Confidence ensures your agents deliver verified results.
            Convenience ensures they deliver fast. Security ensures they deliver safe.
            Stack the pillars to run your entire business on AI.
          </p>
        </section>
      </div>
      <Footer />
    </main>
  );
}
