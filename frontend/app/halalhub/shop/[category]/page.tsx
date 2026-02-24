import { ShieldCheck, MapPin, Search } from "lucide-react";
import Link from "next/link";

// Mock data definitions for specific category requirements
const CATEGORY_DATA: Record<string, { title: string, desc: string, subcategories: string[], hasMap?: boolean }> = {
    food: {
        title: "Food & Catering",
        desc: "Find certified Halal catering and food services near your major city hub.",
        hasMap: true,
        subcategories: ["Hot Meals", "Event Catering", "Baking & Desserts", "Meal Prep"]
    },
    beauty: {
        title: "Fragrance & Beauty",
        desc: "Premium Halal-certified cosmetics, oils, and fragrances.",
        subcategories: ["Oils", "Fragrances", "Skincare", "Cosmetics"]
    },
    merch: {
        title: "Merchandise",
        desc: "High-quality Islamic clothing and accessories with inclusive sizing.",
        subcategories: ["Abayas", "Niqabs", "Kufis", "Jilbabs", "Bisht", "Big Sizes"]
    },
    professional: {
        title: "Professional Services",
        desc: "Hire verified professionals remotely or locally for your home or business.",
        hasMap: true,
        subcategories: ["IT Help", "Remote Work", "Handyman", "HVAC"]
    },
    services: {
        title: "Local Services",
        desc: "Educational support, professional development, and community tutoring.",
        hasMap: true,
        subcategories: ["Tutoring", "Educational Services", "Professional Development Training"]
    },
    international: {
        title: "International",
        desc: "Imported goods globally sourced and verified.",
        subcategories: ["Spices", "Textiles", "Artifacts", "Books"]
    }
};

