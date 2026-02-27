// frontend/app/perform/pricing/page.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  SUBSCRIPTION_MODELS,
  TOKEN_TIERS,
  ANNUAL_COST_BREAKDOWN,
  calculateMonthly,
  type CommitmentTerm,
  type TokenTierId,
  type SubscriptionModel,
} from "@/lib/perform/subscription-models";
import { Mic, Building2, Film, Crown, Check, X, ChevronDown, ChevronUp } from "lucide-react";

const COLOR_MAP: Record<string, { border: string; bg: string; text: string; badge: string }> = {
  emerald: {
    border: "border-emerald-200",
    bg: "bg-emerald-50/50",
    text: "text-emerald-700",
    badge: "bg-emerald-100 text-emerald-800",
  },
  blue: {
    border: "border-blue-200",
    bg: "bg-blue-50/50",
    text: "text-blue-700",
    badge: "bg-blue-100 text-blue-800",
  },
  amber: {
    border: "border-amber-200",
    bg: "bg-amber-50/50",
    text: "text-amber-700",
    badge: "bg-amber-100 text-amber-800",
  },
  slate: {
    border: "border-slate-200",
    bg: "bg-slate-50/50",
    text: "text-slate-700",
    badge: "bg-slate-200 text-slate-900",
  },
};

// Feature comparison rows for the matrix
const COMPARISON_FEATURES = [
  { label: "Big Board access (300+ HS, 551 college prospects)", creator: true, partner: false, families: false, all_in_one: true },
  { label: "Real-time commitment and decommitment alerts", creator: true, partner: false, families: false, all_in_one: true },
  { label: "Transfer Portal live tracker", creator: true, partner: false, families: false, all_in_one: true },
  { label: "AI-generated show prep and script starters", creator: true, partner: false, families: false, all_in_one: true },
  { label: "Branded prospect graphics", creator: true, partner: true, families: false, all_in_one: true },
  { label: "API access and bulk data exports", creator: true, partner: false, families: false, all_in_one: true },
  { label: "Branded school page on Per|Form", creator: false, partner: true, families: false, all_in_one: true },
  { label: "Incoming prospect film inbox", creator: false, partner: true, families: false, all_in_one: true },
  { label: "Recruiting board (track, tag, organize)", creator: false, partner: true, families: false, all_in_one: true },
  { label: "NIL compliance dashboard", creator: false, partner: true, families: false, all_in_one: true },
  { label: "Team manager seat", creator: false, partner: true, families: false, all_in_one: true },
  { label: "Unlimited game film uploads", creator: false, partner: false, families: true, all_in_one: true },
  { label: "AI film analysis and distribution to coaches", creator: false, partner: false, families: true, all_in_one: true },
  { label: "School contact directory and messaging", creator: false, partner: false, families: true, all_in_one: true },
  { label: "NIL education center and legal resources", creator: false, partner: false, families: true, all_in_one: true },
  { label: "Player profile and digital player card", creator: false, partner: false, families: true, all_in_one: true },
  { label: "AGI Grade generation and evaluation", creator: true, partner: false, families: true, all_in_one: true },
  { label: "Interactive data visualization (prompt-to-chart)", creator: false, partner: false, families: false, all_in_one: true },
  { label: "Priority AI processing", creator: false, partner: false, families: false, all_in_one: true },
  { label: "White-label exports", creator: false, partner: false, families: false, all_in_one: true },
  { label: "Deep research access", creator: false, partner: false, families: false, all_in_one: true },
  { label: "Dedicated account support", creator: false, partner: false, families: false, all_in_one: true },
];

