import { Utensils, Sparkles, Briefcase, Wrench, ShoppingBag, Globe } from "lucide-react";
import Link from "next/link";
import { memo } from "react";

const CATEGORIES = [
    { icon: Utensils, label: "Food & Catering", href: "/halalhub/shop/food" },
    { icon: Sparkles, label: "Fragrance & Beauty", href: "/halalhub/shop/beauty" },
    { icon: Briefcase, label: "Professional", href: "/halalhub/shop/professional" },
    { icon: Wrench, label: "Local Services", href: "/halalhub/shop/services" },
    { icon: Globe, label: "Meetups & Education", href: "/halalhub/shop/meetups" },
    { icon: ShoppingBag, label: "Merchandise", href: "/halalhub/shop/merch" },
];

export default memo(function CategoryShowcase() {
    return (
        <section className="py-24 px-6 border-t border-[rgba(255,255,255,0.08)] bg-[#0A0A0A] relative z-10">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-4">
                        Discover Quality Verticals
                    </h2>
                    <p className="text-[rgba(255,255,255,0.6)] font-medium max-w-xl mx-auto">
                        Explore certified vendors across multi-category e-commerce. From Halal food to premium services.
                    </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
                    {CATEGORIES.map((cat, idx) => {
                        const Icon = cat.icon;
                        return (
                            <Link
                                key={idx}
                                href={cat.href}
                                className="group flex flex-col items-center justify-center p-6 sm:p-8 bg-[#111111] border border-[rgba(255,255,255,0.08)] rounded-2xl transition-all shadow-[0_4px_16px_rgba(0,0,0,0.5)] hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(0,0,0,0.6)] hover:border-[rgba(212,175,55,0.4)]"
                            >
                                <div className="h-16 w-16 mb-4 rounded-xl bg-[rgba(212,175,55,0.1)] text-[#D4AF37] flex items-center justify-center transition-transform group-hover:scale-110">
                                    <Icon size={32} strokeWidth={1.5} />
                                </div>
                                <span className="font-bold text-sm text-[rgba(255,255,255,0.9)] text-center group-hover:text-white transition-colors">
                                    {cat.label}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </section>
    );
});
