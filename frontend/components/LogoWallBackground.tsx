// frontend/components/LogoWallBackground.tsx
"use client";

import React from "react";
import clsx from "clsx";

type LogoWallMode = "hero" | "auth" | "form" | "dashboard";
type LogoColorway = "champagne" | "deepsea";

interface Props {
  mode?: LogoWallMode;
  colorway?: LogoColorway;
  children: React.ReactNode;
}

/**
 * Flowing wave pattern — brand signature from the Logox design.
 * SVG renders smooth S-curve strokes rotated diagonally with a 3D embossed effect,
 * tiled across the entire viewport. Replaces the old diagonal bar pattern.
 */
function WavePattern({ colorway }: { colorway: LogoColorway }) {
  const color = colorway === "champagne"
    ? { stroke: "#B8962E", highlight: "#D4AF37", shadow: "#6B5B1F" }
    : { stroke: "#0E7490", highlight: "#22D3EE", shadow: "#064E5C" };

  // S-curve that tiles seamlessly: starts and ends at same y with matching slopes
  const waveD = "M0,0 C80,-28 160,28 240,0";

  // Waves at varied spacing + widths for organic, premium feel
  const waves = [
    { y: 0,   w: 16 },
    { y: 38,  w: 12 },
    { y: 72,  w: 20 },
    { y: 106, w: 14 },
    { y: 144, w: 18 },
    { y: 182, w: 12 },
    { y: 220, w: 16 },
    { y: 258, w: 14 },
  ];

  return (
    <svg
      className="absolute inset-0 w-full h-full"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <pattern
          id="logo-waves"
          x="0" y="0"
          width="240" height="300"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(-38)"
        >
          {waves.map((wave, i) => (
            <React.Fragment key={i}>
              {/* Shadow — depth layer */}
              <path
                d={waveD}
                fill="none"
                stroke={color.shadow}
                strokeWidth={wave.w + 2}
                strokeLinecap="round"
                opacity={0.5}
                transform={`translate(1, ${wave.y + 2})`}
              />
              {/* Main stroke */}
              <path
                d={waveD}
                fill="none"
                stroke={color.stroke}
                strokeWidth={wave.w}
                strokeLinecap="round"
                opacity={0.85}
                transform={`translate(0, ${wave.y})`}
              />
              {/* Top-edge highlight */}
              <path
                d={waveD}
                fill="none"
                stroke={color.highlight}
                strokeWidth={Math.max(2, wave.w * 0.25)}
                strokeLinecap="round"
                opacity={0.35}
                transform={`translate(-0.5, ${wave.y - 1})`}
              />
            </React.Fragment>
          ))}
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#logo-waves)" />
    </svg>
  );
}

export function LogoWallBackground({ mode = "hero", colorway = "champagne", children }: Props) {
  const patternOpacity = {
    hero:      "opacity-[0.18]",
    auth:      "opacity-[0.22]",
    form:      "opacity-[0.10]",
    dashboard: "opacity-[0.08]",
  }[mode];

  const overlayClass = {
    hero:      "from-black/40 via-black/60 to-black/80",
    auth:      "from-black/30 via-black/50 to-black/70",
    form:      "from-black/70 via-black/85 to-black/95",
    dashboard: "from-black/55 via-black/75 to-black/90",
  }[mode];

  return (
    <div className="relative min-h-screen bg-[#050507] text-amber-50 overflow-hidden">
      {/* Layer 0: Wave pattern — brand signature flowing curves */}
      <div
        className={clsx("pointer-events-none absolute inset-0 transition-opacity duration-1000", patternOpacity)}
        aria-hidden="true"
      >
        <WavePattern colorway={colorway} />
      </div>

      {/* Layer 1: Depth gradient — bars recede behind content */}
      <div
        className={clsx(
          "pointer-events-none absolute inset-0 bg-gradient-to-br transition-all duration-700",
          overlayClass
        )}
        aria-hidden="true"
      />

      {/* Layer 2: Window layer — content cut into the wall */}
      <main className={clsx(
        "relative z-10 min-h-screen flex flex-col",
        mode === "hero" || mode === "dashboard" ? "p-4 md:p-8 lg:p-12" : "p-0"
      )}>
        <div className={clsx(
          "flex-1 flex flex-col w-full",
          (mode === "hero" || mode === "dashboard") && "rounded-[32px] border border-white/5 bg-black/20 backdrop-blur-[2px] shadow-2xl"
        )}>
          {children}
        </div>
      </main>
    </div>
  );
}
