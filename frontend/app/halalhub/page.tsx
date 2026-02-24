"use client";

import BarakatBanner from "@/components/landing/BarakatBanner";
import HalalHubHero from "@/components/landing/HalalHubHero";
import CategoryShowcase from "@/components/landing/CategoryShowcase";
import TrustIndicators from "@/components/landing/TrustIndicators";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default function HalalHubLanding() {
    return (
        <main className="min-h-screen bg-[#0A0A0A] text-white flex flex-col font-sans selection:bg-[#D4AF37]/30 selection:text-white pb-32 relative">
            {/* Global scanline overlay toggleable (very faint) */}
            <div className="fixed inset-0 bg-[url('/assets/noise.png')] opacity-[0.03] pointer-events-none z-[999]" />
            <div className="fixed inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px] pointer-events-none z-[998]" />

            <BarakatBanner />

            {/* Glass Nav */}
            <nav className="sticky top-0 z-50 w-full bg-[#111111]/80 backdrop-blur-md border-b border-[rgba(255,255,255,0.08)]">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Image src="/assets/aims_logo.png" alt="AIMS" width={32} height={32} className="opacity-90" />
                        <div className="h-6 w-px bg-[rgba(255,255,255,0.1)]" />
                        <div className="text-xl font-black text-white tracking-widest uppercase">
                            Halal<span className="text-[#D4AF37]">Hub</span>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <Link href="/halalhub/login" className="text-sm font-medium text-[rgba(255,255,255,0.6)] hover:text-white flex items-center transition-colors">Log In</Link>
                        <Link href="/halalhub/shop" className="text-sm font-bold bg-[#D4AF37] text-[#0A0A0A] px-5 py-2 rounded-lg hover:bg-amber-400 flex items-center gap-1 transition-all shadow-[0_2px_8px_rgba(212,175,55,0.3)] hover:-translate-y-0.5">
                            Shop Now
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Main Content Sections */}
            <HalalHubHero />
            <CategoryShowcase />
            <TrustIndicators />

            {/* A.I.M.S. Platform Signature */}
            <footer className="mt-12 py-12 border-t border-[rgba(255,255,255,0.08)] bg-[#0A0A0A]">
                <div className="max-w-7xl mx-auto px-6 flex justify-center text-center items-center flex-col gap-4">
                    <Image src="/assets/acheevy_helmet.png" alt="ACHEEVY" width={80} height={80} className="drop-shadow-[0_0_12px_rgba(0,0,0,0.8)] opacity-90" />
                    <p className="text-[rgba(255,255,255,0.4)] text-sm tracking-widest font-mono uppercase">
                        Orchestrated by AI Managed Solutions
                    </p>
                </div>
            </footer>
        </main>
    );
}
