"use client";

/**
 * Blockwise AI Sandbox — Wealth Tech for the Culture
 *
 * AI finds deals BEFORE Zillow. Voice-driven property discovery,
 * OPM funding paths, and 90-day close plans. From renter to landlord.
 *
 * Services: Deal Engine (5004), Funding Router (5005)
 */

import Link from "next/link";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/motion/variants";
import {
  ArrowRight,
  Zap,
  MapPin,
  DollarSign,
  Calendar,
  TrendingUp,
  Mic,
  Building,
} from "lucide-react";

/* ── Mock deals (replaced by Deal Engine API in prod) ─── */
const MOCK_DEALS = [
  {
    id: "deal-001",
    address: "123 Peachtree St NW",
    city: "Atlanta, GA",
    arv: 285000,
    rehab: 45000,
    askingPrice: 180000,
    cashOnCash: 14.2,
    opmScore: "A-",
    riskGrade: "B+",
    daysOnPlan: 38,
  },
  {
    id: "deal-002",
    address: "456 MLK Blvd",
    city: "Houston, TX",
    arv: 195000,
    rehab: 28000,
    askingPrice: 125000,
    cashOnCash: 11.8,
    opmScore: "B+",
    riskGrade: "B",
    daysOnPlan: 0,
  },
  {
    id: "deal-003",
    address: "789 Washington Ave",
    city: "Memphis, TN",
    arv: 142000,
    rehab: 18000,
    askingPrice: 85000,
    cashOnCash: 16.5,
    opmScore: "A",
    riskGrade: "A-",
    daysOnPlan: 0,
  },
];

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function gradeColor(grade: string) {
  if (grade.startsWith("A")) return "text-emerald-400";
  if (grade.startsWith("B")) return "text-gold";
  return "text-amber-400";
}

