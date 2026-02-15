/**
 * HeroPlayer — Remotion Player wrapper for the PlugMeIn composition.
 * Loaded via dynamic import with { ssr: false } from Hero.tsx.
 */

import { Player } from "@remotion/player";
import { PlugMeIn } from "@/remotion/compositions/PlugMeIn";

export default function HeroPlayer() {
  return (
    <Player
      component={PlugMeIn}
      durationInFrames={150}
      compositionWidth={1920}
      compositionHeight={1080}
      fps={30}
      loop
      autoPlay
      style={{
        width: "100%",
        aspectRatio: "1 / 1",
        borderRadius: "inherit",
      }}
      controls={false}
    />
  );
}
