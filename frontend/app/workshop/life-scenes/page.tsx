"use client";

/**
 * Life Scenes — "Rehearse Tomorrow"
 *
 * Voice space where you practice real-life conversations
 * before they happen. A Boomer_Ang plays the other person,
 * suggests lines, and builds a confidence checklist.
 *
 * Artifact: Script PDF + Confidence Checklist
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/motion/variants";
import { Mic, Play, Pause, SkipForward, X, Theater } from "lucide-react";

const STARTERS = [
  "I have a hard talk with my boss tomorrow",
  "I need to set a boundary with someone",
  "I want to negotiate my salary",
  "I need to practice saying no",
  "I have a difficult conversation with my partner",
];

type SessionState = "idle" | "setup" | "rehearsal" | "coaching" | "wrapup";

export default function LifeScenesPage() {
  const [session, setSession] = useState<SessionState>("idle");

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
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 border border-cyan-400/20 text-cyan-400">
            <Theater size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-display text-white tracking-tight">
              Life Scenes
            </h1>
            <p className="text-xs text-cyan-400/60 font-mono">
              Rehearse Tomorrow
            </p>
          </div>
        </div>
        <p className="text-sm text-white/40 max-w-lg">
          Practice hard conversations before they happen. Your Coach_Ang plays
          the other person, gives you feedback, and builds a confidence
          checklist when you&apos;re done.
        </p>
      </motion.header>

      {session === "idle" && (
        <>
          {/* Voice entry */}
          <motion.div
            variants={staggerItem}
            className="flex flex-col items-center gap-6 py-8"
          >
            <button
              type="button"
              onClick={() => setSession("setup")}
              className="relative flex h-20 w-20 items-center justify-center rounded-full bg-cyan-400/10 border-2 border-cyan-400/30 text-cyan-400 hover:bg-cyan-400/20 transition-colors"
            >
              <Mic size={32} />
            </button>
            <p className="text-sm text-white/40">
              Press and hold to describe what you need to practice
            </p>
          </motion.div>

          {/* Starters */}
          <motion.div variants={staggerItem} className="space-y-3">
            <p className="text-xs text-white/20 font-mono uppercase tracking-widest">
              Or start with one of these
            </p>
            <div className="space-y-2">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSession("setup")}
                  className="block w-full text-left px-4 py-3 rounded-xl border border-white/5 bg-white/[0.02] text-sm text-white/50 hover:text-gold hover:border-gold/20 transition-colors"
                >
                  &quot;{s}&quot;
                </button>
              ))}
            </div>
          </motion.div>
        </>
      )}

      {session === "setup" && (
        <motion.div
          variants={staggerItem}
          initial="hidden"
          animate="visible"
          className="wireframe-card p-6 rounded-2xl space-y-6"
        >
          <h2 className="text-sm font-medium text-white">
            Setting the Scene
          </h2>
          <p className="text-xs text-white/40">
            Coach_Ang is listening. Describe who you need to talk to, what the
            conversation is about, and what&apos;s at stake.
          </p>

          {/* Active listening indicator */}
          <div className="flex items-center gap-3 py-4">
            <div className="h-3 w-3 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-xs text-cyan-400/80 font-mono">
              Coach_Ang is listening...
            </span>
          </div>

          {/* Simulated transcript */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 min-h-[100px]">
            <p className="text-xs text-white/30 italic">
              Your words will appear here as you speak...
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setSession("rehearsal")}
              className="px-4 py-2 rounded-xl bg-gold text-black text-sm font-medium hover:bg-gold-light transition-colors"
            >
              Start Rehearsal
            </button>
            <button
              type="button"
              onClick={() => setSession("idle")}
              className="px-4 py-2 rounded-xl border border-white/10 text-xs text-white/50 hover:text-white hover:border-white/20 transition-colors"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      )}

      {session === "rehearsal" && (
        <motion.div
          variants={staggerItem}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
          {/* Split view */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Your side */}
            <div className="wireframe-card p-5 rounded-2xl space-y-4">
              <p className="text-[0.6rem] font-mono uppercase tracking-widest text-white/30">
                You
              </p>
              <div className="flex justify-center py-4">
                <div className="h-16 w-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                  <Mic size={24} className="text-white/30" />
                </div>
              </div>
              <div className="h-6 rounded bg-white/[0.03] flex items-center px-2 gap-0.5">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-cyan-400/30 rounded-full"
                    style={{ height: `${Math.random() * 16 + 4}px` }}
                  />
                ))}
              </div>
              <div className="p-3 rounded-lg bg-white/[0.02] min-h-[60px]">
                <p className="text-xs text-white/40 italic">
                  Speak your part...
                </p>
              </div>
            </div>

            {/* Companion side */}
            <div className="wireframe-card p-5 rounded-2xl space-y-4">
              <p className="text-[0.6rem] font-mono uppercase tracking-widest text-cyan-400/50">
                Coach_Ang
              </p>
              <div className="flex justify-center py-4">
                <div className="h-16 w-16 rounded-full bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center animate-head-bob">
                  <span className="text-2xl">🎭</span>
                </div>
              </div>
              <div className="h-6 rounded bg-white/[0.03] flex items-center px-2 gap-0.5">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-gold/30 rounded-full"
                    style={{ height: `${Math.random() * 16 + 4}px` }}
                  />
                ))}
              </div>
              <div className="p-3 rounded-lg bg-cyan-400/5 min-h-[60px]">
                <p className="text-xs text-white/50">
                  &quot;I understand you want to talk about this. Tell me
                  more about what&apos;s been on your mind...&quot;
                </p>
              </div>
            </div>
          </div>

          {/* Coaching tip */}
          <div className="p-4 rounded-xl bg-gold/5 border border-gold/10">
            <p className="text-[0.55rem] text-gold/60 font-mono uppercase mb-1">
              Coach Tip
            </p>
            <p className="text-xs text-white/40">
              &quot;Great opening. Now state what you need clearly — use
              &apos;I need...&apos; not &apos;You should...&apos;&quot;
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/30 font-mono">
              Round 1 of 3
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                className="p-2 rounded-lg border border-white/10 text-white/40 hover:text-white transition-colors"
              >
                <Pause size={16} />
              </button>
              <button
                type="button"
                className="p-2 rounded-lg border border-white/10 text-white/40 hover:text-white transition-colors"
              >
                <SkipForward size={16} />
              </button>
              <button
                type="button"
                onClick={() => setSession("wrapup")}
                className="px-4 py-2 rounded-xl bg-gold text-black text-xs font-medium hover:bg-gold-light transition-colors"
              >
                End &amp; Generate Artifact
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {session === "wrapup" && (
        <motion.div
          variants={staggerItem}
          initial="hidden"
          animate="visible"
          className="wireframe-card p-6 rounded-2xl space-y-6"
        >
          <h2 className="text-sm font-medium text-white">
            Session Complete
          </h2>

          {/* Confidence check */}
          <div className="space-y-3">
            <p className="text-xs text-white/40">
              How ready do you feel? (1–5)
            </p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  className="h-10 w-10 rounded-xl border border-white/10 text-white/50 hover:border-gold/30 hover:text-gold transition-colors text-sm font-display"
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Artifact preview */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
            <p className="text-xs text-gold/60 font-mono uppercase">
              Your Artifact
            </p>
            <p className="text-sm text-white/60">
              Script PDF + Confidence Checklist
            </p>
            <ul className="text-xs text-white/40 space-y-1 ml-4 list-disc">
              <li>Opening script (3 versions)</li>
              <li>Key talking points</li>
              <li>Confidence checklist</li>
              <li>Suggested follow-up actions</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              className="px-4 py-2 rounded-xl bg-gold text-black text-sm font-medium hover:bg-gold-light transition-colors"
            >
              Download PDF
            </button>
            <button
              type="button"
              onClick={() => setSession("idle")}
              className="px-4 py-2 rounded-xl border border-white/10 text-xs text-white/50 hover:text-white hover:border-white/20 transition-colors"
            >
              Start New Session
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
