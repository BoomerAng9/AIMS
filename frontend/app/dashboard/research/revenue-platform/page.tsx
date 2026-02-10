// frontend/app/dashboard/research/revenue-platform/page.tsx
"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/motion/variants";
import {
  DollarSign,
  ArrowLeft,
  CheckCircle2,
  Crown,
  Rocket,
  Building2,
  Sparkles,
  Store,
  CreditCard,
  BadgeCheck,
  Key,
  TrendingUp,
  BarChart3,
  ArrowUpRight,
  Zap,
} from "lucide-react";

/* ── Billing Tiers ─────────────────────────────────────────── */

const tiers = [
  {
    id: "free",
    name: "Free",
    price: 0,
    icon: Sparkles,
    highlight: false,
    description: "Perfect for exploring A.I.M.S. capabilities and prototyping.",
    quotaLabel: "Limited quotas",
    features: [
      "100 AI agent messages/month",
      "50 tool invocations/month",
      "1 GB cloud storage",
      "Community support",
      "Basic analytics dashboard",
    ],
    quotas: {
      "Agent Messages": "100/mo",
      "Tool Calls": "50/mo",
      "Storage": "1 GB",
      "API Requests": "500/mo",
    },
  },
  {
    id: "starter",
    name: "Starter",
    price: 29,
    icon: Rocket,
    highlight: false,
    description: "For individuals and small teams getting serious with AI agents.",
    quotaLabel: "Generous quotas",
    features: [
      "2,000 AI agent messages/month",
      "500 tool invocations/month",
      "10 GB cloud storage",
      "Email support (48h SLA)",
      "Full analytics & reporting",
      "3 custom agent personas",
    ],
    quotas: {
      "Agent Messages": "2,000/mo",
      "Tool Calls": "500/mo",
      "Storage": "10 GB",
      "API Requests": "5,000/mo",
    },
  },
  {
    id: "professional",
    name: "Professional",
    price: 99,
    icon: Crown,
    highlight: true,
    description: "For growing businesses that need production-grade AI operations.",
    quotaLabel: "High-volume quotas",
    features: [
      "15,000 AI agent messages/month",
      "5,000 tool invocations/month",
      "100 GB cloud storage",
      "Priority support (12h SLA)",
      "Advanced analytics & custom reports",
      "Unlimited agent personas",
      "White-label branding",
      "Webhook integrations",
    ],
    quotas: {
      "Agent Messages": "15,000/mo",
      "Tool Calls": "5,000/mo",
      "Storage": "100 GB",
      "API Requests": "50,000/mo",
    },
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 499,
    icon: Building2,
    highlight: false,
    description: "For organizations requiring dedicated infrastructure and SLAs.",
    quotaLabel: "Unlimited + dedicated",
    features: [
      "Unlimited AI agent messages",
      "Unlimited tool invocations",
      "1 TB cloud storage",
      "Dedicated support (1h SLA)",
      "Custom model fine-tuning",
      "SSO & RBAC controls",
      "Dedicated infrastructure",
      "Custom SLA agreements",
      "On-premise deployment option",
    ],
    quotas: {
      "Agent Messages": "Unlimited",
      "Tool Calls": "Unlimited",
      "Storage": "1 TB",
      "API Requests": "Unlimited",
    },
  },
];

/* ── Revenue Streams ───────────────────────────────────────── */

