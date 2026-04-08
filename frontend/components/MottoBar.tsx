"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const MOTTOS = [
  "Activity breeds Activity.",
  "Think it. Prompt it. Achieve it.",
  "AI Managed Solutions.",
  "No proof, no done.",
  "Every task earns evidence.",
  "Autonomy with accountability.",
  "Manage services, not servers.",
  "The platform that runs itself.",
  "Deploy. Monitor. Scale. Repeat.",
  "Autonomous by design, human by choice.",
  "One prompt away from production.",
  "Let ACHEEVY handle the rest.",
] as const;

type Props = {
  /** Position: fixed bottom bar or inline */
  position?: "fixed" | "inline";
  /** Cycle interval in ms (default 5000) */
  interval?: number;
};

export function MottoBar({ position = "inline", interval = 5000 }: Props) {
  const [index, setIndex] = useState(0);

  const advance = useCallback(() => {
    setIndex((prev) => (prev + 1) % MOTTOS.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(advance, interval);
    return () => clearInterval(timer);
  }, [advance, interval]);

  const base =
    "text-center text-[0.65rem] uppercase tracking-[0.35em] text-amber-600/30 select-none font-display";

  if (position === "fixed") {
    return (
      <div
        className={`absolute bottom-0 left-0 right-0 z-10 py-2 bg-gradient-to-t from-white/80 to-transparent pointer-events-none ${base}`}
      >
        <div className="relative h-4 overflow-hidden flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.span
              key={index}
              initial={{ opacity: 0, y: 6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="absolute whitespace-nowrap"
            >
              {MOTTOS[index]}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>
    );
  }

  return (
    <div className={`py-3 ${base}`}>
      <span className="inline-block border-t border-b border-amber-200/40 py-2 px-6">
        <div className="relative h-4 overflow-hidden flex items-center justify-center min-w-[18rem]">
          <AnimatePresence mode="wait">
            <motion.span
              key={index}
              initial={{ opacity: 0, filter: "blur(4px)", scale: 0.96 }}
              animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
              exit={{ opacity: 0, filter: "blur(4px)", scale: 0.96 }}
              transition={{ duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="absolute whitespace-nowrap"
            >
              {MOTTOS[index]}
            </motion.span>
          </AnimatePresence>
        </div>
      </span>
    </div>
  );
}
