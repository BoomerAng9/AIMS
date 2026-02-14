"use client";

/**
 * Money Moves Monday — "15-Minute Weekly Companion"
 *
 * Finance Boomer_Ang weekly check-in: spending review,
 * money wins, and one small action per week.
 *
 * Artifact: Action card
 */

import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/motion/variants";
import { Mic, Coins, TrendingUp, TrendingDown, Star, Bell } from "lucide-react";

export default function MoneyMovesPage() {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="max-w-4xl mx-auto px-6 py-10 space-y-8"
    >
      {/* Header */}
      <motion.header variants={staggerItem} className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/10 border border-emerald-400/20 text-emerald-400">
            <Coins size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-display text-white tracking-tight">
              Money Moves Monday
            </h1>
            <p className="text-xs text-emerald-400/60 font-mono">
              15-Minute Weekly Companion
            </p>
          </div>
        </div>
        <p className="text-sm text-white/40 max-w-lg">
          Money_Ang checks in every week. Quick spending review, celebrate
          wins, and one small action to move forward. Not a scary dashboard —
          just one tiny move.
        </p>
      </motion.header>

      {/* Voice entry */}
      <motion.div
        variants={staggerItem}
        className="flex flex-col items-center gap-6 py-6"
      >
        <button
          type="button"
          className="relative flex h-20 w-20 items-center justify-center rounded-full bg-emerald-400/10 border-2 border-emerald-400/30 text-emerald-400 hover:bg-emerald-400/20 transition-colors"
        >
          <Mic size={32} />
        </button>
        <p className="text-sm text-white/40">
          &quot;Let&apos;s do my 15-minute check-in&quot;
        </p>
      </motion.div>

      {/* Sample check-in */}
      <motion.div
        variants={staggerItem}
        className="wireframe-card p-6 rounded-2xl space-y-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xs uppercase tracking-widest text-emerald-400/50 font-mono">
            Week of Feb 10 — Sample Check-In
          </h2>
          <span className="px-2 py-0.5 rounded-full text-[0.5rem] font-mono bg-emerald-400/10 text-emerald-400 border border-emerald-400/20">
            4 week streak
          </span>
        </div>

        {/* Spending snapshot */}
        <div className="grid gap-3 md:grid-cols-3">
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <p className="text-[0.55rem] font-mono uppercase text-white/30 mb-1">
              Eating Out
            </p>
            <p className="text-xl font-display text-white">$127</p>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp size={10} className="text-red-400" />
              <span className="text-[0.55rem] font-mono text-red-400/80">
                +$32 vs last week
              </span>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <p className="text-[0.55rem] font-mono uppercase text-white/30 mb-1">
              Subscriptions
            </p>
            <p className="text-xl font-display text-white">$64</p>
            <div className="flex items-center gap-1 mt-1">
              <TrendingDown size={10} className="text-white/20" />
              <span className="text-[0.55rem] font-mono text-white/30">
                No change
              </span>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <p className="text-[0.55rem] font-mono uppercase text-white/30 mb-1">
              Groceries
            </p>
            <p className="text-xl font-display text-white">$89</p>
            <div className="flex items-center gap-1 mt-1">
              <TrendingDown size={10} className="text-emerald-400" />
              <span className="text-[0.55rem] font-mono text-emerald-400/80">
                -$15 vs last week
              </span>
            </div>
          </div>
        </div>

        {/* Win */}
        <div className="p-4 rounded-xl bg-emerald-400/5 border border-emerald-400/10">
          <p className="text-[0.55rem] text-emerald-400/60 font-mono uppercase mb-1">
            This Week&apos;s Win
          </p>
          <p className="text-sm text-white/60">
            &quot;Found a $15 refund from that subscription app!&quot;
          </p>
        </div>

        {/* One move */}
        <div className="p-5 rounded-xl bg-gold/5 border border-gold/15 space-y-3">
          <div className="flex items-center gap-2">
            <Star size={16} className="text-gold" />
            <p className="text-sm font-medium text-gold">
              Your One Move This Week
            </p>
          </div>
          <p className="text-sm text-white/60">
            &quot;Cancel your Hulu trial before Thursday — it auto-renews at
            $17.99&quot;
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              className="px-4 py-2 rounded-xl bg-gold text-black text-xs font-medium hover:bg-gold-light transition-colors"
            >
              I&apos;ll Do It
            </button>
            <button
              type="button"
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-xs text-white/40 hover:text-white hover:border-white/20 transition-colors"
            >
              <Bell size={12} />
              Remind Me Thursday
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
