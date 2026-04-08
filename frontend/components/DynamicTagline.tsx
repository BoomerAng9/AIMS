"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const VERBS = [
  "manage",
  "build",
  "deploy",
  "run",
  "scale",
  "monitor",
  "automate",
  "orchestrate",
  "ship",
  "secure",
  "optimize",
  "launch",
] as const;

type Props = {
  /** Override the rotating verb with a fixed one */
  verb?: string;
  /** Cycle interval in ms (default 3000) */
  interval?: number;
  /** Compact mode for tight spaces */
  compact?: boolean;
};

export function DynamicTagline({ verb, interval = 3000, compact = false }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (verb) return; // fixed verb — no rotation
    const timer = setInterval(() => {
      setCurrentIndex((i) => (i + 1) % VERBS.length);
    }, interval);
    return () => clearInterval(timer);
  }, [verb, interval]);

  const activeVerb = verb ?? VERBS[currentIndex];

  if (compact) {
    return (
      <p className="font-marker text-xs text-slate-400 tracking-wider">
        Think it. Prompt it. Let ACHEEVY{" "}
        <span className="relative inline-block min-w-[6ch] text-amber-600">
          <AnimatePresence mode="wait">
            <motion.span
              key={activeVerb}
              className="inline-block"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              {activeVerb}
            </motion.span>
          </AnimatePresence>
        </span>{" "}
        it.
      </p>
    );
  }

  return (
    <div className="relative overflow-hidden wireframe-card px-6 py-4">
      {/* Soft animated gradient background */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-amber-50/60 via-transparent to-amber-50/60 pointer-events-none"
        animate={{ opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />

      <p className="relative font-marker text-sm md:text-base text-slate-500 tracking-wide text-center">
        Think it. Prompt it.
      </p>
      <p className="relative font-marker text-lg md:text-xl text-center mt-1 tracking-wide">
        <span className="text-slate-500">Let </span>
        <span className="text-amber-600">ACHEEVY</span>
        <span className="text-slate-500"> </span>
        <span className="inline-flex min-w-[7ch] justify-start text-amber-500">
          <AnimatePresence mode="wait">
            <motion.span
              key={activeVerb}
              className="inline-block"
              initial={{ opacity: 0, y: 10, filter: "blur(3px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -10, filter: "blur(3px)" }}
              transition={{
                duration: 0.35,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
            >
              {activeVerb}
            </motion.span>
          </AnimatePresence>
        </span>
        <span className="text-slate-500"> it.</span>
      </p>
    </div>
  );
}
