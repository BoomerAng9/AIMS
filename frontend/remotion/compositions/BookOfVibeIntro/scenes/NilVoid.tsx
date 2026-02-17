import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";
import { aimsTheme } from "../../../styles/theme";
import { textStyles } from "../../../styles/typography";

/**
 * Scene 1: The Void — Before Creation
 * Deep black with drifting ash-grey particles being consumed inward.
 * Text: "Before there was light… there was The Void."
 */

const PARTICLE_COUNT = 40;

type Particle = {
  x: number;
  y: number;
  size: number;
  speed: number;
  phase: number;
};

// Deterministic particles seeded from index
const particles: Particle[] = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
  x: ((i * 137.5) % 100),
  y: ((i * 73.1) % 100),
  size: 1.5 + (i % 5) * 0.8,
  speed: 0.3 + (i % 7) * 0.15,
  phase: (i * 0.43) % (Math.PI * 2),
}));

export const NilVoid: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps; // time in seconds

  // Text fade-in
  const textOpacity = interpolate(
    frame,
    [1 * fps, 1.8 * fps],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Second line
  const nilOpacity = interpolate(
    frame,
    [2.2 * fps, 3 * fps],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Slow vignette pulse
  const vignettePulse = 0.85 + Math.sin(t * 0.8) * 0.05;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000000" }}>
      {/* Particle field — drifting inward toward center (being consumed) */}
      {particles.map((p, i) => {
        const elapsed = t * p.speed;
        const angle = p.phase + elapsed * 0.5;
        // Particles drift toward center over time
        const drift = Math.min(elapsed * 8, 35);
        const px = p.x + Math.sin(angle) * 3 - (p.x - 50) * (drift / 100);
        const py = p.y + Math.cos(angle) * 2 - (p.y - 50) * (drift / 100);

        const particleOpacity = interpolate(
          frame,
          [0, 0.5 * fps, 3 * fps, 4 * fps],
          [0, 0.4, 0.25, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${px}%`,
              top: `${py}%`,
              width: p.size,
              height: p.size,
              borderRadius: "50%",
              backgroundColor: aimsTheme.colors.vibe.theVoid,
              opacity: particleOpacity,
            }}
          />
        );
      })}

      {/* Vignette overlay */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at 50% 50%, transparent 20%, rgba(0,0,0,${vignettePulse}) 70%)`,
        }}
      />

      {/* Text */}
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
          gap: 24,
        }}
      >
        <div
          style={{
            ...textStyles.quote,
            color: aimsTheme.colors.text.secondary,
            opacity: textOpacity,
            textAlign: "center",
          }}
        >
          Before there was light…
        </div>
        <div
          style={{
            ...textStyles.h2,
            color: aimsTheme.colors.vibe.theVoid,
            opacity: nilOpacity,
            letterSpacing: "0.15em",
            textAlign: "center",
          }}
        >
          there was The Void.
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
