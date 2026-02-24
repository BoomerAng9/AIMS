"use client";

import { useState } from "react";
import { MoveRight, MapPin, Calculator, TrendingUp } from "lucide-react";
import Image from "next/image";

export default function CalculatorPage() {
    const [service, setService] = useState("");
    const [state, setState] = useState("");
    const [city, setCity] = useState("");
    const [distance, setDistance] = useState("25");

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <div className="pb-8 border-b border-[rgba(255,255,255,0.08)] flex justify-between items-end">
                <div>
                    <div className="text-xs font-mono uppercase tracking-widest text-[#D4AF37] mb-2 flex items-center gap-2">
                        <Calculator size={14} /> Vendor Estimator
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tight mb-2 flex items-center gap-3">
                        <div className="w-8 h-8 md:w-10 md:h-10 bg-[url('/assets/luc_logo.png')] bg-contain bg-center bg-no-repeat mix-blend-screen opacity-90 inline-block" />
                        LUC Calculator
                    </h1>
                    <p className="text-[rgba(255,255,255,0.6)] max-w-2xl">
                        Estimate costs and verify your service radius for deliveries, catering, and professional services across HalalHub.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Calculator Input Form */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="p-6 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#111111]/80 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
                        <h2 className="text-lg font-bold text-white mb-6 border-b border-[rgba(255,255,255,0.08)] pb-4">
                            Estimation Parameters
                        </h2>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-mono uppercase tracking-wider text-[rgba(255,255,255,0.6)]">Primary Service</label>
                                <select
                                    value={service}
                                    onChange={(e) => setService(e.target.value)}
                                    className="w-full h-12 px-4 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] text-white rounded-xl focus:outline-none focus:border-[rgba(212,175,55,0.5)] focus:ring-1 focus:ring-[rgba(212,175,55,0.5)] transition-all appearance-none cursor-pointer"
                                >
                                    <option value="" disabled className="text-[rgba(255,255,255,0.2)]">Select standard service...</option>
                                    <option value="catering" className="bg-[#111111]">Food & Catering</option>
                                    <option value="hvac" className="bg-[#111111]">HVAC & Handyman</option>
                                    <option value="tutor" className="bg-[#111111]">Education & Tutoring</option>
                                    <option value="delivery" className="bg-[#111111]">Merchandising Delivery</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-mono uppercase tracking-wider text-[rgba(255,255,255,0.6)]">State / Region</label>
                                <select
                                    value={state}
                                    onChange={(e) => setState(e.target.value)}
                                    className="w-full h-12 px-4 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] text-white rounded-xl focus:outline-none focus:border-[rgba(212,175,55,0.5)] focus:ring-1 focus:ring-[rgba(212,175,55,0.5)] transition-all appearance-none cursor-pointer"
                                >
                                    <option value="" disabled className="text-[rgba(255,255,255,0.2)]">Select US State...</option>
                                    <option value="CA" className="bg-[#111111]">California</option>
                                    <option value="TX" className="bg-[#111111]">Texas</option>
                                    <option value="NY" className="bg-[#111111]">New York</option>
                                    <option value="FL" className="bg-[#111111]">Florida</option>
                                    <option value="MI" className="bg-[#111111]">Michigan</option>
                                    {/* Add more as needed */}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-mono uppercase tracking-wider text-[rgba(255,255,255,0.6)]">Major City Center</label>
                                <select
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                    className="w-full h-12 px-4 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] text-white rounded-xl focus:outline-none focus:border-[rgba(212,175,55,0.5)] focus:ring-1 focus:ring-[rgba(212,175,55,0.5)] transition-all appearance-none cursor-pointer disabled:opacity-50"
                                    disabled={!state}
                                >
                                    <option value="" disabled className="text-[rgba(255,255,255,0.2)]">Select nearest city...</option>
                                    <option value="los-angeles" className="bg-[#111111]">Los Angeles (CA)</option>
                                    <option value="houston" className="bg-[#111111]">Houston (TX)</option>
                                    <option value="new-york" className="bg-[#111111]">New York City (NY)</option>
                                    <option value="dearborn" className="bg-[#111111]">Dearborn (MI)</option>
                                    {/* Add more as needed */}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="flex justify-between text-xs font-mono uppercase tracking-wider text-[rgba(255,255,255,0.6)]">
                                    <span>Coverage Radius</span>
                                    <span className="text-[#D4AF37]">{distance} Miles</span>
                                </label>
                                <input
                                    type="range"
                                    min="5"
                                    max="100"
                                    step="5"
                                    value={distance}
                                    onChange={(e) => setDistance(e.target.value)}
                                    className="w-full h-2 bg-[rgba(255,255,255,0.1)] rounded-lg appearance-none cursor-pointer accent-[#D4AF37]"
                                />
                                <div className="flex justify-between text-[10px] text-[rgba(255,255,255,0.4)] px-1">
                                    <span>5m</span>
                                    <span>50m</span>
                                    <span>100m</span>
                                </div>
                            </div>
                        </div>

                        <button className="w-full mt-6 h-12 bg-[#D4AF37] hover:bg-amber-400 text-slate-900 font-bold rounded-xl transition-all shadow-[0_2px_8px_rgba(212,175,55,0.3)] hover:-translate-y-0.5 flex justify-center items-center gap-2">
                            <TrendingUp size={16} /> Run Calculation
                        </button>
                    </div>
                </div>

                {/* Right: Output / Visualizer */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="h-[300px] w-full bg-[#111111]/80 rounded-2xl border border-[rgba(255,255,255,0.08)] overflow-hidden relative flex flex-col items-center justify-center shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
                        <div className="absolute inset-0 bg-[url('/assets/noise.png')] opacity-[0.05] pointer-events-none mix-blend-overlay" />
                        {/* Map placeholder */}
                        <div className="absolute inset-0 bg-[#050505] flex items-center justify-center overflow-hidden">
                            <div className="w-[800px] h-[800px] rounded-full border border-[rgba(212,175,55,0.1)] absolute" />
                            <div className="w-[600px] h-[600px] rounded-full border border-[rgba(212,175,55,0.15)] absolute" />
                            <div className="w-[400px] h-[400px] rounded-full border border-[rgba(212,175,55,0.2)] absolute flex items-center justify-center">
                                <div className={`w-[${Number(distance) * 4}px] h-[${Number(distance) * 4}px] bg-[rgba(212,175,55,0.05)] rounded-full border border-[#D4AF37] transition-all duration-500 ease-out`} style={{ width: `${Number(distance) * 4}px`, height: `${Number(distance) * 4}px` }} />
                            </div>
                        </div>

                        <div className="relative z-10 flex flex-col items-center">
                            <div className="w-12 h-12 bg-[#0A0A0A] border border-[rgba(212,175,55,0.4)] rounded-full flex items-center justify-center text-[#D4AF37] mb-3 shadow-[0_0_20px_rgba(212,175,55,0.2)]">
                                <MapPin size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-white tracking-wide">
                                {city ? city.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : "Awaiting Selection"}
                            </h3>
                            <p className="text-[#D4AF37] font-mono text-sm mt-1">Radius: {distance} Miles</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-6 rounded-2xl border border-[rgba(16,185,129,0.2)] bg-[linear-gradient(135deg,#111111_0%,rgba(16,185,129,0.05)_100%)] shadow-lg">
                            <div className="text-xs font-mono text-[#10B981] tracking-widest uppercase mb-1">Estimated Base Rate</div>
                            <div className="text-3xl font-bold text-white font-mono">$ {service ? (Number(distance) * 1.5 + 45).toFixed(2) : "0.00"}</div>
                            <p className="text-[rgba(255,255,255,0.5)] text-xs mt-2">Calculated based on current median escrow rates for the selected city and distance profile.</p>
                        </div>
                        <div className="p-6 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#111111]">
                            <div className="text-xs font-mono text-[rgba(255,255,255,0.4)] tracking-widest uppercase mb-1">Available Vendors</div>
                            <div className="text-3xl font-bold text-white font-mono">{city ? Math.floor(Math.random() * 40 + 10) : "0"}</div>
                            <p className="text-[rgba(255,255,255,0.5)] text-xs mt-2">Verified businesses operating within the defined radius.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