const revenueStreams = [
  {
    id: "marketplace",
    name: "aiPlug Marketplace",
    icon: Store,
    description:
      "A curated marketplace where developers publish AI agent plugins, skills, and integrations. A.I.M.S. takes a 15% platform fee on all transactions.",
    metrics: [
      { label: "Listed Plugins", value: "24" },
      { label: "Platform Fee", value: "15%" },
    ],
    color: "#D4A843",
  },
  {
    id: "subscriptions",
    name: "Subscription Tiers",
    icon: CreditCard,
    description:
      "Recurring SaaS revenue from Free, Starter, Professional, and Enterprise tiers. LUC billing engine handles metering, quotas, and overage charges.",
    metrics: [
      { label: "Tiers", value: "4" },
      { label: "MRR Target", value: "$10K" },
    ],
    color: "#3B82F6",
  },
  {
    id: "whitelabel",
    name: "White Label Licensing",
    icon: BadgeCheck,
    description:
      "Enterprise clients license the A.I.M.S. platform under their own brand. Includes custom agent personas, dedicated infrastructure, and priority support.",
    metrics: [
      { label: "License Fee", value: "$2K+/mo" },
      { label: "Setup Fee", value: "$5K" },
    ],
    color: "#8B5CF6",
  },
  {
    id: "api-access",
    name: "API Access",
    icon: Key,
    description:
      "Metered API access for developers building on the A.I.M.S. platform. Pay-per-call pricing with volume discounts via the LUC billing engine.",
    metrics: [
      { label: "Base Rate", value: "$0.001/call" },
      { label: "Volume Discount", value: "Up to 40%" },
    ],
    color: "#22C55E",
  },
];

/* ── Main Page ─────────────────────────────────────────────── */

