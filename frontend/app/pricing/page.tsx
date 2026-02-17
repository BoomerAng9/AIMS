// frontend/app/pricing/page.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import Footer from "@/components/landing/Footer";
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

const markerFont = 'var(--font-marker), "Permanent Marker", cursive';

const MODEL_ICONS: Record<string, React.ReactNode> = {
  Mic: <Mic className="w-6 h-6" />,
  Building2: <Building2 className="w-6 h-6" />,
  Film: <Film className="w-6 h-6" />,
  Crown: <Crown className="w-6 h-6" />,
};

const COLOR_MAP: Record<string, { border: string; bg: string; text: string; badge: string }> = {
  emerald: {
    border: "border-emerald-500/30",
    bg: "bg-emerald-500/5",
    text: "text-emerald-400",
    badge: "bg-emerald-500/10 text-emerald-400",
  },
  blue: {
    border: "border-blue-500/30",
    bg: "bg-blue-500/5",
    text: "text-blue-400",
    badge: "bg-blue-500/10 text-blue-400",
  },
  amber: {
    border: "border-amber-500/30",
    bg: "bg-amber-500/5",
    text: "text-amber-400",
    badge: "bg-amber-500/10 text-amber-400",
  },
  gold: {
    border: "border-gold/30",
    bg: "bg-gold/5",
    text: "text-gold",
    badge: "bg-gold/10 text-gold",
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
  { label: "P.A.I. Score generation", creator: true, partner: false, families: true, all_in_one: true },
  { label: "Interactive data visualization (prompt-to-chart)", creator: false, partner: false, families: false, all_in_one: true },
  { label: "Priority AI processing", creator: false, partner: false, families: false, all_in_one: true },
  { label: "White-label exports", creator: false, partner: false, families: false, all_in_one: true },
  { label: "Deep research access", creator: false, partner: false, families: false, all_in_one: true },
  { label: "Dedicated account support", creator: false, partner: false, families: false, all_in_one: true },
];

export default function PricingPage() {
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
    <main className="min-h-screen bg-obsidian text-white">
      <SiteHeader />
      <div className="mx-auto max-w-6xl px-4 py-12 md:px-6 lg:px-8">

        {/* ──────────────────────── Hero Header ──────────────────────── */}
        <div className="text-center mb-10">
          <h1
            className="text-2xl md:text-4xl font-bold tracking-tight"
            style={{ fontFamily: markerFont }}
          >
            Per|Form Pricing
          </h1>
          <p className="mt-3 text-sm md:text-base text-white/70 max-w-2xl mx-auto leading-relaxed">
            For sports content creators, schools, parents, and power users.
            Choose your plan, pick your commitment, and select the usage level that fits your workflow.
          </p>
        </div>

        {/* ──────────────────────── Dual Controls ──────────────────────── */}
        <section className="mb-10">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10">
            {/* Commitment Toggle */}
            <div className="text-center">
              <p className="text-xs md:text-sm uppercase tracking-wider text-white/50 mb-2">Commitment</p>
              <div className="inline-flex rounded-lg border border-wireframe-stroke bg-black/60 p-1">
                {commitmentOptions.map((opt) => (
                  <button
                    key={opt.term}
                    onClick={() => setSelectedTerm(opt.term)}
                    className={`relative rounded-md px-4 py-2 text-sm font-semibold transition-all ${
                      selectedTerm === opt.term
                        ? "bg-gold/10 text-gold border border-gold/30"
                        : "text-white/60 hover:text-white/80 border border-transparent"
                    }`}
                  >
                    {opt.label}
                    {opt.term === "9mo" && selectedTerm === "9mo" && (
                      <span className="absolute -top-2 -right-1 rounded-full bg-gold px-1.5 py-0.5 text-xs font-bold text-black leading-none">
                        +3
                      </span>
                    )}
                  </button>
                ))}
              </div>
              {selectedTerm === "9mo" && (
                <p className="mt-1.5 text-xs md:text-sm text-gold/80">Pay 9 months, get 12 delivered</p>
              )}
            </div>

            {/* Token Tier Toggle */}
            <div className="text-center">
              <p className="text-xs md:text-sm uppercase tracking-wider text-white/50 mb-2">Usage Level</p>
              <div className="inline-flex rounded-lg border border-wireframe-stroke bg-black/60 p-1">
                {TOKEN_TIERS.map((tier) => (
                  <button
                    key={tier.id}
                    onClick={() => setSelectedTokenTier(tier.id)}
                    className={`rounded-md px-4 py-2 text-sm font-semibold transition-all ${
                      selectedTokenTier === tier.id
                        ? "bg-gold/10 text-gold border border-gold/30"
                        : "text-white/60 hover:text-white/80 border border-transparent"
                    }`}
                  >
                    {tier.name}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-xs md:text-sm text-white/50">
                {formatTokens(currentTokenTier.tokensPerMonth)} tokens/mo
                {currentTokenTier.monthlyAddon > 0 && (
                  <> &middot; +${currentTokenTier.monthlyAddon.toFixed(2)}/mo</>
                )}
              </p>
            </div>
          </div>
        </section>

        {/* ──────────────────────── 4 Model Cards ──────────────────────── */}
        <section className="mb-14">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {SUBSCRIPTION_MODELS.map((model) => {
              const colors = COLOR_MAP[model.color] || COLOR_MAP.gold;
              const price = getModelPrice(model);
              const isAllInOne = model.id === "all_in_one";
              const isExpanded = expandedCards[model.id] ?? false;
              const visibleFeatures = isExpanded ? model.features : model.features.slice(0, 6);
              const hasMore = model.features.length > 6;

              // All-In-One doesn't have p2p, so price may be null if term is p2p (won't happen with our toggle)
              const priceTerm = model.pricing.find((p) => p.term === selectedTerm);

              return (
                <div
                  key={model.id}
                  className={`relative flex flex-col rounded-xl border p-4 md:p-6 backdrop-blur-md transition-all ${
                    isAllInOne
                      ? "border-gold/30 bg-gradient-to-br from-gold/5 to-black/80 shadow-[0_0_30px_rgba(212,175,55,0.08)]"
                      : "border-white/10 bg-black/60"
                  }`}
                >
                  {/* Recommended badge for All-In-One */}
                  {isAllInOne && (
                    <span className="absolute -top-3 left-4 rounded-full bg-gold px-3 py-1 text-xs font-bold text-black uppercase tracking-wider">
                      Recommended
                    </span>
                  )}

                  {/* Icon + Name */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`rounded-lg p-2 ${colors.bg} ${colors.text}`}>
                      {MODEL_ICONS[model.icon]}
                    </div>
                    <div>
                      <h3 className="text-base md:text-lg font-bold text-white">{model.name}</h3>
                      <p className="text-xs md:text-sm text-white/50">{model.tagline}</p>
                    </div>
                  </div>

                  {/* Price Display */}
                  <div className="mb-4">
                    {price ? (
                      <>
                        <div className="flex items-baseline gap-1">
                          <span className={`text-3xl font-bold font-display ${isAllInOne ? "text-gold" : "text-white"}`}>
                            ${price.total.toFixed(2)}
                          </span>
                          <span className="text-sm text-white/50">/mo</span>
                        </div>
                        {price.tokenAddon > 0 && (
                          <p className="text-xs md:text-sm text-white/40 mt-1">
                            ${price.base.toFixed(2)} base + ${price.tokenAddon.toFixed(2)} {currentTokenTier.name} usage
                          </p>
                        )}
                        {priceTerm && (
                          <p className="text-xs md:text-sm text-white/40 mt-0.5">{priceTerm.savings}</p>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-white/40">Select a commitment term</p>
                    )}
                  </div>

                  {/* Feature List */}
                  <ul className="space-y-2 mb-4 flex-1">
                    {visibleFeatures.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs md:text-sm text-white/70 leading-relaxed">
                        <Check className={`w-4 h-4 shrink-0 mt-0.5 ${colors.text}`} />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {/* Expand/Collapse */}
                  {hasMore && (
                    <button
                      onClick={() => toggleCardExpansion(model.id)}
                      className="flex items-center gap-1 text-xs md:text-sm text-white/50 hover:text-white/70 transition-colors mb-4"
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
                    <div className="mb-4 border-t border-white/5 pt-3">
                      <p className="text-xs text-white/30 mb-1.5">Not included:</p>
                      <ul className="space-y-1">
                        {model.excludes.slice(0, 2).map((ex, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-white/30">
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
                    className={`block w-full text-center rounded-lg h-10 flex items-center justify-center text-sm font-semibold transition-all ${
                      isAllInOne
                        ? "bg-gold text-black hover:shadow-[0_0_20px_rgba(212,175,55,0.4)]"
                        : `border ${colors.border} ${colors.text} hover:${colors.bg}`
                    }`}
                  >
                    Get Started
                  </Link>
                </div>
              );
            })}
          </div>

          {/* Pay-per-Use note */}
          <div className="mt-4 rounded-xl border border-wireframe-stroke bg-black/60 p-4 md:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <p className="text-sm md:text-base font-semibold text-white">Pay-per-Use</p>
              <p className="text-xs md:text-sm text-white/50 mt-0.5">
                No commitment required. Perfect for trying things out.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs md:text-sm">
              <span className="text-white/70">$0.10/alert</span>
              <span className="text-white/70">$0.50/graphic</span>
              <span className="text-white/70">$1.00/film breakdown</span>
            </div>
          </div>
        </section>

        {/* ──────────────────────── Feature Comparison Table ──────────────────────── */}
        <section className="mb-14">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px flex-1 bg-gradient-to-r from-gold/20 to-transparent" />
            <h2
              className="text-xl md:text-2xl uppercase tracking-wider text-amber-400 font-display text-center"
              style={{ fontFamily: markerFont }}
            >
              Compare Plans
            </h2>
            <div className="h-px flex-1 bg-gradient-to-l from-gold/20 to-transparent" />
          </div>

          <div className="overflow-x-auto rounded-xl border border-wireframe-stroke bg-black/60 backdrop-blur-md">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-wireframe-stroke">
                  <th className="p-3 md:p-4 text-left text-xs md:text-sm uppercase tracking-wider text-white/40 w-2/5">
                    Feature
                  </th>
                  <th className="p-3 md:p-4 text-center text-xs md:text-sm uppercase tracking-wider text-emerald-400">Creator</th>
                  <th className="p-3 md:p-4 text-center text-xs md:text-sm uppercase tracking-wider text-blue-400">Partner</th>
                  <th className="p-3 md:p-4 text-center text-xs md:text-sm uppercase tracking-wider text-amber-400">Families</th>
                  <th className="p-3 md:p-4 text-center text-xs md:text-sm uppercase tracking-wider text-gold font-bold">All-In-One</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_FEATURES.map((row, i) => (
                  <tr key={i} className="border-t border-wireframe-stroke hover:bg-white/[0.02]">
                    <td className="p-3 md:p-4 text-xs md:text-sm text-white/70">{row.label}</td>
                    <td className="p-3 md:p-4 text-center">
                      {row.creator ? (
                        <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                      ) : (
                        <X className="w-4 h-4 text-white/20 mx-auto" />
                      )}
                    </td>
                    <td className="p-3 md:p-4 text-center">
                      {row.partner ? (
                        <Check className="w-4 h-4 text-blue-400 mx-auto" />
                      ) : (
                        <X className="w-4 h-4 text-white/20 mx-auto" />
                      )}
                    </td>
                    <td className="p-3 md:p-4 text-center">
                      {row.families ? (
                        <Check className="w-4 h-4 text-amber-400 mx-auto" />
                      ) : (
                        <X className="w-4 h-4 text-white/20 mx-auto" />
                      )}
                    </td>
                    <td className="p-3 md:p-4 text-center bg-gold/[0.03]">
                      {row.all_in_one ? (
                        <Check className="w-4 h-4 text-gold mx-auto" />
                      ) : (
                        <X className="w-4 h-4 text-white/20 mx-auto" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-3 text-xs md:text-sm text-white/30 text-center">
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
                  className={`text-left rounded-xl border p-4 md:p-6 backdrop-blur-md transition-all ${
                    isSelected
                      ? "border-gold/30 bg-gold/5 ring-1 ring-gold/20"
                      : "border-white/10 bg-black/60 hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className={`text-base md:text-lg font-bold ${isSelected ? "text-gold" : "text-white"}`}>
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

                  <p className="text-2xl md:text-3xl font-bold font-display text-white mb-2">
                    {formatTokens(tier.tokensPerMonth)}
                    <span className="text-sm md:text-base text-white/40 font-normal ml-1">tokens/mo</span>
                  </p>

                  <p className="text-xs md:text-sm text-white/50 leading-relaxed mb-3">{tier.description}</p>

                  <div className="border-t border-white/5 pt-3">
                    <p className="text-xs md:text-sm text-white/40">
                      Overage: <span className="text-white/60 font-semibold">${tier.overageRatePer1K}/1K tokens</span>
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
            <p className="text-xs md:text-sm text-white/60 leading-relaxed">
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
                className="rounded-xl border border-white/10 bg-black/60 backdrop-blur-md p-4 md:p-5"
              >
                <p className="text-sm md:text-base font-semibold text-white capitalize mb-1">
                  {key.replace(/([A-Z])/g, " $1").trim()}
                </p>
                <p className="text-xs md:text-sm text-white/50 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ──────────────────────── V.I.B.E. Philosophy ──────────────────────── */}
        <section className="mb-14 text-center">
          <p
            className="text-base md:text-lg uppercase tracking-[0.2em] text-amber-400 mb-3"
            style={{ fontFamily: markerFont }}
          >
            The Frequency Philosophy
          </p>
          <p className="text-sm md:text-base text-white/70 max-w-xl mx-auto leading-relaxed">
            The 3-6-9 model aligns with Tesla&apos;s vortex mathematics.
            <strong className="text-white/90"> 3</strong> is the entry point.
            <strong className="text-white/90"> 6</strong> is the axis of balance.
            <strong className="text-white/90"> 9</strong> is completion &mdash;
            V.I.B.E. (Vibration, Intelligence, Balance, Energy).
            Pay for 9, receive 12. Activity breeds Activity.
          </p>
        </section>

        {/* ──────────────────────── CTA Footer ──────────────────────── */}
        <section className="rounded-xl border border-gold/30 bg-gradient-to-br from-gold/5 to-black/80 p-6 md:p-8 text-center shadow-[0_0_40px_rgba(212,175,55,0.06)]">
          <h2
            className="text-xl md:text-2xl font-bold text-white mb-2"
            style={{ fontFamily: markerFont }}
          >
            Ready to Per|Form?
          </h2>
          <p className="text-sm md:text-base text-white/60 mb-6 max-w-lg mx-auto">
            Join content creators, schools, and families already using Per|Form to level up their recruiting game.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/sign-up"
              className="inline-flex items-center justify-center rounded-lg bg-gold h-10 min-w-[120px] px-8 text-sm font-bold text-black hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all"
            >
              Get Started
            </Link>
            <Link
              href="/sign-in"
              className="inline-flex items-center justify-center rounded-lg border border-gold/30 h-10 min-w-[120px] px-8 text-sm font-semibold text-gold hover:bg-gold/10 transition-all"
            >
              Sign In
            </Link>
          </div>
        </section>
      </div>
      <Footer />
    </main>
  );
}
