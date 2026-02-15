"use client";

/**
 * Moment Studio — "Turn Days Into Stories"
 *
 * Speak a quick recap and ACHEEVY + Story_Ang turn it
 * into a private audio diary with chapters and reflections.
 *
 * Artifact: Audio diary with chapters + text summary
 */

import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/motion/variants";
import { Mic, BookOpen, Play, Save, Share2, RotateCcw } from "lucide-react";

export default function MomentStudioPage() {
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
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-400/10 border border-violet-400/20 text-violet-400">
            <BookOpen size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-display text-white tracking-tight">
              Moment Studio
            </h1>
            <p className="text-xs text-violet-400/60 font-mono">
              Turn Days Into Stories
            </p>
          </div>
        </div>
        <p className="text-sm text-white/40 max-w-lg">
          Speak a quick recap of your day. Story_Ang turns it into a private
          audio diary with chapter titles and gentle reflections. Your stories,
          your space.
        </p>
      </motion.header>

      {/* Voice entry */}
      <motion.div
        variants={staggerItem}
        className="flex flex-col items-center gap-6 py-8"
      >
        <button
          type="button"
          className="relative flex h-20 w-20 items-center justify-center rounded-full bg-violet-400/10 border-2 border-violet-400/30 text-violet-400 hover:bg-violet-400/20 transition-colors"
        >
          <Mic size={32} />
        </button>
        <p className="text-sm text-white/40">
          &quot;Here&apos;s what happened today...&quot;
        </p>
      </motion.div>

      {/* Starters */}
      <motion.div variants={staggerItem} className="space-y-3">
        <p className="text-xs text-white/20 font-mono uppercase tracking-widest">
          Or start with a prompt
        </p>
        <div className="grid gap-2 md:grid-cols-2">
          {[
            "Here's what happened today",
            "I had the strangest morning",
            "Something good happened",
            "I need to process this",
          ].map((s) => (
            <button
              key={s}
              type="button"
              className="text-left px-4 py-3 rounded-xl border border-white/5 bg-white/[0.02] text-sm text-white/50 hover:text-violet-400 hover:border-violet-400/20 transition-colors"
            >
              &quot;{s}&quot;
            </button>
          ))}
        </div>
      </motion.div>

      {/* Sample diary entry */}
      <motion.div
        variants={staggerItem}
        className="wireframe-card p-6 rounded-2xl space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xs uppercase tracking-widest text-violet-400/50 font-mono">
            Sample Entry — Feb 14, 2026
          </h2>
          <span className="text-[0.55rem] font-mono text-white/20">
            7:15 total
          </span>
        </div>

        {/* Audio player */}
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-400/10 border border-violet-400/20 text-violet-400"
            >
              <Play size={16} />
            </button>
            <div className="flex-1">
              <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                <div className="h-full w-[48%] rounded-full bg-gradient-to-r from-violet-400/60 to-violet-400" />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[0.5rem] font-mono text-white/30">
                  3:42
                </span>
                <span className="text-[0.5rem] font-mono text-white/30">
                  7:15
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Chapters */}
        <div className="space-y-1">
          <p className="text-[0.6rem] font-mono uppercase tracking-widest text-white/20 mb-2">
            Chapters
          </p>
          {[
            { time: "0:00", title: "Morning", subtitle: "A surprising start" },
            { time: "1:22", title: "Midday", subtitle: "The unexpected call" },
            { time: "3:45", title: "Evening", subtitle: "Finding peace" },
          ].map((ch) => (
            <button
              key={ch.time}
              type="button"
              className="flex items-center gap-3 w-full text-left px-3 py-2 rounded-lg hover:bg-white/[0.03] transition-colors"
            >
              <span className="text-[0.55rem] font-mono text-violet-400/60 w-8">
                {ch.time}
              </span>
              <span className="text-xs text-white/60">{ch.title}</span>
              <span className="text-[0.55rem] text-white/25">
                — &quot;{ch.subtitle}&quot;
              </span>
            </button>
          ))}
        </div>

        {/* Reflections */}
        <div className="p-4 rounded-xl bg-violet-400/5 border border-violet-400/10">
          <p className="text-[0.55rem] text-violet-400/60 font-mono uppercase mb-2">
            Story_Ang Reflections
          </p>
          <p className="text-xs text-white/50 italic leading-relaxed">
            &quot;Today had an undercurrent of anticipation. The morning
            surprise set the tone — a reminder that good things arrive without
            announcement. The call at midday shifted everything sideways, but
            by evening, there was a settling. Sometimes the best stories are
            the ones that don&apos;t resolve neatly.&quot;
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            type="button"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-400/10 border border-violet-400/20 text-xs text-violet-400 hover:bg-violet-400/20 transition-colors"
          >
            <Save size={12} />
            Save to Diary
          </button>
          <button
            type="button"
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-xs text-white/40 hover:text-white hover:border-white/20 transition-colors"
          >
            <Share2 size={12} />
            Share with Someone
          </button>
          <button
            type="button"
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-xs text-white/40 hover:text-white hover:border-white/20 transition-colors"
          >
            <RotateCcw size={12} />
            Redo
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
