// frontend/components/DemoBanner.tsx
"use client";

import { motion } from "framer-motion";
import { ExternalLink, Radio } from "lucide-react";

export function DemoBanner() {
  const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
  if (!isDemo) return null;

  return (
    <motion.div
      className="fixed top-0 inset-x-0 z-50 flex items-center justify-center gap-4 border-b border-violet-500/20 bg-[#09090B]/90 px-4 py-2 backdrop-blur-xl"
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {/* Status badge */}
      <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-violet-400">
        Demo Mode
      </span>

      {/* Description */}
      <span className="text-xs text-zinc-500">
        You&apos;re exploring a sandbox version of A.I.M.S.
      </span>

      {/* Live indicator */}
      <span className="hidden items-center gap-1.5 text-[10px] font-mono text-zinc-500 md:flex">
        <Radio className="h-3 w-3 text-violet-500" />
        SANDBOX
      </span>

      {/* Sign-up CTA */}
      <a
        href="https://plugmein.cloud/sign-in"
        className="group flex items-center gap-1.5 rounded-lg border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-400 transition hover:bg-violet-500/20"
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
