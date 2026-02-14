"use client";

/**
 * Verticals Sandbox — Other Autonomous Projects
 *
 * Showcase for Veritas and upcoming verticals.
 * Each vertical follows the same autonomous pattern:
 * own agents, own pipeline, own Docker services.
 */

import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/motion/variants";
import { Shield, Users, FileSearch, Video, Mic, CheckCircle, AlertTriangle, XCircle } from "lucide-react";

export default function VerticalsSandbox() {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="max-w-5xl mx-auto px-6 py-10 space-y-10"
    >
      {/* Hero */}
      <motion.header variants={staggerItem} className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-400/10 border border-blue-400/20 text-blue-400">
            <Shield size={20} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-display text-white tracking-tight">
              Veritas
            </h1>
            <p className="text-xs text-blue-400/60 font-mono">
              Business Plan Fact-Checking
            </p>
          </div>
        </div>
        <p className="text-sm text-white/40 max-w-xl">
          Upload a pitch deck or business plan. Veritas extracts every claim,
          cross-references multiple sources, and delivers a confidence-scored
          fact-check report. Caught a $180M error in its first case study.
        </p>
      </motion.header>

      {/* Voice entry */}
      <motion.div
        variants={staggerItem}
        className="wireframe-card p-6 rounded-2xl flex items-center gap-4"
      >
        <button
          type="button"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-400/10 border-2 border-blue-400/30 text-blue-400 hover:bg-blue-400/20 transition-colors"
        >
          <Mic size={24} />
        </button>
        <div>
          <p className="text-sm text-white/70">
            &quot;Check the claims in my Series A deck&quot;
          </p>
          <p className="text-[0.55rem] text-white/30 font-mono uppercase tracking-wider">
            Upload a document or describe your plan
          </p>
        </div>
      </motion.div>

      {/* Mock report */}
      <motion.div variants={staggerItem} className="wireframe-card p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs uppercase tracking-widest text-blue-400/50 font-mono">
            Sample Report — Series A Pitch Deck
          </h2>
          <span className="px-3 py-1 rounded-full text-[0.55rem] font-mono uppercase bg-blue-400/10 text-blue-400 border border-blue-400/20">
            78% Confidence
          </span>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-400/5 border border-emerald-400/10">
            <CheckCircle size={20} className="text-emerald-400 shrink-0" />
            <div>
              <p className="text-sm font-display text-emerald-400">18</p>
              <p className="text-[0.55rem] font-mono text-white/40 uppercase">
                Verified
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-400/5 border border-amber-400/10">
            <AlertTriangle size={20} className="text-amber-400 shrink-0" />
            <div>
              <p className="text-sm font-display text-amber-400">4</p>
              <p className="text-[0.55rem] font-mono text-white/40 uppercase">
                Needs Source
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-xl bg-red-400/5 border border-red-400/10">
            <XCircle size={20} className="text-red-400 shrink-0" />
            <div>
              <p className="text-sm font-display text-red-400">2</p>
              <p className="text-[0.55rem] font-mono text-white/40 uppercase">
                Contradicted
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="p-3 rounded-lg bg-amber-400/5 border border-amber-400/10 text-xs">
            <span className="text-amber-400 font-mono">CLAIM:</span>{" "}
            <span className="text-white/50">
              &quot;TAM of $4.2B&quot; — Best available source says $2.8B
              (Gartner 2025). May be conflating TAM with SAM.
            </span>
          </div>
          <div className="p-3 rounded-lg bg-red-400/5 border border-red-400/10 text-xs">
            <span className="text-red-400 font-mono">CLAIM:</span>{" "}
            <span className="text-white/50">
              &quot;No competitors in market&quot; — Found 3 direct competitors
              (CompanyA, CompanyB, CompanyC) with combined $12M in funding.
            </span>
          </div>
        </div>
      </motion.div>

      {/* Coming Soon Verticals */}
      <motion.section variants={staggerContainer} className="space-y-4">
        <h2 className="text-xs uppercase tracking-widest text-amber-400/60 font-mono">
          Coming Soon
        </h2>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              name: "Strategos",
              tagline: "Census-Backed Customer Personas",
              desc: "Build target customer profiles from real census data, market trends, and behavioral patterns. Know your audience before you launch.",
              icon: Users,
            },
            {
              name: "Grant Scout",
              tagline: "Government Contracts & Grants",
              desc: "Match your business to federal, state, and local funding opportunities. SAM.gov integration. Compliance pre-check included.",
              icon: FileSearch,
            },
            {
              name: "Content Engine",
              tagline: "Video → Multi-Platform Clips",
              desc: "Upload one long video. Get clips optimized for TikTok, YouTube Shorts, Instagram Reels, and LinkedIn. AAVE support built in.",
              icon: Video,
            },
          ].map((v) => (
            <motion.div
              key={v.name}
              variants={staggerItem}
              className="wireframe-card p-5 rounded-2xl opacity-60"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 border border-white/10 text-white/30">
                  <v.icon size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-white/60">
                    {v.name}
                  </h3>
                  <p className="text-[0.55rem] font-mono text-white/30">
                    {v.tagline}
                  </p>
                </div>
              </div>
              <p className="text-xs text-white/30">{v.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>
    </motion.div>
  );
}
