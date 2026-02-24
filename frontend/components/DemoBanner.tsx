// frontend/components/DemoBanner.tsx
"use client";

import { motion } from "framer-motion";
import { ExternalLink, Radio } from "lucide-react";

export function DemoBanner() {
  const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
  if (!isDemo) return null;

  return (
    <motion.div
      className="fixed top-0 inset-x-0 z-50 flex items-center justify-center gap-4 border-b border-amber-500/20 bg-[#09090B]/90 px-4 py-2 backdrop-blur-xl"
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-400">
        Demo Mode
      </span>
      <span className="text-xs text-zinc-500">
        You&apos;re exploring a sandbox version of A.I.M.S.
      </span>

      {/* Live indicator */}
      <span className="hidden items-center gap-1.5 text-[10px] font-mono text-slate-400 md:flex">
        <Radio className="h-3 w-3 text-amber-500" />
        SANDBOX
      </span>

      {/* Sign-up CTA */}
      <a
        href="https://plugmein.cloud/sign-in"
        className="flex items-center gap-1.5 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400 transition hover:bg-amber-500/20"
      >
        Get full access
        <ExternalLink size={12} />
      </a>
    </motion.div>
  );
}