export default function PerFormPricingPage() {
  const [selectedTerm, setSelectedTerm] = useState<CommitmentTerm>("3mo");
  const [selectedTokenTier, setSelectedTokenTier] = useState<TokenTierId>("casual");
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  const toggleCardExpansion = (id: string) => {
    setExpandedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const commitmentOptions: { term: CommitmentTerm; label: string; shortLabel: string }[] = [
    { term: "3mo", label: "3 Months", shortLabel: "3mo" },
    { term: "6mo", label: "6 Months", shortLabel: "6mo" },
    { term: "9mo", label: "9 Months", shortLabel: "9mo" },
  ];

  const currentTokenTier = TOKEN_TIERS.find((t) => t.id === selectedTokenTier)!;

  function formatTokens(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}M`;
    return `${(n / 1_000).toFixed(0)}K`;
  }

  function getModelPrice(model: SubscriptionModel): { base: number; tokenAddon: number; total: number } | null {
    return calculateMonthly(model.id, selectedTerm, selectedTokenTier);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 md:px-6 lg:px-8">

      {/* ──────────────────────── Hero Header ──────────────────────── */}
      <div className="text-center mb-16">
        <span className="inline-block px-3 py-1 bg-emerald-950 text-white text-[9px] font-black uppercase tracking-[0.3em] rounded-sm mb-6">
          Services & Access
        </span>
        <h1 className="text-5xl md:text-7xl font-serif font-bold tracking-tight text-slate-950 mb-6">
          PER<span className="italic text-emerald-700">|</span>FORM <span className="text-slate-400 font-light">Access</span>
        </h1>
        <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed font-medium">
          Professional access for scouts, schools, and families.
          Choose the intelligence tier that fits your personnel requirements.
        </p>
        <p className="mt-6 text-xs text-slate-400 font-bold uppercase tracking-widest">
          A.I.M.S. Platform Integration &middot; <Link href="/pricing" className="text-emerald-700 hover:text-emerald-800 underline underline-offset-4">Full Enterprise Plans →</Link>
        </p>
      </div>

      {/* ──────────────────────── Dual Controls ──────────────────────── */}
      <section className="mb-10">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10">
          {/* Commitment Toggle */}
          <div className="text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">Commitment Term</p>
            <div className="inline-flex rounded-sm border border-slate-200 bg-white p-1 shadow-sm">
              {commitmentOptions.map((opt) => (
                <button
                  key={opt.term}
                  onClick={() => setSelectedTerm(opt.term)}
                  className={`relative rounded-sm px-6 py-2.5 text-xs font-black uppercase tracking-widest transition-all ${selectedTerm === opt.term
                      ? "bg-emerald-700 text-white shadow-lg shadow-emerald-700/20"
                      : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                    }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {selectedTerm === "9mo" && (
              <p className="mt-3 text-[10px] font-black text-emerald-700 uppercase tracking-widest animate-pulse">Annual Cycle: 3 Months Complimentary</p>
            )}
          </div>

          {/* Token Tier Toggle */}
          <div className="text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">Orchestration Level</p>
            <div className="inline-flex rounded-sm border border-slate-200 bg-white p-1 shadow-sm">
              {TOKEN_TIERS.map((tier) => (
                <button
                  key={tier.id}
                  onClick={() => setSelectedTokenTier(tier.id)}
                  className={`rounded-sm px-6 py-2.5 text-xs font-black uppercase tracking-widest transition-all ${selectedTokenTier === tier.id
                      ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20"
                      : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                    }`}
                >
                  {tier.name}
                </button>
              ))}
            </div>
            <p className="mt-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">
              {formatTokens(currentTokenTier.tokensPerMonth)} Tokens &middot; ${currentTokenTier.monthlyAddon.toFixed(0)} Addon
            </p>
          </div>
        </div>
      </section>

      {/* ──────────────────────── 4 Model Cards ──────────────────────── */}
      <section className="mb-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {SUBSCRIPTION_MODELS.map((model) => {
            const colors = COLOR_MAP[model.color] || COLOR_MAP.slate;
            const price = getModelPrice(model);
            const isAllInOne = model.id === "all_in_one";
            const isExpanded = expandedCards[model.id] ?? false;
            const visibleFeatures = isExpanded ? model.features : model.features.slice(0, 6);
            const hasMore = model.features.length > 6;

            const priceTerm = model.pricing.find((p) => p.term === selectedTerm);

            return (
              <div
                key={model.id}
                className={`relative flex flex-col rounded-sm border p-8 transition-all shadow-sm ${isAllInOne
                    ? "border-emerald-600 bg-emerald-950 text-white shadow-2xl shadow-emerald-900/20"
                    : "border-slate-200 bg-white hover:border-emerald-500"
                  }`}
              >
                {/* Recommended badge for All-In-One */}
                {isAllInOne && (
                  <span className="absolute -top-3 left-4 rounded-sm bg-emerald-500 px-3 py-1 text-[9px] font-black text-white uppercase tracking-widest">
                    Enterprise Standard
                  </span>
                )}

                {/* Icon + Name */}
                <div className="flex items-center gap-3 mb-3">
                  <div className={`rounded-lg p-2 ${colors.bg} ${colors.text}`}>
                    {MODEL_ICONS[model.icon]}
                  </div>
                  <div>
                    <h3 className="text-base md:text-lg font-bold text-slate-800">{model.name}</h3>
                    <p className="text-xs md:text-sm text-slate-500">{model.tagline}</p>
                  </div>
                </div>

                {/* Price Display */}
                <div className="mb-8">
                  {price ? (
                    <>
                      <div className="flex items-baseline gap-1">
                        <span className={`text-4xl font-serif font-bold ${isAllInOne ? "text-white" : "text-slate-950"}`}>
                          ${price.total.toFixed(0)}
                        </span>
                        <span className={`text-xs font-black uppercase tracking-widest ${isAllInOne ? "text-emerald-400" : "text-slate-400"}`}>
                          / mo
                        </span>
                      </div>
                      {price.tokenAddon > 0 && (
                        <p className={`text-[10px] font-black uppercase tracking-widest mt-2 ${isAllInOne ? "text-white/40" : "text-slate-400"}`}>
                          Incl. {currentTokenTier.name} usage
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-slate-400">Term Required</p>
                  )}
                </div>

                {/* Feature List */}
                <ul className="space-y-2 mb-4 flex-1">
                  {visibleFeatures.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs md:text-sm text-slate-600 leading-relaxed">
                      <Check className={`w-4 h-4 shrink-0 mt-0.5 ${colors.text}`} />
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* Expand/Collapse */}
                {hasMore && (
                  <button
                    onClick={() => toggleCardExpansion(model.id)}
                    className="flex items-center gap-1 text-xs md:text-sm text-slate-500 hover:text-slate-600 transition-colors mb-4"
                  >
                    {isExpanded ? (
                      <>Show less <ChevronUp className="w-3 h-3" /></>
                    ) : (
                      <>+{model.features.length - 6} more features <ChevronDown className="w-3 h-3" /></>
                    )}
                  </button>
                )}

                {/* Not included (subtle) */}
                {model.excludes.length > 0 && (
                  <div className="mb-4 border-t border-slate-100 pt-3">
                    <p className="text-xs text-slate-400 mb-1.5">Not included:</p>
                    <ul className="space-y-1">
                      {model.excludes.slice(0, 2).map((ex, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                          <X className="w-3 h-3 shrink-0 mt-0.5" />
                          {ex}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* CTA */}
                <Link
                  href="/sign-up"
                  className={`block w-full text-center rounded-sm h-12 flex items-center justify-center text-xs font-black uppercase tracking-[0.2em] transition-all ${isAllInOne
                      ? "bg-emerald-600 text-white hover:bg-emerald-500 shadow-xl shadow-emerald-900/50"
                      : "bg-slate-950 text-white hover:bg-slate-800"
                    }`}
                >
                  Deploy Tier
                </Link>
              </div>
            );
          })}
        </div>

        {/* Pay-per-Use note */}
        <div className="mt-4 rounded-xl border border-wireframe-stroke bg-slate-50/70 p-4 md:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <p className="text-sm md:text-base font-semibold text-slate-800">Pay-per-Use</p>
            <p className="text-xs md:text-sm text-slate-500 mt-0.5">
              No commitment required. Perfect for trying things out.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs md:text-sm">
            <span className="text-slate-600">$0.10/alert</span>
            <span className="text-slate-600">$0.50/graphic</span>
            <span className="text-slate-600">$1.00/film breakdown</span>
          </div>
        </div>
      </section>

      {/* ──────────────────────── Feature Comparison Table ──────────────────────── */}
      <section className="mb-24">
        <div className="flex items-center gap-6 mb-12">
          <h2 className="text-4xl font-serif font-bold text-slate-950">
            Capability <span className="italic text-emerald-800">Matrix</span>
          </h2>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <div className="overflow-x-auto rounded-sm border border-slate-200 bg-white">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="p-6 text-left text-[10px] font-black uppercase tracking-widest text-slate-400 w-2/5">
                  Orchestration Capability
                </th>
                <th className="p-6 text-center text-[10px] font-black uppercase tracking-widest text-emerald-800">Creator</th>
                <th className="p-6 text-center text-[10px] font-black uppercase tracking-widest text-blue-800">Partner</th>
                <th className="p-6 text-center text-[10px] font-black uppercase tracking-widest text-amber-800">Families</th>
                <th className="p-6 text-center text-[10px] font-black uppercase tracking-widest text-emerald-950">All-In-One</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON_FEATURES.map((row, i) => (
                <tr key={i} className="border-t border-wireframe-stroke hover:bg-white">
                  <td className="p-3 md:p-4 text-xs md:text-sm text-slate-600">{row.label}</td>
                  <td className="p-3 md:p-4 text-center">
                    {row.creator ? (
                      <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-slate-300 mx-auto" />
                    )}
                  </td>
                  <td className="p-3 md:p-4 text-center">
                    {row.partner ? (
                      <Check className="w-4 h-4 text-blue-400 mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-slate-300 mx-auto" />
                    )}
                  </td>
                  <td className="p-3 md:p-4 text-center">
                    {row.families ? (
                      <Check className="w-4 h-4 text-amber-400 mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-slate-300 mx-auto" />
                    )}
                  </td>
                  <td className="p-3 md:p-4 text-center bg-gold/[0.03]">
                    {row.all_in_one ? (
                      <Check className="w-4 h-4 text-gold mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-slate-300 mx-auto" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-3 text-xs md:text-sm text-slate-400 text-center">
          Scroll horizontally on mobile to see all plans
        </p>
      </section>

      {/* ──────────────────────── Token Tier Details ──────────────────────── */}
      <section className="mb-14">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-px flex-1 bg-gradient-to-r from-gold/20 to-transparent" />
          <h2
            className="text-xl md:text-2xl uppercase tracking-wider text-amber-400 font-display text-center"
            style={{ fontFamily: markerFont }}
          >
            Usage Levels
          </h2>
          <div className="h-px flex-1 bg-gradient-to-l from-gold/20 to-transparent" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {TOKEN_TIERS.map((tier) => {
            const isSelected = selectedTokenTier === tier.id;
            return (
              <button
                key={tier.id}
                onClick={() => setSelectedTokenTier(tier.id)}
                className={`text-left rounded-xl border p-4 md:p-6 backdrop-blur-md transition-all ${isSelected
                    ? "border-gold/30 bg-gold/5 ring-1 ring-gold/20"
                    : "border-slate-200 bg-slate-50/70 hover:border-slate-200"
                  }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className={`text-base md:text-lg font-bold ${isSelected ? "text-gold" : "text-slate-800"}`}>
                    {tier.name}
                  </h3>
                  {tier.monthlyAddon === 0 ? (
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-400">
                      Included
                    </span>
                  ) : (
                    <span className="rounded-full bg-gold/10 px-2 py-0.5 text-xs font-semibold text-gold">
                      +${tier.monthlyAddon}/mo
                    </span>
                  )}
                </div>

                <p className="text-2xl md:text-3xl font-bold font-display text-slate-800 mb-2">
                  {formatTokens(tier.tokensPerMonth)}
                  <span className="text-sm md:text-base text-slate-400 font-normal ml-1">tokens/mo</span>
                </p>

                <p className="text-xs md:text-sm text-slate-500 leading-relaxed mb-3">{tier.description}</p>

                <div className="border-t border-slate-100 pt-3">
                  <p className="text-xs md:text-sm text-slate-400">
                    Overage: <span className="text-slate-500 font-semibold">${tier.overageRatePer1K}/1K tokens</span>
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Free AI models note */}
        <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 md:p-5">
          <p className="text-sm md:text-base font-semibold text-emerald-400 mb-1">
            Powered by advanced AI — no extra cost for standard use
          </p>
          <p className="text-xs md:text-sm text-slate-500 leading-relaxed">
            All plans include access to our AI engine for chat, content generation, film analysis, and data visualization.
            Standard operations use free-tier language models, keeping your costs low.
            Heavy research and deep analysis tasks use premium models and consume more tokens.
          </p>
        </div>
      </section>

      {/* ──────────────────────── Cost Transparency ──────────────────────── */}
      <section className="mb-14">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-px flex-1 bg-gradient-to-r from-gold/20 to-transparent" />
          <h2
            className="text-xl md:text-2xl uppercase tracking-wider text-amber-400 font-display text-center"
            style={{ fontFamily: markerFont }}
          >
            What Your Subscription Covers
          </h2>
          <div className="h-px flex-1 bg-gradient-to-l from-gold/20 to-transparent" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(ANNUAL_COST_BREAKDOWN).map(([key, desc]) => (
            <div
              key={key}
              className="rounded-xl border border-slate-200 bg-slate-50/70 backdrop-blur-md p-4 md:p-5"
            >
              <p className="text-sm md:text-base font-semibold text-slate-800 capitalize mb-1">
                {key.replace(/([A-Z])/g, " $1").trim()}
              </p>
              <p className="text-xs md:text-sm text-slate-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ──────────────────────── Philosophy ──────────────────────── */}
      <section className="mb-24 text-center px-10 py-16 bg-slate-950 rounded-sm">
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500 mb-8">
          The Intelligence Standard
        </p>
        <p className="text-2xl md:text-4xl font-serif font-bold text-white max-w-4xl mx-auto leading-tight mb-8">
          &ldquo;Data is the film, film is the data.&rdquo;
        </p>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Per|Form isn&apos;t just a database; it&apos;s a neural scouting layer.
          By synchronizing metrics, film, and character intelligence, we provide the definitive <span className="text-white font-bold">AGI Record</span> for the modern game.
        </p>
      </section>

      {/* ──────────────────────── CTA Footer ──────────────────────── */}
      <section className="rounded-sm border border-slate-200 bg-white p-20 text-center shadow-2xl shadow-slate-200/50">
        <h2 className="text-4xl md:text-5xl font-serif font-bold text-slate-950 mb-6">
          Ready to <span className="italic text-emerald-800">Deploy?</span>
        </h2>
        <p className="text-lg text-slate-500 mb-12 max-w-xl mx-auto">
          Secure your seat in the Intelligence Hub today. Professional tools for professional personnel operations.
        </p>
        <div className="flex flex-col sm:flex-row gap-6 justify-center">
          <Link
            href="/sign-up"
            className="inline-flex items-center justify-center rounded-sm bg-emerald-700 h-14 min-w-[240px] px-10 text-xs font-black uppercase tracking-widest text-white hover:bg-emerald-800 shadow-xl shadow-emerald-700/20 transition-all"
          >
            Initialize Subscription
          </Link>
          <Link
            href="/sign-in"
            className="inline-flex items-center justify-center rounded-sm border border-slate-200 h-14 min-w-[240px] px-10 text-xs font-black uppercase tracking-widest text-slate-950 hover:bg-slate-50 transition-all"
          >
            Member Sign In
          </Link>
        </div>
      </section>
    </div>
  );
}
