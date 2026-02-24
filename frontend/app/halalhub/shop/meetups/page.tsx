"use client";

import { Users, GraduationCap, MapPin, Search, ArrowRight } from "lucide-react";

export default function MeetupsPage() {
    return (
        <div className="max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <div className="pb-8 border-b border-[rgba(255,255,255,0.08)] flex justify-between items-end">
                <div>
                    <div className="text-xs font-mono uppercase tracking-widest text-[#D4AF37] mb-2 flex items-center gap-2">
                        <Users size={14} /> Community Learning
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tight mb-2">
                        Local Meetups & Education
                    </h1>
                    <p className="text-[rgba(255,255,255,0.6)] max-w-2xl">
                        Connect with local homeschoolers, find continuing education opportunities, and register as a certified trainer.
                    </p>
                </div>
            </div>

            {/* Quick Actions (Boost Bridge Injection) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#111111] p-6 rounded-2xl border border-[rgba(255,255,255,0.08)] shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
                <div className="space-y-4">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <GraduationCap className="text-[#10B981]" /> Transfer Knowledge
                    </h3>
                    <p className="text-sm text-[rgba(255,255,255,0.6)]">
                        Are you a certified trainer or subject matter expert? Sign up to host a meetup, teach a course, and transfer knowledge locally. This connects directly to the AIMS Boost Bridge for compensation.
                    </p>
                    <button className="px-6 py-2.5 bg-[#10B981] hover:bg-emerald-400 text-slate-900 font-bold rounded-lg text-sm transition-all shadow-md">
                        Become an Educator
                    </button>
                </div>

                <div className="border-l border-[rgba(255,255,255,0.08)] pl-6 space-y-4 flex flex-col justify-center">
                    <h3 className="text-xl font-bold text-white">Join a Group</h3>
                    <p className="text-sm text-[rgba(255,255,255,0.6)]">
                        Find local active homeschool co-ops or adult development courses taking place within your proximity.
                    </p>
                    <div className="flex bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-lg overflow-hidden">
                        <input type="text" placeholder="Zip code or City..." className="bg-transparent px-4 py-2 w-full text-white text-sm focus:outline-none" />
                        <button className="px-4 bg-[rgba(212,175,55,0.1)] text-[#D4AF37] hover:bg-[rgba(212,175,55,0.2)] font-bold transition-colors">
                            <Search size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Locator UI */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 p-6 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#111111] shadow-[0_8px_32px_rgba(0,0,0,0.5)] mt-8">
                <div className="col-span-1 space-y-4">
                    <h3 className="text-white font-bold tracking-wide">Set Group Radius</h3>
                    <div className="space-y-4">
                        <select className="w-full h-10 px-4 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] text-white rounded-lg focus:outline-none focus:border-[#D4AF37] text-sm">
                            <option>California</option>
                            <option>Texas</option>
                            <option>New York</option>
                        </select>
                        <select className="w-full h-10 px-4 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] text-white rounded-lg focus:outline-none focus:border-[#D4AF37] text-sm">
                            <option>Los Angeles</option>
                            <option>Houston</option>
                            <option>New York City</option>
                        </select>
                        <div>
                            <label className="flex justify-between text-xs text-[rgba(255,255,255,0.6)] mb-2">
                                Travel Radius <span className="text-[#D4AF37]">15 Miles</span>
                            </label>
                            <input type="range" className="w-full accent-[#D4AF37]" defaultValue={15} min={5} max={50} />
                        </div>
                    </div>
                </div>
                <div className="col-span-1 md:col-span-2 h-[280px] rounded-xl bg-[url('/assets/noise.png')] bg-[#050505] flex items-center justify-center border border-[rgba(255,255,255,0.05)] relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20" style={{ background: "radial-gradient(circle at center, #D4AF37 0%, transparent 60%)" }} />
                    <div className="w-12 h-12 rounded-full border-2 border-[#D4AF37] flex items-center justify-center bg-[#111111] z-10 shadow-[0_0_15px_rgba(212,175,55,0.4)]">
                        <MapPin className="text-[#D4AF37]" size={20} />
                    </div>
                    <div className="absolute text-[10px] font-mono text-[rgba(255,255,255,0.3)] bottom-4 right-4">
                        Google 3D Maps Embed Localized
                    </div>
                </div>
            </div>

            {/* Meetup Listings */}
            <div className="space-y-4">
                <h3 className="text-xl font-bold text-white">Upcoming Events & Co-ops</h3>

                {[1, 2, 3].map((item) => (
                    <div key={item} className="flex flex-col md:flex-row gap-6 p-6 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#111111] hover:border-[rgba(212,175,55,0.3)] transition-all group">
                        <div className="w-16 h-16 shrink-0 bg-[rgba(212,175,55,0.1)] rounded-xl flex flex-col items-center justify-center border border-[rgba(212,175,55,0.2)] text-[#D4AF37]">
                            <span className="text-xs font-bold uppercase tracking-widest">Oct</span>
                            <span className="text-xl font-black">2{item}</span>
                        </div>
                        <div className="flex-1 space-y-1">
                            <h4 className="text-lg font-bold text-white group-hover:text-[#D4AF37] transition-colors">
                                Local Area Homeschool Connect {item}
                            </h4>
                            <p className="text-sm text-[rgba(255,255,255,0.5)] flex items-center gap-2">
                                <span className="bg-[#10B981]/10 text-[#10B981] px-2 py-0.5 rounded textxs font-bold border border-[#10B981]/20">
                                    Certified Transference
                                </span>
                                Host: Local Community Hub
                            </p>
                        </div>
                        <div className="flex items-center">
                            <button className="flex items-center gap-2 text-sm font-medium text-white hover:text-[#D4AF37]">
                                RSVP Now <ArrowRight size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
