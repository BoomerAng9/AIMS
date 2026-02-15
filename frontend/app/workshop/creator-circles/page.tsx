"use client";

/**
 * Creator Circles — "Small Group Collab"
 *
 * Host 3–5 person sessions with a Boomer_Ang facilitator.
 * AI keeps time, captures ideas, and turns the session
 * into a clean artifact (plan, script, checklist).
 *
 * Artifact: Plan / Script / Checklist / Storyboard
 */

import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/motion/variants";
import { Mic, CircleDot, Users, Clock, Plus, Smile, Flame, Heart } from "lucide-react";

const FACILITATORS = [
  {
    name: "Chill Coach",
    emoji: "😌",
    icon: Heart,
    vibe: "Gentle, affirming — all ideas are welcome",
    accent: "border-cyan-400/20 bg-cyan-400/5 text-cyan-400",
  },
  {
    name: "Tough Love",
    emoji: "💪",
    icon: Flame,
    vibe: "Direct, pushes for specifics — what's the real plan?",
    accent: "border-red-400/20 bg-red-400/5 text-red-400",
  },
  {
    name: "Hype Friend",
    emoji: "🎉",
    icon: Smile,
    vibe: "Energetic, celebrates ideas — yes AND...",
    accent: "border-gold/20 bg-gold/5 text-gold",
  },
];

const SESSION_TYPES = [
  "Co-write a song",
  "Outline a podcast",
  "Storyboard a short film",
  "Plan a local event",
  "Brainstorm a business idea",
  "Design a product",
];

export default function CreatorCirclesPage() {
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
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10 border border-gold/20 text-gold">
            <CircleDot size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-display text-white tracking-tight">
              Creator Circles
            </h1>
            <p className="text-xs text-gold/60 font-mono">
              Small Group Collab
            </p>
          </div>
        </div>
        <p className="text-sm text-white/40 max-w-lg">
          Host 3–5 person creative sessions with a Boomer_Ang facilitator who
          keeps time, captures ideas, and produces the artifact. AI is the
          quiet producer in the room, not the star.
        </p>
      </motion.header>

      {/* Facilitator selection */}
      <motion.section variants={staggerItem} className="space-y-4">
        <h2 className="text-xs uppercase tracking-widest text-white/30 font-mono">
          Choose Your Facilitator
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {FACILITATORS.map((f) => (
            <button
              key={f.name}
              type="button"
              className={`text-left p-5 rounded-2xl border ${f.accent} hover:scale-[1.02] transition-transform`}
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{f.emoji}</span>
                <span className="text-sm font-medium text-white">
                  {f.name}
                </span>
              </div>
              <p className="text-xs text-white/40">{f.vibe}</p>
            </button>
          ))}
        </div>
      </motion.section>

      {/* Session types */}
      <motion.section variants={staggerItem} className="space-y-4">
        <h2 className="text-xs uppercase tracking-widest text-white/30 font-mono">
          What Are We Making?
        </h2>
        <div className="flex flex-wrap gap-2">
          {SESSION_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              className="px-4 py-2 rounded-xl border border-white/5 bg-white/[0.02] text-xs text-white/50 hover:text-gold hover:border-gold/20 transition-colors"
            >
              {t}
            </button>
          ))}
        </div>
      </motion.section>

      {/* Circle lobby preview */}
      <motion.div
        variants={staggerItem}
        className="wireframe-card p-6 rounded-2xl space-y-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xs uppercase tracking-widest text-gold/50 font-mono">
            Circle Lobby — Preview
          </h2>
          <div className="flex items-center gap-2">
            <Clock size={12} className="text-white/30" />
            <span className="text-[0.55rem] font-mono text-white/30">
              25 min session
            </span>
          </div>
        </div>

        {/* Participants */}
        <div className="flex items-center gap-4">
          {[
            { name: "You", role: "Host", active: true },
            { name: "Alex", role: "Member", active: true },
            { name: "Sam", role: "Member", active: true },
          ].map((p) => (
            <div key={p.name} className="text-center">
              <div
                className={`relative h-14 w-14 rounded-full border flex items-center justify-center ${
                  p.active
                    ? "bg-white/5 border-white/10"
                    : "bg-white/[0.02] border-white/5"
                }`}
              >
                <Users size={20} className="text-white/30" />
                {p.active && (
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 border-2 border-[#0A0A0A]" />
                )}
              </div>
              <p className="text-[0.6rem] text-white/50 mt-1">{p.name}</p>
              <p className="text-[0.5rem] text-white/20">{p.role}</p>
            </div>
          ))}

          {/* Invite slot */}
          <button
            type="button"
            className="text-center"
          >
            <div className="h-14 w-14 rounded-full border border-dashed border-white/10 flex items-center justify-center hover:border-gold/30 transition-colors">
              <Plus size={16} className="text-white/20" />
            </div>
            <p className="text-[0.6rem] text-white/30 mt-1">Invite</p>
          </button>
        </div>

        {/* Progress bar */}
        <div>
          <div className="h-2 rounded-full bg-white/5 overflow-hidden">
            <div className="h-full w-[48%] rounded-full bg-gradient-to-r from-gold/60 to-gold" />
          </div>
          <p className="text-[0.55rem] font-mono text-white/30 mt-1">
            12:30 remaining
          </p>
        </div>

        {/* Live ideas */}
        <div className="space-y-2">
          <p className="text-[0.6rem] font-mono uppercase tracking-widest text-white/20">
            Live Ideas
          </p>
          {[
            "Open with a listener question",
            "Interview format, 3 segments",
            'End with weekly challenge',
          ].map((idea, i) => (
            <div
              key={idea}
              className="flex items-start gap-3 px-3 py-2 rounded-lg bg-white/[0.02]"
            >
              <span className="text-[0.55rem] font-mono text-gold/40 mt-0.5">
                {i + 1}.
              </span>
              <span className="text-xs text-white/50">&quot;{idea}&quot;</span>
            </div>
          ))}
          <div className="px-3 py-2 rounded-lg bg-gold/5 border border-gold/10">
            <p className="text-xs text-gold/60">
              <span className="font-mono text-[0.55rem]">Hype Friend:</span>{" "}
              &quot;Love #2 — who&apos;s the first guest?&quot;
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-2">
          <button
            type="button"
            className="px-4 py-2 rounded-xl bg-gold text-black text-xs font-medium hover:bg-gold-light transition-colors"
          >
            Start Circle
          </button>
          <button
            type="button"
            className="px-4 py-2 rounded-xl border border-white/10 text-xs text-white/40 hover:text-white hover:border-white/20 transition-colors"
          >
            Add 10 min
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
