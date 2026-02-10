// frontend/components/GlobalNav.tsx
"use client";

import React from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Home, ArrowLeft } from "lucide-react";

export function GlobalNav() {
  const router = useRouter();
  const pathname = usePathname();

  // Don't show on pure landing pages if preferred, but user said "ON EVERY page shown in this walkthrough"
  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] px-4 py-3 flex items-center justify-between pointer-events-none">
      <div className="flex items-center gap-4 pointer-events-auto">
        {/* ACHEEVY Helmet Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gold to-gold flex items-center justify-center text-xl shadow-[0_0_15px_rgba(251,191,36,0.5)] transition-transform group-hover:scale-110">
            🛡️
          </div>
        </Link>

        <div className="h-6 w-px bg-white/10 mx-2" />

        {/* Home Button */}
        <Link 
          href="/" 
          className="flex items-center gap-2 px-4 py-2 rounded-full border border-wireframe-stroke bg-black/40 backdrop-blur-md text-white/70 hover:text-white hover:border-gold/30 transition-all text-xs font-semibold uppercase tracking-widest"
        >
          <Home size={14} />
          <span>Home</span>
        </Link>
        
        {/* Back Button */}
        <button 
          onClick={() => router.back()}
          disabled={pathname === "/"}
          className={`flex items-center gap-2 px-4 py-2 rounded-full border border-wireframe-stroke bg-black/40 backdrop-blur-md text-xs font-semibold uppercase tracking-widest transition-all ${
            pathname === "/" 
              ? "opacity-50 cursor-not-allowed text-white/20" 
              : "text-white/70 hover:text-white hover:border-gold/30"
          }`}
        >
          <ArrowLeft size={14} />
          <span>Back</span>
        </button>
      </div>

      <div className="pointer-events-auto">
         {/* Account Placeholder */}
         <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-xs border border-white/20">
            👤
         </div>
      </div>
    </nav>
  );
}
