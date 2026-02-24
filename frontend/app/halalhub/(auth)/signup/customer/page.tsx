"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { MoveRight, Lock, User, Mail } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function HalalHubCustomerSignup() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
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

        if (!formData.firstName || !formData.email || !formData.password) {
            setError("Please fill out all required fields.");
            return;
        }

        setLoading(true);

        try {
            // Register user via existing API route
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    email: formData.email,
                    password: formData.password,
                    businessType: "customer", // distinguish them
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to create customer account.");
            }

            // Successfully registered, sign them in
            const loginRes = await signIn("credentials", {
                redirect: false,
                email: formData.email,
                password: formData.password,
            });

            if (loginRes?.error) {
                throw new Error(loginRes.error);
            }

            // Redirect to shop
            router.push("/halalhub/shop");

        } catch (err: any) {
            setError(err.message || "An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center p-6 relative font-sans selection:bg-[#D4AF37]/30 py-20">
            {/* Global Texture & Glow */}
            <div className="absolute inset-0 bg-[url('/assets/noise.png')] opacity-[0.03] pointer-events-none z-0" />
            <div className="fixed inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px] pointer-events-none z-0" />
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.06)_0%,transparent_60%)] pointer-events-none" />

            {/* Back to Home wrapper */}
            <div className="absolute top-8 left-8 z-20">
                <Link href="/halalhub" className="text-[rgba(255,255,255,0.6)] hover:text-white flex items-center gap-2 text-sm font-medium transition-colors">
                    <MoveRight size={16} className="rotate-180" /> Back to HalalHub
                </Link>
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
                className="w-full max-w-md relative z-10"
            >
                {/* Auth Container (Glass Box) */}
                <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#111111]/80 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.6)] overflow-hidden">

                    {/* Header */}
                    <div className="p-8 border-b border-[rgba(255,255,255,0.08)] text-center relative overflow-hidden">

                        <div className="flex justify-center mb-6 relative z-10">
                            <Image src="/assets/aims_logo.png" alt="AIMS" width={48} height={48} className="opacity-90 drop-shadow-[0_0_12px_rgba(212,175,55,0.4)]" />
                        </div>

                        <h1 className="text-2xl font-bold text-white tracking-tight mb-2 relative z-10">
                            Create Account
                        </h1>
                        <p className="text-[rgba(255,255,255,0.6)] text-sm max-w-sm mx-auto relative z-10">
                            Join HalalHub to instantly browse, save, and order from <span className="text-[#10B981]">1,500+ Verified Vendors</span>.
                        </p>
                    </div>

                    {/* Form Body */}
                    <form onSubmit={handleSubmit} className="p-8 space-y-6">

                        {error && (
                            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium">
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-mono uppercase tracking-wider text-[rgba(255,255,255,0.6)]">First Name</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <User size={16} className="text-[rgba(255,255,255,0.4)]" />
                                        </div>
                                        <input required name="firstName" value={formData.firstName} onChange={handleChange} type="text" placeholder="John" className="w-full h-12 pl-10 pr-4 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] text-white rounded-xl focus:outline-none focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981] transition-all placeholder:text-[rgba(255,255,255,0.2)]" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-mono uppercase tracking-wider text-[rgba(255,255,255,0.6)]">Last Name</label>
                                    <input name="lastName" value={formData.lastName} onChange={handleChange} type="text" placeholder="Doe" className="w-full h-12 px-4 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] text-white rounded-xl focus:outline-none focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981] transition-all placeholder:text-[rgba(255,255,255,0.2)]" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-mono uppercase tracking-wider text-[rgba(255,255,255,0.6)]">Email Address</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Mail size={18} className="text-[rgba(255,255,255,0.4)]" />
                                    </div>
                                    <input required name="email" value={formData.email} onChange={handleChange} type="email" placeholder="john@example.com" className="w-full h-12 pl-12 pr-4 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] text-white rounded-xl focus:outline-none focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981] transition-all placeholder:text-[rgba(255,255,255,0.2)]" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-mono uppercase tracking-wider text-[rgba(255,255,255,0.6)]">Create Password</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Lock size={18} className="text-[rgba(255,255,255,0.4)]" />
                                    </div>
                                    <input required name="password" value={formData.password} onChange={handleChange} type="password" placeholder="••••••••" className="w-full h-12 pl-12 pr-4 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] text-white rounded-xl focus:outline-none focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981] transition-all placeholder:text-[rgba(255,255,255,0.2)]" />
                                </div>
                            </div>
                        </div>

                        <button disabled={loading} type="submit" className="w-full h-12 bg-[#10B981] hover:bg-emerald-400 text-slate-900 font-bold rounded-xl transition-all shadow-[0_2px_8px_rgba(16,185,129,0.3)] hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(16,185,129,0.4)] text-lg disabled:opacity-50 disabled:pointer-events-none">
                            {loading ? "Registering & Authenticating..." : "Sign Up"}
                        </button>
                    </form>

                    {/* Footer / Alt Auth */}
                    <div className="p-8 border-t border-[rgba(255,255,255,0.08)] bg-[rgba(0,0,0,0.2)] text-center divide-y divide-[rgba(255,255,255,0.05)]">
                        <div className="pb-4">
                            <p className="text-sm text-[rgba(255,255,255,0.6)]">
                                Already have an account? <Link href="/halalhub/login" className="text-white hover:text-[#10B981] font-medium transition-colors">Sign In Here</Link>
                            </p>
                        </div>
                        <div className="pt-4 flex flex-col gap-2">
                            <Link href="/halalhub/signup/vendor" className="text-sm font-medium text-[rgba(255,255,255,0.4)] hover:text-white transition-colors">
                                Own a business? Register as a Vendor Instead
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="mt-8 text-center flex justify-center items-center flex-col gap-2">
                    <p className="text-[rgba(255,255,255,0.4)] text-xs tracking-widest font-mono uppercase">
                        Orchestrated by AI Managed Solutions
                    </p>
                </div>
            </motion.div>
        </main>
    );
}
