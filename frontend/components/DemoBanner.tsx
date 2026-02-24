// frontend/components/DemoBanner.tsx
"use client";

import { motion } from "framer-motion";
import { ExternalLink, Radio } from "lucide-react";

export function DemoBanner() {
  const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
  if (!isDemo) return null;

  return (
    <motion.div
      className="fixed top-0 inset-x-0 z-50 flex items-center justify-center gap-4 border-b border-amber-200/60 bg-white/90 px-4 py-2 backdrop-blur-xl shadow-sm"
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {/* Animated pulse indicator */}
      <span className="relative flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-700">
          Demo Mode
        </span>
      </span>

      {/* Separator dot */}
      <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:block" />

      {/* Description */}
      <span className="hidden text-xs text-slate-500 sm:inline">
        You&apos;re exploring a sandbox version of A.I.M.S. &mdash; some features are limited
      </span>

      {/* Live indicator */}
      <span className="hidden items-center gap-1.5 text-[10px] font-mono text-slate-400 md:flex">
        <Radio className="h-3 w-3 text-amber-500" />
        SANDBOX
      </span>

      {/* Sign-up CTA */}
      <a
        href="https://plugmein.cloud/sign-in"
        className="group flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 transition-all hover:bg-amber-100 hover:border-amber-300 hover:shadow-sm active:scale-[0.97]"
      >
        Get full access
        <ExternalLink
          size={12}
          className="transition-transform group-hover:translate-x-0.5"
        />
      </a>
    </motion.div>
  );
}