export default function BlockwiseSandbox() {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="max-w-6xl mx-auto px-6 py-10 space-y-10"
    >
      {/* Hero */}
      <motion.header variants={staggerItem} className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10 border border-gold/20 text-gold">
            <Zap size={20} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-display text-white tracking-tight">
              Blockwise AI
            </h1>
            <p className="text-xs text-gold/60 font-mono">
              Wealth Tech for the Culture
            </p>
          </div>
        </div>
        <p className="text-sm text-white/40 max-w-xl">
          AI finds deals BEFORE Zillow. Know your numbers, fund with OPM (Other
          People&apos;s Money), close in 90 days. From renter to landlord.
        </p>
      </motion.header>

      {/* Voice entry */}
      <motion.div
        variants={staggerItem}
        className="wireframe-card p-6 rounded-2xl flex items-center gap-4"
      >
        <button
          type="button"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-gold/10 border-2 border-gold/30 text-gold hover:bg-gold/20 transition-colors animate-pulse-gold"
        >
          <Mic size={24} />
        </button>
        <div>
          <p className="text-sm text-white/70">
            &quot;I have $50K. Find me a deal in Atlanta.&quot;
          </p>
          <p className="text-[0.55rem] text-white/30 font-mono uppercase tracking-wider">
            Voice-driven deal discovery — say your budget and market
          </p>
        </div>
      </motion.div>

      {/* Pipeline */}
      <motion.div variants={staggerItem} className="wireframe-card p-6 rounded-2xl">
        <h2 className="text-xs uppercase tracking-widest text-gold/50 font-mono mb-4">
          Deal Pipeline
        </h2>
        <div className="flex flex-wrap items-center gap-2 text-[0.6rem] font-mono">
          {["DISCOVER", "ANALYZE", "FUND PATH", "TIMELINE", "ARTIFACT"].map(
            (stage, i) => (
              <span key={stage} className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/5 text-white/40">
                  {stage}
                </span>
                {i < 4 && (
                  <ArrowRight size={10} className="text-white/15" />
                )}
              </span>
            )
          )}
        </div>
      </motion.div>

      {/* Deal Grid */}
      <motion.section variants={staggerContainer} className="space-y-4">
        <h2 className="text-xs uppercase tracking-widest text-white/30 font-mono">
          Active Deals
        </h2>

        <div className="grid gap-4 md:grid-cols-3">
          {MOCK_DEALS.map((deal) => (
            <motion.div
              key={deal.id}
              variants={staggerItem}
              className="wireframe-card p-5 rounded-2xl space-y-4 hover:border-gold/20 transition-colors"
            >
              {/* Address */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <MapPin size={12} className="text-gold/60" />
                  <h3 className="text-sm font-medium text-white">
                    {deal.address}
                  </h3>
                </div>
                <p className="text-[0.6rem] text-white/40 font-mono ml-5">
                  {deal.city}
                </p>
              </div>

              {/* Property placeholder */}
              <div className="h-28 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-center">
                <Building size={32} className="text-white/10" />
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[0.5rem] font-mono uppercase text-white/30">
                    ARV
                  </p>
                  <p className="text-sm font-display text-white">
                    {formatCurrency(deal.arv)}
                  </p>
                </div>
                <div>
                  <p className="text-[0.5rem] font-mono uppercase text-white/30">
                    Rehab
                  </p>
                  <p className="text-sm font-display text-white">
                    {formatCurrency(deal.rehab)}
                  </p>
                </div>
                <div>
                  <p className="text-[0.5rem] font-mono uppercase text-white/30">
                    Cash-on-Cash
                  </p>
                  <p className="text-sm font-display text-emerald-400">
                    {deal.cashOnCash}%
                  </p>
                </div>
                <div>
                  <p className="text-[0.5rem] font-mono uppercase text-white/30">
                    Asking
                  </p>
                  <p className="text-sm font-display text-white">
                    {formatCurrency(deal.askingPrice)}
                  </p>
                </div>
              </div>

              {/* Grades */}
              <div className="flex items-center justify-between pt-3 border-t border-white/5">
                <div className="flex items-center gap-3">
                  <div>
                    <span className="text-[0.5rem] font-mono text-white/30 uppercase">
                      OPM{" "}
                    </span>
                    <span
                      className={`text-xs font-display ${gradeColor(deal.opmScore)}`}
                    >
                      {deal.opmScore}
                    </span>
                  </div>
                  <div>
                    <span className="text-[0.5rem] font-mono text-white/30 uppercase">
                      Risk{" "}
                    </span>
                    <span
                      className={`text-xs font-display ${gradeColor(deal.riskGrade)}`}
                    >
                      {deal.riskGrade}
                    </span>
                  </div>
                </div>
                {deal.daysOnPlan > 0 && (
                  <div className="flex items-center gap-1">
                    <Calendar size={10} className="text-gold/40" />
                    <span className="text-[0.55rem] font-mono text-gold/60">
                      Day {deal.daysOnPlan}/90
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* OPM Education */}
      <motion.div
        variants={staggerItem}
        className="wireframe-card p-6 rounded-2xl"
      >
        <h2 className="text-xs uppercase tracking-widest text-gold/50 font-mono mb-4">
          OPM Funding Paths
        </h2>
        <div className="grid gap-4 md:grid-cols-3 text-xs text-white/40">
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <p className="text-white/60 font-medium mb-1 flex items-center gap-2">
              <DollarSign size={14} className="text-gold/60" />
              Hard Money Lender
            </p>
            <p>
              12–18 month bridge loans. Fast close (7–14 days). Higher rates
              offset by speed. Best for flips.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <p className="text-white/60 font-medium mb-1 flex items-center gap-2">
              <DollarSign size={14} className="text-gold/60" />
              Private Money
            </p>
            <p>
              Friends, family, local investors. Flexible terms. Relationship-driven.
              Best for buy-and-hold.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <p className="text-white/60 font-medium mb-1 flex items-center gap-2">
              <DollarSign size={14} className="text-gold/60" />
              Seller Financing
            </p>
            <p>
              Seller acts as the bank. Creative terms. No bank qualification.
              Best for unique properties.
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
