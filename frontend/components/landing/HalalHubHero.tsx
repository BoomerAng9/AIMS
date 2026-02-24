import { motion } from "framer-motion";
import { MoveRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function HalalHubHero() {
    return (
        <section className="relative min-h-[90vh] px-6 sm:px-8 lg:px-12 flex flex-col items-center justify-center text-center overflow-hidden">
            {/* Background Texture & Glow */}
            <div className="absolute inset-0 bg-[#0A0A0A] pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.08)_0%,transparent_70%)] pointer-events-none opacity-60 mix-blend-screen" />
            <div className="absolute inset-0 bg-[url('/assets/noise.png')] opacity-[0.03] pointer-events-none" />

            <div className="flex flex-col lg:flex-row items-center justify-between w-full max-w-7xl relative z-10 gap-16 pt-16 lg:pt-0">

                {/* Text Content */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
                    className="flex-1 space-y-8 text-left"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[rgba(255,255,255,0.08)] bg-[#111111]/80 backdrop-blur-md text-[#D4AF37] text-xs font-mono uppercase tracking-widest shadow-[0_4px_16px_rgba(0,0,0,0.5)]">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10B981]"></span>
                        </span>
                        A.I.M.S. Vertical • Active
                    </div>

                    <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-[1.1]">
                        Quality-Verified <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-amber-200">
                            Marketplace
                        </span>
                    </h1>

                    <p className="text-lg md:text-xl text-[rgba(255,255,255,0.6)] max-w-xl font-light leading-relaxed">
                        Connect with certified vendors across food, services, and products. Verified by admins, backed by secure escrow payments.
                    </p>

                    <div className="flex flex-col sm:flex-row items-start gap-4 pt-4">
                        <Link
                            href="/halalhub/shop"
                            className="h-14 px-8 bg-[#D4AF37] hover:bg-amber-400 text-slate-900 font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_2px_8px_rgba(212,175,55,0.3)] hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(212,175,55,0.4)]"
                        >
                            Shop Quality Products <MoveRight size={18} />
                        </Link>
                        <Link
                            href="/halalhub/signup/vendor"
                            className="h-14 px-8 bg-[#111111] border border-[rgba(255,255,255,0.08)] hover:border-[rgba(212,175,55,0.4)] text-white font-medium rounded-xl flex items-center justify-center transition-all shadow-[0_4px_16px_rgba(0,0,0,0.5)] hover:-translate-y-0.5"
                        >
                            Sell on HalalHub
                        </Link>
                    </div>
                </motion.div>

                {/* Hero Graphic / Storefront */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1], delay: 0.2 }}
                    className="flex-1 w-full max-w-lg lg:max-w-none relative"
                >
                    <div className="relative w-full aspect-square rounded-2xl overflow-hidden border border-[rgba(255,255,255,0.08)] bg-[#111111] shadow-[0_8px_32px_rgba(0,0,0,0.6)] group">
                        <div className="absolute inset-0 bg-[#0A0A0A] animate-pulse" /> {/* Loading state */}
                        <Image
                            src="/assets/acheevy_holo_plug.jpg"
                            alt="HalalHub Active Storefront"
                            fill
                            className="object-cover relative z-10 scale-105"
                        />
                        {/* Glass Overlay Elements */}
                        <div className="absolute top-6 left-6 right-6 p-4 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0A0A0A]/80 backdrop-blur-xl z-20 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="text-[#10B981]">●</span>
                                <span className="text-sm font-mono text-white/80">Escrow Secure Payments</span>
                            </div>
                            <Image src="/assets/aims_logo.png" alt="AIMS" width={40} height={40} className="opacity-80 drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]" />
                        </div>
                    </div>
                </motion.div>

            </div>
        </section>
    );
}
