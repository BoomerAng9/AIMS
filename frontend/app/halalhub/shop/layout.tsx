"use client";

import Link from "next/link";
import Image from "next/image";
import { Search, ShoppingCart, Menu, Utensils, Sparkles, Briefcase, Wrench, ShoppingBag, Globe, LogOut } from "lucide-react";
import { usePathname } from "next/navigation";

const CATEGORIES = [
    { icon: Utensils, label: "Food & Catering", href: "/halalhub/shop/food" },
    { icon: Sparkles, label: "Fragrance & Beauty", href: "/halalhub/shop/beauty" },
    { icon: Briefcase, label: "Professional", href: "/halalhub/shop/professional" },
    { icon: Wrench, label: "Local Services", href: "/halalhub/shop/services" },
    { icon: Globe, label: "Community & Meetups", href: "/halalhub/shop/meetups" },
    { icon: ShoppingBag, label: "Merchandise", href: "/halalhub/shop/merch" },
    { icon: Utensils, label: "International", href: "/halalhub/shop/international" },
];

export default function ShopLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col font-sans selection:bg-[#D4AF37]/30 selection:text-white">
            {/* Global scanline overlay toggleable (very faint) */}
            <div className="fixed inset-0 bg-[url('/assets/noise.png')] opacity-[0.03] pointer-events-none z-[999]" />
            <div className="fixed inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px] pointer-events-none z-[998]" />

            {/* Top Bar Navigation */}
            <nav className="sticky top-0 z-50 w-full bg-[#111111]/90 backdrop-blur-md border-b border-[rgba(255,255,255,0.08)] shadow-[0_4px_16px_rgba(0,0,0,0.5)]">
                <div className="px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/halalhub" className="flex items-center gap-3">
                            <Image src="/assets/aims_logo.png" alt="AIMS" width={28} height={28} className="opacity-90" />
                            <div className="h-5 w-px bg-[rgba(255,255,255,0.1)] hidden md:block" />
                            <div className="text-xl font-black text-white tracking-widest uppercase hidden md:block">
                                Halal<span className="text-[#D4AF37]">Hub</span>
                            </div>
                        </Link>
                    </div>

                    {/* Search Bar */}
                    <div className="flex-1 max-w-xl mx-4">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search size={16} className="text-[rgba(255,255,255,0.4)]" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search products, services, or vendors..."
                                className="w-full h-10 pl-10 pr-4 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-white text-sm rounded-lg focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all placeholder:text-[rgba(255,255,255,0.3)]"
                            />
                        </div>
                    </div>

                    {/* User Actions */}
                    <div className="flex items-center gap-6">
                        <button className="relative text-[rgba(255,255,255,0.6)] hover:text-[#D4AF37] transition-colors">
                            <ShoppingCart size={22} />
                            <span className="absolute -top-1.5 -right-1.5 bg-[#D4AF37] text-[#0A0A0A] text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center border border-[#111111]">
                                0
                            </span>
                        </button>
                        <div className="h-6 w-px bg-[rgba(255,255,255,0.1)]" />
                        <Link href="/halalhub/login" className="text-sm font-medium text-[rgba(255,255,255,0.6)] hover:text-white transition-colors flex items-center gap-2">
                            Log In <LogOut size={16} />
                        </Link>
                    </div>
                </div>
            </nav>

            <div className="flex flex-1 relative z-10">
                {/* Sidebar Categories */}
                <aside className="hidden lg:flex flex-col w-64 bg-[#111111]/50 border-r border-[rgba(255,255,255,0.08)] sticky top-16 h-[calc(100vh-64px)] overflow-y-auto">
                    <div className="p-6">
                        <h2 className="text-xs font-mono tracking-widest text-[rgba(255,255,255,0.4)] uppercase mb-4">Categories</h2>
                        <ul className="space-y-2">
                            <li>
                                <Link
                                    href="/halalhub/shop"
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${pathname === '/halalhub/shop' ? 'bg-[rgba(212,175,55,0.1)] text-[#D4AF37] shadow-[inset_2px_0_0_#D4AF37]' : 'text-[rgba(255,255,255,0.6)] hover:bg-[rgba(255,255,255,0.03)] hover:text-white'}`}
                                >
                                    <Menu size={18} />
                                    <span className="text-sm font-medium">All Categories</span>
                                </Link>
                            </li>
                            {CATEGORIES.map((cat, idx) => {
                                const Icon = cat.icon;
                                const isActive = pathname.startsWith(cat.href);
                                return (
                                    <li key={idx}>
                                        <Link
                                            href={cat.href}
                                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-[rgba(212,175,55,0.1)] text-[#D4AF37] shadow-[inset_2px_0_0_#D4AF37]' : 'text-[rgba(255,255,255,0.6)] hover:bg-[rgba(255,255,255,0.03)] hover:text-white'}`}
                                        >
                                            <Icon size={18} />
                                            <span className="text-sm font-medium">{cat.label}</span>
                                        </Link>
                                    </li>
                                );
                            })}
                            <li>
                                <Link
                                    href="/halalhub/shop/calculator"
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all mt-4 border border-[rgba(212,175,55,0.2)] ${pathname.includes('calculator') ? 'bg-[rgba(212,175,55,0.15)] text-[#D4AF37] shadow-[inset_2px_0_0_#D4AF37]' : 'text-[#D4AF37] bg-[rgba(212,175,55,0.05)] hover:bg-[rgba(212,175,55,0.1)]'}`}
                                >
                                    <div className="w-5 h-5 bg-[url('/assets/luc_logo.png')] bg-contain bg-center bg-no-repeat opacity-80 mix-blend-screen" />
                                    <span className="text-sm font-bold">LUC Estimator</span>
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div className="mt-auto p-6">
                        <div className="p-4 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(0,0,0,0.2)]">
                            <h3 className="text-xs font-bold text-white mb-1 tracking-wide">Premium Trust</h3>
                            <p className="text-[11px] text-[rgba(255,255,255,0.5)] mb-3 leading-relaxed">
                                All purchases are protected by A.I.M.S. Zero-Trust Escrow.
                            </p>
                            <span className="inline-block text-[10px] font-mono text-[#10B981] px-2 py-1 bg-[rgba(16,185,129,0.1)] rounded border border-[rgba(16,185,129,0.2)]">
                                Escrow Active
                            </span>
                        </div>
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 p-6 md:p-8 lg:p-12 min-h-[calc(100vh-64px)]">
                    {children}
                </main>
            </div>
        </div>
    );
}
