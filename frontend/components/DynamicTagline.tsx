"use client";

import { useState, useEffect } from "react";

const VERBS = ["manage", "build", "deploy", "run", "scale"] as const;

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
  const [fade, setFade] = useState(true);

  useEffect(() => {
    if (verb) return; // fixed verb — no rotation
    const timer = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setCurrentIndex((i) => (i + 1) % VERBS.length);
        setFade(true);
      }, 300);
    }, interval);
    return () => clearInterval(timer);
  }, [verb, interval]);

  const activeVerb = verb ?? VERBS[currentIndex];

  if (compact) {
    return (
      <p className="font-marker text-xs text-white/40 tracking-wider">
        Think it. Prompt it. Let ACHEEVY{" "}
        <span
          className={`inline-block text-gold/70 transition-opacity duration-300 ${
            fade ? "opacity-100" : "opacity-0"
          }`}
        >
          {activeVerb}
        </span>{" "}
        it.
      </p>
    );
  }

  return (
    <div className="relative overflow-hidden wireframe-card px-6 py-4">
      {/* Soft pulse glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-gold/[0.03] via-transparent to-gold/[0.03] animate-pulse pointer-events-none" />

      <p className="relative font-marker text-sm md:text-base text-white/70 tracking-wide text-center">
        Think it. Prompt it.
      </p>
      <p className="relative font-marker text-lg md:text-xl text-center mt-1 tracking-wide">
        <span className="text-white/60">Let </span>
        <span className="text-gold">ACHEEVY</span>
        <span className="text-white/60"> </span>
        <span
          className={`inline-block min-w-[5ch] text-gold-light transition-all duration-300 ${
            fade ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"
          }`}
        >
          {activeVerb}
        </span>
        <span className="text-white/60"> it.</span>
      </p>
    </div>
  );
}
