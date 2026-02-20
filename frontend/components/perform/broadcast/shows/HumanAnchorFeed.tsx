'use client';

import { motion } from 'framer-motion';
import { BroadcastSegment } from '../engine';
import { Camera, Radio } from 'lucide-react';
import { useState } from 'react';

export function HumanAnchorFeed({ segment }: { segment: BroadcastSegment }) {
    // Placeholder state for an actual WebRTC video feed (e.g. Agora/Twilio)
    const [cameraActive, setCameraActive] = useState(false);

    return (
        <div className="w-full h-full flex items-center justify-center p-12">
            <div className="relative w-full max-w-6xl aspect-video rounded-3xl overflow-hidden shadow-[0_0_100px_rgba(218,165,32,0.15)] bg-[#030303]">
                {/* TV Grid and Noise Overlay */}
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay pointer-events-none" />
                <div className="absolute inset-0 border-[0.5px] border-white/5 opacity-50 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:40px_40px]" />

                {/* Framing brackets */}
                <div className="absolute top-8 left-8 w-16 h-16 border-t-4 border-l-4 border-gold/40 rounded-tl-xl" />
                <div className="absolute top-8 right-8 w-16 h-16 border-t-4 border-r-4 border-gold/40 rounded-tr-xl" />
                <div className="absolute bottom-8 left-8 w-16 h-16 border-b-4 border-l-4 border-gold/40 rounded-bl-xl" />
                <div className="absolute bottom-8 right-8 w-16 h-16 border-b-4 border-r-4 border-gold/40 rounded-br-xl" />

                {cameraActive ? (
                    <div className="w-full h-full flex items-center justify-center bg-black">
                        {/* Actual `<video>` element goes here */}
                        <span className="text-white/20 font-mono tracking-widest">[ WEBRTC_STREAM_ACTIVE ]</span>
                    </div>
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center relative">
                        <motion.div
                            animate={{ opacity: [0.3, 0.7, 0.3] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute bg-gold/5 blur-[120px] w-[500px] h-[500px] rounded-full"
                        />
                        <Radio className="w-24 h-24 text-gold/30 mb-6 drop-shadow-[0_0_20px_rgba(218,165,32,0.4)]" />
                        <h3 className="text-4xl text-white font-black uppercase tracking-[0.3em] text-center mb-4">
                            Human Analyst Feed
                        </h3>
                        <p className="text-gold/50 font-mono tracking-widest text-sm mb-8">WAITING FOR BROADCAST SIGNAL...</p>

                        <button
                            onClick={() => setCameraActive(true)}
                            className="px-6 py-3 bg-white/5 hover:bg-gold/20 border border-gold/40 text-gold rounded backdrop-blur-md transition-all flex items-center gap-3 uppercase text-sm tracking-widest font-bold font-mono"
                        >
                            <Camera size={16} /> Enable Studio Camera
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
