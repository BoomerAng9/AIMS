"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { MoveRight, Lock, User, Mail, Briefcase, Store } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function HalalHubVendorSignup() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        businessName: "",
        businessType: "",
        agreed: false
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target as any;
        setFormData(prev => ({
            ...prev,
            [name]: type === "checkbox" ? e.target.checked : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!formData.agreed) {
            setError("You must agree to the A.I.M.S. Zero-Trust Escrow Policy.");
            return;
        }

        if (!formData.firstName || !formData.email || !formData.password || !formData.businessName) {
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
                    lastName: formData.lastName, // optional
                    email: formData.email,
                    password: formData.password,
                    businessName: formData.businessName,
                    businessType: formData.businessType || "vendor",
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to register vendor account.");
            }

            // Successfully registered, now automatically sign them in
            const loginRes = await signIn("credentials", {
                redirect: false,
                email: formData.email,
                password: formData.password,
            });

            if (loginRes?.error) {
                throw new Error(loginRes.error);
            }

            // Redirect to vendor dashboard or shop
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
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.04)_0%,transparent_60%)] pointer-events-none" />

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
                className="w-full max-w-2xl relative z-10"
            >
                {/* Auth Container (Glass Box) */}
                <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#111111]/80 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.6)] overflow-hidden">

                    {/* Header */}
                    <div className="p-8 border-b border-[rgba(255,255,255,0.08)] text-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-[url('/assets/halalhub_storefront.jpg')] opacity-10 bg-cover bg-center" />

                        <div className="flex justify-center mb-6 relative z-10">
                            <Image src="/assets/aims_logo.png" alt="AIMS" width={48} height={48} className="opacity-90 drop-shadow-[0_0_12px_rgba(212,175,55,0.4)]" />
                        </div>

                        <h1 className="text-2xl font-bold text-white tracking-tight mb-2 relative z-10">
                            Become a <span className="text-[#D4AF37]">Verified Vendor</span>
                        </h1>
                        <p className="text-[rgba(255,255,255,0.6)] text-sm max-w-sm mx-auto relative z-10">
                            Join HalalHub's premium A.I.M.S.-managed marketplace. Grow your business with our secure escrow platform.
                        </p>
                    </div>

                    {/* Form Body */}
                    <form onSubmit={handleSubmit} className="p-8 space-y-6">

                        {error && (
                            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium">
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-mono uppercase tracking-wider text-[rgba(255,255,255,0.6)]">First Name</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <User size={18} className="text-[rgba(255,255,255,0.4)]" />
                                    </div>
                                    <input required name="firstName" value={formData.firstName} onChange={handleChange} type="text" placeholder="John" className="w-full h-12 pl-12 pr-4 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] text-white rounded-xl focus:outline-none focus:border-[rgba(212,175,55,0.5)] focus:ring-1 focus:ring-[rgba(212,175,55,0.5)] transition-all placeholder:text-[rgba(255,255,255,0.2)]" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-mono uppercase tracking-wider text-[rgba(255,255,255,0.6)]">Last Name</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <User size={18} className="text-[rgba(255,255,255,0.4)]" />
                                    </div>
                                    <input name="lastName" value={formData.lastName} onChange={handleChange} type="text" placeholder="Doe" className="w-full h-12 pl-12 pr-4 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] text-white rounded-xl focus:outline-none focus:border-[rgba(212,175,55,0.5)] focus:ring-1 focus:ring-[rgba(212,175,55,0.5)] transition-all placeholder:text-[rgba(255,255,255,0.2)]" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-mono uppercase tracking-wider text-[rgba(255,255,255,0.6)]">Email Address</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Mail size={18} className="text-[rgba(255,255,255,0.4)]" />
                                    </div>
                                    <input required name="email" value={formData.email} onChange={handleChange} type="email" placeholder="owner@business.com" className="w-full h-12 pl-12 pr-4 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] text-white rounded-xl focus:outline-none focus:border-[rgba(212,175,55,0.5)] focus:ring-1 focus:ring-[rgba(212,175,55,0.5)] transition-all placeholder:text-[rgba(255,255,255,0.2)]" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-mono uppercase tracking-wider text-[rgba(255,255,255,0.6)]">Business Name</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Store size={18} className="text-[rgba(255,255,255,0.4)]" />
                                    </div>
                                    <input required name="businessName" value={formData.businessName} onChange={handleChange} type="text" placeholder="Your Business LLC" className="w-full h-12 pl-12 pr-4 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] text-white rounded-xl focus:outline-none focus:border-[rgba(212,175,55,0.5)] focus:ring-1 focus:ring-[rgba(212,175,55,0.5)] transition-all placeholder:text-[rgba(255,255,255,0.2)]" />
                                </div>
                            </div>

                            <div className="space-y-2 md:col-span-1 border-blue-500">
                                <label className="text-xs font-mono uppercase tracking-wider text-[rgba(255,255,255,0.6)]">Business Category</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Briefcase size={18} className="text-[rgba(255,255,255,0.4)]" />
                                    </div>
                                    <select name="businessType" value={formData.businessType} onChange={handleChange} className="w-full h-12 pl-12 pr-4 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] text-white rounded-xl focus:outline-none focus:border-[rgba(212,175,55,0.5)] focus:ring-1 focus:ring-[rgba(212,175,55,0.5)] transition-all appearance-none cursor-pointer">
                                        <option value="" disabled className="text-[rgba(255,255,255,0.2)]">Select Category...</option>
                                        <option value="food" className="bg-[#111111] text-white">Food & Catering</option>
                                        <option value="beauty" className="bg-[#111111] text-white">Fragrance & Beauty</option>
                                        <option value="professional" className="bg-[#111111] text-white">Professional Services</option>
                                        <option value="local" className="bg-[#111111] text-white">Local Services</option>
                                        <option value="merch" className="bg-[#111111] text-white">Merchandise</option>
                                        <option value="intl" className="bg-[#111111] text-white">International Products</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2 md:col-span-1">
                                <label className="text-xs font-mono uppercase tracking-wider text-[rgba(255,255,255,0.6)]">Create Password</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Lock size={18} className="text-[rgba(255,255,255,0.4)]" />
                                    </div>
                                    <input required name="password" value={formData.password} onChange={handleChange} type="password" placeholder="••••••••" className="w-full h-12 pl-12 pr-4 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] text-white rounded-xl focus:outline-none focus:border-[rgba(212,175,55,0.5)] focus:ring-1 focus:ring-[rgba(212,175,55,0.5)] transition-all placeholder:text-[rgba(255,255,255,0.2)]" />
                                </div>
                            </div>
                        </div>

                        {/* A.I.M.S Escrow Acknowledgment */}
                        <div className="p-4 rounded-lg bg-[rgba(212,175,55,0.05)] border border-[rgba(212,175,55,0.2)] flex items-start gap-4">
                            <input name="agreed" checked={formData.agreed} onChange={handleChange} type="checkbox" className="mt-1 w-5 h-5 rounded border-[rgba(255,255,255,0.2)] bg-transparent checked:bg-[#D4AF37] checked:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] focus:outline-none transition-colors" />
                            <div className="text-sm text-[rgba(255,255,255,0.8)] leading-relaxed flex-1">
                                I agree to the <span className="font-medium text-[#D4AF37]">A.I.M.S. Zero-Trust Escrow Policy</span>. I understand that customer payments are held securely until delivery or fulfillment is confirmed.
                            </div>
                        </div>

                        <button disabled={loading} type="submit" className="w-full h-14 bg-[#D4AF37] hover:bg-amber-400 text-slate-900 font-bold rounded-xl transition-all shadow-[0_2px_8px_rgba(212,175,55,0.3)] hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(212,175,55,0.4)] text-lg disabled:opacity-50 disabled:pointer-events-none flex justify-center items-center">
                            {loading ? "Registering & Authenticating..." : "Apply as Vendor"}
                        </button>
                    </form>

                    {/* Footer / Alt Auth */}
                    <div className="p-8 border-t border-[rgba(255,255,255,0.08)] bg-[rgba(0,0,0,0.2)] text-center divide-y divide-[rgba(255,255,255,0.05)]">
                        <div className="pb-4">
                            <p className="text-sm text-[rgba(255,255,255,0.6)]">
                                Already have an account? <Link href="/halalhub/login" className="text-white hover:text-[#D4AF37] font-medium transition-colors">Sign In Here</Link>
                            </p>
                        </div>
                        <div className="pt-4">
                            <Link href="/halalhub/signup/customer" className="text-sm font-medium text-[rgba(255,255,255,0.4)] hover:text-white transition-colors">
                                Looking to buy instead? Sign up as a Customer
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="mt-8 text-center flex justify-center items-center flex-col gap-2">
                    <p className="text-[rgba(255,255,255,0.4)] text-xs tracking-widest font-mono uppercase">
                        Orchestrated by AI Managed Solutions
                    </p>
                    <Image src="/assets/acheevy_helmet.png" alt="ACHEEVY" width={40} height={40} className="drop-shadow-[0_0_12px_rgba(0,0,0,0.8)] opacity-60" />
                </div>
            </motion.div>
        </main>
    );
}
