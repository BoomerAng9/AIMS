"use client";
/**
 * AuthWelcomePlayer — Remotion Player wrapper for the WelcomeVideo composition.
 * Loaded via dynamic import with { ssr: false } from the auth layout.
 */

import { Player } from "@remotion/player";
import { WelcomeVideo } from "@/remotion/compositions/WelcomeVideo";

export default function AuthWelcomePlayer() {
  return (
    <Player
      component={WelcomeVideo}
      durationInFrames={180}
      compositionWidth={800}
      compositionHeight={1080}
      fps={30}
      loop
      autoPlay
      style={{
        width: "100%",
        height: "100%",
      }}
      controls={false}
    />
  );
}
