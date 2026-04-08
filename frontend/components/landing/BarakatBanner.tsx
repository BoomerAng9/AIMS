import { motion } from "framer-motion";

export default function BarakatBanner() {
    return (
        <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            className="w-full bg-[#111111] border-b border-[rgba(255,255,255,0.08)] py-2 px-4 shadow-[0_2px_8px_rgba(0,0,0,0.4)] relative z-50 overflow-hidden"
        >
            <div className="max-w-7xl mx-auto flex items-center justify-center text-center gap-2">
                <span className="text-[#D4AF37] animate-pulse drop-shadow-[0_0_8px_rgba(212,175,55,0.6)]">✦</span>
                <p className="text-xs sm:text-sm font-medium text-[rgba(255,255,255,0.8)] tracking-wide">
                    <span className="font-bold text-white mr-2">Barakat Rewards:</span>
                    Earn <span className="text-[#D4AF37] font-bold">70% Lifetime Commission</span> - Refer Vendors & Earn Forever
                </p>
            </div>
            {/* Subtle retro scanline */}
            <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.2)_50%)] bg-[length:100%_4px] pointer-events-none opacity-20" />
        </motion.div>
    );
}
