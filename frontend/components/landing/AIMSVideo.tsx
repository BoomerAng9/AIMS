"use client";

import React from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";

// Dynamically import the Remotion Player to avoid SSR issues
const Player = dynamic(() => import("@remotion/player").then((mod) => mod.Player), {
    ssr: false,
});

// Import the composition component - using dynamic here too if needed, 
// but usually it's fine once the Player is dynamic
import { AIMSIntro } from "@/remotion/compositions/AIMSIntro";

export default function AIMSVideo() {
    return (
        <div className="w-full h-full rounded-2xl overflow-hidden bg-black border border-white/10 shadow-3xl">
            <Player
                component={AIMSIntro as any}
                durationInFrames={150}
                compositionWidth={1920}
                compositionHeight={1080}
                fps={30}
                style={{
                    width: "100%",
                    height: "auto",
                    aspectRatio: "16/9",
                }}
                controls
                autoPlay
                loop
                inputProps={{
                    title: "A.I.M.S.",
                    subtitle: "AI Managed Systems"
                }}
            />
        </div>
    );
}
