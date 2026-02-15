// frontend/components/DemoBanner.tsx
"use client";

import { ExternalLink } from "lucide-react";

export function DemoBanner() {
  const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
  if (!isDemo) return null;

  return (
    <div className="fixed top-0 inset-x-0 z-50 flex items-center justify-center gap-4 border-b border-gold/20 bg-black/80 px-4 py-2 backdrop-blur-xl">
      <span className="rounded-full border border-gold/30 bg-gold/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gold">
        Demo Mode
      </span>
      <span className="text-xs text-white/50">
        You&apos;re exploring a sandbox version of A.I.M.S.
      </span>
      <a
        href="https://plugmein.cloud/sign-in"
        className="flex items-center gap-1.5 rounded-lg border border-gold/20 bg-gold/10 px-3 py-1 text-xs font-semibold text-gold transition hover:bg-gold/20"
      >
        Sign up for full access
        <ExternalLink size={12} />
      </a>
    </div>
  );
}
