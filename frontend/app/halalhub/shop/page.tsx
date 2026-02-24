import { ShieldCheck } from "lucide-react";

export default function ShopHome() {
    return (
        <div className="max-w-6xl mx-auto space-y-12">

            {/* Catalog Header */}
            <div className="pb-8 border-b border-[rgba(255,255,255,0.08)]">
                <h1 className="text-3xl font-black text-white tracking-tight mb-2">Shop All Categories</h1>
                <p className="text-[rgba(255,255,255,0.6)]">Browse high quality products from our registered HalalHub vendors.</p>
            </div>

            {/* Featured Highlight Banner */}
            <div className="w-full h-auto md:h-64 rounded-2xl border border-[rgba(212,175,55,0.2)] bg-[linear-gradient(135deg,#111111_0%,rgba(212,175,55,0.05)_100%)] overflow-hidden flex flex-col md:flex-row items-center relative shadow-[0_8px_32px_rgba(0,0,0,0.5)] p-8 md:p-0">
                <div className="flex-1 md:pl-12 space-y-4">
                    <span className="text-[#D4AF37] text-xs font-mono uppercase tracking-widest font-bold">Featured Partnership</span>
                    <h2 className="text-3xl font-bold text-white leading-tight">Authentic Catering, <br />Delivered Warm.</h2>
                    <p className="text-[rgba(255,255,255,0.6)] max-w-sm text-sm">Top-rated vendors ready for your next big event. Safe payments guaranteed.</p>
                    <button className="mt-2 px-6 py-2 bg-[#D4AF37] hover:bg-amber-400 text-slate-900 font-bold rounded-lg text-sm transition-all shadow-md">
                        Explore Catering
                    </button>
                </div>
                <div className="w-full md:w-1/2 h-full min-h-[200px] bg-[url('/assets/halalhub_storefront.jpg')] bg-cover bg-center rounded-xl md:rounded-none md:rounded-r-2xl border border-[rgba(255,255,255,0.05)] opacity-80 mix-blend-luminosity relative mt-6 md:mt-0">
                    <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-l from-transparent to-[#111111] pointer-events-none" />
                </div>
            </div>

            {/* Grid of latest additions/products placeholder */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white">Trending Picks</h3>
                    <button className="text-sm text-[#D4AF37] hover:underline font-medium">View All Results</button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {/* Placeholder Cards */}
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
                        <div key={item} className="group rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#111111] overflow-hidden hover:border-[rgba(212,175,55,0.3)] transition-all shadow-[0_4px_16px_rgba(0,0,0,0.4)] hover:-translate-y-1 block cursor-pointer">
                            <div className="aspect-square bg-[#0A0A0A] relative flex items-center justify-center border-b border-[rgba(255,255,255,0.05)]">
                                <span className="text-[rgba(255,255,255,0.2)] font-mono text-xs">NO IMAGE</span>
                                <div className="absolute top-3 left-3 px-2 py-0.5 bg-[rgba(16,185,129,0.1)] border border-[rgba(16,185,129,0.2)] rounded text-[10px] text-[#10B981] font-bold flex items-center gap-1 backdrop-blur-md">
                                    <ShieldCheck size={10} /> Verified
                                </div>
                            </div>
                            <div className="p-4 space-y-2">
                                <div className="flex justify-between items-start">
                                    <h4 className="text-white font-bold text-sm tracking-wide">Premium Product {item}</h4>
                                    <span className="text-[#D4AF37] font-bold text-sm">$49.99</span>
                                </div>
                                <p className="text-xs text-[rgba(255,255,255,0.5)] line-clamp-2">High quality item guaranteed by our A.I.M.S verification system. Sold by verified vendor.</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
}