export default function RevenuePlatformPage() {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="space-y-8 animate-in fade-in duration-700"
    >
      {/* ── Back Link + Header ─────────────────────────────── */}
      <motion.section variants={staggerItem}>
        <Link
          href="/dashboard/research"
          className="mb-4 inline-flex items-center gap-2 text-sm text-white/40 transition hover:text-gold"
        >
          <ArrowLeft size={14} />
          Back to Research Hub
        </Link>

        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-gold/20 bg-gold/10">
            <DollarSign size={22} className="text-gold" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white font-display">
              Revenue Platform
            </h1>
            <p className="text-sm text-white/50">
              Monetization strategy, billing tiers, and revenue streams
            </p>
          </div>
        </div>
      </motion.section>

      {/* ── LUC Billing Tiers ──────────────────────────────── */}
      <motion.section variants={staggerItem}>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-white/80 font-display">
          LUC Billing Tiers
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {tiers.map((tier) => (
            <motion.div
              key={tier.id}
              whileHover={{ y: -4 }}
              className={`relative rounded-3xl border p-6 backdrop-blur-2xl ${
                tier.highlight
                  ? "border-gold/30 bg-gold/5"
                  : "border-wireframe-stroke bg-black/60"
              }`}
            >
              {/* Recommended Badge */}
              {tier.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-gold">
                    Recommended
                  </span>
                </div>
              )}

              {/* Icon + Name */}
              <div className="mb-4 flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl border ${
                    tier.highlight
                      ? "border-gold/30 bg-gold/15"
                      : "border-gold/20 bg-gold/10"
                  }`}
                >
                  <tier.icon
                    size={18}
                    className={tier.highlight ? "text-gold" : "text-gold/80"}
                  />
                </div>
                <h3 className="text-lg font-semibold text-white font-display">
                  {tier.name}
                </h3>
              </div>

              {/* Price */}
              <div className="mb-3">
                <span className="text-3xl font-bold text-white">
                  ${tier.price}
                </span>
                <span className="text-sm text-white/40">/month</span>
              </div>

              {/* Description */}
              <p className="mb-4 text-xs leading-relaxed text-white/50">
                {tier.description}
              </p>

              {/* Quota Summary */}
              <div className="mb-4 rounded-xl border border-wireframe-stroke bg-white/5 p-3">
                <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-gold/50">
                  {tier.quotaLabel}
                </p>
                <div className="space-y-1">
                  {Object.entries(tier.quotas).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="text-white/40">{key}</span>
                      <span className="font-mono text-white/70">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-1.5">
                {tier.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2 text-xs text-white/50"
                  >
                    <CheckCircle2
                      size={12}
                      className={`mt-0.5 flex-shrink-0 ${
                        tier.highlight ? "text-gold" : "text-gold/60"
                      }`}
                    />
                    {feature}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ── Revenue Streams ────────────────────────────────── */}
      <motion.section variants={staggerItem}>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-white/80 font-display">
          Revenue Streams
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {revenueStreams.map((stream) => (
            <motion.div
              key={stream.id}
              whileHover={{ y: -2 }}
              className="rounded-3xl border border-wireframe-stroke bg-black/60 p-6 backdrop-blur-2xl"
            >
              <div className="mb-3 flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{
                    backgroundColor: `${stream.color}15`,
                    border: `1px solid ${stream.color}30`,
                  }}
                >
                  <stream.icon size={18} style={{ color: stream.color }} />
                </div>
                <h3 className="text-base font-semibold text-white font-display">
                  {stream.name}
                </h3>
              </div>
              <p className="mb-4 text-sm leading-relaxed text-white/60">
                {stream.description}
              </p>
              <div className="flex gap-4">
                {stream.metrics.map((m) => (
                  <div
                    key={m.label}
                    className="rounded-xl border border-wireframe-stroke bg-white/5 px-3 py-2"
                  >
                    <p className="text-[10px] font-medium uppercase tracking-wider text-gold/50">
                      {m.label}
                    </p>
                    <p className="text-sm font-semibold text-white">
                      {m.value}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ── Monetization Strategy ──────────────────────────── */}
      <motion.section variants={staggerItem}>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-white/80 font-display">
          Monetization Strategy
        </h2>
        <div className="rounded-3xl border border-wireframe-stroke bg-black/60 p-6 backdrop-blur-2xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Phase 1 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-gold/20 bg-gold/10">
                  <Zap size={14} className="text-gold" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Phase 1</p>
                  <p className="text-[10px] text-white/40">Foundation</p>
                </div>
              </div>
              <ul className="space-y-1.5 pl-10">
                <li className="text-xs text-white/50">Launch free tier for adoption</li>
                <li className="text-xs text-white/50">Build aiPlug marketplace MVP</li>
                <li className="text-xs text-white/50">Onboard 100 beta users</li>
                <li className="text-xs text-white/50">Validate LUC billing engine</li>
              </ul>
            </div>

            {/* Phase 2 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-blue-500/20 bg-blue-500/10">
                  <TrendingUp size={14} className="text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Phase 2</p>
                  <p className="text-[10px] text-white/40">Growth</p>
                </div>
              </div>
              <ul className="space-y-1.5 pl-10">
                <li className="text-xs text-white/50">Convert free to paid tiers</li>
                <li className="text-xs text-white/50">Expand marketplace catalog</li>
                <li className="text-xs text-white/50">Launch API access program</li>
                <li className="text-xs text-white/50">Target $10K MRR</li>
              </ul>
            </div>

            {/* Phase 3 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-purple-500/20 bg-purple-500/10">
                  <BarChart3 size={14} className="text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Phase 3</p>
                  <p className="text-[10px] text-white/40">Scale</p>
                </div>
              </div>
              <ul className="space-y-1.5 pl-10">
                <li className="text-xs text-white/50">White-label enterprise deals</li>
                <li className="text-xs text-white/50">On-premise deployment option</li>
                <li className="text-xs text-white/50">Partner & reseller program</li>
                <li className="text-xs text-white/50">Target $100K MRR</li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-6 flex items-center justify-between border-t border-wireframe-stroke pt-4">
            <p className="text-xs text-white/40">
              Revenue engine powered by the LUC (Locale Universal Calculator) billing system
            </p>
            <Link
              href="/dashboard/luc"
              className="inline-flex items-center gap-1 text-xs font-medium text-gold transition hover:text-gold/80"
            >
              Open LUC Dashboard
              <ArrowUpRight size={12} />
            </Link>
          </div>
        </div>
      </motion.section>
    </motion.div>
  );
}