export default function CategoryPage({ params }: { params: { category: string } }) {

    const catKey = params.category.toLowerCase();
    const data = CATEGORY_DATA[catKey] || {
        title: catKey.charAt(0).toUpperCase() + catKey.slice(1),
        desc: `Browse high quality products within ${catKey}.`,
        subcategories: ["All Items"]
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8">

            {/* Catalog Header */}
            <div className={`pb-8 ${data.hasMap ? 'border-b-0' : 'border-b'} border-[rgba(255,255,255,0.08)]`}>
                <div className="flex justify-between items-start">
                    <div>
                        <div className="text-xs font-mono uppercase tracking-widest text-[#D4AF37] mb-2">Category Hub</div>
                        <h1 className="text-3xl font-black text-white tracking-tight mb-2">{data.title}</h1>
                        <p className="text-[rgba(255,255,255,0.6)]">{data.desc}</p>
                    </div>
                    {data.hasMap && (
                        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-[rgba(212,175,55,0.1)] border border-[rgba(212,175,55,0.2)] rounded-lg text-[#D4AF37] text-sm font-medium">
                            <MapPin size={16} /> Distance / Map Locator Enabled
                        </div>
                    )}
                </div>
            </div>

            {/* Subcategories Filter Pills */}
            <div className="flex flex-wrap gap-3 pb-6">
                {data.subcategories.map(sub => (
                    <button key={sub} className="px-4 py-2 rounded-full border border-[rgba(255,255,255,0.1)] bg-[#111111] hover:bg-[rgba(212,175,55,0.1)] hover:border-[rgba(212,175,55,0.3)] text-sm font-medium text-[rgba(255,255,255,0.8)] hover:text-[#D4AF37] transition-all">
                        {sub}
                    </button>
                ))}
            </div>

            {/* Optional Map / Locator UI for Localized Categories */}
            {data.hasMap && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 p-6 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#111111] shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
                    <div className="col-span-1 space-y-4">
                        <h3 className="text-white font-bold tracking-wide">Set Vendor Radius</h3>
                        <div className="space-y-4">
                            <select className="w-full h-10 px-4 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] text-white rounded-lg focus:outline-none focus:border-[#D4AF37] text-sm">
                                <option>Select State...</option>
                                <option>California</option>
                                <option>Texas</option>
                                <option>New York</option>
                            </select>
                            <select className="w-full h-10 px-4 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] text-white rounded-lg focus:outline-none focus:border-[#D4AF37] text-sm">
                                <option>Select City Center...</option>
                                <option>Los Angeles</option>
                                <option>Houston</option>
                                <option>New York City</option>
                            </select>
                            <div>
                                <label className="flex justify-between text-xs text-[rgba(255,255,255,0.6)] mb-2">
                                    Radius from Center <span className="text-[#D4AF37]">25 Miles</span>
                                </label>
                                <input type="range" className="w-full accent-[#D4AF37]" defaultValue={25} min={5} max={100} />
                            </div>
                            <button className="w-full h-10 bg-[#D4AF37] hover:bg-amber-400 text-slate-900 font-bold rounded-lg text-sm transition-all shadow-[0_2px_8px_rgba(212,175,55,0.3)] flex justify-center items-center gap-2">
                                <Search size={14} /> Update Results
                            </button>
                        </div>
                    </div>
                    <div className="col-span-1 md:col-span-2 h-[280px] rounded-xl bg-[url('/assets/noise.png')] bg-[#050505] flex items-center justify-center border border-[rgba(255,255,255,0.05)] relative overflow-hidden">
                        <div className="absolute inset-0 opacity-20" style={{ background: "radial-gradient(circle at center, #D4AF37 0%, transparent 60%)" }} />
                        <div className="w-12 h-12 rounded-full border-2 border-[#D4AF37] flex items-center justify-center bg-[#111111] z-10 shadow-[0_0_15px_rgba(212,175,55,0.4)]">
                            <MapPin className="text-[#D4AF37]" size={20} />
                        </div>
                        <div className="absolute text-[10px] font-mono text-[rgba(255,255,255,0.3)] bottom-4 right-4">
                            Google Maps / Earth 3D API Placeholder
                        </div>
                    </div>
                </div>
            )}

            {/* Product Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
                    <div key={item} className="group rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#111111] overflow-hidden hover:border-[rgba(212,175,55,0.3)] transition-all shadow-[0_4px_16px_rgba(0,0,0,0.4)] hover:-translate-y-1 block cursor-pointer flex flex-col h-full">
                        <div className="aspect-[4/3] bg-[#0A0A0A] relative flex items-center justify-center border-b border-[rgba(255,255,255,0.05)] shrink-0">
                            <span className="text-[rgba(255,255,255,0.2)] font-mono text-xs">MEDIA PLACEHOLDER</span>
                            <div className="absolute top-3 left-3 px-2 py-0.5 bg-[rgba(16,185,129,0.1)] border border-[rgba(16,185,129,0.2)] rounded text-[10px] text-[#10B981] font-bold flex items-center gap-1 backdrop-blur-md">
                                <ShieldCheck size={10} /> Escrow Backed
                            </div>
                        </div>
                        <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                            <div>
                                <div className="text-[10px] text-[#D4AF37] font-bold tracking-wider uppercase mb-1">
                                    {data.subcategories[item % data.subcategories.length]}
                                </div>
                                <div className="flex justify-between items-start gap-2">
                                    <h4 className="text-white font-bold text-sm tracking-wide leading-snug break-words">Premium {data.title} Service/Product {item}</h4>
                                </div>
                                <p className="text-xs text-[rgba(255,255,255,0.5)] mt-2 line-clamp-2">High quality, verified by A.I.M.S.</p>
                            </div>
                            <div className="flex justify-between items-end mt-4 pt-4 border-t border-[rgba(255,255,255,0.05)]">
                                <span className="text-[#D4AF37] font-bold text-lg">$??.??</span>
                                <button className="px-3 py-1.5 text-xs font-bold bg-[rgba(255,255,255,0.05)] text-white hover:bg-[rgba(212,175,55,0.2)] hover:text-[#D4AF37] rounded transition-colors">
                                    View Details
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

        </div>
    );
}
