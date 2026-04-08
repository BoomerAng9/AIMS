import { ShieldCheck, Lock, CheckCircle2 } from "lucide-react";
import { memo } from "react";

const INDICATORS = [
    {
        icon: CheckCircle2,
        title: "Admin-Certified Quality",
        description: "1,500+ Verified Vendors subjected to rigorous quality checks and certification proofs.",
        stats: "50,000+ Products",
    },
    {
        icon: Lock,
        title: "Secure Escrow Payments",
        description: "Funds are held securely by A.I.M.S. smart escrow until vendor fulfillment is confirmed.",
        stats: "0 Fraud Claims",
    },
    {
        icon: ShieldCheck,
        title: "Platform Trust",
        description: "Built on AI Managed Solutions transparent marketplace architecture.",
        stats: "100% Reliable",
    }
];

export default memo(function TrustIndicators() {
    return (
        <section className="py-24 px-6 relative bg-[radial-gradient(ellipse_at_bottom,rgba(212,175,55,0.04)_0%,#0A0A0A_60%)] border-t border-[rgba(255,255,255,0.08)] z-10 overflow-hidden">
            {/* Texture overlay */}
            <div className="absolute inset-0 bg-[url('/assets/noise.png')] opacity-[0.03] pointer-events-none" />

            <div className="max-w-7xl mx-auto text-center">
                <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-16">
                    A Foundation of Trust
                </h2>
                <div className="grid md:grid-cols-3 gap-8 md:gap-12 relative z-20">
                    {INDICATORS.map((item, idx) => {
                        const Icon = item.icon;
                        return (
                            <div key={idx} className="flex flex-col items-center text-center group">
                                <div className="h-20 w-20 rounded-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] flex items-center justify-center mb-6 shadow-[0_4px_16px_rgba(0,0,0,0.5)] transition-colors group-hover:border-[rgba(212,175,55,0.3)]">
                                    <Icon size={40} className="text-[#D4AF37]" strokeWidth={1} />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3 tracking-wide">{item.title}</h3>
                                <p className="text-[rgba(255,255,255,0.6)] mb-4 max-w-sm mx-auto leading-relaxed">
                                    {item.description}
                                </p>
                                <span className="text-sm font-mono font-bold text-[#10B981] px-3 py-1 bg-[rgba(16,185,129,0.1)] rounded-md border border-[rgba(16,185,129,0.2)]">
                                    {item.stats}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
});
