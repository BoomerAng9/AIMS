"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { MoveRight, Lock, Mail } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function HalalHubLogin() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!formData.email || !formData.password) {
            setError("Please fill out your email and password.");
            return;
        }

        setLoading(true);

        try {
            const loginRes = await signIn("credentials", {
                redirect: false,
                email: formData.email,
                password: formData.password,
            });

            if (loginRes?.error) {
                throw new Error("Invalid credentials or account does not exist.");
            }

            // Successfully logged in
            router.push("/halalhub/shop");
            router.refresh(); // force layout to recognize session changes

        } catch (err: any) {
            setError(err.message || "An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center p-6 relative font-sans selection:bg-[#D4AF37]/30">
            {/* Global Texture & Glow */}
            <div className="absolute inset-0 bg-[url('/assets/noise.png')] opacity-[0.03] pointer-events-none z-0" />
            <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px] pointer-events-none z-0" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.05)_0%,transparent_60%)] pointer-events-none" />

            {/* Back to Home wrapper */}
            <div className="absolute top-8 left-8 z-20">
                <Link href="/halalhub" className="text-[rgba(255,255,255,0.6)] hover:text-white flex items-center gap-2 text-sm font-medium transition-colors">
                    <MoveRight size={16} className="rotate-180" /> Back to HalalHub
                </Link>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
                className="w-full max-w-md relative z-10"
            >
                {/* Auth Container (Glass Box) */}
                <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#111111]/80 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.6)] overflow-hidden">

                    {/* Header */}
                    <div className="p-8 border-b border-[rgba(255,255,255,0.08)] text-center">
                        <div className="flex justify-center mb-6">
                            <Image src="/assets/aims_logo.png" alt="AIMS" width={48} height={48} className="opacity-90 drop-shadow-[0_0_12px_rgba(212,175,55,0.4)]" />
                        </div>
                        <h1 className="text-2xl font-bold text-white tracking-tight mb-2">Welcome Back</h1>
                        <p className="text-[rgba(255,255,255,0.6)] text-sm">Sign in to your HalalHub account</p>
                    </div>

                    {/* Form Body */}
                    <form onSubmit={handleSubmit} className="p-8 space-y-6">

                        {error && (
                            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium">
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-mono uppercase tracking-wider text-[rgba(255,255,255,0.6)]">Email Address</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Mail size={18} className="text-[rgba(255,255,255,0.4)]" />
                                    </div>
                                    <input
                                        name="email" value={formData.email} onChange={handleChange} required
                                        type="email"
                                        placeholder="Enter your email"
                                        className="w-full h-12 pl-12 pr-4 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] text-white rounded-xl focus:outline-none focus:border-[rgba(212,175,55,0.5)] focus:ring-1 focus:ring-[rgba(212,175,55,0.5)] transition-all placeholder:text-[rgba(255,255,255,0.2)]"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs font-mono uppercase tracking-wider text-[rgba(255,255,255,0.6)]">Password</label>
                                    <a href="#" className="text-xs text-[#D4AF37] hover:underline">Forgot password?</a>
                                </div>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Lock size={18} className="text-[rgba(255,255,255,0.4)]" />
                                    </div>
                                    <input
                                        name="password" value={formData.password} onChange={handleChange} required
                                        type="password"
                                        placeholder="••••••••"
                                        className="w-full h-12 pl-12 pr-4 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] text-white rounded-xl focus:outline-none focus:border-[rgba(212,175,55,0.5)] focus:ring-1 focus:ring-[rgba(212,175,55,0.5)] transition-all placeholder:text-[rgba(255,255,255,0.2)]"
                                    />
                                </div>
                            </div>
                        </div>

                        <button disabled={loading} type="submit" className="w-full h-12 bg-[#D4AF37] hover:bg-amber-400 text-slate-900 font-bold rounded-xl transition-all shadow-[0_2px_8px_rgba(212,175,55,0.3)] hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(212,175,55,0.4)] disabled:opacity-50 disabled:pointer-events-none">
                            {loading ? "Signing in..." : "Sign In"}
                        </button>
                    </form>

                    {/* Footer / Alt Auth */}
                    <div className="p-8 border-t border-[rgba(255,255,255,0.08)] bg-[rgba(0,0,0,0.2)] text-center">
                        <p className="text-sm text-[rgba(255,255,255,0.6)] mb-4">Don't have an account?</p>
                        <div className="flex gap-4 justify-center">
                            <Link href="/halalhub/signup/customer" className="flex-1 shrink-0 px-4 py-2 border border-[rgba(255,255,255,0.08)] rounded-lg text-sm font-medium text-white hover:bg-[rgba(255,255,255,0.05)] transition-colors">
                                I'm a Customer
                            </Link>
                            <Link href="/halalhub/signup/vendor" className="flex-1 shrink-0 px-4 py-2 border border-[rgba(255,255,255,0.08)] rounded-lg text-sm font-medium text-white hover:bg-[rgba(255,255,255,0.05)] transition-colors">
                                I'm a Vendor
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="mt-8 text-center">
                    <p className="text-[rgba(255,255,255,0.4)] text-xs tracking-widest font-mono uppercase">
                        Orchestrated by AI Managed Solutions
                    </p>
                </div>
            </motion.div>
        </main>
    );
}
