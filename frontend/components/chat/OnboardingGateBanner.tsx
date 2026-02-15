// frontend/components/chat/OnboardingGateBanner.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Info } from "lucide-react";

export function OnboardingGateBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const isComplete = localStorage.getItem("aims_onboarding_complete") === "true";
    setIsVisible(!isComplete);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="mb-6 mx-6 md:mx-8 animate-in slide-in-from-top-4 duration-700">
      <div className="relative overflow-hidden rounded-[24px] border border-gold/20 bg-gradient-to-r from-gold/20 to-black p-0.5 shadow-lg">
        <div className="flex flex-col md:flex-row items-center justify-between rounded-[23px] bg-black/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 text-gold">
              <Info size={20} />
            </div>
            <div className="text-center md:text-left">
              <h3 className="text-sm font-semibold text-white">Strategic Onboarding Required</h3>
              <p className="text-[11px] text-white/50 leading-tight">
                ACHEEVY needs your business goal and LUC mission profile before execution.
              </p>
            </div>
          </div>
          <Link 
            href="/onboarding/profile" 
            className="mt-3 md:mt-0 flex items-center gap-2 rounded-full bg-gold px-5 py-2 text-[11px] font-bold text-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(251,191,36,0.3)]"
          >
            Continue Onboarding <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
