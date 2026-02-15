"use client";

/**
 * Workshop Hub — "Ask · Play · Build Together"
 *
 * The main experience hub for plugmein.cloud.
 * Voice-first companion flows. No blank text boxes.
 * Always starts with conversation starters.
 */

import Link from "next/link";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/motion/variants";
import {
  Mic,
  MessageCircle,
  Gamepad2,
  Users,
  ArrowRight,
  Theater,
  BookOpen,
  Coins,
  CircleDot,
} from "lucide-react";

const FLOWS = [
  {
    slug: "life-scenes",
    name: "Life Scenes",
    tagline: "Rehearse Tomorrow",
    description:
      "Practice hard conversations before they happen. A Boomer_Ang plays the other person, suggests lines, and builds you a confidence checklist.",
    icon: Theater,
    accent: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
    examples: [
      "Hard talk with my boss",
      "Setting a boundary",
      "Salary negotiation",
      "Saying no without guilt",
    ],
  },
  {
    slug: "moment-studio",
    name: "Moment Studio",
    tagline: "Turn Days Into Stories",
    description:
      "Speak a quick recap of your day. ACHEEVY + a Story Boomer_Ang turn it into a private audio diary with chapters and gentle reflections.",
    icon: BookOpen,
    accent: "text-violet-400 bg-violet-400/10 border-violet-400/20",
    examples: [
      "Here's what happened today",
      "I had the strangest morning",
      "Something good happened",
      "I need to process this",
    ],
  },
  {
    slug: "money-moves",
    name: "Money Moves Monday",
    tagline: "15-Minute Weekly Companion",
    description:
      "A Finance Boomer_Ang checks in weekly: spending review, money wins, and one small action to improve next week. Not a scary dashboard.",
    icon: Coins,
    accent: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
    examples: [
      "Let's do my weekly check-in",
      "How much did I spend on food?",
      "Any subscriptions I should cancel?",
      "One thing to save money this week",
    ],
  },
  {
    slug: "creator-circles",
    name: "Creator Circles",
    tagline: "Small Group Collab",
    description:
      "Host 3–5 person creative sessions with a Boomer_Ang facilitator. Co-write, outline, storyboard, or plan. AI keeps time and produces the artifact.",
    icon: CircleDot,
    accent: "text-gold bg-gold/10 border-gold/20",
    examples: [
      "Co-write a song",
      "Outline a podcast",
      "Storyboard a short film",
      "Plan a local event",
    ],
  },
];

export default function WorkshopHub() {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="max-w-5xl mx-auto px-6 py-12 space-y-16"
    >
      {/* Hero */}
      <motion.header
        variants={staggerItem}
        className="text-center space-y-6"
      >
        {/* VoiceOrb */}
        <div className="flex justify-center">
          <button
            type="button"
            className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gold/10 border-2 border-gold/30 text-gold hover:bg-gold/20 transition-colors animate-pulse-gold"
          >
            <Mic size={32} />
            <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-emerald-400 border-2 border-[#0A0A0A]">
              <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-40" />
            </span>
          </button>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-display text-white tracking-tight">
            The Workshop
          </h1>
          <p className="text-sm text-white/40 max-w-md mx-auto">
            Voice-first companions. Say what&apos;s on your mind and leave with
            something real.
          </p>
        </div>

        {/* Three verbs */}
        <div className="flex flex-wrap justify-center gap-4">
          {[
            { icon: MessageCircle, verb: "Ask", desc: "Talk it out" },
            { icon: Gamepad2, verb: "Play", desc: "Try something" },
            { icon: Users, verb: "Build Together", desc: "Co-create" },
          ].map((v) => (
            <div
              key={v.verb}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/5 bg-white/[0.02]"
            >
              <v.icon size={14} className="text-gold/60" />
              <span className="text-xs text-white/60 font-medium">
                {v.verb}
              </span>
              <span className="text-[0.55rem] text-white/25">
                — {v.desc}
              </span>
            </div>
          ))}
        </div>
      </motion.header>

      {/* Flows */}
      <motion.section variants={staggerContainer} className="space-y-6">
        {FLOWS.map((flow) => (
          <motion.div key={flow.slug} variants={staggerItem}>
            <Link
              href={`/workshop/${flow.slug}`}
              className="group block wireframe-card p-6 rounded-2xl hover:border-gold/20 transition-all"
            >
              <div className="flex flex-col md:flex-row md:items-start gap-6">
                {/* Icon + title */}
                <div className="shrink-0">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl border ${flow.accent}`}
                  >
                    <flow.icon size={24} />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 space-y-3">
                  <div>
                    <h3 className="text-base font-medium text-white group-hover:text-gold transition-colors">
                      {flow.name}
                    </h3>
                    <p className="text-xs text-gold/50 font-mono">
                      {flow.tagline}
                    </p>
                  </div>
                  <p className="text-sm text-white/40 leading-relaxed">
                    {flow.description}
                  </p>

                  {/* Example starters */}
                  <div className="flex flex-wrap gap-2">
                    {flow.examples.map((ex) => (
                      <span
                        key={ex}
                        className="px-3 py-1 rounded-full text-[0.6rem] font-mono bg-white/[0.03] border border-white/5 text-white/30"
                      >
                        &quot;{ex}&quot;
                      </span>
                    ))}
                  </div>
                </div>

                {/* Arrow */}
                <div className="hidden md:flex items-center self-center opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                  <ArrowRight size={16} className="text-gold/40" />
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.section>

      {/* Companion note */}
      <motion.div
        variants={staggerItem}
        className="text-center py-8 border-t border-white/5"
      >
        <p className="text-xs text-white/20 max-w-sm mx-auto">
          Your Boomer_Angs are companions, not replacements. Every flow is
          designed to make real life feel lighter, not weirder.
        </p>
      </motion.div>
    </motion.div>
  );
}
