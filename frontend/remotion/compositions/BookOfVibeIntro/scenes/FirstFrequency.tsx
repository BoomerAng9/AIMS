import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";
import { aimsTheme } from "../../../styles/theme";
import { textStyles } from "../../../styles/typography";
import { springPresets } from "../../../styles/animations";

/**
 * Scene 2: The First Frequency
 * A pulse of energy bursts from center — waveform ripples outward.
 * The Void cracks. Color enters the universe.
 */

const RING_COUNT = 5;

export const FirstFrequency: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  // Central flash
  const flashOpacity = interpolate(
    frame,
    [0, 0.15 * fps, 0.5 * fps],
    [0, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Central glow that persists
  const glowScale = spring({
    frame,
    fps,
    config: springPresets.heavy,
  });
  const glowOpacity = interpolate(
    frame,
    [0.3 * fps, 1 * fps],
    [0, 0.6],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Text
  const textOpacity = interpolate(
    frame,
    [1.5 * fps, 2.2 * fps],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Subtitle
  const subOpacity = interpolate(
    frame,
    [2.4 * fps, 3 * fps],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill style={{ backgroundColor: "#000000" }}>
      {/* Expanding ripple rings */}
      {Array.from({ length: RING_COUNT }, (_, i) => {
        const ringDelay = i * 0.2 * fps;
        const ringProgress = interpolate(
          frame,
          [ringDelay, ringDelay + 2 * fps],
          [0, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );
        const ringScale = interpolate(ringProgress, [0, 1], [0, 1]);
        const ringOpacity = interpolate(ringProgress, [0, 0.2, 1], [0, 0.5, 0]);

        return (
          <AbsoluteFill
            key={i}
            style={{ justifyContent: "center", alignItems: "center" }}
          >
            <div
              style={{
                width: 800,
                height: 800,
                borderRadius: "50%",
                border: `2px solid ${aimsTheme.colors.gold}`,
                transform: `scale(${ringScale})`,
                opacity: ringOpacity,
              }}
            />
          </AbsoluteFill>
        );
      })}

      {/* Central energy burst */}
      <AbsoluteFill
        style={{ justifyContent: "center", alignItems: "center" }}
      >
        {/* White flash */}
        <div
          style={{
            position: "absolute",
            width: 200,
            height: 200,
            borderRadius: "50%",
            backgroundColor: "#FFFFFF",
            opacity: flashOpacity,
            boxShadow: "0 0 120px 60px rgba(255,255,255,0.8)",
          }}
        />
        {/* Gold core glow */}
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: "50%",
            backgroundColor: aimsTheme.colors.gold,
            transform: `scale(${glowScale})`,
            opacity: glowOpacity,
            boxShadow: `0 0 80px 40px ${aimsTheme.colors.goldGlow}`,
          }}
        />
      </AbsoluteFill>

      {/* Waveform line across center */}
      <AbsoluteFill
        style={{ justifyContent: "center", alignItems: "center" }}
      >
        <svg
          width={1920}
          height={200}
          viewBox="0 0 1920 200"
          style={{
            opacity: interpolate(
              frame,
              [0.5 * fps, 1 * fps, 3 * fps],
              [0, 0.5, 0.2],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            ),
          }}
        >
          <path
            d={generateWaveform(t)}
            fill="none"
            stroke={aimsTheme.colors.gold}
            strokeWidth={2}
            strokeLinecap="round"
          />
        </svg>
      </AbsoluteFill>

      {/* Text */}
      <AbsoluteFill
        style={{
          justifyContent: "flex-end",
          alignItems: "center",
          paddingBottom: 180,
          flexDirection: "column",
          gap: 16,
        }}
      >
        <div
          style={{
            ...textStyles.chapterLabel,
            color: aimsTheme.colors.gold,
            opacity: textOpacity,
          }}
        >
          The First Frequency
        </div>
        <div
          style={{
            ...textStyles.body,
            color: aimsTheme.colors.text.secondary,
            opacity: subOpacity,
            textAlign: "center",
            maxWidth: 700,
          }}
        >
          The original pulse of creative intent that refused to collapse.
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Generate a sine-based waveform path that oscillates with time */
function generateWaveform(t: number): string {
  const points: string[] = [];
  const segments = 200;
  for (let i = 0; i <= segments; i++) {
    const x = (i / segments) * 1920;
    const normalizedX = (i / segments) * Math.PI * 8;
    // Compound wave — changes with time
    const amplitude =
      40 * Math.sin(normalizedX + t * 4) +
      20 * Math.sin(normalizedX * 2.3 + t * 6) +
      10 * Math.cos(normalizedX * 4.1 + t * 3);
    // Taper at edges
    const taper = Math.sin((i / segments) * Math.PI);
    const y = 100 + amplitude * taper;
    points.push(`${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return points.join(" ");
}
