"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { X, UserPlus } from "lucide-react";

export default function GuestPrompt() {
    const { status } = useSession();
    const [showPrompt, setShowPrompt] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        // Only trigger if unauthenticated and not already dismissed
        if (status === "unauthenticated" && !dismissed) {
            const timer = setTimeout(() => {
                setShowPrompt(true);
            }, 30000); // 30 seconds

            return () => clearTimeout(timer);
        }
    }, [status, dismissed]);

    if (!showPrompt) return null;

    return (
        <AnimatePresence>
            {showPrompt && (
                <motion.div
                    initial={{ opacity: 0, y: 50, x: 20 }}
                    animate={{ opacity: 1, y: 0, x: 0 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    className="fixed bottom-6 right-6 z-[9999] w-80 bg-[#111111]/90 backdrop-blur-xl border border-[rgba(212,175,55,0.3)] rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.8)] overflow-hidden"
                >
                    <div className="p-4 relative">
                        <button
                            onClick={() => {
                                setShowPrompt(false);
                                setDismissed(true);
                            }}
                            className="absolute top-3 right-3 text-[rgba(255,255,255,0.4)] hover:text-white transition-colors"
                        >
                            <X size={16} />
                        </button>

                        <div className="flex items-start gap-3">
                            <div className="h-10 w-10 shrink-0 rounded-full bg-[rgba(212,175,55,0.1)] text-[#D4AF37] flex items-center justify-center border border-[rgba(212,175,55,0.2)]">
                                <UserPlus size={18} />
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-sm tracking-wide mb-1">Join the Platform</h3>
                                <p className="text-[rgba(255,255,255,0.6)] text-xs leading-relaxed mb-3">
                                    Create an account to gain full access to buy, sell, and interact directly with our verified vendors.
                                </p>
                                <div className="flex gap-2">
                                    <Link
                                        href="/halalhub/signup/customer"
                                        className="flex-1 bg-[#D4AF37] hover:bg-amber-400 text-[#0A0A0A] text-xs font-bold py-2 rounded-lg text-center transition-colors shadow-sm"
                                        onClick={() => setShowPrompt(false)}
                                    >
                                        Register
                                    </Link>
                                    <Link
                                        href="/halalhub/login"
                                        className="flex-1 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.1)] text-white text-xs font-medium py-2 rounded-lg text-center transition-colors"
                                        onClick={() => setShowPrompt(false)}
                                    >
                                        Log In
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
